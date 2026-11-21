import {reportBranch} from '@/lib/report-scope';
import {requireRole} from '@/lib/rbac';
import {hasRole as canInventory} from '@/lib/rbac';
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { Role } from '@prisma/client';
import { getGoodsReceipts, receiveGoods } from '@/services/inventory.service';

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if(!canInventory(user,["INVENTORY","OWNER_ADMIN"]))return NextResponse.json({error:"Inventory access required."},{status:403});
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  let branchId = searchParams.get('branchId') || undefined;

  try {
    branchId=reportBranch(user,['INVENTORY','OWNER_ADMIN'],branchId);
    const receipts = await getGoodsReceipts(branchId);
    return NextResponse.json({ receipts });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch goods receipts' }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if(!canInventory(user,["INVENTORY","OWNER_ADMIN"]))return NextResponse.json({error:"Inventory access required."},{status:403});
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const allowed = user.roleGrants.some((g) =>
    ([
      Role.OWNER_ADMIN,
      Role.INVENTORY,
      Role.RECEPTIONIST,
      Role.DENTIST,
    ] as Role[]).includes(g.role)
  );

  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    requireRole(user,['INVENTORY','OWNER_ADMIN'],body.branchId);
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
