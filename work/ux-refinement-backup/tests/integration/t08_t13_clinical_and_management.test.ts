import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import db from '../../src/lib/db';
import { submitIntake, saveIntakeDraft, reviewIntake, getPatientIntakeHistory } from '../../src/services/intake.service';
import { getOperationalMetrics } from '../../src/services/management.service';
import { Role, IntakeStatus, IntakeSource, ReviewOutcome, MigrationStatus } from '@prisma/client';

describe('T08 - T13: Clinical Intake, Reviews, Management PHI Shield & Legacy Migration', () => {
  let dentistSandy: any;
  let dentistAhmed: any;
  let receptionistUser: any;
  let managerUser: any;
  let patientHassanUser: any;
  let patientHassanRecord: any;

  beforeAll(async () => {
    dentistSandy = await db.user.findUnique({
      where: { email: 'dr.sandy@ebtesamty.dev' },
      include: { roleGrants: true },
    });
    expect(dentistSandy).not.toBeNull();

    dentistAhmed = await db.user.findUnique({
      where: { email: 'dr.ahmed@ebtesamty.dev' },
      include: { roleGrants: true },
    });
    expect(dentistAhmed).not.toBeNull();

    receptionistUser = await db.user.findUnique({
      where: { email: 'mariam.reception@ebtesamty.dev' },
      include: { roleGrants: true },
    });
    expect(receptionistUser).not.toBeNull();

    managerUser = await db.user.findUnique({
      where: { email: 'manager.b1@ebtesamty.dev' },
      include: { roleGrants: true },
    });
    expect(managerUser).not.toBeNull();

    patientHassanUser = await db.user.findUnique({
      where: { email: 'hassan.patient@ebtesamty.dev' },
      include: { roleGrants: true },
    });
    expect(patientHassanUser).not.toBeNull();

    patientHassanRecord = await db.patient.findFirst({
      where: { patientNumber: 'EBT-PAT-2026-0001' },
    });
    expect(patientHassanRecord).not.toBeNull();
  });

  afterAll(async () => {
    if (patientHassanRecord) {
      await db.medicalHistorySubmission.deleteMany({
        where: { patientId: patientHassanRecord.id, versionNumber: { gt: 2 } },
      });
      await db.medicalHistorySubmission.updateMany({
        where: { patientId: patientHassanRecord.id, versionNumber: 2 },
        data: { status: IntakeStatus.PENDING_REVIEW },
      });
    }
  });

  it('T08: Patient submits intake with UNKNOWN answer; saved version reflects provenance, time, status, answers', async () => {
    const intakeAnswers = {
      conditions: {
        hypertension: { value: 'NO' as const },
        diabetes: { value: 'NO' as const },
      },
      allergies: {
        penicillin: { value: 'YES' as const, reaction: 'Severe rash' },
        localAnesthetics: { value: 'UNKNOWN' as const, reaction: 'Never received dental shots' },
      },
      medications: {
        currentMedsList: 'Omega-3',
      },
      dental: {
        chiefComplaint: 'Tooth sensitivity to cold water',
      },
    };

    const submission = await submitIntake(
      patientHassanRecord.id,
      intakeAnswers,
      patientHassanUser,
      false // Patient direct submission
    );

    expect(submission.id).toBeDefined();
    expect(submission.versionNumber).toBeGreaterThanOrEqual(1);
    expect(submission.status).toBe(IntakeStatus.PENDING_REVIEW);
    expect(submission.submissionSource).toBe(IntakeSource.PATIENT_PORTAL);
    expect(submission.submittedByUserId).toBe(patientHassanUser.id);
    expect(submission.submittedAt).not.toBeNull();

    // Verify stored JSON answers
    const answers = submission.answersJson as any;
    expect(answers.allergies.localAnesthetics.value).toBe('UNKNOWN');
    expect(answers.allergies.penicillin.value).toBe('YES');
  });

  it('T09: Receptionist can assist intake submission, but receptionist attempting clinical review is rejected with 403', async () => {
    // 1. Receptionist assists patient in clinic
    const assistedAnswers = {
      conditions: { hypertension: { value: 'NO' as const } },
      allergies: { penicillin: { value: 'NO' as const } },
      medications: { currentMedsList: 'None' },
      dental: { chiefComplaint: 'Walk-in tooth pain' },
    };

    const submission = await submitIntake(
      patientHassanRecord.id,
      assistedAnswers,
      receptionistUser,
      true // Assisted by reception
    );

    expect(submission.submissionSource).toBe(IntakeSource.PATIENT_ASSISTED_BY_RECEPTION);
    expect(submission.submittedByUserId).toBe(receptionistUser.id);
    expect(submission.status).toBe(IntakeStatus.PENDING_REVIEW);

    // 2. Receptionist attempts to approve/review this submission clinically -> MUST FAIL WITH 403 FORBIDDEN
    await expect(
      reviewIntake(
        submission.id,
        ReviewOutcome.APPROVED,
        'Receptionist approving medical review',
        receptionistUser // RECEPTIONIST ROLE
      )
    ).rejects.toThrow(/You do not have permission to perform this action/);

    // Submission remains unreviewed
    const checkSub = await db.medicalHistorySubmission.findUnique({
      where: { id: submission.id },
    });
    expect(checkSub?.status).toBe(IntakeStatus.PENDING_REVIEW);
  });

  it('T10: Assigned treating dentist reviews exact intake version; unassigned dentist receives 403 Forbidden', async () => {
    // Dr. Sandy Saad is assigned to Hassan El-Sayed
    // Dr. Ahmed is NOT assigned to Hassan El-Sayed

    const latestSub = await db.medicalHistorySubmission.findFirst({
      where: { patientId: patientHassanRecord.id, status: IntakeStatus.PENDING_REVIEW },
      orderBy: { versionNumber: 'desc' },
    });
    expect(latestSub).not.toBeNull();

    // 1. Unassigned dentist (Dr. Ahmed) attempts to view or review -> REJECTED (403)
    await expect(
      reviewIntake(
        latestSub!.id,
        ReviewOutcome.APPROVED,
        'Dr. Ahmed trying to sign off unassigned patient',
        dentistAhmed
      )
    ).rejects.toThrow(/Access denied: You are not assigned as an authorized treating clinician for this patient/);

    // 2. Assigned dentist (Dr. Sandy Saad) reviews and approves -> SUCCESS
    const review = await reviewIntake(
      latestSub!.id,
      ReviewOutcome.APPROVED,
      'Approved for dental cleaning and restorative filling. Penicillin allergy confirmed and noted on operatory chart.',
      dentistSandy
    );

    expect(review.id).toBeDefined();
    expect(review.outcome).toBe(ReviewOutcome.APPROVED);
    expect(review.dentistUserId).toBe(dentistSandy.id);
    expect(review.submissionId).toBe(latestSub!.id);

    // Check submission status updated to REVIEWED
    const updatedSub = await db.medicalHistorySubmission.findUnique({
      where: { id: latestSub!.id },
    });
    expect(updatedSub?.status).toBe(IntakeStatus.REVIEWED);
  });

  it('T11: Newer intake submission invalidates previous review currentness while preserving historical review sign-off', async () => {
    // Get the previously approved submission
    const previousSub = await db.medicalHistorySubmission.findFirst({
      where: { patientId: patientHassanRecord.id, status: IntakeStatus.REVIEWED },
      include: { reviews: true },
    });
    expect(previousSub).not.toBeNull();
    const prevReviewCount = previousSub!.reviews.length;
    expect(prevReviewCount).toBeGreaterThanOrEqual(1);

    // Patient submits an updated intake (Version N+1)
    const newAnswers = {
      conditions: {
        hypertension: { value: 'YES' as const, notes: 'Newly diagnosed with mild hypertension' },
      },
      allergies: { penicillin: { value: 'YES' as const } },
      medications: { currentMedsList: 'Amlodipine 5mg' },
      dental: { chiefComplaint: 'Follow-up filling check' },
    };

    const newSub = await submitIntake(
      patientHassanRecord.id,
      newAnswers,
      patientHassanUser,
      false
    );

    expect(newSub.versionNumber).toBe(previousSub!.versionNumber + 1);
    expect(newSub.status).toBe(IntakeStatus.PENDING_REVIEW);

    // Verify earlier submission status was updated to SUPERSEDED
    const archivedPrevSub = await db.medicalHistorySubmission.findUnique({
      where: { id: previousSub!.id },
      include: { reviews: true },
    });
    expect(archivedPrevSub?.status).toBe(IntakeStatus.SUPERSEDED);

    // Historical review sign-off remains intact and auditable
    expect(archivedPrevSub?.reviews.length).toBe(prevReviewCount);
    expect(archivedPrevSub?.reviews[0]?.outcome).toBe(ReviewOutcome.APPROVED);
  });

  it('T12: Management sees safe operational counts but is denied patient clinical questionnaire answers', async () => {
    // 1. Branch Manager queries operational metrics -> SUCCESS (Statistical counts only)
    const metrics = await getOperationalMetrics(null, managerUser);
    expect(metrics.totalPatients).toBeGreaterThanOrEqual(1);
    expect(metrics.pendingIntakesCount).toBeGreaterThanOrEqual(1);
    expect(metrics.branches.length).toBe(3);

    // Verify metrics payload contains ZERO clinical text
    const payloadStr = JSON.stringify(metrics);
    expect(payloadStr).not.toContain('hypertension');
    expect(payloadStr).not.toContain('penicillin');
    expect(payloadStr).not.toContain('clinicalNotes');

    // 2. Branch Manager attempts to query patient clinical questionnaire history directly -> FORBIDDEN (403)
    await expect(getPatientIntakeHistory(patientHassanRecord.id, managerUser)).rejects.toThrow(
      /Access denied: Branch management is not authorized to read patient medical intake questionnaires/
    );
  });

  it('T13: Migration status displays PARTIALLY_DIGITIZED / UNKNOWN without false claims of clean history or EGP 0 balance', async () => {
    const monaRecord = await db.patient.findFirst({
      where: { fullName: 'Mona Shenouda' },
    });
    expect(monaRecord).not.toBeNull();
    expect(monaRecord?.migrationStatus).toBe(MigrationStatus.PARTIALLY_DIGITIZED);
    expect(monaRecord?.legacyBalanceNotes).toContain('unverified outstanding balance');

    const youssefRecord = await db.patient.findFirst({
      where: { fullName: 'Youssef Nabil' },
    });
    expect(youssefRecord).not.toBeNull();
    expect(youssefRecord?.migrationStatus).toBe(MigrationStatus.NOT_DIGITIZED);

    // Assert neither record falsely assumes 0 balance or complete digital history
    expect(monaRecord?.legacyBalanceNotes).not.toBeNull();
    expect(youssefRecord?.migrationStatus).not.toBe(MigrationStatus.FULLY_DIGITIZED);
  });
});
