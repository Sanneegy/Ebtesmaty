import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import db from '../../src/lib/db';
import {
  EquipmentCategory,
  EquipmentStatus,
  CriticalityLevel,
  FaultSeverity,
  WorkOrderStatus,
  Role,
} from '@prisma/client';
import {
  getEquipmentAssets,
  getEquipmentAssetById,
  createEquipmentAsset,
  reportEquipmentFault,
  createWorkOrder,
  completeWorkOrder,
  verifyAndReturnToService,
  getEquipmentSummary,
} from '../../src/services/equipment.service';

describe('Checkpoint F: Equipment, Maintenance & Repairs (EQ01 - EQ05)', () => {
  let testBranch: any;
  let staffUser: any;
  let managerUser: any;
  let testStartTime: Date;

  beforeAll(async () => {
    testStartTime = new Date();
    testBranch = await db.branch.findFirst({ where: { code: 'BR-A' } });
    staffUser = await db.user.findFirst({
      where: { email: 'mariam.reception@ebtesamty.dev' },
    });
    managerUser = await db.user.findFirst({
      where: { email: 'manager.b1@ebtesamty.dev' },
    });
  });

  afterAll(async () => {
    await db.operationalAlert.deleteMany({ where: { createdAt: { gte: testStartTime } } });
    await db.expense.deleteMany({ where: { createdAt: { gte: testStartTime }, category: 'MAINTENANCE', amountPiasters: 450000 } });
    await db.maintenanceWorkOrder.deleteMany({ where: { createdAt: { gte: testStartTime } } });
    await db.equipmentFault.deleteMany({ where: { reportedAt: { gte: testStartTime } } });
    await db.equipmentAsset.deleteMany({ where: { createdAt: { gte: testStartTime } } });
  });

  it('EQ01: Seeds and retrieves operational dental equipment catalog per branch', async () => {
    const assets = await getEquipmentAssets();
    expect(assets.length).toBeGreaterThanOrEqual(1);

    const chair = assets.find((a) => a.category === EquipmentCategory.DENTAL_CHAIR);
    expect(chair).toBeDefined();
    expect(chair?.status).toBe(EquipmentStatus.OPERATIONAL);
    expect(chair?.criticality).toBe(CriticalityLevel.HIGH);
  });

  it('EQ02: Reporting a critical fault automatically updates asset status to OUT_OF_SERVICE and generates audit record', async () => {
    const testSerial = `SN-CRIT-${Date.now()}`;
    const asset = await createEquipmentAsset({
      branchId: testBranch.id,
      name: 'Test Autoclave Unit 9',
      serialNumber: testSerial,
      model: 'Tuttnauer 3870E',
      category: EquipmentCategory.AUTOCLAVE,
      criticality: CriticalityLevel.HIGH,
    });

    expect(asset.status).toBe(EquipmentStatus.OPERATIONAL);

    const fault = await reportEquipmentFault({
      assetId: asset.id,
      reportedByUserId: staffUser.id,
      description: 'Chamber pressure relief valve failed sterilization cycle test',
      severity: FaultSeverity.CRITICAL,
    });

    expect(fault.id).toBeDefined();
    expect(fault.severity).toBe(FaultSeverity.CRITICAL);
    expect(fault.isResolved).toBe(false);

    // Asset status must have transitioned to OUT_OF_SERVICE immediately
    const updatedAsset = await db.equipmentAsset.findUnique({
      where: { id: asset.id },
    });
    expect(updatedAsset?.status).toBe(EquipmentStatus.OUT_OF_SERVICE);

    // Audit log verification
    const audit = await db.auditEvent.findFirst({
      where: {
        entityType: 'EquipmentFault',
        entityId: fault.id,
        action: 'EQUIPMENT_FAULT_REPORTED',
      },
    });
    expect(audit).toBeDefined();
    expect(audit?.actorUserId).toBe(staffUser.id);
  });

  it('EQ03: Reporting a major fault sets asset to RESTRICTED_USE', async () => {
    const testSerial = `SN-MAJ-${Date.now()}`;
    const asset = await createEquipmentAsset({
      branchId: testBranch.id,
      name: 'Test X-Ray Intraoral Arm',
      serialNumber: testSerial,
      model: 'Planmeca ProX',
      category: EquipmentCategory.XRAY_UNIT,
      criticality: CriticalityLevel.MEDIUM,
    });

    const fault = await reportEquipmentFault({
      assetId: asset.id,
      reportedByUserId: staffUser.id,
      description: 'Scissor arm tension loose, drift observed during positioning',
      severity: FaultSeverity.MAJOR,
    });

    expect(fault.severity).toBe(FaultSeverity.MAJOR);

    const updatedAsset = await db.equipmentAsset.findUnique({
      where: { id: asset.id },
    });
    expect(updatedAsset?.status).toBe(EquipmentStatus.RESTRICTED_USE);
  });

  it('EQ04: Dispatches maintenance work order and transitions asset to UNDER_MAINTENANCE', async () => {
    const testSerial = `SN-WO-${Date.now()}`;
    const asset = await createEquipmentAsset({
      branchId: testBranch.id,
      name: 'Test Compressor 4',
      serialNumber: testSerial,
      model: 'Dürr Duo',
      category: EquipmentCategory.COMPRESSOR,
      criticality: CriticalityLevel.HIGH,
    });

    const fault = await reportEquipmentFault({
      assetId: asset.id,
      reportedByUserId: staffUser.id,
      description: 'Low air line pressure detected in operatory 2',
      severity: FaultSeverity.CRITICAL,
    });

    const workOrder = await createWorkOrder({
      assetId: asset.id,
      faultId: fault.id,
      technicianName: 'Hany Abdel-Rahman (DentalTech Egypt)',
      technicianPhone: '+20 100 555 4433',
      workOrderType: 'CORRECTIVE',
      notes: 'Dispatched emergency technician for pressure regulator gasket replacement',
    });

    expect(workOrder.id).toBeDefined();
    expect(workOrder.status).toBe(WorkOrderStatus.IN_PROGRESS);

    const assetUnderRepair = await db.equipmentAsset.findUnique({
      where: { id: asset.id },
    });
    expect(assetUnderRepair?.status).toBe(EquipmentStatus.UNDER_MAINTENANCE);
  });

  it('EQ05: Completes repair and return-to-service verification restores OPERATIONAL status, marks fault resolved, and records maintenance expense', async () => {
    const testSerial = `SN-VERIF-${Date.now()}`;
    const asset = await createEquipmentAsset({
      branchId: testBranch.id,
      name: 'Test Surgical Laser',
      serialNumber: testSerial,
      model: 'Biolase Epic X',
      category: EquipmentCategory.LASER_UNIT,
      criticality: CriticalityLevel.HIGH,
    });

    const fault = await reportEquipmentFault({
      assetId: asset.id,
      reportedByUserId: staffUser.id,
      description: 'Fiber calibration error code E04',
      severity: FaultSeverity.CRITICAL,
    });

    const workOrder = await createWorkOrder({
      assetId: asset.id,
      faultId: fault.id,
      technicianName: 'Biolase Certified Service Engineer',
      technicianPhone: '+20 111 222 3344',
      workOrderType: 'CORRECTIVE',
    });

    // Technician completes work
    const completedWO = await completeWorkOrder(workOrder.id, {
      costPiasters: 450000, // 4,500 EGP
      downtimeHours: 3.5,
      notes: 'Optical handpiece tip replaced and recalibrated with test photodiode',
    });
    expect(completedWO.status).toBe(WorkOrderStatus.COMPLETED_AWAITING_VERIFICATION);

    // Branch manager verifies and returns asset to clinical service
    const verifiedWO = await verifyAndReturnToService(
      workOrder.id,
      managerUser.id,
      'Test pulse verification passed with safety goggles protocol verified'
    );
    expect(verifiedWO.status).toBe(WorkOrderStatus.VERIFIED_RETURNED_TO_SERVICE);

    // Verify Asset is OPERATIONAL again
    const restoredAsset = await db.equipmentAsset.findUnique({
      where: { id: asset.id },
    });
    expect(restoredAsset?.status).toBe(EquipmentStatus.OPERATIONAL);
    expect(restoredAsset?.lastServiceDate).toBeDefined();

    // Verify Fault is marked resolved
    const resolvedFault = await db.equipmentFault.findUnique({
      where: { id: fault.id },
    });
    expect(resolvedFault?.isResolved).toBe(true);

    // Verify maintenance expense was recorded in the finance ledger
    const expense = await db.expense.findFirst({
      where: {
        branchId: testBranch.id,
        category: 'MAINTENANCE',
        amountPiasters: 450000,
      },
    });
    expect(expense).toBeDefined();
    expect(expense?.createdByUserId).toBe(managerUser.id);

    // Verify summary metric reflects healthy operations
    const summary = await getEquipmentSummary(testBranch.id);
    expect(summary.total).toBeGreaterThanOrEqual(1);
    expect(summary.operational).toBeGreaterThanOrEqual(1);
  });
});
