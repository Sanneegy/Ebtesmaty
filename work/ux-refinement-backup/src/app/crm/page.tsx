import React from 'react';
import { getCurrentUser } from '@/lib/auth';
import db from '@/lib/db';
import { Role } from '@prisma/client';
import CrmDashboardClient from './CrmDashboardClient';

export const dynamic = 'force-dynamic';

export default async function CrmDashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center">
        <h1 className="text-2xl font-bold text-[#123B67] mb-2">Authentication Required</h1>
        <p className="text-sm text-[#526574]">
          Please sign in with an authorized CRM, Reception, or Executive account.
        </p>
      </div>
    );
  }

  const allowed = user.roleGrants.some((g) =>
    ([Role.OWNER_ADMIN, Role.BRANCH_MANAGER, Role.RECEPTIONIST] as Role[]).includes(g.role)
  );

  if (!allowed) {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center">
        <div className="p-8 bg-red-50 border border-red-200 rounded-2xl">
          <h1 className="text-2xl font-bold text-red-900 mb-2">
            Access Denied: CRM &amp; Retention Authority Required
          </h1>
          <p className="text-sm text-red-700">
            Only authorized CRM, Reception, or Executive staff may access the patient retention and inquiry pipeline.
          </p>
        </div>
      </div>
    );
  }

  // Genuinely connected cohort tracking:
  // Starts with inbound AppointmentRequests and follows the EXACT same records through review, booking, and attendance
  const [
    branches,
    feedbackCases,
    followUps,
    cohortTotalRequests,
    cohortContactedRequests,
    cohortBookedAppointments,
    cohortAttendedVisits,
  ] = await Promise.all([
    db.branch.findMany({ orderBy: { code: 'asc' } }),
    db.feedbackCase.findMany({
      include: {
        patient: { select: { id: true, fullName: true, patientNumber: true, primaryPhone: true } },
        branch: { select: { id: true, code: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    db.followUp.findMany({
      include: {
        patient: { select: { id: true, fullName: true, patientNumber: true, primaryPhone: true } },
        branch: { select: { id: true, code: true, name: true } },
        dentistUser: { select: { id: true, fullName: true } },
      },
      orderBy: { recommendedDate: 'asc' },
    }),
    // Cohort Stage 1: Inbound requests created
    db.appointmentRequest.count(),
    // Cohort Stage 2: Staff reviewed / contacted
    db.appointmentRequest.count({
      where: {
        status: { in: ['IN_REVIEW', 'ALTERNATIVE_PROPOSED', 'CONFIRMED'] },
      },
    }),
    // Cohort Stage 3: Appointment confirmed from that request
    db.appointmentRequest.count({
      where: {
        appointment: { isNot: null },
      },
    }),
    // Cohort Stage 4: Visit attended & completed from that request
    db.appointmentRequest.count({
      where: {
        appointment: {
          status: 'COMPLETED',
        },
      },
    }),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <CrmDashboardClient
        branches={JSON.parse(JSON.stringify(branches))}
        initialCases={JSON.parse(JSON.stringify(feedbackCases))}
        initialFollowUps={JSON.parse(JSON.stringify(followUps))}
        funnelMetrics={{
          inquiriesCount: feedbackCases.filter((c) => c.category === 'INQUIRY').length,
          totalFeedbackCount: feedbackCases.length,
          bookingRequestsCount: cohortTotalRequests,
          contactedRequestsCount: cohortContactedRequests,
          confirmedBookingsCount: cohortBookedAppointments,
          attendedVisitsCount: cohortAttendedVisits,
        }}
      />
    </div>
  );
}
