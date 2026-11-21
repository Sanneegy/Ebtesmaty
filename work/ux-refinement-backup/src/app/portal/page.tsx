import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import db from '@/lib/db';
import { getUserNotifications } from '@/services/communications.service';
import { getPatientInvoices, getPatientPayments } from '@/services/billing.service';
import { PatientDashboardClient } from './PatientDashboardClient';

export default async function PatientPortalPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/auth/login');
  }

  // Get active approved portal link
  const approvedLink = await db.portalPatientLink.findFirst({
    where: { userId: user.id, status: 'APPROVED' },
    include: {
      patient: {
        include: {
          primaryBranch: true,
          careAssignments: {
            where: { active: true },
            include: { dentistUser: true, branch: true },
          },
        },
      },
    },
  });

  const patient = approvedLink?.patient;

  // 1. Fetch next confirmed appointment
  const nextAppointment = patient
    ? await db.appointment.findFirst({
        where: {
          patientId: patient.id,
          status: 'CONFIRMED',
          appointmentDate: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
        include: {
          branch: true,
          dentistUser: true,
          arrivalEvent: true,
        },
        orderBy: [{ appointmentDate: 'asc' }, { startTime: 'asc' }],
      })
    : null;

  // 2. Fetch pending appointment requests (including offers)
  const pendingRequests = patient
    ? await db.appointmentRequest.findMany({
        where: {
          patientId: patient.id,
          status: { in: ['REQUESTED', 'IN_REVIEW', 'ALTERNATIVE_PROPOSED', 'AWAITING_PATIENT'] },
        },
        include: { branch: true },
        orderBy: { createdAt: 'desc' },
      })
    : [];

  // 3. Fetch upcoming confirmed care timeline (deduplicated by date + time + service)
  const rawCareTimeline = patient
    ? await db.appointment.findMany({
        where: {
          patientId: patient.id,
          status: 'CONFIRMED',
          appointmentDate: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
        include: { branch: true, dentistUser: true },
        orderBy: [{ appointmentDate: 'asc' }, { startTime: 'asc' }],
        take: 15,
      })
    : [];

  const seenTimelineSlots = new Set<string>();
  const careTimeline = rawCareTimeline.filter((appt) => {
    const key = `${new Date(appt.appointmentDate).toISOString().split('T')[0]}_${appt.startTime}_${appt.serviceDescription}`;
    if (seenTimelineSlots.has(key)) return false;
    seenTimelineSlots.add(key);
    return true;
  }).slice(0, 5);

  // 4. Fetch treatment plans (recommended care, deduplicated by canonical title + items signature)
  const rawTreatmentPlans = patient
    ? await db.treatmentPlan.findMany({
        where: {
          patientId: patient.id,
          status: { in: ['DRAFT', 'PROPOSED', 'ACCEPTED'] },
        },
        include: {
          items: true,
          dentistUser: true,
        },
        orderBy: { createdAt: 'desc' },
      })
    : [];

  const seenPlanSignatures = new Set<string>();
  const treatmentPlans = rawTreatmentPlans.filter((plan) => {
    const itemSig = (plan.items || [])
      .map((i) => `${i.toothNumber || ''}:${i.procedureName}:${i.estimatedCostPiasters}`)
      .sort()
      .join('|');
    const sig = `${plan.title}::${plan.totalEstimatedCostPiasters}::${itemSig}`;
    if (seenPlanSignatures.has(sig)) return false;
    seenPlanSignatures.add(sig);
    return true;
  });

  // Only unperformed (PLANNED / IN_PROGRESS / DEFERRED) items count toward future estimated treatment cost
  const estimatedTreatmentCostPiasters = treatmentPlans.reduce((sum, p) => {
    const unperformedItemsCost = (p.items || [])
      .filter((it) => it.status !== 'PERFORMED' && it.status !== 'DECLINED')
      .reduce((iSum, it) => iSum + (it.estimatedCostPiasters || 0), 0);
    return sum + (p.items && p.items.length > 0 ? unperformedItemsCost : (p.totalEstimatedCostPiasters || 0));
  }, 0);

  // 5. Fetch authoritative invoices & payments (excluding VOID invoices)
  const rawInvoices = patient ? await getPatientInvoices(patient.id) : [];
  const invoices = rawInvoices.filter((inv: any) => inv.status !== 'VOID');
  const payments = patient ? await getPatientPayments(patient.id) : [];

  const totalInvoiced = invoices.reduce((sum: number, inv: any) => sum + inv.totalAmountPiasters, 0);
  const totalPaid = payments
    .filter((p: any) => p.status === 'POSTED')
    .reduce((sum: number, p: any) => sum + p.amountPiasters, 0);
  const totalBalanceDue = Math.max(0, totalInvoiced - totalPaid);

  // 6. Fetch active installment plans (deduplicated by invoiceId / canonical obligation)
  const rawInstallmentPlans = patient
    ? await db.installmentPlan.findMany({
        where: { patientId: patient.id, status: 'ACTIVE' },
        include: {
          installments: {
            where: { status: 'PENDING' },
            orderBy: { dueDate: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      })
    : [];

  const seenInstPlanKeys = new Set<string>();
  const installmentPlans = rawInstallmentPlans.filter((plan) => {
    const key = plan.invoiceId || `${plan.totalAmountPiasters}_${plan.installments.length}`;
    if (seenInstPlanKeys.has(key)) return false;
    seenInstPlanKeys.add(key);
    return true;
  });

  const pendingInstallments = installmentPlans.flatMap((plan) => plan.installments);

  // 7. Medical intake submissions & notifications
  const submissions = patient
    ? await db.medicalHistorySubmission.findMany({
        where: { patientId: patient.id },
        include: {
          reviews: {
            include: { dentistUser: true },
            orderBy: { reviewedAt: 'desc' },
          },
        },
        orderBy: { versionNumber: 'desc' },
      })
    : [];

  const latestSubmission = submissions[0] || null;
  const draftSubmission = submissions.find((s) => s.status === 'DRAFT') || null;
  const notifications = await getUserNotifications(user.id, 5);

  return (
    <PatientDashboardClient
      user={user}
      patient={patient}
      nextAppointment={nextAppointment}
      pendingRequests={pendingRequests}
      careTimeline={careTimeline}
      treatmentPlans={treatmentPlans}
      billingSummary={{
        totalInvoiced,
        totalPaid,
        totalBalanceDue,
        invoicesCount: invoices.length,
        paymentsCount: payments.length,
      }}
      installments={pendingInstallments}
      estimatedTreatmentCostPiasters={estimatedTreatmentCostPiasters}
      latestSubmission={latestSubmission}
      draftSubmission={draftSubmission}
      notifications={notifications}
      isAr={false}
    />
  );
}
