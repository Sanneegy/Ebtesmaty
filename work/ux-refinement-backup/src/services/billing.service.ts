import db from '../lib/db';
import { logAuditEvent } from '../lib/audit';
import { 
  InvoiceStatus, 
  PaymentMethod, 
  PaymentStatus, 
  InstallmentPlanStatus, 
  InstallmentStatus,
  ExpenseCategory 
} from '@prisma/client';

export interface CreateInvoiceInput {
  patientId: string;
  branchId: string;
  encounterId?: string;
  issuedByUserId: string;
  notes?: string;
  lines: Array<{
    serviceItemId?: string;
    description: string;
    toothNumber?: string;
    unitPricePiasters: number;
    quantity?: number;
  }>;
}

export interface RecordPaymentInput {
  patientId: string;
  collectionBranchId: string;
  amountPiasters: number;
  paymentMethod: PaymentMethod;
  collectedByUserId: string;
  idempotencyKey: string;
  invoiceAllocations?: Array<{
    invoiceId: string;
    amountPiasters: number;
  }>;
  notes?: string;
}

export interface CreateInstallmentPlanInput {
  patientId: string;
  invoiceId: string;
  totalInstallments: number;
  startDate?: Date;
}

export interface CashReconciliationInput {
  branchId: string;
  cashierUserId: string;
  reconciliationDate?: Date;
  countedCashPiasters: number;
  notes?: string;
}

export interface RecordExpenseInput {
  branchId: string;
  category: ExpenseCategory;
  payee: string;
  amountPiasters: number;
  expenseDate?: Date;
  notes?: string;
  createdByUserId: string;
}

// ==========================================
// 1. NUMBER SEQUENCING GENERATORS
// ==========================================

export async function generateNextInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await db.invoice.count();
  const nextSeq = (count + 1).toString().padStart(4, '0');
  return `INV-${year}-${nextSeq}`;
}

export async function generateNextReceiptNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await db.payment.count();
  const nextSeq = (count + 1).toString().padStart(4, '0');
  return `RCP-${year}-${nextSeq}`;
}

// ==========================================
// 2. SERVICE CATALOG
// ==========================================

export async function getServiceCatalog() {
  const items = await db.serviceCatalogItem.findMany({
    where: { isActive: true },
    orderBy: { category: 'asc' },
  });

  if (items.length === 0) {
    // Seed default dental catalog items with provisional prices
    const defaultCatalog = [
      { code: 'SRV-CONS-01', nameEn: 'Comprehensive Clinical Consultation & Exam', nameAr: 'كشف واستشارة شاملة', category: 'EXAMINATION', basePricePiasters: 30000 },
      { code: 'SRV-SCAL-01', nameEn: 'Ultrasonic Scaling & Polishing', nameAr: 'تنظيف وتلميع الجير بالموجات فوق الصوتية', category: 'HYGIENE', basePricePiasters: 60000 },
      { code: 'SRV-COMP-01', nameEn: 'Posterior Composite Resin Restoration', nameAr: 'حشو تجميلي كومبوزيت خلفي', category: 'RESTORATIVE', basePricePiasters: 80000 },
      { code: 'SRV-COMP-02', nameEn: 'Anterior Aesthetic Composite Restoration', nameAr: 'حشو تجميلي كومبوزيت أمامي', category: 'RESTORATIVE', basePricePiasters: 100000 },
      { code: 'SRV-ENDO-01', nameEn: 'Root Canal Treatment — Single Canal', nameAr: 'علاج جذور — قناة واحدة', category: 'ENDODONTICS', basePricePiasters: 150000 },
      { code: 'SRV-ENDO-02', nameEn: 'Root Canal Treatment — Molar Multi-Canal', nameAr: 'علاج جذور — ضرس متعدد القنوات', category: 'ENDODONTICS', basePricePiasters: 250000 },
      { code: 'SRV-CRWN-01', nameEn: 'Zirconia Monolithic Crown', nameAr: 'تاج زيركون كامل', category: 'PROSTHODONTICS', basePricePiasters: 350000 },
      { code: 'SRV-EXTR-01', nameEn: 'Simple Tooth Extraction', nameAr: 'خلع ضرس بسيط', category: 'SURGERY', basePricePiasters: 50000 },
      { code: 'SRV-EXTR-02', nameEn: 'Surgical Impacted Wisdom Tooth Extraction', nameAr: 'خلع جراحي لضرس عقل مدفون', category: 'SURGERY', basePricePiasters: 200000 },
    ];

    for (const item of defaultCatalog) {
      await db.serviceCatalogItem.upsert({
        where: { code: item.code },
        update: {},
        create: item,
      });
    }

    return db.serviceCatalogItem.findMany({ where: { isActive: true } });
  }

  return items;
}

