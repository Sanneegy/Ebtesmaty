import {branchScope} from '@/lib/rbac';
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { requireRole } from '@/lib/rbac';
import { Role } from '@prisma/client';
import { createInvoice, getPatientInvoices } from '@/services/billing.service';
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
        return NextResponse.json({ invoices: [] });
      }
      const invoices = await getPatientInvoices(link.patientId);
      return NextResponse.json({ invoices });
    }

    const scope=branchScope(user,[Role.RECEPTIONIST,Role.FINANCE,Role.OWNER_ADMIN],branchId);
    const whereClause:any={branchId:scope,...(patientId?{patientId}:{})};
    const invoices = await db.invoice.findMany({
      where: whereClause,
      include: {
        lines: true,
        patient: { select: { id: true, patientNumber: true, fullName: true, primaryPhone: true } },
        branch: { select: { id: true, code: true, name: true } },
        issuedByUser: { select: { id: true, fullName: true } },
      },
      orderBy: { issuedAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ invoices });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch invoices' }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    requireRole(user, [Role.RECEPTIONIST, Role.FINANCE, Role.OWNER_ADMIN, Role.DENTIST]);
    const body = await req.json();
    const { patientId, branchId, encounterId, notes, lines } = body;

    if (!patientId || !branchId || !lines || !Array.isArray(lines) || lines.length === 0) {
      return NextResponse.json({ error: 'Missing required invoice parameters' }, { status: 400 });
    }

    const invoice = await createInvoice({
      patientId,
      branchId,
      encounterId,
      issuedByUserId: user.id,
      notes,
      lines,
    });

    return NextResponse.json({ invoice }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to issue invoice' }, { status: 400 });
  }
}
