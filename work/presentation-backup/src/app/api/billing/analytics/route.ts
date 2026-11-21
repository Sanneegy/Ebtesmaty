import {reportBranch} from '@/lib/report-scope';
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { requireRole } from '@/lib/rbac';
import { Role } from '@prisma/client';
import { getFinancialSummary } from '@/services/billing.service';

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  let branchId = searchParams.get('branchId') || undefined;

  try {
    branchId=reportBranch(user,[Role.FINANCE,Role.OWNER_ADMIN],branchId);
    const summary = await getFinancialSummary(branchId);
    return NextResponse.json({ financialSummary: summary });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch financial analytics' }, { status: 400 });
  }
}
