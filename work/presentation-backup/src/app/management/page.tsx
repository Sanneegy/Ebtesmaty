import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '../../lib/auth';
import { hasRole } from '../../lib/rbac';
import { Role } from '@prisma/client';
import db from '../../lib/db';
import { getOperationalMetrics, getUnresolvedDuplicates, getPendingPortalLinks } from '../../services/management.service';
import { getManagementActionCenterKPIs, getOperationalAlerts, getFeedbackCases } from '../../services/communications.service';
import { ManagementClient } from './ManagementClient';

interface Props {
  searchParams: Promise<{ branchId?: string }>;
}

export default async function ManagementPage({ searchParams }: Props) {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/auth/login');
  }

  // Check RBAC permission: BRANCH_MANAGER or OWNER_ADMIN
  if (!hasRole(user, [Role.BRANCH_MANAGER, Role.OWNER_ADMIN])) {
    return (
      <div className="max-w-2xl mx-auto mt-16 p-8 bg-white rounded-3xl border border-red-200 shadow-sm text-center">
        <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4 font-bold text-lg">
          403
        </div>
        <h1 className="text-xl font-bold text-slate-900 mb-2">Access Denied: Management Role Required</h1>
        <p className="text-xs text-slate-500 leading-relaxed mb-6">
          You are currently signed in as <span className="font-semibold text-slate-800">{user.fullName}</span> ({user.roleGrants[0]?.role}). Operational Management is strictly restricted to Branch Managers and Clinic Executives.
        </p>
        <a
          href="/demo"
          className="inline-block px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors"
        >
          Switch to Branch Manager Demo Account (Amr Fouad)
        </a>
      </div>
    );
  }

  const { branchId } = await searchParams;
  const isOwnerAdmin = hasRole(user, [Role.OWNER_ADMIN]);
  const userBranchId = user.roleGrants.find((rg) => rg.role === Role.BRANCH_MANAGER)?.branchId;

  // Server-side enforcement: If user is BRANCH_MANAGER without OWNER_ADMIN, force their assigned branchId
  const effectiveBranchId = !isOwnerAdmin && userBranchId ? userBranchId : (branchId || null);

  // Fetch operational metrics (STRICT GUARANTEE: Zero clinical PHI returned)
  const [metrics, duplicates, pendingLinks, branches, kpis, alerts, feedbackCases] = await Promise.all([
    getOperationalMetrics(effectiveBranchId, user),
    getUnresolvedDuplicates(effectiveBranchId, user),
    getPendingPortalLinks(effectiveBranchId, user),
    db.branch.findMany({ where: { isActive: true }, orderBy: { code: 'asc' } }),
    getManagementActionCenterKPIs(effectiveBranchId||undefined),
    getOperationalAlerts(effectiveBranchId || undefined),
    getFeedbackCases(effectiveBranchId || undefined),
  ]);

  return (
    <ManagementClient
      currentUser={user}
      metrics={metrics}
      duplicates={duplicates}
      pendingLinks={pendingLinks}
      branches={branches}
      selectedBranchId={effectiveBranchId}
      kpis={kpis}
      alerts={alerts}
      initialFeedbackCases={feedbackCases}
    />
  );
}
