import {getOperationalUser} from '@/lib/operational-auth';
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { requireRole } from '@/lib/rbac';
import { Role } from '@/lib/prisma-shim';
import { recordCashReconciliation } from '@/services/billing.service';

export async function POST(req: NextRequest) {
  const user = await getOperationalUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    requireRole(user, [Role.RECEPTIONIST, Role.FINANCE, Role.OWNER_ADMIN]);
    const body = await req.json();
    const { branchId, countedCashPiasters, notes } = body;

    if (!branchId || countedCashPiasters === undefined) {
      return NextResponse.json({ error: 'branchId and countedCashPiasters are required' }, { status: 400 });
    }

    requireRole(user,[Role.RECEPTIONIST,Role.FINANCE,Role.OWNER_ADMIN],branchId);
    const reconciliation = await recordCashReconciliation({
      branchId,
      cashierUserId: user.id,
      countedCashPiasters: Number(countedCashPiasters),
      notes,
    });

    return NextResponse.json({ reconciliation }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to reconcile cash drawer' }, { status: 400 });
  }
}
