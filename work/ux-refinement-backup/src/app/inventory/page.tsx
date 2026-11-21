import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { hasRole } from '@/lib/rbac';
import { Role } from '@prisma/client';
import db from '@/lib/db';
import { getMaterialCatalog, getSuppliers, getStockBalances } from '@/services/inventory.service';
import { InventoryDeskClient } from './InventoryDeskClient';

export default async function InventoryPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/auth/login');
  }

  // RBAC: Inventory & Replenishment is restricted to Branch Managers, Inventory Officers, and Clinic Executives (IA-01, IA-02)
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
        <h1 className="text-xl font-bold text-slate-900 mb-2">Access Denied: Inventory Authority Required</h1>
        <p className="text-xs text-slate-500 mb-6">
          You are signed in as <span className="font-semibold text-slate-800">{user.fullName}</span>. Inventory management requires clinic staff or management authority.
        </p>
      </div>
    );
  }

  const branches = await db.branch.findMany({
    where: { isActive: true },
    select: { id: true, code: true, name: true },
    orderBy: { code: 'asc' },
  });

  const [materials, suppliers] = await Promise.all([
    getMaterialCatalog(),
    getSuppliers(),
  ]);

  const defaultBranchId = branches[0]?.id || '';
  const initialBalances = defaultBranchId ? await getStockBalances(defaultBranchId) : [];

  return (
    <InventoryDeskClient
      currentUser={user}
      branches={branches}
      initialMaterials={materials}
      initialSuppliers={suppliers}
      initialBalances={initialBalances}
    />
  );
}
