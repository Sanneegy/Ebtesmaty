import {getOperationalUser} from '@/lib/operational-auth';
import {hasRole} from '@/lib/rbac';
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import db from '@/lib/db';
import { PurchaseOrderStatus } from '@/lib/prisma-shim';

export async function GET(req: NextRequest) {
  const user = await getOperationalUser();
  if (!user || !hasRole(user,["INVENTORY","OWNER_ADMIN"])) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const supplierId = searchParams.get('supplierId');

  try {
    const orders = await db.purchaseOrder.findMany({
      where: supplierId ? { supplierId } : undefined,
      select: {
        id: true,
        poNumber: true,
        status: true,
        issuedAt: true,
        notes: true,
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
      take: 50,
    });

    return NextResponse.json({ orders });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to query supplier orders' }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest) {
  const user = await getOperationalUser();
  if (!user || !hasRole(user,["INVENTORY","OWNER_ADMIN"])) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { poId, status, supplierNotes } = body;

    if (!poId) {
      return NextResponse.json({ error: 'Missing poId' }, { status: 400 });
    }

    const validStatuses: PurchaseOrderStatus[] = ['ISSUED', 'PARTIALLY_RECEIVED', 'FULFILLED', 'CANCELLED'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const updated = await db.purchaseOrder.update({
      where: { id: poId },
      data: {
        ...(status ? { status } : {}),
        ...(supplierNotes ? { notes: supplierNotes } : {}),
      },
    });

    return NextResponse.json({ success: true, order: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update order status' }, { status: 400 });
  }
}
