import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { Role } from '@prisma/client';
import { receiveStockTransfer } from '@/services/inventory.service';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const allowed = user.roleGrants.some((g) =>
    ([
      Role.OWNER_ADMIN,
      Role.BRANCH_MANAGER,
      Role.RECEPTIONIST,
      Role.DENTIST,
    ] as Role[]).includes(g.role)
  );

  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    if (!body.lotNumber || !body.expiryDate) {
      return NextResponse.json({ error: 'lotNumber and expiryDate are required for receipt' }, { status: 400 });
    }

    const updated = await receiveStockTransfer(
      id,
      user.id,
      body.lotNumber,
      new Date(body.expiryDate)
    );
    return NextResponse.json({ success: true, transfer: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to receive transfer' }, { status: 400 });
  }
}
