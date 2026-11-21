import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { requireRole } from '@/lib/rbac';
import { Role, TreatmentPlanStatus } from '@prisma/client';
import { updateTreatmentPlanStatus, markTreatmentItemPerformed } from '@/services/clinical.service';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { action, status, itemId, encounterId, notes } = body;

    if (action === 'PERFORM_ITEM') {
      requireRole(user, [Role.DENTIST, Role.OWNER_ADMIN]);
      if (!itemId || !encounterId) {
        return NextResponse.json({ error: 'itemId and encounterId are required to mark an item performed' }, { status: 400 });
      }
      const item = await markTreatmentItemPerformed(itemId, encounterId, user.id, notes);
      return NextResponse.json({ item });
    } else if (status) {
      // Dentist or patient can update status depending on context
      const updated = await updateTreatmentPlanStatus(params.id, user.id, status as TreatmentPlanStatus);
      return NextResponse.json({ treatmentPlan: updated });
    } else {
      return NextResponse.json({ error: 'Invalid update payload' }, { status: 400 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update treatment plan' }, { status: 400 });
  }
}
