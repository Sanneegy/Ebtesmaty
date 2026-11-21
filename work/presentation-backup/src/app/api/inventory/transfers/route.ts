import {reportBranch} from '@/lib/report-scope';
import {requireRole} from '@/lib/rbac';
import {hasRole as canInventory} from '@/lib/rbac';
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { Role } from '@prisma/client';
import { getStockTransfers, requestStockTransfer } from '@/services/inventory.service';

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
    const transfers = await getStockTransfers(branchId);
    return NextResponse.json({ transfers });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch transfers' }, { status: 400 });
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
      Role.DENTIST,
      Role.RECEPTIONIST,
    ] as Role[]).includes(g.role)
  );

  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    requireRole(user,['INVENTORY','OWNER_ADMIN'],body.fromBranchId);
    const transfer = await requestStockTransfer({
      ...body,
      requestedByUserId: user.id,
    });

    return NextResponse.json({ transfer }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to request stock transfer' }, { status: 400 });
  }
}
