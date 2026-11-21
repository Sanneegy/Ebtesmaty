import {getOperationalUser} from '@/lib/operational-auth';


import {TranslatedText} from '@/components/TranslatedText';
import { ReceptionToday } from '@/components/ReceptionToday';
import { LocalizedText } from '@/components/LocalizedText';
import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '../../lib/auth';
import { hasRole } from '../../lib/rbac';
import { Role } from '@prisma/client';
import db from '../../lib/db';
import { ReceptionWorkspaceClient } from './ReceptionWorkspaceClient';
import { getCairoDayBounds } from '../../lib/cairo-date';

export const dynamic = 'force-dynamic';

export default async function ReceptionPage({searchParams}:{searchParams:{view?:string}}) {
 if(searchParams.view==='patients')redirect('/reception/patients');
  const user = await getOperationalUser();
  if (!user) {
    redirect('/auth/login');
  }

  // Check RBAC permission: RECEPTIONIST, BRANCH_MANAGER, or OWNER_ADMIN
  if (!hasRole(user, [Role.RECEPTIONIST, Role.OWNER_ADMIN])) {
    return (
      <div className="max-w-2xl mx-auto mt-16 p-8 bg-white rounded-3xl border border-red-200 shadow-sm text-center">
        <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4 font-bold text-lg">
          403
        </div>
        <h1 className="text-xl font-bold text-slate-900 mb-2"> <TranslatedText text="Access Denied: Receptionist Role Required" /> </h1>
        <p className="text-xs text-slate-500 leading-relaxed mb-6"> <TranslatedText text="You are currently signed in as" /> <span className="font-semibold text-slate-800">{user.fullName}</span> ({user.roleGrants[0]?.role} <TranslatedText text="). The Reception Desk is strictly restricted to authorized clinic receptionists and administrators." /> </p>
        <a
          href="/demo"
          className="inline-block px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors"
        > <TranslatedText text="Switch to Receptionist Demo Account" /> </a>
      </div>
    );
  }

  const assignedBranchId = user.roleGrants.find((g) => g.branchId)?.branchId || null;
  const { start: todayStart, end: tomorrowStart } = getCairoDayBounds();

  // Fetch pending portal link requests
  const pendingLinks = await db.portalPatientLink.findMany({
    where: { status: 'PENDING', ...(assignedBranchId?{patient:{primaryBranchId:assignedBranchId}}:{}) },
    include: {
      user: {select:{id:true,fullName:true,email:true,phone:true}},
      patient: {
        include: { primaryBranch: true },
      },
    },
    orderBy: { requestedAt: 'asc' },
  });

  // Fetch unresolved duplicate review hints and group by canonical patient pair + match reason
  const rawDuplicateReviews = await db.potentialDuplicateReview.findMany({
    where: { status: 'PENDING' },
    include: {
      patientA: true,
      patientB: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  const seenDuplicatePairs = new Set<string>();
  const duplicateReviews = rawDuplicateReviews.filter((r) => {
    const key = `${[r.patientAId, r.patientBId].sort().join('_')}::${r.matchType}`;
    if (seenDuplicatePairs.has(key)) return false;
    seenDuplicatePairs.add(key);
    return true;
  });

  // Fetch branches, today's/upcoming appointments, appointment requests, and doctor duty coverage
  const [branches, appointments, pendingRequests, doctorDuties] = await Promise.all([
    db.branch.findMany({
      where: { isActive: true, ...(assignedBranchId ? {id:assignedBranchId} : {}) },
      orderBy: { code: 'asc' },
    }),
    db.appointment.findMany({
      where: {
        ...(assignedBranchId ? { branchId: assignedBranchId } : {}),
        appointmentDate: { gte: todayStart, lt: tomorrowStart },
      },
      include: {
        patient: true,
        dentistUser: {select:{id:true,fullName:true,email:true}},
        branch: true,
        arrivalEvent: true,
        queueEntry: true,
      },
      orderBy: [{ appointmentDate: 'asc' }, { startTime: 'asc' }],
      take: 25,
    }),
    db.appointmentRequest.findMany({
      where: {
        ...(assignedBranchId ? { branchId: assignedBranchId } : {}),
        status: { in: ['REQUESTED', 'IN_REVIEW', 'AWAITING_PATIENT'] },
      },
      include: {
        patient: true,
        branch: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
    db.doctorDuty.findMany({
      where: {
        ...(assignedBranchId ? { branchId: assignedBranchId } : {}),
        dutyDate: { gte: todayStart, lt: tomorrowStart },
      },
      include: {
        dentistUser: {select:{id:true,fullName:true,email:true}},
        branch: true,
      },
      orderBy: { dutyDate: 'desc' },
      take: 10,
    }),
  ]);

  return <ReceptionToday branches={branches} appointments={appointments} requests={pendingRequests}/>;
}
