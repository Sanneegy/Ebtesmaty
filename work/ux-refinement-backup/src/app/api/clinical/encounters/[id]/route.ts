import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { requireRole } from '@/lib/rbac';
import { Role } from '@prisma/client';
import { getEncounter, updateEncounterDraft, finalizeEncounter } from '@/services/clinical.service';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    requireRole(user, [Role.DENTIST, Role.OWNER_ADMIN, Role.BRANCH_MANAGER]);
    const encounter = await getEncounter(params.id);
    if (!encounter) {
      return NextResponse.json({ error: 'Encounter not found' }, { status: 404 });
    }
    return NextResponse.json({ encounter });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Forbidden' }, { status: 403 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    requireRole(user, [Role.DENTIST, Role.OWNER_ADMIN]);
    const body = await req.json();
    const { action, finalizedDiagnosis, clinicalNotesAddendum, ...draftUpdates } = body;

    if (action === 'FINALIZE') {
      if (!finalizedDiagnosis) {
        return NextResponse.json({ error: 'Finalized diagnosis is required for finalization.' }, { status: 400 });
      }
      const finalized = await finalizeEncounter(
        params.id,
        user.id,
        finalizedDiagnosis,
        clinicalNotesAddendum
      );
      return NextResponse.json({ encounter: finalized });
    } else {
      const updated = await updateEncounterDraft(params.id, user.id, draftUpdates);
      return NextResponse.json({ encounter: updated });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update encounter' }, { status: 400 });
  }
}
