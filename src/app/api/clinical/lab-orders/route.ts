import { NextResponse } from 'next/server';
import { getOperationalUser } from '@/lib/operational-auth';
import { hasRole } from '@/lib/rbac';
import { Role } from '@/lib/prisma-shim';
import db from '@/lib/db';
import { logAuditEvent } from '@/lib/audit';
import { ensurePlatformDefaults } from '@/services/platform-extensions.service';

export async function GET(req: Request) {
  try {
    const user = await getOperationalUser();
    if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    if (!hasRole(user, [Role.DENTIST, Role.OWNER_ADMIN, Role.RECEPTIONIST])) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    await ensurePlatformDefaults();

    const { searchParams } = new URL(req.url);
    const patientId = searchParams.get('patientId') || undefined;
    const branchId = searchParams.get('branchId') || undefined;
    const status = searchParams.get('status') || undefined;

    const assignedBranchId = !hasRole(user, [Role.OWNER_ADMIN])
      ? user.roleGrants.find((g) => g.branchId)?.branchId || undefined
      : branchId;

    const [labOrders, laboratories, patients, branches, dentists] = await Promise.all([
      db.labOrder.findMany({
        where: {
          ...(patientId ? { patientId } : {}),
          ...(assignedBranchId ? { branchId: assignedBranchId } : {}),
          ...(status && status !== 'ALL' ? { status } : {}),
        },
        include: { laboratory: true },
        orderBy: { dueDate: 'asc' },
      }),
      db.laboratory.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } }),
      db.patient.findMany({ select: { id: true, fullName: true, patientNumber: true }, take: 50 }),
      db.branch.findMany({ select: { id: true, code: true, name: true } }),
      db.user.findMany({
        where: { roleGrants: { some: { role: Role.DENTIST } } },
        select: { id: true, fullName: true },
      }),
    ]);

    const patientMap = new Map(patients.map((p) => [p.id, p]));
    const branchMap = new Map(branches.map((b) => [b.id, b]));
    const dentistMap = new Map(dentists.map((d) => [d.id, d]));

    const enrichedOrders = labOrders.map((o) => ({
      ...o,
      patient: patientMap.get(o.patientId) || { id: o.patientId, fullName: 'Clinic Patient', patientNumber: 'EBT-PAT' },
      branch: branchMap.get(o.branchId) || { id: o.branchId, code: 'BR-A', name: 'Heliopolis' },
      dentist: dentistMap.get(o.dentistUserId) || { id: o.dentistUserId, fullName: 'Attending Dentist' },
      isOverdue: !['RECEIVED', 'CANCELLED'].includes(o.status) && new Date(o.dueDate).getTime() < Date.now(),
    }));

    return NextResponse.json({ labOrders: enrichedOrders, laboratories });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to load lab orders' }, { status: 400 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getOperationalUser();
    if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    if (!hasRole(user, [Role.DENTIST, Role.OWNER_ADMIN])) {
      return NextResponse.json({ error: 'Only dentists or owner can create lab orders' }, { status: 403 });
    }
    await ensurePlatformDefaults();

    const body = await req.json();
    const {
      patientId,
      encounterId,
      treatmentPlanItemId,
      branchId,
      laboratoryId,
      workType,
      toothNumbers,
      material,
      shade,
      instructions,
      dueDate,
      costPiasters,
    } = body;

    if (!patientId || !workType || !toothNumbers) {
      return NextResponse.json({ error: 'Patient, work type, and tooth number(s) are required.' }, { status: 400 });
    }

    const lab = laboratoryId
      ? await db.laboratory.findUnique({ where: { id: laboratoryId } })
      : await db.laboratory.findFirst({ where: { isActive: true } });

    if (!lab) {
      return NextResponse.json({ error: 'No active dental laboratory configured.' }, { status: 400 });
    }

    const targetBranchId =
      branchId ||
      user.roleGrants.find((g) => g.branchId)?.branchId ||
      (await db.branch.findFirst({ where: { isActive: true } }))?.id ||
      '';

    const count = await db.labOrder.count();
    const orderNumber = `LAB-${1051 + count}`;

    const order = await db.labOrder.create({
      data: {
        orderNumber,
        patientId,
        encounterId: encounterId || null,
        treatmentPlanItemId: treatmentPlanItemId || null,
        branchId: targetBranchId,
        dentistUserId: user.id,
        laboratoryId: lab.id,
        workType,
        toothNumbers: String(toothNumbers).trim(),
        material: material || 'ZIRCONIA',
        shade: shade || 'A2',
        instructions: instructions || null,
        status: 'SENT',
        sentDate: new Date(),
        dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + lab.turnaroundDays * 86400000),
        costPiasters: Number(costPiasters) || 180000,
        statusHistoryJson: [
          { status: 'SENT', at: new Date().toISOString(), by: user.fullName },
        ],
      },
      include: { laboratory: true },
    });

    await logAuditEvent({
      actorUserId: user.id,
      action: 'LAB_ORDER_CREATED',
      entityType: 'LabOrder',
      entityId: order.id,
      branchId: targetBranchId,
      metadata: { orderNumber, workType, toothNumbers, costPiasters: order.costPiasters },
    });

    return NextResponse.json({ labOrder: order }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create lab order' }, { status: 400 });
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await getOperationalUser();
    if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    if (!hasRole(user, [Role.DENTIST, Role.OWNER_ADMIN])) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await req.json();
    const { orderId, status, costPiasters, isPaid, notes } = body;
    if (!orderId) return NextResponse.json({ error: 'orderId is required' }, { status: 400 });

    const existing = await db.labOrder.findUnique({ where: { id: orderId } });
    if (!existing) return NextResponse.json({ error: 'Lab order not found' }, { status: 404 });

    const history = Array.isArray(existing.statusHistoryJson) ? [...existing.statusHistoryJson] : [];
    if (status && status !== existing.status) {
      history.push({
        from: existing.status,
        status,
        at: new Date().toISOString(),
        by: user.fullName,
        notes: notes || undefined,
      });
    }

    const updated = await db.labOrder.update({
      where: { id: orderId },
      data: {
        ...(status ? { status } : {}),
        ...(status === 'RECEIVED' ? { receivedDate: new Date() } : {}),
        ...(costPiasters !== undefined && hasRole(user, [Role.OWNER_ADMIN]) ? { costPiasters: Number(costPiasters) } : {}),
        ...(isPaid !== undefined && hasRole(user, [Role.OWNER_ADMIN]) ? { isPaid: Boolean(isPaid) } : {}),
        statusHistoryJson: history,
      },
      include: { laboratory: true },
    });

    await logAuditEvent({
      actorUserId: user.id,
      action: 'LAB_ORDER_UPDATED',
      entityType: 'LabOrder',
      entityId: orderId,
      branchId: existing.branchId,
      metadata: { fromStatus: existing.status, toStatus: updated.status },
    });

    return NextResponse.json({ labOrder: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update lab order' }, { status: 400 });
  }
}
