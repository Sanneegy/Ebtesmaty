import db from '../lib/db';
import { logAuditEvent } from '../lib/audit';
import { 
  StockMovementType, 
  StockTransferStatus, 
  PurchaseOrderStatus 
} from '@prisma/client';

export interface CreateMaterialInput {
  sku: string;
  nameEn: string;
  nameAr: string;
  category: string;
  unit: string;
  unitCostPiasters: number;
  reorderPoint?: number;
}

export interface StockAdjustmentInput {
  materialId: string;
  branchId: string;
  lotNumber: string;
  expiryDate?: Date;
  quantity: number; // positive for addition, negative for consumption/waste
  movementType: StockMovementType;
  performedByUserId: string;
  notes?: string;
}

export interface RequestTransferInput {
  materialId: string;
  fromBranchId: string;
  toBranchId: string;
  quantity: number;
  requestedByUserId: string;
  notes?: string;
}

export interface CreateSupplierInput {
  name: string;
  contactPerson?: string;
  phone: string;
  email?: string;
  address?: string;
}

export interface CreatePurchaseOrderInput {
  supplierId: string;
  branchId: string;
  notes?: string;
  lines: Array<{
    materialId: string;
    quantityOrdered: number;
    unitCostPiasters: number;
  }>;
}

export interface ReceiveGoodsInput {
  purchaseOrderId: string;
  branchId: string;
  receivedByUserId: string;
  notes?: string;
  lines: Array<{
    materialId: string;
    lotNumber: string;
    expiryDate: Date;
    quantityAccepted: number;
    quantityRejected?: number;
    rejectionReason?: string;
  }>;
}

// ==========================================
// 1. PO SEQUENCE GENERATOR
// ==========================================

export async function generateNextPONumber(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await db.purchaseOrder.count();
  const nextSeq = (count + 1).toString().padStart(4, '0');
  return `PO-${year}-${nextSeq}`;
}

// ==========================================
// 2. MATERIAL CATALOG
// ==========================================

export async function getMaterialCatalog(category?: string) {
  const whereClause: any = { isActive: true };
  if (category) whereClause.category = category;

  let materials = await db.material.findMany({
    where: whereClause,
    include: {
      lots: { where: { isQuarantined: false } },
    },
    orderBy: { sku: 'asc' },
  });

  if (materials.length === 0) {
    const defaultMaterials = [
      { sku: 'MAT-COMP-A2', nameEn: 'Filtek Z350 XT Composite (Shade A2)', nameAr: 'كومبوزيت فيلتك لون A2', category: 'COMPOSITES', unit: 'SYRINGE', unitCostPiasters: 85000, reorderPoint: 5 },
      { sku: 'MAT-COMP-A3', nameEn: 'Filtek Z350 XT Composite (Shade A3)', nameAr: 'كومبوزيت فيلتك لون A3', category: 'COMPOSITES', unit: 'SYRINGE', unitCostPiasters: 85000, reorderPoint: 5 },
      { sku: 'MAT-ANEST-01', nameEn: 'Septanest Articaine 4% with Epinephrine 1:100k', nameAr: 'بنج سيبتانيست 4% ارتيكايين', category: 'ANESTHETICS', unit: 'BOX', unitCostPiasters: 120000, reorderPoint: 10 },
      { sku: 'MAT-ENDO-F2', nameEn: 'Protaper Gold Rotary Files F2 25mm', nameAr: 'مبارد علاج جذور بروتيبر F2', category: 'ENDODONTICS', unit: 'PACK', unitCostPiasters: 95000, reorderPoint: 8 },
      { sku: 'MAT-IMPR-ALG', nameEn: 'Cavex ColorChange Alginate Impression Material', nameAr: 'مادة أخذ طبعات الجينات كافكس', category: 'IMPRESSION', unit: 'BAG', unitCostPiasters: 40000, reorderPoint: 6 },
      { sku: 'MAT-BOND-01', nameEn: 'Single Bond Universal Adhesive 5ml', nameAr: 'مادة لاصقة سينجل بوند يونيفرسال', category: 'COMPOSITES', unit: 'BOTTLE', unitCostPiasters: 110000, reorderPoint: 4 },
      { sku: 'MAT-GLOVE-M', nameEn: 'Nitrile Examination Gloves (Medium)', nameAr: 'قفازات فحص نيتريل مقاس وسط', category: 'PPE', unit: 'BOX', unitCostPiasters: 35000, reorderPoint: 20 },
      { sku: 'MAT-MASK-01', nameEn: '3-Ply Surgical Face Masks with Ear Loops', nameAr: 'كمامات جراحية 3 طبقات', category: 'PPE', unit: 'BOX', unitCostPiasters: 15000, reorderPoint: 15 },
    ];

    for (const m of defaultMaterials) {
      await db.material.upsert({
        where: { sku: m.sku },
        update: {},
        create: m,
      });
    }

    materials = await db.material.findMany({
      where: whereClause,
      include: {
        lots: { where: { isQuarantined: false } },
      },
      orderBy: { sku: 'asc' },
    });
  }

  return materials;
}

