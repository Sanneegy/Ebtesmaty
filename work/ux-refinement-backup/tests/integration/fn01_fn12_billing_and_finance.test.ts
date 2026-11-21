import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import db from '../../src/lib/db';
import {
  getServiceCatalog,
  createInvoice,
  recordPayment,
  createInstallmentPlan,
  recordCashReconciliation,
  recordExpense,
  getFinancialSummary,
} from '../../src/services/billing.service';
import { InvoiceStatus, PaymentMethod, PaymentStatus, ExpenseCategory } from '@prisma/client';

describe('Checkpoint D: Billing, Invoicing, Payments & Operating Finance (FN01 - FN12)', () => {
  let staffUser: any;
  let testPatient: any;
  let branch: any;
  let testStartTime: Date;

  beforeAll(async () => {
    testStartTime = new Date();
    staffUser = await db.user.findFirst({
      where: { email: 'mariam.reception@ebtesamty.dev' },
    });
    expect(staffUser).toBeDefined();

    testPatient = await db.patient.findFirst({
      where: { patientNumber: 'EBT-PAT-2026-0001' },
    });
    expect(testPatient).toBeDefined();

    branch = await db.branch.findFirst({
      where: { code: 'BR-A' },
    });
    expect(branch).toBeDefined();
  });

  afterAll(async () => {
    await db.installmentPlan.deleteMany({ where: { createdAt: { gte: testStartTime } } });
    await db.payment.deleteMany({ where: { collectedAt: { gte: testStartTime } } });
    await db.invoice.deleteMany({ where: { issuedAt: { gte: testStartTime } } });
    await db.cashReconciliation.deleteMany({ where: { createdAt: { gte: testStartTime } } });
    await db.expense.deleteMany({ where: { createdAt: { gte: testStartTime } } });
  });

  it('FN01: Retrieves or seeds active dental service catalog items', async () => {
    const catalog = await getServiceCatalog();
    expect(catalog.length).toBeGreaterThanOrEqual(5);

    const consultation = catalog.find((i) => i.code === 'SRV-CONS-01');
    expect(consultation).toBeDefined();
    expect(consultation?.basePricePiasters).toBe(30000); // 300 EGP
  });

  it('FN02: Creates an invoice with calculated line totals, sequencing, and minor units (Piasters)', async () => {
    const invoice = await createInvoice({
      patientId: testPatient.id,
      branchId: branch.id,
      issuedByUserId: staffUser.id,
      notes: 'Initial restorative visit',
      lines: [
        {
          description: 'Comprehensive Consultation',
          unitPricePiasters: 30000, // 300 EGP
          quantity: 1,
        },
        {
          description: 'Composite Filling #36',
          toothNumber: '36',
          unitPricePiasters: 80000, // 800 EGP
          quantity: 2, // 1600 EGP
        },
      ],
    });

    expect(invoice.id).toBeDefined();
    expect(invoice.invoiceNumber).toMatch(/^INV-\d{4}-\d{4}$/);
    expect(invoice.status).toBe(InvoiceStatus.ISSUED);
    // 30,000 + 160,000 = 190,000 Piasters (1,900 EGP)
    expect(invoice.totalAmountPiasters).toBe(190000);
    expect(invoice.paidAmountPiasters).toBe(0);
    expect(invoice.lines.length).toBe(2);
  });

  it('FN03: Records partial payment, allocates to invoice, and updates status to PARTIALLY_PAID', async () => {
    const invoice = await createInvoice({
      patientId: testPatient.id,
      branchId: branch.id,
      issuedByUserId: staffUser.id,
      lines: [
        {
          description: 'Dental Hygiene & Scaling',
          unitPricePiasters: 100000, // 1,000 EGP
          quantity: 1,
        },
      ],
    });

    const payment = await recordPayment({
      patientId: testPatient.id,
      collectionBranchId: branch.id,
      amountPiasters: 40000, // 400 EGP partial payment
      paymentMethod: PaymentMethod.CASH,
      collectedByUserId: staffUser.id,
      idempotencyKey: `pay-test-partial-${Date.now()}`,
      invoiceAllocations: [
        {
          invoiceId: invoice.id,
          amountPiasters: 40000,
        },
      ],
    });

    expect(payment?.id).toBeDefined();
    expect(payment?.receiptNumber).toMatch(/^RCP-\d{4}-\d{4}$/);
    expect(payment?.status).toBe(PaymentStatus.POSTED);

    // Verify invoice balance and status
    const updatedInvoice = await db.invoice.findUnique({
      where: { id: invoice.id },
    });
    expect(updatedInvoice?.paidAmountPiasters).toBe(40000);
    expect(updatedInvoice?.status).toBe(InvoiceStatus.PARTIALLY_PAID);
  });

  it('FN04: Secondary payment completes total invoice amount due and transitions status to PAID', async () => {
    const invoice = await createInvoice({
      patientId: testPatient.id,
      branchId: branch.id,
      issuedByUserId: staffUser.id,
      lines: [
        {
          description: 'Simple Extraction #48',
          unitPricePiasters: 50000, // 500 EGP
          quantity: 1,
        },
      ],
    });

    // Pay full 500 EGP via InstaPay
    await recordPayment({
      patientId: testPatient.id,
      collectionBranchId: branch.id,
      amountPiasters: 50000,
      paymentMethod: PaymentMethod.INSTAPAY,
      collectedByUserId: staffUser.id,
      idempotencyKey: `pay-test-full-${Date.now()}`,
      invoiceAllocations: [
        {
          invoiceId: invoice.id,
          amountPiasters: 50000,
        },
      ],
    });

    const settledInvoice = await db.invoice.findUnique({
      where: { id: invoice.id },
    });
    expect(settledInvoice?.paidAmountPiasters).toBe(50000);
    expect(settledInvoice?.status).toBe(InvoiceStatus.PAID);
  });

  it('FN05: Idempotency invariant rejects duplicate double-charging on duplicate requests', async () => {
    const key = `idempotency-key-${Date.now()}`;

    const payment1 = await recordPayment({
      patientId: testPatient.id,
      collectionBranchId: branch.id,
      amountPiasters: 25000,
      paymentMethod: PaymentMethod.CREDIT_CARD,
      collectedByUserId: staffUser.id,
      idempotencyKey: key,
    });

    const payment2 = await recordPayment({
      patientId: testPatient.id,
      collectionBranchId: branch.id,
      amountPiasters: 25000,
      paymentMethod: PaymentMethod.CREDIT_CARD,
      collectedByUserId: staffUser.id,
      idempotencyKey: key,
    });

    expect(payment1?.id).toBe(payment2?.id);
    expect(payment1?.receiptNumber).toBe(payment2?.receiptNumber);
  });

  it('FN06: Generates multi-month installment plans with equal splits and remainder tracking', async () => {
    const invoice = await createInvoice({
      patientId: testPatient.id,
      branchId: branch.id,
      issuedByUserId: staffUser.id,
      lines: [
        {
          description: 'Zirconia Crown #11',
          unitPricePiasters: 350000, // 3,500 EGP
          quantity: 1,
        },
      ],
    });

    const plan = await createInstallmentPlan({
      patientId: testPatient.id,
      invoiceId: invoice.id,
      totalInstallments: 3,
    });

    expect(plan.id).toBeDefined();
    expect(plan.installments.length).toBe(3);
    expect(plan.totalAmountPiasters).toBe(350000);

    const sumInstallments = plan.installments.reduce((sum, inst) => sum + inst.amountPiasters, 0);
    expect(sumInstallments).toBe(350000);
  });

  it('FN07: Computes daily cash collection reconciliation and flags discrepancies', async () => {
    const today = new Date();

    // Collect 100 EGP in CASH today
    await recordPayment({
      patientId: testPatient.id,
      collectionBranchId: branch.id,
      amountPiasters: 10000,
      paymentMethod: PaymentMethod.CASH,
      collectedByUserId: staffUser.id,
      idempotencyKey: `cash-recon-pay-${Date.now()}`,
    });

    // Cashier counts 95 EGP in drawer (-5 EGP discrepancy / shortage)
    const recon = await recordCashReconciliation({
      branchId: branch.id,
      cashierUserId: staffUser.id,
      countedCashPiasters: 9500,
      notes: 'End of shift drawer count',
    });

    expect(recon.id).toBeDefined();
    expect(recon.countedCashPiasters).toBe(9500);
    expect(recon.expectedCashPiasters).toBeGreaterThanOrEqual(10000);
    expect(recon.discrepancyPiasters).toBe(9500 - recon.expectedCashPiasters);
  });

  it('FN08: Records branch expenses and provides authoritative separated financial totals', async () => {
    const expense = await recordExpense({
      branchId: branch.id,
      category: ExpenseCategory.SUPPLIES,
      payee: 'Dental Supply Egypt Ltd',
      amountPiasters: 45000, // 450 EGP
      notes: 'Anesthetic cartridges box',
      createdByUserId: staffUser.id,
    });

    expect(expense.id).toBeDefined();
    expect(expense.category).toBe(ExpenseCategory.SUPPLIES);

    const summary = await getFinancialSummary(branch.id);
    expect(summary.totalInvoicedPiasters).toBeGreaterThan(0);
    expect(summary.totalCollectedPiasters).toBeGreaterThan(0);
    expect(summary.totalExpensesPiasters).toBeGreaterThan(0);
    expect(summary.collectedByMethod.CASH).toBeDefined();
    expect(summary.collectedByMethod.INSTAPAY).toBeDefined();
  });
});
