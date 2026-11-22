import { NextResponse } from 'next/server';
import { getOperationalUser } from '@/lib/operational-auth';
import { assertPatientSelf, hasRole } from '@/lib/rbac';
import { Role } from '@/lib/prisma-shim';
import db from '@/lib/db';
import { logAuditEvent } from '@/lib/audit';
import { ensurePlatformDefaults, getOwnerProfitabilityReport } from '@/services/platform-extensions.service';
import { getCairoDayBounds } from '@/lib/cairo-date';

export async function GET(req: Request) {
  try {
    const user = await getOperationalUser();
    if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    await ensurePlatformDefaults();

    const { searchParams } = new URL(req.url);
    const moduleName = searchParams.get('module') || 'summary';
    const branchId = searchParams.get('branchId') || undefined;

    // 1. OWNER-ONLY PROFITABILITY & COMMISSIONS (Strict RBAC: 403 for Patient, Receptionist, Dentist)
    if (moduleName === 'profitability') {
      if (!hasRole(user, [Role.OWNER_ADMIN])) {
        return NextResponse.json(
          { error: 'Access denied: Owner / Executive profitability and commission data is strictly restricted.' },
          { status: 403 }
        );
      }
      const report = await getOwnerProfitabilityReport(branchId);
      return NextResponse.json(report);
    }

    // 2. OWNER-ONLY ATTENDANCE & PAYROLL (Strict RBAC: 403 for non-Owner)
    if (moduleName === 'attendance_payroll') {
      if (!hasRole(user, [Role.OWNER_ADMIN])) {
        return NextResponse.json(
          { error: 'Access denied: Attendance and payroll administration is strictly restricted to Owner.' },
          { status: 403 }
        );
      }

      const [attendance, payroll, staffUsers, branches] = await Promise.all([
        db.attendanceRecord.findMany({
          where: { ...(branchId ? { branchId } : {}) },
          orderBy: { date: 'desc' },
          take: 50,
        }),
        db.payrollRecord.findMany({
          where: { ...(branchId ? { branchId } : {}) },
          orderBy: { periodMonth: 'desc' },
          take: 50,
        }),
        db.user.findMany({
          where: { roleGrants: { some: { role: { in: [Role.RECEPTIONIST, Role.DENTIST, Role.OWNER_ADMIN] } } } },
          select: { id: true, fullName: true, email: true, roleGrants: { include: { branch: true } } },
        }),
        db.branch.findMany({ where: { isActive: true }, orderBy: { code: 'asc' } }),
      ]);

      const userMap = new Map(staffUsers.map((u) => [u.id, u]));
      const branchMap = new Map(branches.map((b) => [b.id, b]));

      return NextResponse.json({
        attendance: attendance.map((a) => ({
          ...a,
          user: userMap.get(a.userId) || { fullName: 'Clinic Staff' },
          branch: branchMap.get(a.branchId) || { code: 'BR-A', name: 'Heliopolis' },
        })),
        payroll: payroll.map((p) => ({
          ...p,
          user: userMap.get(p.userId) || { fullName: 'Clinic Staff' },
          branch: branchMap.get(p.branchId) || { code: 'BR-A', name: 'Heliopolis' },
        })),
        staffUsers,
      });
    }

    // 3. STAFF OWN CLOCK-IN STATUS (For Receptionist & Dentist Header Control)
    if (moduleName === 'my_attendance') {
      if (!hasRole(user, [Role.RECEPTIONIST, Role.DENTIST, Role.OWNER_ADMIN])) {
        return NextResponse.json({ error: 'Staff role required' }, { status: 403 });
      }
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const record = await db.attendanceRecord.findFirst({
        where: { userId: user.id, date: { gte: today } },
        orderBy: { clockInAt: 'desc' },
      });
      return NextResponse.json({ attendance: record });
    }

    // 4. INTERNAL TEAM COMMUNICATION & AUTOMATION RULES (For Staff Dashboards)
    if (moduleName === 'team_and_automation') {
      if (!hasRole(user, [Role.RECEPTIONIST, Role.DENTIST, Role.OWNER_ADMIN])) {
        return NextResponse.json({ error: 'Staff role required' }, { status: 403 });
      }
      const [teamMessages, automationRules, customFields, insuranceClaims, materialRecipes, settings] =
        await Promise.all([
          db.teamMessage.findMany({ orderBy: { createdAt: 'desc' }, take: 30 }),
          db.automationRule.findMany({ orderBy: { createdAt: 'asc' } }),
          db.customFieldDefinition.findMany({ orderBy: { sortOrder: 'asc' } }),
          hasRole(user, [Role.OWNER_ADMIN, Role.FINANCE, Role.RECEPTIONIST])
            ? db.insuranceClaim.findMany({
                where: { ...(branchId ? { branchId } : {}) },
                orderBy: { submittedAt: 'desc' },
              })
            : Promise.resolve([]),
          db.materialRecipe.findMany({ orderBy: { procedureName: 'asc' } }),
          db.systemSetting.findMany(),
        ]);

      return NextResponse.json({
        teamMessages,
        automationRules,
        customFields,
        insuranceClaims,
        materialRecipes,
        settings: Object.fromEntries(settings.map((s) => [s.key, s.valueJson])),
      });
    }

    // 5. PATIENT EXTRAS: Live View-Only Queue Position, Loyalty Ledger, Prescriptions & Revocable QR Token
    if (moduleName === 'patient_extras') {
      const targetPatientId = searchParams.get('patientId');
      let patientId = targetPatientId;
      if (!patientId) {
        const link = await db.portalPatientLink.findFirst({
          where: { userId: user.id, status: 'APPROVED' },
        });
        patientId = link?.patientId || null;
      } else if (hasRole(user, [Role.PATIENT]) && !hasRole(user, [Role.RECEPTIONIST, Role.DENTIST, Role.OWNER_ADMIN])) {
        await assertPatientSelf(user.id, patientId);
      }

      if (!patientId) {
        return NextResponse.json({
          queuePosition: null,
          loyaltyPoints: 0,
          loyaltyHistory: [],
          prescriptions: [],
          familyProfiles: [],
          qrToken: null,
        });
      }

      const { start, end } = getCairoDayBounds();
      const [activeQueueEntries, loyaltyHistory, prescriptions, familyLinks, customFields] = await Promise.all([
        db.queueEntry.findMany({
          where: {
            enteredAt: { gte: start, lt: end },
            status: { in: ['WAITING', 'CALLED', 'IN_CONSULTATION'] },
          },
          include: { branch: { select: { name: true, code: true } } },
          orderBy: [{ clinicalPriority: 'desc' }, { enteredAt: 'asc' }],
        }),
        db.loyaltyLedger.findMany({ where: { patientId }, orderBy: { createdAt: 'desc' } }),
        db.prescription.findMany({
          where: { patientId, isSharedWithPatient: true },
          orderBy: { createdAt: 'desc' },
        }),
        db.portalPatientLink.findMany({
          where: { userId: user.id, status: 'APPROVED' },
          include: { patient: { select: { id: true, fullName: true, patientNumber: true, dateOfBirth: true } } },
        }),
        db.customFieldDefinition.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } }),
      ]);

      const myEntry = activeQueueEntries.find((q) => q.patientId === patientId);
      let queuePositionInfo = null;
      if (myEntry) {
        const branchQueue = activeQueueEntries.filter((q) => q.branchId === myEntry.branchId);
        const posIndex = branchQueue.findIndex((q) => q.id === myEntry.id) + 1;
        queuePositionInfo = {
          queueNumber: myEntry.queueNumber,
          positionInLine: posIndex,
          status: myEntry.status,
          branchName: myEntry.branch?.name || 'Cairo Branch',
          estimatedWaitMinutes: myEntry.status === 'IN_CONSULTATION' ? 0 : myEntry.status === 'CALLED' ? 2 : Math.max(5, (posIndex - 1) * 15 + 10),
          enteredAt: myEntry.enteredAt,
        };
      }

      const expTs = Date.now() + 3600000; // 1-hour expiring token
      const qrToken = `EBT-QR-${patientId.slice(-6).toUpperCase()}-${Math.floor(expTs / 60000)}`;

      return NextResponse.json({
        queuePosition: queuePositionInfo,
        loyaltyPoints: loyaltyHistory.reduce((s, r) => s + r.points, 0),
        loyaltyHistory,
        prescriptions,
        familyProfiles: familyLinks.map((l) => l.patient),
        customFields,
        qrToken: {
          token: qrToken,
          expiresAt: new Date(expTs).toISOString(),
        },
      });
    }

    return NextResponse.json({ status: 'ok' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Request failed' }, { status: err.statusCode || 400 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getOperationalUser();
    if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    await ensurePlatformDefaults();

    const body = await req.json();
    const { action } = body;

    // 1. STAFF CLOCK-IN / CLOCK-OUT
    if (action === 'CLOCK_IN' || action === 'CLOCK_OUT') {
      if (!hasRole(user, [Role.RECEPTIONIST, Role.DENTIST, Role.OWNER_ADMIN])) {
        return NextResponse.json({ error: 'Staff role required' }, { status: 403 });
      }
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const branchId =
        user.roleGrants.find((g) => g.branchId)?.branchId ||
        (await db.branch.findFirst({ where: { isActive: true } }))?.id ||
        '';

      const existing = await db.attendanceRecord.findFirst({
        where: { userId: user.id, date: { gte: today } },
        orderBy: { clockInAt: 'desc' },
      });

      if (action === 'CLOCK_IN') {
        const record = await db.attendanceRecord.create({
          data: {
            userId: user.id,
            branchId,
            date: today,
            clockInAt: new Date(),
            status: 'PRESENT',
            source: 'GEOLOCATION',
          },
        });
        return NextResponse.json({ attendance: record });
      } else {
        if (!existing) {
          return NextResponse.json({ error: 'No active clock-in found for today' }, { status: 400 });
        }
        const updated = await db.attendanceRecord.update({
          where: { id: existing.id },
          data: { clockOutAt: new Date() },
        });
        return NextResponse.json({ attendance: updated });
      }
    }

    // 2. OWNER ATTENDANCE OR PAYROLL MANUAL ADJUSTMENT (Mandatory Reason & Audit)
    if (action === 'ADJUST_PAYROLL') {
      if (!hasRole(user, [Role.OWNER_ADMIN])) {
        return NextResponse.json({ error: 'Owner role required for payroll adjustments' }, { status: 403 });
      }
      const { payrollId, manualAdjustmentPiasters, adjustmentReason, status } = body;
      if (!payrollId || !adjustmentReason?.trim()) {
        return NextResponse.json({ error: 'Payroll ID and mandatory adjustment reason are required.' }, { status: 400 });
      }
      const existing = await db.payrollRecord.findUnique({ where: { id: payrollId } });
      if (!existing) return NextResponse.json({ error: 'Payroll record not found' }, { status: 404 });

      const adj = Number(manualAdjustmentPiasters || 0);
      const net =
        existing.baseSalaryPiasters +
        existing.commissionPiasters +
        existing.overtimePiasters -
        existing.deductionsPiasters +
        adj;

      const updated = await db.payrollRecord.update({
        where: { id: payrollId },
        data: {
          manualAdjustmentPiasters: adj,
          adjustmentReason: adjustmentReason.trim(),
          netPayablePiasters: net,
          ...(status ? { status, approvedByUserId: user.id, approvedAt: new Date() } : {}),
        },
      });

      await logAuditEvent({
        actorUserId: user.id,
        action: 'PAYROLL_RECORD_ADJUSTED',
        entityType: 'PayrollRecord',
        entityId: payrollId,
        branchId: existing.branchId,
        metadata: {
          previousAdjustment: existing.manualAdjustmentPiasters,
          newAdjustment: adj,
          reason: adjustmentReason.trim(),
        },
      });

      return NextResponse.json({ payroll: updated });
    }

    // 3. INTERNAL TEAM MESSAGE
    if (action === 'SEND_TEAM_MESSAGE') {
      if (!hasRole(user, [Role.RECEPTIONIST, Role.DENTIST, Role.OWNER_ADMIN])) {
        return NextResponse.json({ error: 'Staff role required' }, { status: 403 });
      }
      const { channelName, messageText, attachmentName } = body;
      if (!messageText?.trim()) {
        return NextResponse.json({ error: 'Message text is required' }, { status: 400 });
      }
      const msg = await db.teamMessage.create({
        data: {
          senderUserId: user.id,
          senderName: user.fullName,
          senderRole: user.roleGrants[0]?.role || 'STAFF',
          branchId: user.roleGrants.find((g) => g.branchId)?.branchId || null,
          channelName: channelName || 'GENERAL',
          messageText: messageText.trim(),
          attachmentName: attachmentName || null,
          reactionsJson: {},
        },
      });
      return NextResponse.json({ teamMessage: msg }, { status: 201 });
    }

    // 4. TOGGLE OR CREATE AUTOMATION RULE
    if (action === 'TOGGLE_AUTOMATION_RULE') {
      if (!hasRole(user, [Role.RECEPTIONIST, Role.OWNER_ADMIN])) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
      const { ruleId, isEnabled } = body;
      const updated = await db.automationRule.update({
        where: { id: ruleId },
        data: { isEnabled: Boolean(isEnabled) },
      });
      return NextResponse.json({ automationRule: updated });
    }

    if (action === 'CREATE_AUTOMATION_RULE') {
      if (!hasRole(user, [Role.RECEPTIONIST, Role.OWNER_ADMIN])) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
      const { nameEn, triggerEvent, delayHours, channel, templateTextEn } = body;
      const rule = await db.automationRule.create({
        data: {
          nameEn: nameEn || 'Custom Clinic Reminder',
          nameAr: nameEn || 'قاعدة تذكير تلقائية',
          triggerEvent: triggerEvent || 'APPOINTMENT_BOOKED',
          delayHours: Number(delayHours) || 24,
          channel: channel || 'WHATSAPP',
          templateTextEn: templateTextEn || 'Hello {{patientName}}, reminder from Ebtesamty Dental Clinics.',
          templateTextAr: templateTextEn || 'مرحباً {{patientName}}، تذكير من عيادات ابتسامتي.',
          isEnabled: true,
        },
      });
      return NextResponse.json({ automationRule: rule }, { status: 201 });
    }

    // 5. OWNER SAVE COMMISSION RULE
    if (action === 'SAVE_COMMISSION_RULE') {
      if (!hasRole(user, [Role.OWNER_ADMIN])) {
        return NextResponse.json({ error: 'Owner role required' }, { status: 403 });
      }
      const { ruleType, ratePercent, deductLabCost, deductMaterialCost } = body;
      const rule = await db.commissionRule.create({
        data: {
          ruleType: ruleType || 'PERCENTAGE_AFTER_COSTS',
          ratePercent: Number(ratePercent) || 35,
          deductLabCost: deductLabCost !== false,
          deductMaterialCost: deductMaterialCost !== false,
          isActive: true,
        },
      });
      await logAuditEvent({
        actorUserId: user.id,
        action: 'COMMISSION_RULE_UPDATED',
        entityType: 'CommissionRule',
        entityId: rule.id,
        metadata: { ruleType: rule.ruleType, ratePercent: rule.ratePercent },
      });
      return NextResponse.json({ commissionRule: rule });
    }

    // 6. OWNER SAVE SYSTEM SETTING / CUSTOM KPI / CMS / BACKUP
    if (action === 'SAVE_SYSTEM_SETTING') {
      if (!hasRole(user, [Role.OWNER_ADMIN])) {
        return NextResponse.json({ error: 'Owner role required' }, { status: 403 });
      }
      const { key, valueJson } = body;
      if (!key) return NextResponse.json({ error: 'Setting key required' }, { status: 400 });
      const setting = await db.systemSetting.upsert({
        where: { key },
        update: { valueJson, updatedByUserId: user.id },
        create: { key, valueJson, updatedByUserId: user.id },
      });
      await logAuditEvent({
        actorUserId: user.id,
        action: 'SYSTEM_SETTING_UPDATED',
        entityType: 'SystemSetting',
        entityId: key,
      });
      return NextResponse.json({ setting });
    }

    // 7. INSURANCE CLAIM CREATION / UPDATE
    if (action === 'CREATE_INSURANCE_CLAIM') {
      if (!hasRole(user, [Role.OWNER_ADMIN, Role.FINANCE, Role.RECEPTIONIST])) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
      const { patientId, invoiceId, branchId, payerName, policyNumber, claimedAmountPiasters, notes } = body;
      const count = await db.insuranceClaim.count();
      const claim = await db.insuranceClaim.create({
        data: {
          claimNumber: `CLM-2026-0${100 + count}`,
          patientId,
          invoiceId,
          branchId,
          payerName: payerName || 'Medical Insurance Partner',
          policyNumber: policyNumber || 'POL-EG-001',
          claimedAmountPiasters: Number(claimedAmountPiasters) || 100000,
          status: 'SUBMITTED',
          notes: notes || null,
        },
      });
      return NextResponse.json({ claim }, { status: 201 });
    }

    // 8. CUSTOM FIELD BUILDER
    if (action === 'CREATE_CUSTOM_FIELD') {
      if (!hasRole(user, [Role.OWNER_ADMIN])) {
        return NextResponse.json({ error: 'Owner role required' }, { status: 403 });
      }
      const { labelEn, labelAr, fieldType, isRequired, visibleRoles } = body;
      const fieldKey = (labelEn || 'custom_field').toLowerCase().replace(/[^a-z0-9]+/g, '_') + '_' + Date.now().toString().slice(-3);
      const field = await db.customFieldDefinition.create({
        data: {
          fieldKey,
          labelEn: labelEn || 'Custom Field',
          labelAr: labelAr || labelEn || 'حقل مخصص',
          fieldType: fieldType || 'TEXT',
          isRequired: Boolean(isRequired),
          isActive: true,
          visibleRolesJson: visibleRoles || ['PATIENT', 'RECEPTIONIST', 'DENTIST', 'OWNER_ADMIN'],
          editableRolesJson: ['RECEPTIONIST', 'OWNER_ADMIN'],
        },
      });
      return NextResponse.json({ customField: field }, { status: 201 });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Operation failed' }, { status: err.statusCode || 400 });
  }
}
