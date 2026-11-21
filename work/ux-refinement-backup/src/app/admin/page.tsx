import React from 'react';
import { getCurrentUser } from '@/lib/auth';
import { hasRole } from '@/lib/rbac';
import { Role } from '@prisma/client';
import db from '@/lib/db';
import { AdminDashboardClient } from './AdminDashboardClient';
import { RolePageHeader } from '@/components/ui/RolePageHeader';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'System Administration & Audit Explorer | Ebtesamty Dental Clinics',
  description: 'Owner and clinic administration workspace with immutable audit trail inspection and RBAC user control.',
};

export default async function AdminPage() {
  const user = await getCurrentUser();

  if (!user || !hasRole(user, [Role.OWNER_ADMIN])) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4 font-bold text-2xl">
          403
        </div>
        <h1 className="text-xl font-bold text-slate-900 mb-2">Access Restricted: OWNER_ADMIN Privilege Required</h1>
        <p className="text-xs text-slate-500 leading-relaxed mb-6">
          The System Administration & Audit Explorer workspace contains immutable event logs and high-privilege account management. Switch to the Clinic Administrator account via the Demo Switcher to view this desk.
        </p>
      </div>
    );
  }

  const [users, branches, auditEvents, totalUsers, totalAuditEvents, totalPatients] = await Promise.all([
    db.user.findMany({
      include: {
        roleGrants: {
          include: {
            branch: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
    db.branch.findMany({
      where: { isActive: true },
      orderBy: { code: 'asc' },
    }),
    db.auditEvent.findMany({
      include: {
        actorUser: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        branch: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
    db.user.count(),
    db.auditEvent.count(),
    db.patient.count(),
  ]);

  return (
    <div className="min-h-screen bg-slate-50/50 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <RolePageHeader
          roleTitle="System Administration & Audit Explorer"
          roleBadge="OWNER & GLOBAL ADMIN"
          roleBadgeVariant="action"
          quickSearchPlaceholder="Search audit events, users, branches..."
        />

        <AdminDashboardClient
          currentUser={user}
          users={users}
          branches={branches}
          auditEvents={auditEvents}
          systemStats={{
            totalUsers,
            totalAuditEvents,
            activeBranches: branches.length,
            totalPatients,
          }}
        />
      </div>
    </div>
  );
}
