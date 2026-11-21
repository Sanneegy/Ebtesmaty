import {getOperationalUser} from '@/lib/operational-auth';
import {requireClinicalAccess} from '@/lib/rbac';
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { requireRole } from '@/lib/rbac';
import { Role } from '@prisma/client';
import { recordToothFinding, getPatientToothChart } from '@/services/clinical.service';

export async function GET(req: NextRequest) {
  const user = await getOperationalUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const patientId = searchParams.get('patientId');

  if (!patientId) {
    return NextResponse.json({ error: 'patientId is required' }, { status: 400 });
  }

  try {
    await requireClinicalAccess(user, patientId);
    requireRole(user, [Role.DENTIST, Role.OWNER_ADMIN, Role.BRANCH_MANAGER]);
    const chart = await getPatientToothChart(patientId);
    return NextResponse.json({ chart });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Forbidden' }, { status: 403 });
  }
}

export async function POST(req: NextRequest) {
  const user = await getOperationalUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    requireRole(user, [Role.DENTIST, Role.OWNER_ADMIN]);
    const body = await req.json();
    const { patientId, encounterId, toothNumber, surface, condition, notes } = body;
    await requireClinicalAccess(user, patientId);

    if (!patientId || !toothNumber || !condition) {
      return NextResponse.json({ error: 'patientId, toothNumber, and condition are required' }, { status: 400 });
    }

    const finding = await recordToothFinding({
      patientId,
      encounterId,
      toothNumber,
      surface,
      condition,
      notes,
      dentistUserId: user.id,
    });

    return NextResponse.json({ finding }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to record tooth finding' }, { status: 400 });
  }
}
