import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { hasRole } from '@/lib/rbac';
import { Role } from '@prisma/client';
import db from '@/lib/db';
import { PurchasingWorkspaceClient } from './PurchasingWorkspaceClient';

export default async function PurchasingPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/auth/login');
  }

  // RBAC check: BRANCH_MANAGER or OWNER_ADMIN (IA-01, IA-02)
  if (!hasRole(user, [Role.INVENTORY, Role.OWNER_ADMIN])) {
    return (
      <div className="max-w-2xl mx-auto mt-16 p-8 bg-white rounded-3xl border border-red-200 shadow-sm text-center">
        <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4 font-bold text-lg">
          403
        </div>
        <h1 className="text-xl font-bold text-slate-900 mb-2">Access Denied: Procurement Role Required</h1>
        <p className="text-xs text-slate-500 leading-relaxed mb-6">
          You are signed in as <span className="font-semibold text-slate-800">{user.fullName}</span>. The Purchasing & Procurement Desk is restricted to authorized clinic procurement staff and management.
        </p>
      </div>
    );
  }

  const [branches, suppliers, materials, purchaseOrders] = await Promise.all([
    db.branch.findMany({ where: { isActive: true }, select: { id: true, code: true, name: true } }),
    db.supplier.findMany({ orderBy: { name: 'asc' } }),
    db.material.findMany({ where: { isActive: true }, orderBy: { nameEn: 'asc' } }),
    db.purchaseOrder.findMany({
      include: {
        branch: true,
        supplier: true,
        lines: { include: { material: true } },
      },
      orderBy: { issuedAt: 'desc' },
      take: 50,
    }),
  ]);

  return (
    <PurchasingWorkspaceClient
      currentUser={user}
      branches={branches}
      suppliers={suppliers}
      materials={materials}
      initialOrders={purchaseOrders}
    />
  );
}
