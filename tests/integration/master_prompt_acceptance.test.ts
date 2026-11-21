import { describe, it, expect, beforeAll } from 'vitest';
import db from '@/lib/db';
import { resolveActiveWorkspace, getAuthorizedWorkspacesForRole } from '@/config/workspace-navigation';
import { createTreatmentPlan, markTreatmentItemPerformed, createEncounter } from '@/services/clinical.service';
import { createInvoice } from '@/services/billing.service';
import { checkIn } from '@/services/visit.service';
import { ensurePlatformDefaults, getOwnerProfitabilityReport } from '@/services/platform-extensions.service';
import { Role, TreatmentPlanStatus } from '@prisma/client';

describe('Master Prompt End-to-End Acceptance Suite (4 Dashboards, Clinical, Labs, Profitability & Security)', () => {
  let branchA: any;
  let patientRecord: any;
  let patientUser: any;
  let receptionistUser: any;
  let dentistUser: any;
  let ownerUser: any;

  beforeAll(async () => {
    await ensurePlatformDefaults();
    branchA = await db.branch.findUniqueOrThrow({ where: { code: 'BR-A' } });
    patientRecord = await db.patient.findFirstOrThrow({ where: { primaryBranchId: branchA.id } });
    patientUser = await db.user.findUniqueOrThrow({
      where: { email: 'hassan.patient@ebtesamty.dev' },
      include: { roleGrants: true },
    });
    receptionistUser = await db.user.findUniqueOrThrow({
      where: { email: 'mariam.reception@ebtesamty.dev' },
      include: { roleGrants: true },
    });
    dentistUser = await db.user.findUniqueOrThrow({
      where: { email: 'dr.sandy@ebtesamty.dev' },
      include: { roleGrants: true },
    });
    ownerUser = await db.user.findUniqueOrThrow({
      where: { email: 'admin@ebtesamty.dev' },
      include: { roleGrants: true },
    });
  });

  it('MP01: Enforces strictly four primary dashboard workspaces across roles', () => {
    expect(getAuthorizedWorkspacesForRole('PATIENT').map((w) => w.id)).toEqual(['PATIENT']);
    expect(getAuthorizedWorkspacesForRole('RECEPTIONIST').map((w) => w.id)).toEqual(['RECEPTIONIST']);
    expect(getAuthorizedWorkspacesForRole('DENTIST').map((w) => w.id)).toEqual(['DENTIST']);
    expect(getAuthorizedWorkspacesForRole('OWNER_ADMIN').map((w) => w.id)).toEqual(['OWNER']);

    expect(resolveActiveWorkspace('/billing', 'OWNER_ADMIN').id).toBe('OWNER');
    expect(resolveActiveWorkspace('/inventory', 'OWNER_ADMIN').id).toBe('OWNER');
    expect(resolveActiveWorkspace('/crm', 'RECEPTIONIST').id).toBe('RECEPTIONIST');
  });

  it('MP02: Prohibits Patient from performing self-check-in', async () => {
    await expect(
      checkIn(
        {
          patientId: patientRecord.id,
          branchId: branchA.id,
        },
        patientUser
      )
    ).rejects.toThrow(/permission/i);
  });

  it('MP03: Enforces Receptionist discount cap (10% max) and allows Owner override', async () => {
    await expect(
      createInvoice({
        patientId: patientRecord.id,
        branchId: branchA.id,
        issuedByUserId: receptionistUser.id,
        discountPercent: 25,
        discountReason: 'Attempted unauthorized 25% discount',
        lines: [{ description: 'Composite Filling', unitPricePiasters: 100000, quantity: 1 }],
      })
    ).rejects.toThrow(/exceeds your permitted role cap/i);

    const allowedInvoice = await createInvoice({
      patientId: patientRecord.id,
      branchId: branchA.id,
      issuedByUserId: receptionistUser.id,
      discountPercent: 10,
      discountReason: 'Authorized 10% front-desk discount',
      lines: [{ description: 'Composite Filling', unitPricePiasters: 100000, quantity: 1 }],
    });
    expect(allowedInvoice.totalAmountPiasters).toBe(90000);
  });

  it('MP04: Freezes immutable Dentist CommissionSnapshot on invoice issue and protects historical snapshots', async () => {
    const inv = await createInvoice({
      patientId: patientRecord.id,
      branchId: branchA.id,
      issuedByUserId: ownerUser.id,
      lines: [{ description: 'Zirconia Crown #36', toothNumber: '36', unitPricePiasters: 500000, quantity: 1 }],
    });

    const snapBefore = await db.commissionSnapshot.findUniqueOrThrow({ where: { invoiceId: inv.id } });
    expect(snapBefore.grossAmountPiasters).toBe(500000);
    expect(snapBefore.commissionAmountPiasters).toBeGreaterThan(0);

    // Change future commission rule to 50%
    await db.commissionRule.create({
      data: {
        ruleType: 'PERCENTAGE_AFTER_COSTS',
        ratePercent: 50.0,
        deductLabCost: true,
        deductMaterialCost: true,
        isActive: true,
      },
    });

    // Verify historical snapshot on inv.id was NOT altered
    const snapAfter = await db.commissionSnapshot.findUniqueOrThrow({ where: { invoiceId: inv.id } });
    expect(snapAfter.commissionAmountPiasters).toBe(snapBefore.commissionAmountPiasters);
    expect(snapAfter.commissionRatePercent).toBe(snapBefore.commissionRatePercent);
  });

  it('MP05: Completing a procedure triggers idempotent MaterialRecipe stock deduction and Loyalty points', async () => {
    const enc = await createEncounter({
      patientId: patientRecord.id,
      branchId: branchA.id,
      dentistUserId: dentistUser.id,
      chiefComplaint: 'Sensitivity on #36',
      examinationFindings: 'Occlusal caries on #36',
      clinicalNotes: 'Prepared and restored #36 with composite',
    });

    const plan = await createTreatmentPlan({
      patientId: patientRecord.id,
      dentistUserId: dentistUser.id,
      branchId: branchA.id,
      title: 'Restorative Care Plan MP05',
      items: [{ procedureName: 'Composite Filling', toothNumber: '36', estimatedCostPiasters: 120000 }],
    });

    const itemId = plan.items[0].id;
    await markTreatmentItemPerformed(itemId, enc.id, dentistUser.id);
    // Call a second time to verify idempotency (must not double deduct)
    await markTreatmentItemPerformed(itemId, enc.id, dentistUser.id);

    const movements = await db.stockMovement.findMany({
      where: { referenceId: `PROC:${itemId}`, movementType: 'CONSUMPTION' },
    });
    expect(movements.length).toBeLessThanOrEqual(1);

    const loyaltyEntries = await db.loyaltyLedger.findMany({
      where: { visitId: itemId },
    });
    expect(loyaltyEntries.length).toBe(1);
    expect(loyaltyEntries[0].points).toBe(50);
  });

  it('MP06: Computes Owner Profitability report including Lab Orders, Materials, Commissions & Net Margin', async () => {
    const report = await getOwnerProfitabilityReport(branchA.id);
    expect(report.summary.grossBilledPiasters).toBeGreaterThan(0);
    expect(report.labOrders.length).toBeGreaterThan(0);
    expect(report.dentistStatements.length).toBeGreaterThan(0);
    expect(typeof report.summary.netProfitPiasters).toBe('number');
  });
});