// ==========================================
// 3. INVOICES & CHARGES
// ==========================================

export async function createInvoice(data: CreateInvoiceInput) {
  if (!data.lines || data.lines.length === 0) {
    throw new Error('An invoice must contain at least one line item.');
  }

  const invoiceNumber = await generateNextInvoiceNumber();

  // Compute line totals and overall total
  let totalAmountPiasters = 0;
  const processedLines = data.lines.map((line) => {
    const qty = line.quantity ?? 1;
    const lineTotal = line.unitPricePiasters * qty;
    totalAmountPiasters += lineTotal;
    return {
      serviceItemId: line.serviceItemId ?? null,
      description: line.description,
      toothNumber: line.toothNumber ?? null,
      unitPricePiasters: line.unitPricePiasters,
      quantity: qty,
      lineTotalPiasters: lineTotal,
    };
  });

  const invoice = await db.invoice.create({
    data: {
      invoiceNumber,
      patientId: data.patientId,
      branchId: data.branchId,
      encounterId: data.encounterId ?? null,
      issuedByUserId: data.issuedByUserId,
      status: InvoiceStatus.ISSUED,
      totalAmountPiasters,
      paidAmountPiasters: 0,
      notes: data.notes ?? null,
      lines: {
        create: processedLines,
      },
    },
    include: {
      lines: true,
      patient: true,
      branch: true,
      issuedByUser: { select: { id: true, fullName: true } },
    },
  });

  await logAuditEvent({
    actorUserId: data.issuedByUserId,
    action: 'INVOICE_ISSUED',
    entityType: 'Invoice',
    entityId: invoice.id,
    branchId: data.branchId,
    metadata: {
      invoiceNumber,
      patientId: data.patientId,
      totalAmountPiasters,
      linesCount: processedLines.length,
    },
  });

  return invoice;
}

export async function getPatientInvoices(patientId: string) {
  return db.invoice.findMany({
    where: { patientId },
    include: {
      lines: { include: { serviceItem: true } },
      allocations: { include: { payment: true } },
      branch: true,
      issuedByUser: { select: { id: true, fullName: true } },
    },
    orderBy: { issuedAt: 'desc' },
  });
}

// ==========================================
// 4. PAYMENTS & ALLOCATIONS (ATOMIC & IDEMPOTENT)
// ==========================================

export async function recordPayment(data: RecordPaymentInput) {
  if (data.amountPiasters <= 0) {
    throw new Error('Payment amount must be greater than zero.');
  }

  // Idempotency check: if key already exists, return existing payment safely
  const existing = await db.payment.findUnique({
    where: { idempotencyKey: data.idempotencyKey },
    include: { allocations: true },
  });

  if (existing) {
    return existing;
  }

  const receiptNumber = await generateNextReceiptNumber();

  // Perform payment creation and invoice allocation in an atomic transaction
  const payment = await db.$transaction(async (tx) => {
    const p = await tx.payment.create({
      data: {
        receiptNumber,
        patientId: data.patientId,
        collectionBranchId: data.collectionBranchId,
        amountPiasters: data.amountPiasters,
        paymentMethod: data.paymentMethod,
        idempotencyKey: data.idempotencyKey,
        status: PaymentStatus.POSTED,
        collectedByUserId: data.collectedByUserId,
        notes: data.notes ?? null,
      },
    });

    if (data.invoiceAllocations && data.invoiceAllocations.length > 0) {
      for (const alloc of data.invoiceAllocations) {
        if (alloc.amountPiasters <= 0) continue;

        await tx.paymentAllocation.create({
          data: {
            paymentId: p.id,
            invoiceId: alloc.invoiceId,
            allocatedAmountPiasters: alloc.amountPiasters,
          },
        });

        // Update the invoice paidAmount and status
        const invoice = await tx.invoice.findUnique({
          where: { id: alloc.invoiceId },
        });

        if (invoice) {
          const newPaidAmount = invoice.paidAmountPiasters + alloc.amountPiasters;
          const newStatus =
            newPaidAmount >= invoice.totalAmountPiasters
              ? InvoiceStatus.PAID
              : newPaidAmount > 0
              ? InvoiceStatus.PARTIALLY_PAID
              : invoice.status;

          await tx.invoice.update({
            where: { id: alloc.invoiceId },
            data: {
              paidAmountPiasters: newPaidAmount,
              status: newStatus,
            },
          });
        }
      }
    }

    return p;
  });

  await logAuditEvent({
    actorUserId: data.collectedByUserId,
    action: 'PAYMENT_COLLECTED',
    entityType: 'Payment',
    entityId: payment.id,
    branchId: data.collectionBranchId,
    metadata: {
      receiptNumber,
      patientId: data.patientId,
      amountPiasters: data.amountPiasters,
      paymentMethod: data.paymentMethod,
      allocationsCount: data.invoiceAllocations?.length || 0,
    },
  });

  return db.payment.findUnique({
    where: { id: payment.id },
    include: {
      allocations: { include: { invoice: true } },
      collectedByUser: { select: { id: true, fullName: true } },
    },
  });
}

