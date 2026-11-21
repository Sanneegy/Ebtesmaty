import {getOperationalUser} from '@/lib/operational-auth';
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { Role } from '@prisma/client';
import { getEquipmentAssets, createEquipmentAsset } from '@/services/equipment.service';

export async function GET(req: NextRequest) {
  const user = await getOperationalUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const branchId = searchParams.get('branchId') || undefined;
  const status = (searchParams.get('status') as any) || undefined;

  try {
    const assets = await getEquipmentAssets(branchId, status);
    return NextResponse.json({ assets });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch equipment assets' }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  const user = await getOperationalUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const allowed = user.roleGrants.some((g) =>
    ([Role.OWNER_ADMIN, Role.BRANCH_MANAGER] as Role[]).includes(g.role)
  );

  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const asset = await createEquipmentAsset({
      ...body,
      nextServiceDue: body.nextServiceDue ? new Date(body.nextServiceDue) : undefined,
    });
    return NextResponse.json({ asset }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create equipment asset' }, { status: 400 });
  }
}
