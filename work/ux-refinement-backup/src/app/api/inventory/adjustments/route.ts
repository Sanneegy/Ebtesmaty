import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { Role } from '@prisma/client';
import { recordStockAdjustment } from '@/services/inventory.service';

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Clinic staff: DENTIST, RECEPTIONIST, BRANCH_MANAGER, OWNER_ADMIN
  const allowed = user.roleGrants.some((g) =>
    ([
      Role.OWNER_ADMIN,
      Role.BRANCH_MANAGER,
      Role.DENTIST,
      Role.RECEPTIONIST,
    ] as Role[]).includes(g.role)
  );

  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const result = await recordStockAdjustment({
      ...body,
      performedByUserId: user.id,
      expiryDate: body.expiryDate ? new Date(body.expiryDate) : undefined,
    });

    return NextResponse.json({ success: true, result }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to record stock adjustment' }, { status: 400 });
  }
}
