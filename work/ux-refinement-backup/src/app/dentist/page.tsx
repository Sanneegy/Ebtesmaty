import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '../../lib/auth';
import { hasRole } from '../../lib/rbac';
import { Role, AppointmentStatus, QueueStatus } from '@prisma/client';
import db from '../../lib/db';
import { DentistDeskClient } from './DentistDeskClient';

export default async function DentistPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/auth/login');
  }

  // Check RBAC permission: DENTIST or OWNER_ADMIN
  if (!hasRole(user, [Role.DENTIST, Role.OWNER_ADMIN])) {
    return (
      <div className="max-w-2xl mx-auto mt-16 p-8 bg-white rounded-3xl border border-red-200 shadow-sm text-center">
        <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4 font-bold text-lg">
          403
        </div>
        <h1 className="text-xl font-bold text-slate-900 mb-2">Access Denied: Clinician Role Required</h1>
        <p className="text-xs text-slate-500 leading-relaxed mb-6">
          You are currently signed in as <span className="font-semibold text-slate-800">{user.fullName}</span> ({user.roleGrants[0]?.role}). The Dentist Clinical Desk is strictly restricted to authorized licensed dental surgeons.
        </p>
        <a
          href="/demo"
          className="inline-block px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors"
        >
          Switch to Dentist Demo Account (Dr. Sandy Saad)
        </a>
      </div>
    );
  }

  const todayStart = new Date(new Date().setHours(0, 0, 0, 0));
  const todayEnd = new Date(new Date().setHours(23, 59, 59, 999));

  // 1. Fetch care assignments for this dentist (including tooth findings & treatment plans)
  const careAssignments = await db.patientCareAssignment.findMany({
    where: {
      dentistUserId: user.id,
      active: true,
    },
    include: {
      patient: {
        include: {
          primaryBranch: true,
          toothFindings: {
            orderBy: { recordedAt: 'desc' },
          },
          treatmentPlans: {
            include: { items: true },
            orderBy: { createdAt: 'desc' },
          },
          medicalSubmissions: {
            include: {
              reviews: {
                include: { dentistUser: true },
                orderBy: { reviewedAt: 'desc' },
              },
            },
            orderBy: { versionNumber: 'desc' },
          },
        },
      },
      branch: true,
    },
  });

  // 2. Fetch live waiting queue for this dentist (patients who have verified physical arrival)
  const waitingQueue = await db.queueEntry.findMany({
    where: {
      dentistUserId: user.id,
      status: { in: [QueueStatus.WAITING, QueueStatus.CALLED, QueueStatus.IN_CONSULTATION] },
    },
    include: {
      patient: {
        include: {
          primaryBranch: true,
          medicalSubmissions: {
            where: { status: 'REVIEWED' },
            orderBy: { versionNumber: 'desc' },
            take: 1,
          },
        },
      },
      appointment: true,
      branch: true,
    },
    orderBy: { enteredAt: 'asc' },
  });

  // 3. Fetch assigned appointments & branch assets for contextual fault reporting
  const branchId = user.roleGrants.find((g) => g.branchId)?.branchId || undefined;
  const [todayAppointments, branchAssets] = await Promise.all([
    db.appointment.findMany({
      where: {
        dentistUserId: user.id,
      },
      include: {
        patient: true,
        branch: true,
        arrivalEvent: true,
        queueEntry: true,
      },
      orderBy: [{ appointmentDate: 'asc' }, { startTime: 'asc' }],
      take: 20,
    }),
    db.equipmentAsset.findMany({
      where: branchId ? { branchId } : {},
      select: { id: true, name: true, serialNumber: true, category: true, status: true, branchId: true },
      orderBy: { name: 'asc' },
    }),
  ]);

  return (
    <DentistDeskClient
      currentUser={user}
      assignedPatients={careAssignments.map((a) => a.patient)}
      waitingQueue={waitingQueue}
      todayAppointments={todayAppointments}
      branchAssets={branchAssets}
    />
  );
}
