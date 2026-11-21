import {requireClinicalAccess} from '@/lib/rbac';
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { requireRole } from '@/lib/rbac';
import { Role } from '@prisma/client';
import { getPatientClinicalSummary } from '@/services/clinical.service';

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
    requireRole(user, [Role.DENTIST, Role.OWNER_ADMIN, Role.BRANCH_MANAGER]);
    const summary = await getPatientClinicalSummary(patientId);
    return NextResponse.json({ summary });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch clinical summary' }, { status: 400 });
  }
}
