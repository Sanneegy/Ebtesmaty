import {getOperationalUser} from '@/lib/operational-auth';

import {TranslatedText} from '@/components/TranslatedText';
import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { assertCareAssignment,branchScope,hasRole } from '@/lib/rbac';
import { Role } from '@/lib/prisma-shim';
import db from '@/lib/db';
import { getPatientClinicalSummary } from '@/services/clinical.service';
import { DentistPatientChartClient } from './DentistPatientChartClient';

interface Props {
  params: {
    patientId: string;
  };
}

export default async function DentistChartPage({ params }: Props) {
  const user = await getOperationalUser();
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
        <h1 className="text-xl font-bold text-slate-900 mb-2"> <TranslatedText text="Access Denied: Clinician Role Required" /> </h1>
        <p className="text-xs text-slate-500 leading-relaxed mb-6"> <TranslatedText text="You are signed in as" /> <span className="font-semibold text-slate-800">{user.fullName}</span> <TranslatedText text=". Patient charts are restricted to authorized clinical staff." /> </p>
      </div>
    );
  }

  try{await assertCareAssignment(user.id,params.patientId)}catch{return <p role="alert">403 · Access restricted</p>;}
  const summary = await getPatientClinicalSummary(params.patientId);
  const branches = await db.branch.findMany({where:{id:branchScope(user,['DENTIST'])},select: { id: true, code: true, name: true } });

  return (
    <DentistPatientChartClient
      currentUser={user}
      patientId={params.patientId}
      initialSummary={summary}
      branches={branches}
    />
  );
}
