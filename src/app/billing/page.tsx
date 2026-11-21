import {getOperationalUser} from '@/lib/operational-auth';

import {TranslatedText} from '@/components/TranslatedText';
import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { branchScope, hasRole } from '@/lib/rbac';
import { Role } from '@prisma/client';
import db from '@/lib/db';
import { getServiceCatalog, getFinancialSummary } from '@/services/billing.service';
import { BillingDeskClient } from './BillingDeskClient';

export default async function BillingPage() {
  const user = await getOperationalUser();
  if (!user) {
    redirect('/auth/login');
  }

  // RBAC: Staff roles
  if (!hasRole(user, [Role.RECEPTIONIST, Role.FINANCE, Role.OWNER_ADMIN])) {
    return (
      <div className="max-w-2xl mx-auto mt-16 p-8 bg-white rounded-3xl border border-red-200 shadow-sm text-center">
        <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4 font-bold text-lg">
          403
        </div>
        <h1 className="text-xl font-bold text-slate-900 mb-2"> <TranslatedText text="Access Denied: Staff Financial Authority Required" /> </h1>
        <p className="text-xs text-slate-500 mb-6"> <TranslatedText text="You are signed in as" /> <span className="font-semibold text-slate-800">{user.fullName}</span> <TranslatedText text=". Financial operations require receptionist or management authority." /> </p>
      </div>
    );
  }

  const scope=branchScope(user,['RECEPTIONIST','FINANCE','OWNER_ADMIN']);
  const summaryBranch=typeof scope==='object'?scope.in[0]:scope;
  const [branches, catalog, initialSummary, patients] = await Promise.all([
    db.branch.findMany({where:{id:scope}, select: { id: true, code: true, name: true } }),
    getServiceCatalog(),
    getFinancialSummary(summaryBranch),
    db.patient.findMany({where:{primaryBranchId:scope},
      select: { id: true, patientNumber: true, fullName: true, primaryPhone: true },
      take: 20,
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return (
    <BillingDeskClient
      currentUser={user}
      branches={branches}
      serviceCatalog={catalog}
      initialSummary={initialSummary}
      initialPatients={patients}
    />
  );
}
