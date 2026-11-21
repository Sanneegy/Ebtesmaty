import {getOperationalUser} from '@/lib/operational-auth';
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { Role } from '@prisma/client';
import { getWorkOrders, createWorkOrder } from '@/services/equipment.service';

export async function GET(req: NextRequest) {
  const user = await getOperationalUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const branchId = searchParams.get('branchId') || undefined;

  try {
    const orders = await getWorkOrders(branchId);
    return NextResponse.json({ orders });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch work orders' }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  const user = await getOperationalUser();
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
    const order = await createWorkOrder(body);
    return NextResponse.json({ order }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create work order' }, { status: 400 });
  }
}
