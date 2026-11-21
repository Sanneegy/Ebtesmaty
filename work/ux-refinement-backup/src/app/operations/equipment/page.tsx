import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { hasRole } from '@/lib/rbac';
import { Role } from '@prisma/client';
import db from '@/lib/db';
import { getEquipmentAssets, getEquipmentSummary, getWorkOrders } from '@/services/equipment.service';
import { EquipmentDeskClient } from './EquipmentDeskClient';

export default async function EquipmentOperationsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/auth/login');
  }

  // RBAC: Administrative Equipment & Maintenance Desk restricted to Management & Maintenance Officers (IA-01, IA-02, OPS-01)
  const allowed = hasRole(user, [
    Role.OWNER_ADMIN,
    Role.BRANCH_MANAGER,
  ]);

  if (!allowed) {
    return (
      <div className="max-w-2xl mx-auto mt-16 p-8 bg-white rounded-3xl border border-red-200 shadow-sm text-center">
        <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4 font-bold text-lg">
          403
        </div>
        <h1 className="text-xl font-bold text-slate-900 mb-2">Access Denied: Staff Operations Access Required</h1>
        <p className="text-xs text-slate-500 mb-6">
          You are signed in as <span className="font-semibold text-slate-800">{user.fullName}</span>. Equipment operations and maintenance logs require clinic staff authority.
        </p>
      </div>
    );
  }

  const branches = await db.branch.findMany({
    where: { isActive: true },
    select: { id: true, code: true, name: true },
    orderBy: { code: 'asc' },
  });

  const defaultBranchId = branches[0]?.id || '';

  const [assets, summary, workOrders] = await Promise.all([
    getEquipmentAssets(defaultBranchId),
    getEquipmentSummary(defaultBranchId),
    getWorkOrders(defaultBranchId),
  ]);

  return (
    <EquipmentDeskClient
      currentUser={user}
      branches={branches}
      initialAssets={assets}
      initialSummary={summary}
      initialWorkOrders={workOrders}
    />
  );
}
