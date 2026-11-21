import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { Role } from '@prisma/client';
import { completeWorkOrder } from '@/services/equipment.service';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const allowed = user.roleGrants.some((g) =>
    ([Role.OWNER_ADMIN, Role.BRANCH_MANAGER, Role.DENTIST, Role.RECEPTIONIST] as Role[]).includes(g.role)
  );

  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const costPiasters = Math.round((parseFloat(body.costEgp) || 0) * 100);
    const downtimeHours = parseFloat(body.downtimeHours) || 0;

    const updated = await completeWorkOrder(id, {
      costPiasters,
      downtimeHours,
      notes: body.notes,
    });

    return NextResponse.json({ success: true, workOrder: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to complete work order' }, { status: 400 });
  }
}
