import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { hasRole } from '@/lib/rbac';
import { Role } from '@prisma/client';
import db from '@/lib/db';
import { getPatientClinicalSummary } from '@/services/clinical.service';
import { DentistPatientChartClient } from './DentistPatientChartClient';

interface Props {
  params: {
    patientId: string;
  };
}

export default async function DentistChartPage({ params }: Props) {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/auth/login');
  }

  // RBAC check: DENTIST or OWNER_ADMIN
  if (!hasRole(user, [Role.DENTIST, Role.OWNER_ADMIN])) {
    return (
      <div className="max-w-2xl mx-auto mt-16 p-8 bg-white rounded-3xl border border-red-200 shadow-sm text-center">
        <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4 font-bold text-lg">
          403
        </div>
        <h1 className="text-xl font-bold text-slate-900 mb-2">Access Denied: Clinician Role Required</h1>
        <p className="text-xs text-slate-500 leading-relaxed mb-6">
          You are signed in as <span className="font-semibold text-slate-800">{user.fullName}</span>. Patient charts are restricted to authorized clinical staff.
        </p>
      </div>
    );
  }

  const summary = await getPatientClinicalSummary(params.patientId);
  const branches = await db.branch.findMany({ select: { id: true, code: true, name: true } });

  return (
    <DentistPatientChartClient
      currentUser={user}
      patientId={params.patientId}
      initialSummary={summary}
      branches={branches}
    />
  );
}
