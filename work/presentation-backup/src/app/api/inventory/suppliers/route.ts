import {hasRole as canInventory} from '@/lib/rbac';
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { Role } from '@prisma/client';
import { getSuppliers, createSupplier } from '@/services/inventory.service';

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if(!canInventory(user,["INVENTORY","OWNER_ADMIN"]))return NextResponse.json({error:"Inventory access required."},{status:403});
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const suppliers = await getSuppliers();
    return NextResponse.json({ suppliers });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch suppliers' }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if(!canInventory(user,["INVENTORY","OWNER_ADMIN"]))return NextResponse.json({error:"Inventory access required."},{status:403});
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const allowed = user.roleGrants.some((g) =>
    ([Role.OWNER_ADMIN, Role.INVENTORY] as Role[]).includes(g.role)
  );

  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const supplier = await createSupplier(body);
    return NextResponse.json({ supplier }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create supplier' }, { status: 400 });
  }
}
