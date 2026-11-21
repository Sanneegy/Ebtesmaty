import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import db from '../../src/lib/db';
import {
  NotificationType,
  NotificationStatus,
  FeedbackCategory,
  FeedbackStatus,
  AlertStatus,
  EquipmentStatus,
  Role,
} from '@prisma/client';
import {
  createNotification,
  getUserNotifications,
  markNotificationRead,
  submitFeedbackCase,
  getFeedbackCases,
  assignFeedbackCase,
  respondAndResolveFeedback,
  getOperationalAlerts,
  resolveOperationalAlert,
  getManagementActionCenterKPIs,
} from '../../src/services/communications.service';

describe('Checkpoint G: Patient Communications, Feedback & Management Action Center (MG01 - MG06)', () => {
  let testBranch: any;
  let testPatientUser: any;
  let testStaffUser: any;
  let testPatientRecord: any;
  let testStartTime: Date;

  beforeAll(async () => {
    testStartTime = new Date();
    testBranch = await db.branch.findFirst({ where: { code: 'BR-A' } });
    testStaffUser = await db.user.findFirst({
      where: { email: 'mariam.reception@ebtesamty.dev' },
    });

    testPatientUser = await db.user.create({
      data: {
        fullName: 'Feedback Patient User',
        phone: `+2010666${Math.floor(1000 + Math.random() * 9000)}`,
        status: 'ACTIVE',
        passwordHash: '$2b$10$dummyHashForTestingPurposesOnly1234567890',
        roleGrants: {
          create: { role: Role.PATIENT },
        },
      },
    });

    testPatientRecord = await db.patient.create({
      data: {
        patientNumber: `P-MG-${Date.now().toString().slice(-4)}`,
        fullName: 'Feedback Patient User',
        nationalIdOrPassport: `MG_NAT_${Date.now()}`,
        primaryPhone: testPatientUser.phone,
        dateOfBirth: new Date('1992-05-15'),
        gender: 'MALE',
        source: 'ONLINE_SELF_REG',
        primaryBranchId: testBranch.id,
      },
    });

    await db.portalPatientLink.create({
      data: {
        userId: testPatientUser.id,
        patientId: testPatientRecord.id,
        status: 'APPROVED',
      },
    });
  });

  afterAll(async () => {
    await db.operationalAlert.deleteMany({ where: { createdAt: { gte: testStartTime } } });
    await db.feedbackCase.deleteMany({ where: { createdAt: { gte: testStartTime } } });
    await db.equipmentAsset.deleteMany({ where: { createdAt: { gte: testStartTime } } });
    if (testPatientRecord) {
      await db.patient.deleteMany({ where: { id: testPatientRecord.id } });
    }
    if (testPatientUser) {
      await db.user.deleteMany({ where: { id: testPatientUser.id } });
    }
  });

  it('MG01: Creates in-app notifications and marks as read', async () => {
    const notif = await createNotification({
      userId: testPatientUser.id,
      title: 'Appointment Confirmed',
      body: 'Your dental consultation is confirmed for tomorrow at 11:00 AM.',
      type: NotificationType.APPOINTMENT_REMINDER,
    });

    expect(notif.id).toBeDefined();
    expect(notif.status).toBe(NotificationStatus.DELIVERED);

    const userNotifs = await getUserNotifications(testPatientUser.id);
    expect(userNotifs.length).toBeGreaterThanOrEqual(1);

    await markNotificationRead(notif.id, testPatientUser.id);

    const updated = await db.notification.findUnique({
      where: { id: notif.id },
    });
    expect(updated?.status).toBe(NotificationStatus.READ);
  });

  it('MG02: Patient feedback case submission generates operational alert if category is COMPLAINT', async () => {
    const feedback = await submitFeedbackCase({
      patientId: testPatientRecord.id,
      branchId: testBranch.id,
      category: FeedbackCategory.COMPLAINT,
      subject: 'Wait time exceeded 40 minutes past scheduled appointment slot',
      description: 'Arrived at 10:45 AM, appointment was 11:00 AM, not seen until 11:42 AM without update.',
    });

    expect(feedback.id).toBeDefined();
    expect(feedback.status).toBe(FeedbackStatus.OPEN);

    // Complaint must have triggered an active OperationalAlert
    const alert = await db.operationalAlert.findFirst({
      where: {
        branchId: testBranch.id,
        entityId: feedback.id,
        status: AlertStatus.ACTIVE,
      },
    });

    expect(alert).toBeDefined();
    expect(alert?.title).toContain('Patient Complaint Registered');
  });

  it('MG03: Staff assigns and responds to feedback case, auto-delivering notification to patient', async () => {
    const feedback = await submitFeedbackCase({
      patientId: testPatientRecord.id,
      branchId: testBranch.id,
      category: FeedbackCategory.INQUIRY,
      subject: 'ValU installment options for dental bridge',
      description: 'Can I pay over 12 months with ValU at the Heliopolis clinic?',
    });

    const assigned = await assignFeedbackCase(feedback.id, testStaffUser.id);
    expect(assigned.status).toBe(FeedbackStatus.ASSIGNED);
    expect(assigned.assignedStaffId).toBe(testStaffUser.id);

    const resolved = await respondAndResolveFeedback({
      caseId: feedback.id,
      staffUserId: testStaffUser.id,
      patientVisibleResponse: 'Yes, ValU 12-month zero-interest installments are fully supported at Heliopolis!',
      internalNotes: 'Contacted patient via WhatsApp as well to confirm booking.',
      status: FeedbackStatus.RESOLVED,
    });

    expect(resolved.status).toBe(FeedbackStatus.RESOLVED);
    expect(resolved.patientVisibleResponse).toContain('ValU 12-month');

    // Auto-notification to patient's portal
    const notifications = await getUserNotifications(testPatientUser.id);
    const feedbackNotif = notifications.find((n) => n.title.includes('ValU installment'));
    expect(feedbackNotif).toBeDefined();
  });

  it('MG04: Operational alert engine detects down equipment and low stock thresholds', async () => {
    // Put an asset out of service to verify alert generation
    const downAsset = await db.equipmentAsset.create({
      data: {
        branchId: testBranch.id,
        name: 'Alert Test Handpiece 99',
        serialNumber: `SN-ALERT-${Date.now()}`,
        model: 'KaVo Smart 99',
        status: EquipmentStatus.OUT_OF_SERVICE,
      },
    });

    const alerts = await getOperationalAlerts(testBranch.id);
    expect(alerts.length).toBeGreaterThanOrEqual(1);

    const equipmentAlert = alerts.find((a) => a.entityId === downAsset.id);
    expect(equipmentAlert).toBeDefined();
    expect(equipmentAlert?.severity).toBe('CRITICAL');
  });

  it('MG05: Resolves active operational alert with audit recording', async () => {
    const alert = await db.operationalAlert.create({
      data: {
        branchId: testBranch.id,
        alertType: 'PROLONGED_WAIT_TIME',
        severity: 'WARNING',
        title: 'Prolonged Wait Alert',
        description: 'Waiting queue > 30 minutes',
        status: AlertStatus.ACTIVE,
      },
    });

    const resolved = await resolveOperationalAlert(alert.id, testStaffUser.id);
    expect(resolved.status).toBe(AlertStatus.RESOLVED);
    expect(resolved.resolvedByUserId).toBe(testStaffUser.id);
    expect(resolved.resolvedAt).toBeDefined();
  });

  it('MG06: Management Action Center calculates cross-branch KPIs across all 3 branches', async () => {
    const kpis = await getManagementActionCenterKPIs();
    expect(kpis.branches).toBeDefined();
    expect(kpis.branches.length).toBeGreaterThanOrEqual(1);

    const branch = kpis.branches[0];
    expect(branch.branch.name).toBeDefined();
    expect(branch.financials).toBeDefined();
    expect(branch.financials.collectedEgp).toBeGreaterThanOrEqual(0);
    expect(branch.equipment).toBeDefined();
    expect(branch.feedback).toBeDefined();
  });
});
