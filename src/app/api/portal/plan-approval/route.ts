import { NextResponse } from 'next/server';
import { getOperationalUser } from '@/lib/operational-auth';
import { assertPatientSelf, hasRole } from '@/lib/rbac';
import { Role, TreatmentPlanStatus } from '@/lib/prisma-shim';
import db from '@/lib/db';
import { logAuditEvent } from '@/lib/audit';
import { createInvoice } from '@/services/billing.service';

export async function POST(req: Request) {
  try {
    const user = await getOperationalUser();
    if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const body = await req.json();
    const { planId, action, notes, discountPercent } = body;
    if (!planId || !action) {
      return NextResponse.json({ error: 'planId and action are required' }, { status: 400 });
    }

    const plan = await db.treatmentPlan.findUnique({
      where: { id: planId },
      include: { items: { orderBy: { sequenceOrder: 'asc' } } },
    });

    if (!plan) {
      return NextResponse.json({ error: 'Treatment plan not found' }, { status: 404 });
    }

    if (action === 'APPROVE' || action === 'REQUEST_CLARIFICATION') {
      if (hasRole(user, [Role.PATIENT]) && !hasRole(user, [Role.DENTIST, Role.OWNER_ADMIN])) {
        await assertPatientSelf(user.id, plan.patientId);
      }

      const newStatus = action === 'APPROVE' ? TreatmentPlanStatus.ACCEPTED : TreatmentPlanStatus.PROPOSED;
      const approvalNote =
        action === 'APPROVE'
          ? `[Patient Digital Consent Approved by ${user.fullName} at ${new Date().toISOString()}]`
          : `[Patient Clarification Requested by ${user.fullName}: ${notes || 'Please review costs/sequence'}]`;

      const updated = await db.treatmentPlan.update({
        where: { id: planId },
        data: {
          status: newStatus,
          notes: plan.notes ? `${plan.notes}\n${approvalNote}` : approvalNote,
        },
        include: { items: true },
      });

      await logAuditEvent({
        actorUserId: user.id,
        action: action === 'APPROVE' ? 'PATIENT_APPROVED_TREATMENT_PLAN' : 'PATIENT_REQUESTED_PLAN_CLARIFICATION',
        entityType: 'TreatmentPlan',
        entityId: planId,
        branchId: plan.branchId,
        metadata: { patientId: plan.patientId, status: newStatus },
      });

      return NextResponse.json({ plan: updated });
    }

    if (action === 'GENERATE_INVOICE') {
      if (!hasRole(user, [Role.RECEPTIONIST, Role.DENTIST, Role.OWNER_ADMIN, Role.FINANCE])) {
        return NextResponse.json({ error: 'Not authorized to generate invoices' }, { status: 403 });
      }

      if (plan.status !== TreatmentPlanStatus.ACCEPTED && plan.status !== TreatmentPlanStatus.COMPLETED) {
        return NextResponse.json(
          { error: 'Only an approved (ACCEPTED) or COMPLETED treatment plan can generate an invoice.' },
          { status: 400 }
        );
      }

      // Prevent duplicate invoice generation for the same treatment plan
      const existingPlanInvoice = await db.invoice.findFirst({
        where: {
          patientId: plan.patientId,
          status: { not: 'VOIDED' },
          notes: { contains: `PLAN:${plan.id}` },
        },
        include: { lines: true },
      });

      if (existingPlanInvoice) {
        return NextResponse.json({ invoice: existingPlanInvoice, deduplicated: true });
      }

      const activeItems = plan.items.filter((i) => i.status !== 'DECLINED');
      if (activeItems.length === 0) {
        return NextResponse.json({ error: 'No billable items in this treatment plan.' }, { status: 400 });
      }

      const invoice = await createInvoice({
        patientId: plan.patientId,
        branchId: plan.branchId,
        issuedByUserId: user.id,
        discountPercent: discountPercent ? Number(discountPercent) : 0,
        discountReason: notes || 'Approved treatment plan invoice',
        notes: `Generated from Approved Treatment Plan (${plan.title}) [PLAN:${plan.id}]`,
        lines: activeItems.map((item) => ({
          description: item.procedureName,
          toothNumber: item.toothNumber || undefined,
          unitPricePiasters: item.estimatedCostPiasters || 50000,
          quantity: 1,
        })),
      });

      return NextResponse.json({ invoice }, { status: 201 });
    }

    return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Operation failed' }, { status: err.statusCode || 400 });
  }
}
