import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { Role } from '@prisma/client';
import { getStockBalances } from '@/services/inventory.service';
import db from '@/lib/db';

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  let branchId = searchParams.get('branchId');

  if (!branchId) {
    const userBranch = user.roleGrants.find((g) => g.branchId)?.branchId;
    if (userBranch) {
      branchId = userBranch;
    } else {
      const defaultBranch = await db.branch.findFirst({ where: { isActive: true } });
      branchId = defaultBranch?.id || null;
    }
  }

  if (!branchId) {
    return NextResponse.json({ error: 'No branch identified' }, { status: 400 });
  }

  try {
    const balances = await getStockBalances(branchId);
    return NextResponse.json({ balances, branchId });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch stock balances' }, { status: 400 });
  }
}
