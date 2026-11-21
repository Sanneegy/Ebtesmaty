import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import db from '../../src/lib/db';
import { createPatient, searchPatients, requestPortalPatientLink, verifyPortalPatientLink, resolveDuplicateReview } from '../../src/services/patient.service';
import { assertPatientSelf, requireRole, AuthorizationError } from '../../src/lib/rbac';
import { Role, PatientSource, MigrationStatus, LinkStatus, DuplicateReviewStatus } from '@prisma/client';

describe('T01 - T07: Identity, Multi-Branch RBAC & Session Isolation Integration Tests', () => {
  let receptionUser: any;
  let patientHassanUser: any;
  let patientNourUser: any;
  let patientHassanRecord: any;
  let testStartTime: Date;

  beforeAll(async () => {
    testStartTime = new Date();
    // T01 Verification: Ensure branches and seed data exist in real PostgreSQL
    const branchCount = await db.branch.count();
    expect(branchCount).toBeGreaterThanOrEqual(3);

    receptionUser = await db.user.findUnique({
      where: { email: 'mariam.reception@ebtesamty.dev' },
      include: { roleGrants: true },
    });
    expect(receptionUser).not.toBeNull();

    patientHassanUser = await db.user.findUnique({
      where: { email: 'hassan.patient@ebtesamty.dev' },
      include: { roleGrants: true },
    });
    expect(patientHassanUser).not.toBeNull();

    patientNourUser = await db.user.findUnique({
      where: { email: 'nour.patient@ebtesamty.dev' },
      include: { roleGrants: true },
    });
    expect(patientNourUser).not.toBeNull();

    patientHassanRecord = await db.patient.findFirst({
      where: { patientNumber: 'EBT-PAT-2026-0001' },
    });
    expect(patientHassanRecord).not.toBeNull();
  });

  afterAll(async () => {
    await db.potentialDuplicateReview.deleteMany({
      where: { createdAt: { gte: testStartTime } },
    });
    await db.patient.deleteMany({
      where: { createdAt: { gte: testStartTime } },
    });
    // Restore seeded duplicate reviews to PENDING if resolved during T05
    await db.potentialDuplicateReview.updateMany({
      where: { createdAt: { lt: testStartTime } },
      data: { status: DuplicateReviewStatus.PENDING, reviewedByUserId: null, reviewedAt: null },
    });
    // Restore Nour's portal link to PENDING for E2E reception queue verification
    if (patientNourUser) {
      await db.portalPatientLink.updateMany({
        where: { userId: patientNourUser.id },
        data: { status: LinkStatus.PENDING, verifiedAt: null, verifiedByUserId: null },
      });
    }
  });

  it('T01: Database initialized and operational with version-controlled schema and seed', async () => {
    const branches = await db.branch.findMany({ select: { code: true } });
    const codes = branches.map((b) => b.code);
    expect(codes).toContain('BR-A');
    expect(codes).toContain('BR-B');
    expect(codes).toContain('BR-C');

    const patientCount = await db.patient.count();
    expect(patientCount).toBeGreaterThanOrEqual(5);
  });

  it('T02: Authenticated Patient sees only own record; cross-patient access returns 403 Forbidden', async () => {
    // Hassan accessing own record succeeds
    await expect(assertPatientSelf(patientHassanUser.id, patientHassanRecord.id)).resolves.toBeDefined();

    // Find another patient record (e.g. Omar Farouk or Patient 2)
    const otherPatient = await db.patient.findFirst({
      where: { fullName: 'Omar Farouk' },
    });
    expect(otherPatient).not.toBeNull();

    // Hassan attempting to access Omar's record must be rejected with AuthorizationError (403)
    await expect(assertPatientSelf(patientHassanUser.id, otherPatient!.id)).rejects.toThrow(
      /Access denied: You can only view and manage your own authorized patient record/
    );
  });

  it('T03: Receptionist creates patient without email; record persists in PostgreSQL with unique ID', async () => {
    const result = await createPatient(
      {
        fullName: 'Kareem Soliman Walkin',
        dateOfBirth: '1988-03-25',
        gender: 'MALE',
        primaryPhone: '+201099887766',
        address: 'Heliopolis Cairo',
        source: PatientSource.CLINIC_ENTRY,
        migrationStatus: MigrationStatus.FULLY_DIGITIZED,
      },
      receptionUser
    );

    expect(result.patient).toBeDefined();
    expect(result.patient.id).toBeDefined();
    expect(result.patient.patientNumber).toMatch(/^EBT-PAT-\d{4}-\d{4}$/);
    expect(result.patient.fullName).toBe('Kareem Soliman Walkin');
    expect(result.patient.source).toBe('CLINIC_ENTRY');

    // Retrieve directly from DB to verify persistence
    const saved = await db.patient.findUnique({
      where: { id: result.patient.id },
    });
    expect(saved).not.toBeNull();
    expect(saved?.primaryPhone).toBe('+201099887766');
  });

  it('T04: Same phone number can belong to two different patients without merging or collision', async () => {
    const sharedPhone = '+201011' + Math.floor(100000 + Math.random() * 900000);

    // Register Patient Family Member 1
    const p1 = await createPatient(
      {
        fullName: 'Sameh Family Member 1',
        dateOfBirth: '1980-01-01',
        gender: 'MALE',
        primaryPhone: sharedPhone,
      },
      receptionUser
    );

    // Register Patient Family Member 2 with the EXACT SAME PHONE
    const p2 = await createPatient(
      {
        fullName: 'Nadia Family Member 2',
        dateOfBirth: '1984-06-15',
        gender: 'FEMALE',
        primaryPhone: sharedPhone,
      },
      receptionUser
    );

    expect(p1.patient.id).not.toBe(p2.patient.id);
    expect(p1.patient.patientNumber).not.toBe(p2.patient.patientNumber);
    expect(p1.patient.primaryPhone).toBe(sharedPhone);
    expect(p2.patient.primaryPhone).toBe(sharedPhone);

    // Both distinct patient records exist in PostgreSQL
    const matchingPatients = await db.patient.findMany({
      where: { primaryPhone: sharedPhone },
    });
    expect(matchingPatients.length).toBe(2);
  });

  it('T05: Possible duplicate suggestion does not auto-merge people; staff resolution action is audited', async () => {
    // When Nadia Family Member 2 was created with same phone as Sameh, a duplicate hint was generated
    const duplicateReview = await db.potentialDuplicateReview.findFirst({
      where: {
        matchType: 'SAME_PHONE',
        status: DuplicateReviewStatus.PENDING,
      },
    });
    expect(duplicateReview).not.toBeNull();

    // Staff resolves review: confirms distinct people
    const resolved = await resolveDuplicateReview(
      duplicateReview!.id,
      DuplicateReviewStatus.REVIEWED_DISTINCT,
      'Verified husband and wife sharing household telephone.',
      receptionUser
    );

    expect(resolved.status).toBe(DuplicateReviewStatus.REVIEWED_DISTINCT);
    expect(resolved.reviewedByUserId).toBe(receptionUser.id);

    // Verify Audit Event logged in DB
    const audit = await db.auditEvent.findFirst({
      where: {
        action: 'DUPLICATE_REVIEW_RESOLVED',
        entityId: duplicateReview!.id,
      },
    });
    expect(audit).not.toBeNull();
    expect(audit?.actorUserId).toBe(receptionUser.id);
  });

  it('T06: Patient self-registration creates isolated identity; cannot hijack existing clinic file via phone match', async () => {
    // Hassan already has record patientHassanRecord with phone '+201001234567'
    // A new online registration with same name/phone must NOT link automatically
    const newSelfReg = await createPatient({
      fullName: 'Hassan El-Sayed',
      dateOfBirth: '1990-05-14',
      gender: 'MALE',
      primaryPhone: '+201001234567',
      source: PatientSource.ONLINE_SELF_REG,
    });

    // An entirely new patient ID is generated
    expect(newSelfReg.patient.id).not.toBe(patientHassanRecord.id);
    expect(newSelfReg.patient.patientNumber).not.toBe(patientHassanRecord.patientNumber);

    // The existing patientHassanRecord retains its separate identity and link
    const original = await db.patient.findUnique({
      where: { id: patientHassanRecord.id },
      include: { portalLinks: true },
    });
    expect(original?.portalLinks[0]?.userId).toBe(patientHassanUser.id);
  });

  it('T07: Portal link request for clinic patient awaits staff approval; patient cannot access old record meanwhile', async () => {
    // Find unlinked patient (e.g. Mona Shenouda)
    const monaRecord = await db.patient.findFirst({
      where: { fullName: 'Mona Shenouda' },
    });
    expect(monaRecord).not.toBeNull();

    // Nour Mansour has a PENDING link request to Mona (reset for test repeatability)
    await db.portalPatientLink.updateMany({
      where: {
        userId: patientNourUser.id,
        patientId: monaRecord!.id,
      },
      data: {
        status: LinkStatus.PENDING,
        verifiedAt: null,
        verifiedByUserId: null,
      },
    });

    const pendingLink = await db.portalPatientLink.findFirst({
      where: {
        userId: patientNourUser.id,
        patientId: monaRecord!.id,
      },
    });
    expect(pendingLink?.status).toBe(LinkStatus.PENDING);

    // While pending, Nour Mansour MUST NOT have patient self-access to Mona's file
    await expect(assertPatientSelf(patientNourUser.id, monaRecord!.id)).rejects.toThrow(
      /Access denied: You can only view and manage your own authorized patient record/
    );

    // Receptionist verifies and approves link after identity verification
    const verified = await verifyPortalPatientLink(
      pendingLink!.id,
      'APPROVE',
      'Verified via national identity card physically in clinic.',
      receptionUser
    );
    expect(verified.status).toBe(LinkStatus.APPROVED);

    // Now Nour Mansour has authorized access
    await expect(assertPatientSelf(patientNourUser.id, monaRecord!.id)).resolves.toBeDefined();

    // Audit event must be recorded
    const audit = await db.auditEvent.findFirst({
      where: {
        action: 'PORTAL_LINK_APPROVED',
        entityId: pendingLink!.id,
      },
    });
    expect(audit).not.toBeNull();
  });
});
