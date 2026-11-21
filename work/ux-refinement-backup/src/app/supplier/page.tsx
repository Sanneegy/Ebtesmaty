import React from 'react';
import { getCurrentUser } from '@/lib/auth';
import db from '@/lib/db';
import { SupplierPortalClient } from './SupplierPortalClient';
import { RolePageHeader } from '@/components/ui/RolePageHeader';
import { ShieldCheck } from 'lucide-react';

export const metadata = {
  title: 'Supplier Portal | Ebtesamty Dental Clinics',
  description: 'External logistics and dispatch workspace for medical suppliers.',
};

export const dynamic = 'force-dynamic';

export default async function SupplierPortalPage() {
  const user = await getCurrentUser();

  // Load active suppliers and all purchase orders
  const [suppliers, purchaseOrders] = await Promise.all([
    db.supplier.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        contactPerson: true,
        phone: true,
        email: true,
        address: true,
      },
    }),
    db.purchaseOrder.findMany({
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            contactPerson: true,
            phone: true,
            email: true,
          },
        },
        branch: {
          select: {
            id: true,
            code: true,
            name: true,
            phone: true,
          },
        },
        lines: {
          select: {
            id: true,
            quantityOrdered: true,
            quantityReceived: true,
            material: {
              select: {
                id: true,
                sku: true,
                nameEn: true,
                nameAr: true,
                unit: true,
              },
            },
          },
        },
      },
      orderBy: { issuedAt: 'desc' },
      take: 100,
    }),
  ]);

  return (
    <div className="min-h-screen bg-slate-50/50 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <RolePageHeader
          roleTitle="Supplier Fulfillment Portal"
          roleBadge="EXTERNAL LOGISTICS"
          roleBadgeVariant="warning"
          quickSearchPlaceholder="Search purchase orders, deliveries..."
        />

        <SupplierPortalClient
          suppliers={suppliers}
          initialOrders={purchaseOrders}
        />
      </div>
    </div>
  );
}