export async function createMaterial(data: CreateMaterialInput) {
  return db.material.create({
    data: {
      sku: data.sku,
      nameEn: data.nameEn,
      nameAr: data.nameAr,
      category: data.category,
      unit: data.unit,
      unitCostPiasters: data.unitCostPiasters,
      reorderPoint: data.reorderPoint ?? 10,
    },
  });
}

// ==========================================
// 3. STOCK BALANCES & AUDIT MOVEMENTS
// ==========================================

export async function getStockBalances(branchId: string) {
  const materials = await getMaterialCatalog();

  const balances = await Promise.all(
    materials.map(async (m) => {
      const lots = await db.stockLot.findMany({
        where: {
          materialId: m.id,
          branchId,
          isQuarantined: false,
        },
      });

      const totalOnHand = lots.reduce((sum, lot) => sum + lot.quantityOnHand, 0);
      const isLowStock = totalOnHand <= m.reorderPoint;

      return {
        material: m,
        totalOnHand,
        reorderPoint: m.reorderPoint,
        isLowStock,
        lots,
      };
    })
  );

  return balances;
}

export async function recordStockAdjustment(data: StockAdjustmentInput) {
  const defaultExpiry = data.expiryDate || new Date(new Date().setFullYear(new Date().getFullYear() + 2));

  // Find or create the stock lot
  let lot = await db.stockLot.findUnique({
    where: {
      materialId_branchId_lotNumber: {
        materialId: data.materialId,
        branchId: data.branchId,
        lotNumber: data.lotNumber,
      },
    },
  });

  if (!lot) {
    if (data.quantity < 0) {
      throw new Error(`Cannot deduct from non-existent stock lot ${data.lotNumber}. Strict no-negative stock policy.`);
    }

    lot = await db.stockLot.create({
      data: {
        materialId: data.materialId,
        branchId: data.branchId,
        lotNumber: data.lotNumber,
        expiryDate: defaultExpiry,
        quantityOnHand: 0,
      },
    });
  }

  const newQty = lot.quantityOnHand + data.quantity;
  if (newQty < 0) {
    throw new Error(`Insufficient stock in lot ${data.lotNumber}. Current on-hand is ${lot.quantityOnHand}, cannot deduct ${Math.abs(data.quantity)}.`);
  }

  // Atomic update of lot on-hand and creation of audit movement
  const updated = await db.$transaction(async (tx) => {
    const updatedLot = await tx.stockLot.update({
      where: { id: lot!.id },
      data: { quantityOnHand: newQty },
    });

    const movement = await tx.stockMovement.create({
      data: {
        materialId: data.materialId,
        branchId: data.branchId,
        lotId: lot!.id,
        movementType: data.movementType,
        quantity: data.quantity,
        notes: data.notes ?? null,
        performedByUserId: data.performedByUserId,
      },
    });

    return { updatedLot, movement };
  });

  await logAuditEvent({
    actorUserId: data.performedByUserId,
    action: 'STOCK_ADJUSTMENT_RECORDED',
    entityType: 'StockMovement',
    entityId: updated.movement.id,
    branchId: data.branchId,
    metadata: {
      materialId: data.materialId,
      lotNumber: data.lotNumber,
      movementType: data.movementType,
      quantity: data.quantity,
      resultingOnHand: newQty,
    },
  });

  return updated;
}

// ==========================================
// 4. INTER-BRANCH STOCK TRANSFERS
// ==========================================

export async function requestStockTransfer(data: RequestTransferInput) {
  if (data.fromBranchId === data.toBranchId) {
    throw new Error('Source and destination branches must be distinct.');
  }

  const transfer = await db.stockTransfer.create({
    data: {
      materialId: data.materialId,
      fromBranchId: data.fromBranchId,
      toBranchId: data.toBranchId,
      quantity: data.quantity,
      status: StockTransferStatus.REQUESTED,
      requestedByUserId: data.requestedByUserId,
      notes: data.notes ?? null,
    },
    include: {
      material: true,
      fromBranch: true,
      toBranch: true,
      requestedByUser: { select: { id: true, fullName: true } },
    },
  });

  return transfer;
}

