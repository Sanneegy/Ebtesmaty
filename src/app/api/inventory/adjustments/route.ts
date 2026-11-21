import {getOperationalUser} from '@/lib/operational-auth';
import {reportBranch} from '@/lib/report-scope';
import {requireRole} from '@/lib/rbac';
import {hasRole as canInventory} from '@/lib/rbac';
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { Role } from '@prisma/client';
import { recordStockAdjustment } from '@/services/inventory.service';

export async function POST(req: NextRequest) {
  const user = await getOperationalUser();
  if(!canInventory(user,["INVENTORY","OWNER_ADMIN"]))return NextResponse.json({error:"Inventory access required."},{status:403});
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Clinic staff: DENTIST, RECEPTIONIST, BRANCH_MANAGER, OWNER_ADMIN
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
    requireRole(user,['INVENTORY','OWNER_ADMIN'],body.branchId);
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
