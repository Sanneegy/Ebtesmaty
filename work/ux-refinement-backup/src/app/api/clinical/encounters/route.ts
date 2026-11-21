import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { requireRole } from '@/lib/rbac';
import { Role } from '@prisma/client';
import { createEncounter, getPatientEncounters } from '@/services/clinical.service';

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
    requireRole(user, [Role.DENTIST, Role.OWNER_ADMIN, Role.BRANCH_MANAGER]);
    const encounters = await getPatientEncounters(patientId);
    return NextResponse.json({ encounters });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Forbidden' }, { status: 403 });
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
    const { patientId, branchId, appointmentId, chiefComplaint, examinationFindings, provisionalDiagnosis, clinicalNotes } = body;

    if (!patientId || !branchId || !chiefComplaint || !examinationFindings || !clinicalNotes) {
      return NextResponse.json({ error: 'Missing required clinical encounter fields' }, { status: 400 });
    }

    const encounter = await createEncounter({
      patientId,
      branchId,
      dentistUserId: user.id,
      appointmentId,
      chiefComplaint,
      examinationFindings,
      provisionalDiagnosis,
      clinicalNotes,
    });

    return NextResponse.json({ encounter }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create encounter' }, { status: 400 });
  }
}
