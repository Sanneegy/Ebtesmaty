import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import db from '../../src/lib/db';
import {
  createEncounter,
  updateEncounterDraft,
  finalizeEncounter,
  addClinicalAddendum,
  getEncounter,
  recordToothFinding,
  getPatientToothChart,
  createTreatmentPlan,
  updateTreatmentPlanStatus,
  markTreatmentItemPerformed,
  recordDocumentMetadata,
  getPatientClinicalSummary,
} from '../../src/services/clinical.service';
import { EncounterStatus, TreatmentPlanStatus, TreatmentItemStatus, FileCategory } from '@prisma/client';

describe('Checkpoint C: Clinical Records, Tooth Chart & Treatment Lifecycle (CL01 - CL10)', () => {
  let dentistUser: any;
  let testPatient: any;
  let branch: any;
  let portalUser: any;
  let testStartTime: Date;

  beforeAll(async () => {
    testStartTime = new Date();
    // Pick existing seeded dentist
    dentistUser = await db.user.findFirst({
      where: { email: 'dr.sandy@ebtesamty.dev' },
    });
    expect(dentistUser).toBeDefined();

    // Pick existing seeded patient
    testPatient = await db.patient.findFirst({
      where: { patientNumber: 'EBT-PAT-2026-0001' },
    });
    expect(testPatient).toBeDefined();

    // Pick branch
    branch = await db.branch.findFirst({
      where: { code: 'BR-A' },
    });
    expect(branch).toBeDefined();

    // Pick patient portal user
    portalUser = await db.user.findFirst({
      where: { email: 'hassan.patient@ebtesamty.dev' },
    });
    expect(portalUser).toBeDefined();
  });

  afterAll(async () => {
    await db.documentMetadata.deleteMany({ where: { createdAt: { gte: testStartTime } } });
    await db.treatmentPlan.deleteMany({ where: { createdAt: { gte: testStartTime } } });
    await db.toothFinding.deleteMany({ where: { recordedAt: { gte: testStartTime } } });
    await db.encounter.deleteMany({ where: { startedAt: { gte: testStartTime } } });
  });

  it('CL01: Can create a clinical encounter draft with initial complaint and exam findings', async () => {
    const encounter = await createEncounter({
      patientId: testPatient.id,
      branchId: branch.id,
      dentistUserId: dentistUser.id,
      chiefComplaint: 'Sharp sensitivity on lower left molar with cold drinks',
      examinationFindings: 'Deep occlusal caries on tooth 36, sensitive to cold exploration',
      provisionalDiagnosis: 'Reversible pulpitis secondary to dental caries #36',
      clinicalNotes: 'Discussed conservative excavation vs endodontic treatment with patient.',
    });

    expect(encounter.id).toBeDefined();
    expect(encounter.status).toBe(EncounterStatus.DRAFT);
    expect(encounter.chiefComplaint).toContain('Sharp sensitivity');
  });

  it('CL02: Can update encounter draft while still in DRAFT status', async () => {
    const encounter = await createEncounter({
      patientId: testPatient.id,
      branchId: branch.id,
      dentistUserId: dentistUser.id,
      chiefComplaint: 'Routine checkup',
      examinationFindings: 'Mild plaque accumulation',
      clinicalNotes: 'Initial notes',
    });

    const updated = await updateEncounterDraft(encounter.id, dentistUser.id, {
      clinicalNotes: 'Updated notes with patient consent for scaler cleaning.',
    });

    expect(updated.clinicalNotes).toContain('Updated notes with patient consent');
  });

  it('CL03: Finalizing an encounter locks the record; direct edits to finalized encounters are rejected', async () => {
    const encounter = await createEncounter({
      patientId: testPatient.id,
      branchId: branch.id,
      dentistUserId: dentistUser.id,
      chiefComplaint: 'Crown evaluation',
      examinationFindings: 'Margins intact',
      clinicalNotes: 'No recurrent decay seen',
    });

    const finalized = await finalizeEncounter(
      encounter.id,
      dentistUser.id,
      'Healthy restoration #11',
      'Discharged with hygiene instructions'
    );

    expect(finalized.status).toBe(EncounterStatus.FINALIZED);
    expect(finalized.finalizedDiagnosis).toBe('Healthy restoration #11');
    expect(finalized.finalizedAt).toBeDefined();

    // Invariant: Trying to edit draft fields of a finalized encounter MUST throw
    await expect(
      updateEncounterDraft(encounter.id, dentistUser.id, {
        clinicalNotes: 'Attempting illegal post-finalization alteration',
      })
    ).rejects.toThrow(/immutable/i);
  });

  it('CL04: Finalized encounters can be legally amended using signed ClinicalNoteAddendum', async () => {
    const encounter = await createEncounter({
      patientId: testPatient.id,
      branchId: branch.id,
      dentistUserId: dentistUser.id,
      chiefComplaint: 'Toothache',
      examinationFindings: 'Exam complete',
      clinicalNotes: 'Notes',
    });

    await finalizeEncounter(encounter.id, dentistUser.id, 'Acute apical periodontitis #46');

    const addendum = await addClinicalAddendum(
      encounter.id,
      dentistUser.id,
      'Addendum: Patient phoned 2 hours post-visit confirming pain reduction after prescribed NSAID.'
    );

    expect(addendum.id).toBeDefined();
    expect(addendum.encounterId).toBe(encounter.id);
    expect(addendum.addendumText).toContain('prescribed NSAID');

    // Verify encounter fetch includes addenda in chronological sequence
    const fetched = await getEncounter(encounter.id);
    expect(fetched?.addenda.length).toBeGreaterThanOrEqual(1);
    expect(fetched?.addenda[0].addendumText).toContain('prescribed NSAID');
  });

  it('CL05: Tooth findings enforce valid FDI notation and build aggregated odontogram chart', async () => {
    // Valid FDI tooth 36 (Lower left first molar)
    const finding36 = await recordToothFinding({
      patientId: testPatient.id,
      toothNumber: '36',
      surface: 'MOD',
      condition: 'CARIES',
      notes: 'Deep dentinal caries',
      dentistUserId: dentistUser.id,
    });
    expect(finding36.toothNumber).toBe('36');

    // Valid FDI tooth 11 (Upper right central incisor)
    const finding11 = await recordToothFinding({
      patientId: testPatient.id,
      toothNumber: '11',
      condition: 'RESTORED',
      notes: 'Zirconia crown placed 2024',
      dentistUserId: dentistUser.id,
    });
    expect(finding11.toothNumber).toBe('11');

    // Invalid tooth number must be rejected
    await expect(
      recordToothFinding({
        patientId: testPatient.id,
        toothNumber: '99',
        condition: 'CARIES',
        dentistUserId: dentistUser.id,
      })
    ).rejects.toThrow(/Invalid tooth identifier/i);

    // Verify chart aggregation
    const chart = await getPatientToothChart(testPatient.id);
    expect(chart['36']).toBeDefined();
    expect(chart['36'].latest.condition).toBe('CARIES');
    expect(chart['11'].latest.condition).toBe('RESTORED');
  });

  it('CL06: Treatment plans correctly aggregate cost totals and track item procedural performance', async () => {
    const plan = await createTreatmentPlan({
      patientId: testPatient.id,
      dentistUserId: dentistUser.id,
      branchId: branch.id,
      title: 'Quadrant 3 Rehabilitation',
      items: [
        {
          procedureName: 'Root Canal Treatment — Molar',
          toothNumber: '36',
          estimatedCostPiasters: 250000, // 2,500 EGP
          sequenceOrder: 1,
        },
        {
          procedureName: 'Post & Core Build-Up',
          toothNumber: '36',
          estimatedCostPiasters: 100000, // 1,000 EGP
          sequenceOrder: 2,
        },
        {
          procedureName: 'Ceramic Crown',
          toothNumber: '36',
          estimatedCostPiasters: 350000, // 3,500 EGP
          sequenceOrder: 3,
        },
      ],
    });

    expect(plan.id).toBeDefined();
    expect(plan.status).toBe(TreatmentPlanStatus.DRAFT);
    // Total should be 250,000 + 100,000 + 350,000 = 700,000 Piasters (7,000 EGP)
    expect(plan.totalEstimatedCostPiasters).toBe(700000);
    expect(plan.items.length).toBe(3);

    // Update status to PROPOSED then ACCEPTED
    const proposed = await updateTreatmentPlanStatus(plan.id, dentistUser.id, TreatmentPlanStatus.PROPOSED);
    expect(proposed.status).toBe(TreatmentPlanStatus.PROPOSED);

    const accepted = await updateTreatmentPlanStatus(plan.id, portalUser.id, TreatmentPlanStatus.ACCEPTED);
    expect(accepted.status).toBe(TreatmentPlanStatus.ACCEPTED);

    // Mark item 1 as performed during an encounter
    const encounter = await createEncounter({
      patientId: testPatient.id,
      branchId: branch.id,
      dentistUserId: dentistUser.id,
      chiefComplaint: 'RCT Step 1',
      examinationFindings: 'Pulp extirpated',
      clinicalNotes: 'Working length determined with apex locator.',
    });

    const item1 = plan.items[0];
    const performed = await markTreatmentItemPerformed(
      item1.id,
      encounter.id,
      dentistUser.id,
      'Canals shaped to F2 Protaper, irrigated with NaOCl.'
    );

    expect(performed.status).toBe(TreatmentItemStatus.PERFORMED);
    expect(performed.performedEncounterId).toBe(encounter.id);
  });

  it('CL07: Diagnostic documents enforce MIME type allowlist and file size constraints', async () => {
    // Valid bitewing / panoramic X-ray
    const doc = await recordDocumentMetadata({
      patientId: testPatient.id,
      branchId: branch.id,
      fileName: 'panoramic_2026.png',
      fileMime: 'image/png',
      fileSizeBytes: 2048000, // 2MB
      fileCategory: FileCategory.XRAY_PANORAMIC,
      storageKey: 'secure/vault/br-a/p1/panoramic_2026.png',
      uploadedByUserId: dentistUser.id,
      notes: 'Initial panoramic radiograph for baseline',
    });

    expect(doc.id).toBeDefined();
    expect(doc.fileCategory).toBe(FileCategory.XRAY_PANORAMIC);

    // Invalid MIME type must be rejected
    await expect(
      recordDocumentMetadata({
        patientId: testPatient.id,
        branchId: branch.id,
        fileName: 'malicious.exe',
        fileMime: 'application/x-msdownload',
        fileSizeBytes: 1024,
        fileCategory: FileCategory.LAB_REPORT,
        storageKey: 'secure/bad/malicious.exe',
        uploadedByUserId: dentistUser.id,
      })
    ).rejects.toThrow(/Unsupported medical file type/i);

    // Exceeding 50MB file size limit must be rejected
    await expect(
      recordDocumentMetadata({
        patientId: testPatient.id,
        branchId: branch.id,
        fileName: 'huge_raw.dicom',
        fileMime: 'application/dicom',
        fileSizeBytes: 60 * 1024 * 1024, // 60MB
        fileCategory: FileCategory.XRAY_PANORAMIC,
        storageKey: 'secure/bad/huge_raw.dicom',
        uploadedByUserId: dentistUser.id,
      })
    ).rejects.toThrow(/File size exceeds/i);
  });

  it('CL08: Clinical patient summary aggregates intake review, encounters, tooth chart, and plans', async () => {
    const summary = await getPatientClinicalSummary(testPatient.id);

    expect(summary.patient).toBeDefined();
    expect(summary.patient.patientNumber).toBe('EBT-PAT-2026-0001');
    expect(Array.isArray(summary.encounters)).toBe(true);
    expect(summary.toothChart).toBeDefined();
    expect(Array.isArray(summary.treatmentPlans)).toBe(true);
    expect(Array.isArray(summary.documents)).toBe(true);
  });
});
