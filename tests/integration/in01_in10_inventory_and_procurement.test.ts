import { describe, it, expect, beforeAll } from 'vitest';
import db from '../../src/lib/db';
import {
  getMaterialCatalog,
  getStockBalances,
  recordStockAdjustment,
  requestStockTransfer,
  shipStockTransfer,
  receiveStockTransfer,
  getSuppliers,
  createPurchaseOrder,
  receiveGoods,
} from '../../src/services/inventory.service';
import { StockMovementType, StockTransferStatus, PurchaseOrderStatus } from '@prisma/client';

describe('Checkpoint E: Inventory, Suppliers & Procurement (IN01 - IN10)', () => {
  let staffUser: any;
  let branchA: any;
  let branchB: any;

  beforeAll(async () => {
    staffUser = await db.user.findFirst({
      where: { email: 'admin@ebtesamty.dev' },
    });
    expect(staffUser).toBeDefined();

    branchA = await db.branch.findFirst({ where: { code: 'BR-A' } });
    branchB = await db.branch.findFirst({ where: { code: 'BR-B' } });
    expect(branchA).toBeDefined();
    expect(branchB).toBeDefined();
  });

  it('IN01: Retrieves and seeds standard dental material catalog with reorder thresholds', async () => {
    const catalog = await getMaterialCatalog();
    expect(catalog.length).toBeGreaterThanOrEqual(5);

    const anesthetic = catalog.find((m) => m.sku === 'MAT-ANEST-01');
    expect(anesthetic).toBeDefined();
    expect(anesthetic?.reorderPoint).toBe(10);
  });

  it('IN02: Positive stock adjustment adds inventory to lot and logs audit movement', async () => {
    const catalog = await getMaterialCatalog();
    const composite = catalog[0];

    const result = await recordStockAdjustment({
      materialId: composite.id,
      branchId: branchA.id,
      lotNumber: 'LOT-2026-001',
      quantity: 15,
      movementType: StockMovementType.RECEIPT,
      performedByUserId: staffUser.id,
      notes: 'Initial lot stocking',
    });

    expect(result.updatedLot.quantityOnHand).toBeGreaterThanOrEqual(15);
    expect(result.movement.quantity).toBe(15);
    expect(result.movement.movementType).toBe(StockMovementType.RECEIPT);
  });

  it('IN03: Strict no-negative stock policy: over-consumption throws error', async () => {
    const catalog = await getMaterialCatalog();
    const composite = catalog[0];

    await expect(
      recordStockAdjustment({
        materialId: composite.id,
        branchId: branchA.id,
        lotNumber: 'LOT-2026-001',
        quantity: -9999, // Exceeds on hand
        movementType: StockMovementType.CONSUMPTION,
        performedByUserId: staffUser.id,
      })
    ).rejects.toThrow(/Insufficient stock/i);
  });

  it('IN04: Permitted consumption deducts on-hand and records movement', async () => {
    const catalog = await getMaterialCatalog();
    const composite = catalog[0];

    const result = await recordStockAdjustment({
      materialId: composite.id,
      branchId: branchA.id,
      lotNumber: 'LOT-2026-001',
      quantity: -2,
      movementType: StockMovementType.CONSUMPTION,
      performedByUserId: staffUser.id,
      notes: 'Used in restorative session',
    });

    expect(result.movement.quantity).toBe(-2);
    expect(result.movement.movementType).toBe(StockMovementType.CONSUMPTION);
  });

  it('IN05: Inter-branch transfer lifecycle: request, ship (deduct from source), and receive (add to destination)', async () => {
    const catalog = await getMaterialCatalog();
    const composite = catalog[0];

    // Ensure source branch has stock
    await recordStockAdjustment({
      materialId: composite.id,
      branchId: branchA.id,
      lotNumber: 'LOT-XFER-SRC',
      quantity: 10,
      movementType: StockMovementType.RECEIPT,
      performedByUserId: staffUser.id,
    });

    // 1. Request transfer of 3 units from Branch A to Branch B
    const transfer = await requestStockTransfer({
      materialId: composite.id,
      fromBranchId: branchA.id,
      toBranchId: branchB.id,
      quantity: 3,
      requestedByUserId: staffUser.id,
      notes: 'Emergency transfer for patient appointment',
    });

    expect(transfer.id).toBeDefined();
    expect(transfer.status).toBe(StockTransferStatus.REQUESTED);

    // 2. Ship transfer from Branch A
    const shipped = await shipStockTransfer(transfer.id, staffUser.id, 'LOT-XFER-SRC');
    expect(shipped.status).toBe(StockTransferStatus.SHIPPED);

    // 3. Receive transfer at Branch B
    const received = await receiveStockTransfer(
      transfer.id,
      staffUser.id,
      'LOT-XFER-DEST',
      new Date('2028-12-31')
    );
    expect(received.status).toBe(StockTransferStatus.RECEIVED);

    // Verify destination lot has the 3 units
    const destLot = await db.stockLot.findUnique({
      where: {
        materialId_branchId_lotNumber: {
          materialId: composite.id,
          branchId: branchB.id,
          lotNumber: 'LOT-XFER-DEST',
        },
      },
    });
    expect(destLot?.quantityOnHand).toBeGreaterThanOrEqual(3);
  });

  it('IN06: Creates and retrieves approved dental suppliers directory', async () => {
    const suppliers = await getSuppliers();
    expect(suppliers.length).toBeGreaterThanOrEqual(2);
    expect(suppliers[0].name).toBeDefined();
    expect(suppliers[0].phone).toBeDefined();
  });

  it('IN07: Creates purchase order with sequencing and calculates total amount', async () => {
    const catalog = await getMaterialCatalog();
    const suppliers = await getSuppliers();

    const po = await createPurchaseOrder({
      supplierId: suppliers[0].id,
      branchId: branchA.id,
      notes: 'Monthly replenishment order',
      lines: [
        {
          materialId: catalog[0].id,
          quantityOrdered: 20,
          unitCostPiasters: catalog[0].unitCostPiasters,
        },
      ],
    });

    expect(po.id).toBeDefined();
    expect(po.poNumber).toMatch(/^PO-\d{4}-\d{4}$/);
    expect(po.status).toBe(PurchaseOrderStatus.ISSUED);
    expect(po.totalAmountPiasters).toBe(20 * catalog[0].unitCostPiasters);
    expect(po.lines.length).toBe(1);
  });

  it('IN08: Goods receipt records accepted/rejected quantities and increments physical stock lots', async () => {
    const catalog = await getMaterialCatalog();
    const suppliers = await getSuppliers();

    const po = await createPurchaseOrder({
      supplierId: suppliers[0].id,
      branchId: branchA.id,
      lines: [
        {
          materialId: catalog[1].id,
          quantityOrdered: 10,
          unitCostPiasters: catalog[1].unitCostPiasters,
        },
      ],
    });

    const testLot = `LOT-GR-${Date.now()}`;
    // Receive 8 accepted, 2 rejected (damaged packaging)
    const gr = await receiveGoods({
      purchaseOrderId: po.id,
      branchId: branchA.id,
      receivedByUserId: staffUser.id,
      notes: 'Delivered via courier',
      lines: [
        {
          materialId: catalog[1].id,
          lotNumber: testLot,
          expiryDate: new Date('2028-06-30'),
          quantityAccepted: 8,
          quantityRejected: 2,
          rejectionReason: 'Damaged outer blister seal',
        },
      ],
    });

    expect(gr.id).toBeDefined();
    expect(gr.lines.length).toBe(1);
    expect(gr.lines[0].quantityAccepted).toBe(8);
    expect(gr.lines[0].quantityRejected).toBe(2);

    // Verify PO status is PARTIALLY_RECEIVED (8 of 10)
    const updatedPo = await db.purchaseOrder.findUnique({
      where: { id: po.id },
    });
    expect(updatedPo?.status).toBe(PurchaseOrderStatus.PARTIALLY_RECEIVED);

    // Verify stock lot was created with 8 units
    const lot = await db.stockLot.findUnique({
      where: {
        materialId_branchId_lotNumber: {
          materialId: catalog[1].id,
          branchId: branchA.id,
          lotNumber: testLot,
        },
      },
    });
    expect(lot?.quantityOnHand).toBe(8);
  });
});
