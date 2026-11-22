import db from '@/lib/db';
import {getCairoDayBounds} from '@/lib/cairo-date';
import {getOperationalUser} from '@/lib/operational-auth';
import {reportBranch} from '@/lib/report-scope';
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { requireRole } from '@/lib/rbac';
import { Role } from '@/lib/prisma-shim';
import { getFinancialSummary } from '@/services/billing.service';

export async function GET(req: NextRequest) {
  const user = await getOperationalUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  let branchId = searchParams.get('branchId') || undefined;

  try {
    branchId=reportBranch(user,[Role.FINANCE,Role.OWNER_ADMIN],branchId);
    const summary = await getFinancialSummary(branchId);
    const {start,end}=getCairoDayBounds();const cash=await db.payment.aggregate({where:{collectionBranchId:branchId,status:'POSTED',paymentMethod:'CASH',collectedAt:{gte:start,lt:end}},_sum:{amountPiasters:true}});return NextResponse.json({financialSummary:{...summary,todayCashPiasters:cash._sum.amountPiasters||0}});
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch financial analytics' }, { status: 400 });
  }
}
