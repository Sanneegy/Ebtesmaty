import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { Role } from '@prisma/client';
import { respondAndResolveFeedback } from '@/services/communications.service';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const allowed = user.roleGrants.some((g) =>
    ([Role.OWNER_ADMIN, Role.BRANCH_MANAGER, Role.RECEPTIONIST, Role.DENTIST] as Role[]).includes(g.role)
  );

  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const updated = await respondAndResolveFeedback({
      caseId: id,
      staffUserId: user.id,
      patientVisibleResponse: body.patientVisibleResponse,
      internalNotes: body.internalNotes,
      status: body.status,
    });

    return NextResponse.json({ success: true, case: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to respond to feedback' }, { status: 400 });
  }
}
