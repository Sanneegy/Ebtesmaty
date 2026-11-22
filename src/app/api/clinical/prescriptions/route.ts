import { NextResponse } from 'next/server';
import { getOperationalUser } from '@/lib/operational-auth';
import { hasRole, requireClinicalAccess } from '@/lib/rbac';
import { Role } from '@/lib/prisma-shim';
import db from '@/lib/db';
import { logAuditEvent } from '@/lib/audit';
import { ensurePlatformDefaults } from '@/services/platform-extensions.service';

export async function GET(req: Request) {
  try {
    const user = await getOperationalUser();
    if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    await ensurePlatformDefaults();

    const { searchParams } = new URL(req.url);
    const patientId = searchParams.get('patientId');
    if (!patientId) {
      return NextResponse.json({ error: 'patientId is required' }, { status: 400 });
    }

    if (!hasRole(user, [Role.OWNER_ADMIN])) {
      await requireClinicalAccess(user, patientId, true);
    }

    const prescriptions = await db.prescription.findMany({
      where: {
        patientId,
        ...(hasRole(user, [Role.PATIENT]) && !hasRole(user, [Role.DENTIST, Role.OWNER_ADMIN])
          ? { isSharedWithPatient: true }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ prescriptions });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch prescriptions' }, { status: err.statusCode || 400 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getOperationalUser();
    if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    if (!hasRole(user, [Role.DENTIST, Role.OWNER_ADMIN])) {
      return NextResponse.json({ error: 'Only licensed dentists can issue prescriptions' }, { status: 403 });
    }

    const body = await req.json();
    const {
      patientId,
      encounterId,
      branchId,
      medicationName,
      strengthForm,
      dosage,
      route,
      frequency,
      duration,
      quantity,
      instructions,
      allergyChecked,
      isSharedWithPatient,
    } = body;

    if (!patientId || !medicationName?.trim() || !dosage?.trim() || !frequency?.trim() || !duration?.trim()) {
      return NextResponse.json(
        { error: 'Medication name, dosage, frequency, and duration are required.' },
        { status: 400 }
      );
    }

    const targetBranchId =
      branchId ||
      user.roleGrants.find((g) => g.branchId)?.branchId ||
      (await db.branch.findFirst({ where: { isActive: true } }))?.id ||
      '';

    const prescription = await db.prescription.create({
      data: {
        patientId,
        encounterId: encounterId || null,
        dentistUserId: user.id,
        branchId: targetBranchId,
        medicationName: medicationName.trim(),
        strengthForm: (strengthForm || 'Standard').trim(),
        dosage: dosage.trim(),
        route: (route || 'ORAL').trim(),
        frequency: frequency.trim(),
        duration: duration.trim(),
        quantity: (quantity || '1 Pack').trim(),
        instructions: (instructions || 'Take as directed after meals.').trim(),
        allergyChecked: allergyChecked !== false,
        isSharedWithPatient: isSharedWithPatient !== false,
      },
    });

    await logAuditEvent({
      actorUserId: user.id,
      action: 'PRESCRIPTION_ISSUED',
      entityType: 'Prescription',
      entityId: prescription.id,
      branchId: targetBranchId,
      metadata: { patientId, allergyChecked: prescription.allergyChecked },
    });

    return NextResponse.json({ prescription }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create prescription' }, { status: err.statusCode || 400 });
  }
}
