import {getOperationalUser} from '@/lib/operational-auth';
import {reportBranch} from '@/lib/report-scope';
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { requireRole } from '@/lib/rbac';
import { Role, ExpenseCategory } from '@/lib/prisma-shim';
import { recordExpense } from '@/services/billing.service';
import db from '@/lib/db';

export async function GET(req: NextRequest) {
  const user = await getOperationalUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  let branchId = searchParams.get('branchId') || undefined;

  try {
    branchId=reportBranch(user,[Role.FINANCE,Role.OWNER_ADMIN],branchId);
    const whereClause: any = {};
    if (branchId) whereClause.branchId = branchId;

    const expenses = await db.expense.findMany({
      where: whereClause,
      include: {
        branch: { select: { id: true, code: true, name: true } },
        createdByUser: { select: { id: true, fullName: true } },
      },
      orderBy: { expenseDate: 'desc' },
      take: 50,
    });

    return NextResponse.json({ expenses });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch expenses' }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  const user = await getOperationalUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    requireRole(user, [Role.FINANCE, Role.OWNER_ADMIN]);
    const body = await req.json();
    const { branchId, category, payee, amountPiasters, expenseDate, notes } = body;

    if (!branchId || !category || !payee || !amountPiasters) {
      return NextResponse.json({ error: 'Missing required expense parameters' }, { status: 400 });
    }

    requireRole(user,[Role.FINANCE,Role.OWNER_ADMIN],branchId);
    const expense = await recordExpense({
      branchId,
      category: category as ExpenseCategory,
      payee,
      amountPiasters: Number(amountPiasters),
      expenseDate: expenseDate ? new Date(expenseDate) : undefined,
      notes,
      createdByUserId: user.id,
    });

    return NextResponse.json({ expense }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to record expense' }, { status: 400 });
  }
}
