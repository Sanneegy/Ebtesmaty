import {getOperationalUser} from '@/lib/operational-auth';
import {hasRole as canInventory} from '@/lib/rbac';
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { requireRole } from '@/lib/rbac';
import { Role } from '@prisma/client';
import { getMaterialCatalog, createMaterial } from '@/services/inventory.service';

export async function GET(req: NextRequest) {
  const user = await getOperationalUser();
  if(!canInventory(user,["INVENTORY","OWNER_ADMIN"]))return NextResponse.json({error:"Inventory access required."},{status:403});
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category') || undefined;

  try {
    const materials = await getMaterialCatalog(category);
    return NextResponse.json({ materials });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch materials' }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  const user = await getOperationalUser();
  if(!canInventory(user,["INVENTORY","OWNER_ADMIN"]))return NextResponse.json({error:"Inventory access required."},{status:403});
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Admin / Director / Manager can create materials
  if (!user.roleGrants.some((g) => ([Role.OWNER_ADMIN, Role.INVENTORY] as Role[]).includes(g.role))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const material = await createMaterial(body);
    return NextResponse.json({ material }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create material' }, { status: 400 });
  }
}
