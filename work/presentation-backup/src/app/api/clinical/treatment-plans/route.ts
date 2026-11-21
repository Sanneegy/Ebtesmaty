import {requireClinicalAccess} from '@/lib/rbac';
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { requireRole } from '@/lib/rbac';
import { Role } from '@prisma/client';
import { createTreatmentPlan, getPatientTreatmentPlans } from '@/services/clinical.service';

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
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
    const plans = await getPatientTreatmentPlans(patientId);
    return NextResponse.json({ treatmentPlans: plans });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch treatment plans' }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    requireRole(user, [Role.DENTIST, Role.OWNER_ADMIN]);
    const body = await req.json();
    const { patientId, branchId, title, notes, items } = body;
    await requireClinicalAccess(user, patientId);

    if (!patientId || !branchId || !title || !items || !Array.isArray(items)) {
      return NextResponse.json({ error: 'Missing required treatment plan fields' }, { status: 400 });
    }

    const plan = await createTreatmentPlan({
      patientId,
      branchId,
      dentistUserId: user.id,
      title,
      notes,
      items,
    });

    return NextResponse.json({ treatmentPlan: plan }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create treatment plan' }, { status: 400 });
  }
}
