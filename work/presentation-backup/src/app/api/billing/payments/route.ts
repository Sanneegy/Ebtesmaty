import {branchScope} from '@/lib/rbac';
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { requireRole } from '@/lib/rbac';
import { Role, PaymentMethod } from '@prisma/client';
import { recordPayment, getPatientPayments } from '@/services/billing.service';
import db from '@/lib/db';

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const patientId = searchParams.get('patientId');
  const branchId = searchParams.get('branchId');

  try {
    const isPatient = user.roleGrants.some((g) => g.role === Role.PATIENT);
    if (isPatient && !user.roleGrants.some((g) => ([Role.RECEPTIONIST, Role.DENTIST, Role.FINANCE, Role.OWNER_ADMIN] as Role[]).includes(g.role))) {
      const link = await db.portalPatientLink.findFirst({
        where: { userId: user.id, status: 'APPROVED' },
      });
      if (!link) {
        return NextResponse.json({ payments: [] });
      }
      const payments = await getPatientPayments(link.patientId);
      return NextResponse.json({ payments });
    }

    const scope=branchScope(user,[Role.RECEPTIONIST,Role.FINANCE,Role.OWNER_ADMIN],branchId);
    const whereClause:any={collectionBranchId:scope,...(patientId?{patientId}:{})};
    const payments = await db.payment.findMany({
      where: whereClause,
      include: {
        allocations: { include: { invoice: true } },
        patient: { select: { id: true, patientNumber: true, fullName: true, primaryPhone: true } },
        collectedByUser: { select: { id: true, fullName: true } },
      },
      orderBy: { collectedAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ payments });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch payments' }, { status: err.statusCode || 400 });
  }
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { patientId, collectionBranchId, amountPiasters, paymentMethod, idempotencyKey, invoiceAllocations, notes } = body;

    requireRole(user,[Role.RECEPTIONIST,Role.FINANCE,Role.OWNER_ADMIN],collectionBranchId);
    if (!idempotencyKey) return NextResponse.json({error:'A payment reference is required.'},{status:400});

    if (!patientId || !collectionBranchId || !amountPiasters || !paymentMethod) {
      return NextResponse.json({ error: 'Missing required payment parameters' }, { status: 400 });
    }

    const finalIdempotencyKey = idempotencyKey;

    const payment = await recordPayment({
      patientId,
      collectionBranchId,
      amountPiasters: Number(amountPiasters),
      paymentMethod: paymentMethod as PaymentMethod,
      collectedByUserId: user.id,
      idempotencyKey: finalIdempotencyKey,
      invoiceAllocations,
      notes,
    });

    return NextResponse.json({ payment }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to collect payment' }, { status: 400 });
  }
}
