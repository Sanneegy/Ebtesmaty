import {getOperationalUser} from '@/lib/operational-auth';
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { requireRole } from '@/lib/rbac';
import db from '@/lib/db';
import { Role } from '@/lib/prisma-shim';
import { createInstallmentPlan } from '@/services/billing.service';

export async function POST(req: NextRequest) {
  const user = await getOperationalUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    requireRole(user, [Role.RECEPTIONIST, Role.FINANCE, Role.OWNER_ADMIN]);
    const body = await req.json();
    const { patientId, invoiceId, totalInstallments, startDate } = body;

    if (!patientId || !invoiceId) {
      return NextResponse.json({ error: 'patientId and invoiceId are required' }, { status: 400 });
    }

    const invoice=await db.invoice.findUnique({where:{id:invoiceId},select:{patientId:true,branchId:true}});
    if(!invoice || invoice.patientId!==patientId)return NextResponse.json({error:"Invoice not found"},{status:404});
    requireRole(user,[Role.RECEPTIONIST,Role.FINANCE],invoice.branchId);
    const plan = await createInstallmentPlan({
      patientId,
      invoiceId,
      totalInstallments: Number(totalInstallments) || 3,
      startDate: startDate ? new Date(startDate) : undefined,
    });

    return NextResponse.json({ installmentPlan: plan }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to establish installment plan' }, { status: 400 });
  }
}