export async function shipStockTransfer(transferId: string, performedByUserId: string, lotNumber: string) {
  const transfer = await db.stockTransfer.findUnique({
    where: { id: transferId },
  });

  if (!transfer) {
    throw new Error('Stock transfer not found');
  }

  if (transfer.status !== StockTransferStatus.REQUESTED && transfer.status !== StockTransferStatus.APPROVED) {
    throw new Error(`Transfer cannot be shipped from status ${transfer.status}`);
  }

  // Deduct from source branch lot
  await recordStockAdjustment({
    materialId: transfer.materialId,
    branchId: transfer.fromBranchId,
    lotNumber,
    quantity: -transfer.quantity,
    movementType: StockMovementType.TRANSFER_OUT,
    performedByUserId,
    notes: `Shipped inter-branch transfer ${transferId}`,
  });

  const updated = await db.stockTransfer.update({
    where: { id: transferId },
    data: {
      status: StockTransferStatus.SHIPPED,
      shippedAt: new Date(),
    },
  });

  return updated;
}

export async function receiveStockTransfer(
  transferId: string, 
  performedByUserId: string, 
  lotNumber: string, 
  expiryDate: Date
) {
  const transfer = await db.stockTransfer.findUnique({
    where: { id: transferId },
  });

  if (!transfer) {
    throw new Error('Stock transfer not found');
  }

  if (transfer.status !== StockTransferStatus.SHIPPED) {
    throw new Error(`Transfer must be in SHIPPED status to be received. Current: ${transfer.status}`);
  }

  // Add to destination branch lot
  await recordStockAdjustment({
    materialId: transfer.materialId,
    branchId: transfer.toBranchId,
    lotNumber,
    expiryDate,
    quantity: transfer.quantity,
    movementType: StockMovementType.TRANSFER_IN,
    performedByUserId,
    notes: `Received inter-branch transfer ${transferId}`,
  });

  const updated = await db.stockTransfer.update({
    where: { id: transferId },
    data: {
      status: StockTransferStatus.RECEIVED,
      receivedAt: new Date(),
    },
  });

  return updated;
}

// ==========================================
// 5. SUPPLIERS & PROCUREMENT
// ==========================================

export async function getSuppliers() {
  const suppliers = await db.supplier.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
  });

  if (suppliers.length === 0) {
    const defaultSuppliers = [
      { name: 'Egyptian Dental Supplies Co.', contactPerson: 'Karim Mansour', phone: '+20 100 111 2233', email: 'orders@eds-egypt.com', address: 'Downtown, Cairo' },
      { name: 'Medica Star Pharmaceuticals', contactPerson: 'Nadia El-Gohary', phone: '+20 111 444 5566', email: 'sales@medicastar.com', address: 'Nasr City, Cairo' },
      { name: 'Cairo Dental Depot', contactPerson: 'Sameh Fawzy', phone: '+20 122 777 8899', email: 'supplies@cairodepot.com', address: 'Heliopolis, Cairo' },
    ];

    for (const s of defaultSuppliers) {
      await db.supplier.create({ data: s });
    }

    return db.supplier.findMany({ where: { isActive: true } });
  }

  return suppliers;
}

export async function createSupplier(data: CreateSupplierInput) {
  return db.supplier.create({
    data: {
      name: data.name,
      contactPerson: data.contactPerson ?? null,
      phone: data.phone,
      email: data.email ?? null,
      address: data.address ?? null,
    },
  });
}

export async function createPurchaseOrder(data: CreatePurchaseOrderInput) {
  if (!data.lines || data.lines.length === 0) {
    throw new Error('Purchase order must have at least one line item.');
  }

  const poNumber = await generateNextPONumber();
  let totalAmountPiasters = 0;

  const linesData = data.lines.map((l) => {
    const lineTotal = l.quantityOrdered * l.unitCostPiasters;
    totalAmountPiasters += lineTotal;
    return {
      materialId: l.materialId,
      quantityOrdered: l.quantityOrdered,
      quantityReceived: 0,
      unitCostPiasters: l.unitCostPiasters,
    };
  });

  const po = await db.purchaseOrder.create({
    data: {
      poNumber,
      supplierId: data.supplierId,
      branchId: data.branchId,
      status: PurchaseOrderStatus.ISSUED,
      totalAmountPiasters,
      notes: data.notes ?? null,
      lines: {
        create: linesData,
      },
    },
    include: {
      lines: { include: { material: true } },
      supplier: true,
      branch: true,
    },
  });

  return po;
}

