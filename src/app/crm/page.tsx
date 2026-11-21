import {getOperationalUser} from '@/lib/operational-auth';
import {branchScope} from '@/lib/rbac';


import {TranslatedText} from '@/components/TranslatedText';
import React from 'react';
import { getCurrentUser } from '@/lib/auth';
import db from '@/lib/db';
import { Role } from '@prisma/client';
import CrmDashboardClient from './CrmDashboardClient';

export const dynamic = 'force-dynamic';

export default async function CrmDashboardPage() {
  const user = await getOperationalUser();

  if (!user) {
    return (
      <div className="w-full max-w-[1600px] mx-auto p-12 text-center">
        <h1 className="text-2xl font-bold text-[#0B2528] mb-2"><TranslatedText text="Authentication Required" /></h1>
        <p className="text-sm text-slate-500"> <TranslatedText text="Please sign in with an authorized CRM, Reception, or Executive account." /> </p>
      </div>
    );
  }

  const allowed = user.roleGrants.some((g) =>
    ([Role.OWNER_ADMIN, Role.CRM, Role.RECEPTIONIST] as Role[]).includes(g.role)
  );

  if (!allowed) {
    return (
      <div className="w-full max-w-[1600px] mx-auto p-12 text-center">
        <div className="p-8 bg-red-50 border border-red-200 rounded-3xl">
          <h1 className="text-2xl font-bold text-red-900 mb-2"> <TranslatedText text="Access Denied: CRM &amp; Retention Authority Required" /> </h1>
          <p className="text-sm text-red-700"> <TranslatedText text="Only authorized CRM, Reception, or Executive staff may access the patient retention and inquiry pipeline." /> </p>
        </div>
      </div>
    );
  }

  const scope=branchScope(user,['CRM','RECEPTIONIST','OWNER_ADMIN']);
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
    db.branch.findMany({where:{id:scope}, orderBy: { code: 'asc' } }),
    db.feedbackCase.findMany({where:{branchId:scope},
      include: {activities:{orderBy:{createdAt:'desc'}},linkedRequest:{select:{appointment:{select:{status:true}}}},
        patient: { select: { id: true, fullName: true, patientNumber: true, primaryPhone: true } },
        branch: { select: { id: true, code: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    db.followUp.findMany({where:{branchId:scope},
      include: {
        patient: { select: { id: true, fullName: true, patientNumber: true, primaryPhone: true } },
        branch: { select: { id: true, code: true, name: true } },
        dentistUser: { select: { id: true, fullName: true } },
      },
      orderBy: { recommendedDate: 'asc' },
    }),
    // Cohort Stage 1: Inbound requests created
    db.appointmentRequest.count({where:{branchId:scope}}),
    // Cohort Stage 2: Staff reviewed / contacted
    db.appointmentRequest.count({
      where: {branchId:scope,
        OR:[{status: { in: ['IN_REVIEW', 'ALTERNATIVE_PROPOSED', 'AWAITING_PATIENT', 'CONFIRMED'] }},{appointment:{isNot:null}}],
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

  const cohort=await db.appointmentRequest.findMany({where:{branchId:scope},select:{id:true,patientId:true,patient:{select:{fullName:true,patientNumber:true}},preferredDate:true,createdAt:true,source:true,branchId:true,status:true,appointment:{select:{status:true}}}});
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <CrmDashboardClient cohort={JSON.parse(JSON.stringify(cohort))}
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