export async function getPatientPayments(patientId: string) {
  return db.payment.findMany({
    where: { patientId },
    include: {
      allocations: { include: { invoice: true } },
      collectedByUser: { select: { id: true, fullName: true } },
    },
    orderBy: { collectedAt: 'desc' },
  });
}

// ==========================================
// 5. INSTALLMENT PLANS (FLEXIBLE FINANCING)
// ==========================================

export async function createInstallmentPlan(data: CreateInstallmentPlanInput) {
  const invoice = await db.invoice.findUnique({
    where: { id: data.invoiceId },
  });

  if (!invoice) {
    throw new Error('Invoice not found');
  }

  const remainingBalancePiasters = invoice.totalAmountPiasters - invoice.paidAmountPiasters;
  if (remainingBalancePiasters <= 0) {
    throw new Error('Invoice is already fully paid. Cannot establish installment plan.');
  }

  const installmentsCount = Math.max(2, data.totalInstallments || 3);
  const perInstallmentAmount = Math.floor(remainingBalancePiasters / installmentsCount);
  const remainder = remainingBalancePiasters - (perInstallmentAmount * installmentsCount);

  const baseDate = data.startDate ? new Date(data.startDate) : new Date();

  const plan = await db.installmentPlan.create({
    data: {
      patientId: data.patientId,
      invoiceId: data.invoiceId,
      totalInstallments: installmentsCount,
      totalAmountPiasters: remainingBalancePiasters,
      status: InstallmentPlanStatus.ACTIVE,
      installments: {
        create: Array.from({ length: installmentsCount }, (_, i) => {
          const dueDate = new Date(baseDate);
          dueDate.setMonth(dueDate.getMonth() + i + 1);
          // Last installment absorbs rounding remainder
          const amount = i === installmentsCount - 1 ? perInstallmentAmount + remainder : perInstallmentAmount;
          return {
            installmentNumber: i + 1,
            dueDate,
            amountPiasters: amount,
            status: InstallmentStatus.PENDING,
          };
        }),
      },
    },
    include: {
      installments: { orderBy: { installmentNumber: 'asc' } },
      invoice: true,
    },
  });

  return plan;
}

// ==========================================
// 6. DAILY CASH RECONCILIATION & DISCREPANCIES
// ==========================================