export async function receiveGoods(data: ReceiveGoodsInput) {
  const po = await db.purchaseOrder.findUnique({
    where: { id: data.purchaseOrderId },
    include: { lines: true },
  });

  if (!po) {
    throw new Error('Purchase order not found');
  }

  // Transaction: Create GoodsReceipt, increment stock, update PO lines
  const receipt = await db.$transaction(async (tx) => {
    const gr = await tx.goodsReceipt.create({
      data: {
        purchaseOrderId: data.purchaseOrderId,
        branchId: data.branchId,
        receivedByUserId: data.receivedByUserId,
        notes: data.notes ?? null,
        lines: {
          create: data.lines.map((l) => ({
            materialId: l.materialId,
            lotNumber: l.lotNumber,
            expiryDate: l.expiryDate,
            quantityAccepted: l.quantityAccepted,
            quantityRejected: l.quantityRejected || 0,
            rejectionReason: l.rejectionReason || null,
          })),
        },
      },
      include: { lines: true },
    });

    // Update PO lines & stock lots for accepted quantities
    for (const line of data.lines) {
      if (line.quantityAccepted > 0) {
        // Update PO line received count
        const poLine = po.lines.find((pl) => pl.materialId === line.materialId);
        if (poLine) {
          await tx.purchaseOrderLine.update({
            where: { id: poLine.id },
            data: { quantityReceived: poLine.quantityReceived + line.quantityAccepted },
          });
        }

        // Add to stock lot
        let lot = await tx.stockLot.findUnique({
          where: {
            materialId_branchId_lotNumber: {
              materialId: line.materialId,
              branchId: data.branchId,
              lotNumber: line.lotNumber,
            },
          },
        });

        if (!lot) {
          lot = await tx.stockLot.create({
            data: {
              materialId: line.materialId,
              branchId: data.branchId,
              lotNumber: line.lotNumber,
              expiryDate: line.expiryDate,
              quantityOnHand: line.quantityAccepted,
            },
          });
        } else {
          lot = await tx.stockLot.update({
            where: { id: lot.id },
            data: { quantityOnHand: lot.quantityOnHand + line.quantityAccepted },
          });
        }

        // Record stock movement
        await tx.stockMovement.create({
          data: {
            materialId: line.materialId,
            branchId: data.branchId,
            lotId: lot.id,
            movementType: StockMovementType.RECEIPT,
            quantity: line.quantityAccepted,
            referenceId: gr.id,
            performedByUserId: data.receivedByUserId,
          },
        });
      }
    }

    // Check if PO is completely fulfilled
    const updatedPoLines = await tx.purchaseOrderLine.findMany({
      where: { purchaseOrderId: data.purchaseOrderId },
    });
    const allFulfilled = updatedPoLines.every((pl) => pl.quantityReceived >= pl.quantityOrdered);

    await tx.purchaseOrder.update({
      where: { id: data.purchaseOrderId },
      data: {
        status: allFulfilled ? PurchaseOrderStatus.FULFILLED : PurchaseOrderStatus.PARTIALLY_RECEIVED,
      },
    });

    return gr;
  });

  return receipt;
}

export async function getStockTransfers(branchId?: string) {
  const whereClause: any = {};
  if (branchId) {
    whereClause.OR = [
      { fromBranchId: branchId },
      { toBranchId: branchId },
    ];
  }

  return db.stockTransfer.findMany({
    where: whereClause,
    include: {
      material: true,
      fromBranch: true,
      toBranch: true,
      requestedByUser: { select: { id: true, fullName: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getPurchaseOrders(branchId?: string) {
  const whereClause: any = {};
  if (branchId) {
    whereClause.branchId = branchId;
  }

  return db.purchaseOrder.findMany({
    where: whereClause,
    include: {
      supplier: true,
      branch: true,
      lines: {
        include: { material: true },
      },
    },
    orderBy: { issuedAt: 'desc' },
  });
}

export async function getGoodsReceipts(branchId?: string) {
  const whereClause: any = {};
  if (branchId) {
    whereClause.branchId = branchId;
  }

  return db.goodsReceipt.findMany({
    where: whereClause,
    include: {
      branch: true,
      purchaseOrder: { include: { supplier: true } },
      receivedByUser: { select: { id: true, fullName: true } },
      lines: { include: { material: true } },
    },
    orderBy: { receivedAt: 'desc' },
  });
}

export async function getStockMovements(branchId?: string, limit = 50) {
  const whereClause: any = {};
  if (branchId) {
    whereClause.branchId = branchId;
  }

  return db.stockMovement.findMany({
    where: whereClause,
    include: {
      material: true,
      branch: true,
      performedByUser: { select: { id: true, fullName: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}
