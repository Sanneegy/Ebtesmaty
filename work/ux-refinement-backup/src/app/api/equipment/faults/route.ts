import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { Role } from '@prisma/client';
import { reportEquipmentFault } from '@/services/equipment.service';

export async function POST(req: NextRequest) {
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

  try {
    const body = await req.json();
    const fault = await reportEquipmentFault({
      assetId: body.assetId,
      reportedByUserId: user.id,
      description: body.description,
      severity: body.severity,
    });

    return NextResponse.json({ fault }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to report equipment fault' }, { status: 400 });
  }
}
