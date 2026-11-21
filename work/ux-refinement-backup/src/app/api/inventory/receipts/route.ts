import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { Role } from '@prisma/client';
import { getGoodsReceipts, receiveGoods } from '@/services/inventory.service';

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const branchId = searchParams.get('branchId') || undefined;

  try {
    const receipts = await getGoodsReceipts(branchId);
    return NextResponse.json({ receipts });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch goods receipts' }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
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

  try {
    const body = await req.json();
    const formattedLines = (body.lines || []).map((line: any) => ({
      ...line,
      expiryDate: new Date(line.expiryDate),
    }));

    const receipt = await receiveGoods({
      ...body,
      receivedByUserId: user.id,
      lines: formattedLines,
    });

    return NextResponse.json({ receipt }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to record goods receipt' }, { status: 400 });
  }
}