export async function recordCashReconciliation(data: CashReconciliationInput) {
  const targetDate = data.reconciliationDate ? new Date(data.reconciliationDate) : new Date();
  const dayStart = new Date(targetDate);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(targetDate);
  dayEnd.setHours(23, 59, 59, 999);

  // Authoritatively calculate expected cash from posted CASH payments for this branch today
  const cashPayments = await db.payment.findMany({
    where: {
      collectionBranchId: data.branchId,
      paymentMethod: PaymentMethod.CASH,
      status: PaymentStatus.POSTED,
      collectedAt: {
        gte: dayStart,
        lte: dayEnd,
      },
    },
  });

  const expectedCashPiasters = cashPayments.reduce((sum, p) => sum + p.amountPiasters, 0);
  const discrepancyPiasters = data.countedCashPiasters - expectedCashPiasters;

  const reconciliation = await db.cashReconciliation.create({
    data: {
      branchId: data.branchId,
      cashierUserId: data.cashierUserId,
      reconciliationDate: dayStart,
      expectedCashPiasters,
      countedCashPiasters: data.countedCashPiasters,
      discrepancyPiasters,
      notes: data.notes ?? null,
    },
    include: {
      branch: true,
      cashierUser: { select: { id: true, fullName: true } },
    },
  });

  await logAuditEvent({
    actorUserId: data.cashierUserId,
    action: 'CASH_RECONCILIATION_PERFORMED',
    entityType: 'CashReconciliation',
    entityId: reconciliation.id,
    branchId: data.branchId,
    metadata: {
      expectedCashPiasters,
      countedCashPiasters: data.countedCashPiasters,
      discrepancyPiasters,
    },
  });

  return reconciliation;
}

// ==========================================
// 7. EXPENSES & FINANCIAL ANALYTICS
// ==========================================

export async function recordExpense(data: RecordExpenseInput) {
  if (data.amountPiasters <= 0) {
    throw new Error('Expense amount must be greater than zero.');
  }

  const expense = await db.expense.create({
    data: {
      branchId: data.branchId,
      category: data.category,
      payee: data.payee,
      amountPiasters: data.amountPiasters,
      expenseDate: data.expenseDate || new Date(),
      notes: data.notes ?? null,
      createdByUserId: data.createdByUserId,
    },
    include: {
      branch: true,
      createdByUser: { select: { id: true, fullName: true } },
    },
  });

  await logAuditEvent({
    actorUserId: data.createdByUserId,
    action: 'EXPENSE_RECORDED',
    entityType: 'Expense',
    entityId: expense.id,
    branchId: data.branchId,
    metadata: {
      category: data.category,
      payee: data.payee,
      amountPiasters: data.amountPiasters,
    },
  });

  return expense;
}

export async function getFinancialSummary(branchId?: string, startDate?: Date, endDate?: Date) {
  const whereBranch = branchId ? { branchId } : {};
  const whereCollection = branchId ? { collectionBranchId: branchId } : {};

  const dateFilter = startDate && endDate ? { gte: startDate, lte: endDate } : undefined;

  const [invoices, payments, expenses] = await Promise.all([
    db.invoice.findMany({
      where: {
        ...whereBranch,
        ...(dateFilter ? { issuedAt: dateFilter } : {}),
      },
    }),
    db.payment.findMany({
      where: {
        ...whereCollection,
        status: PaymentStatus.POSTED,
        ...(dateFilter ? { collectedAt: dateFilter } : {}),
      },
    }),
    db.expense.findMany({
      where: {
        ...whereBranch,
        ...(dateFilter ? { expenseDate: dateFilter } : {}),
      },
    }),
  ]);

  const totalInvoicedPiasters = invoices.reduce((sum, inv) => sum + inv.totalAmountPiasters, 0);
  const totalCollectedPiasters = payments.reduce((sum, p) => sum + p.amountPiasters, 0);
  const totalExpensesPiasters = expenses.reduce((sum, exp) => sum + exp.amountPiasters, 0);

  // Method breakdown
  const collectedByMethod = {
    CASH: payments.filter((p) => p.paymentMethod === PaymentMethod.CASH).reduce((sum, p) => sum + p.amountPiasters, 0),
    CREDIT_CARD: payments.filter((p) => p.paymentMethod === PaymentMethod.CREDIT_CARD).reduce((sum, p) => sum + p.amountPiasters, 0),
    INSTAPAY: payments.filter((p) => p.paymentMethod === PaymentMethod.INSTAPAY).reduce((sum, p) => sum + p.amountPiasters, 0),
    FAWRY: payments.filter((p) => p.paymentMethod === PaymentMethod.FAWRY).reduce((sum, p) => sum + p.amountPiasters, 0),
  };

  return {
    totalInvoicedPiasters,
    totalCollectedPiasters,
    totalExpensesPiasters,
    collectedByMethod,
    invoiceCount: invoices.length,
    paymentCount: payments.length,
    expenseCount: expenses.length,
  };
}
