// TypeScript seed definition for Ebtesamty Dental Clinic
import {
  PrismaClient,
  Role,
  UserStatus,
  PatientSource,
  MigrationStatus,
  LinkStatus,
  IntakeStatus,
  IntakeSource,
  ReviewOutcome,
  DuplicateReviewStatus,
  AppointmentStatus,
  DutyStatus,
  EncounterStatus,
  TreatmentPlanStatus,
  TreatmentItemStatus,
  InvoiceStatus,
  PaymentMethod,
  PaymentStatus,
  InstallmentPlanStatus,
  InstallmentStatus,
  EquipmentCategory,
  EquipmentStatus,
  CriticalityLevel,
  AlertType,
  AlertSeverity,
  AlertStatus,
  FeedbackCategory,
  FeedbackStatus,
  ExpenseCategory,
  StockMovementType,
  FollowUpStatus,
  AppointmentRequestStatus,
} from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('CRITICAL SECURITY: Refusing to seed fictional development data into production environment!');
  }

  console.log('Seeding authoritative, non-duplicated Ebtesamty development dataset into PostgreSQL...');

  // 1. Clean ALL existing records in strict child-to-parent dependency order
  await prisma.goodsReceiptLine.deleteMany({});
  await prisma.goodsReceipt.deleteMany({});
  await prisma.purchaseOrderLine.deleteMany({});
  await prisma.purchaseOrder.deleteMany({});
  await prisma.purchaseRequest.deleteMany({});
  await prisma.stockTransfer.deleteMany({});
  await prisma.stockMovement.deleteMany({});
  await prisma.stockLot.deleteMany({});
  await prisma.material.deleteMany({});
  await prisma.supplier.deleteMany({});
  await prisma.maintenanceWorkOrder.deleteMany({});
  await prisma.equipmentFault.deleteMany({});
  await prisma.equipmentAsset.deleteMany({});
  await prisma.installment.deleteMany({});
  await prisma.installmentPlan.deleteMany({});
  await prisma.paymentAllocation.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.invoiceLine.deleteMany({});
  await prisma.invoice.deleteMany({});
  await prisma.serviceCatalogItem.deleteMany({});
  await prisma.cashReconciliation.deleteMany({});
  await prisma.expense.deleteMany({});
  await prisma.documentMetadata.deleteMany({});
  await prisma.treatmentPlanItem.deleteMany({});
  await prisma.treatmentPlan.deleteMany({});
  await prisma.toothFinding.deleteMany({});
  await prisma.clinicalNoteAddendum.deleteMany({});
  await prisma.encounter.deleteMany({});
  await prisma.followUp.deleteMany({});
  await prisma.queueEntry.deleteMany({});
  await prisma.arrivalEvent.deleteMany({});
  await prisma.appointment.deleteMany({});
  await prisma.appointmentRequest.deleteMany({});
  await prisma.coverageException.deleteMany({});
  await prisma.doctorDuty.deleteMany({});
  await prisma.room.deleteMany({});
  await prisma.operationalAlert.deleteMany({});
  await prisma.feedbackCase.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.auditEvent.deleteMany({});
  await prisma.medicalHistoryReview.deleteMany({});
  await prisma.medicalHistorySubmission.deleteMany({});
  await prisma.potentialDuplicateReview.deleteMany({});
  await prisma.patientCareAssignment.deleteMany({});
  await prisma.portalPatientLink.deleteMany({});
  await prisma.patientContact.deleteMany({});
  await prisma.patient.deleteMany({});
  await prisma.staffProfile.deleteMany({});
  await prisma.roleGrant.deleteMany({});
  await prisma.session.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.branch.deleteMany({});

  // 2. Create Canonical Branches (Heliopolis, New Cairo, Maadi)
  const branchA = await prisma.branch.create({
    data: {
      code: 'BR-A',
      name: 'Branch A - Heliopolis',
      phone: '+20 2 2410 0001',
      isActive: true,
    },
  });

  const branchB = await prisma.branch.create({
    data: {
      code: 'BR-B',
      name: 'Branch B - New Cairo',
      phone: '+20 2 2810 0002',
      isActive: true,
    },
  });

  const branchC = await prisma.branch.create({
    data: {
      code: 'BR-C',
      name: 'Branch C - Maadi',
      phone: '+20 2 2510 0003',
      isActive: true,
    },
  });

  console.log('Created branches: Branch A - Heliopolis, Branch B - New Cairo, Branch C - Maadi');

  // Password hash for all dev accounts: "Password123!"
  const passwordHash = await bcrypt.hash('Password123!', 10);

  // 3. Create Staff & Admin Users (Working Model: 2+2+1 Dentists, 1+1+1 Receptionists, plus distinct functional leads)
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@ebtesamty.dev',
      phone: '+201000000001',
      fullName: 'Dr. Tarek El-Gendy',
      passwordHash,
      status: UserStatus.ACTIVE,
      roleGrants: {
        create: { role: Role.OWNER_ADMIN, branchId: null },
      },
      staffProfile: {
        create: { title: 'OWNER / EXECUTIVE', active: true },
      },
    },
  });

  await prisma.user.create({
    data: {
      email: 'finance@ebtesamty.dev',
      phone: '+201000000011',
      fullName: 'Nadia Mansour',
      passwordHash,
      status: UserStatus.ACTIVE,
      roleGrants: {
        create: { role: Role.OWNER_ADMIN, branchId: null },
      },
      staffProfile: {
        create: { title: 'FINANCE / ACCOUNTANT', active: true },
      },
    },
  });

  await prisma.user.create({
    data: {
      email: 'inventory@ebtesamty.dev',
      phone: '+201000000012',
      fullName: 'Khaled Soliman',
      passwordHash,
      status: UserStatus.ACTIVE,
      roleGrants: {
        create: { role: Role.OWNER_ADMIN, branchId: null },
      },
      staffProfile: {
        create: { title: 'INVENTORY & PROCUREMENT', active: true },
      },
    },
  });

  await prisma.user.create({
    data: {
      email: 'crm@ebtesamty.dev',
      phone: '+201000000013',
      fullName: 'Heba Zaki',
      passwordHash,
      status: UserStatus.ACTIVE,
      roleGrants: {
        create: { role: Role.OWNER_ADMIN, branchId: null },
      },
      staffProfile: {
        create: { title: 'MARKETING & CRM', active: true },
      },
    },
  });

  await prisma.user.create({
    data: {
      email: 'sysadmin@ebtesamty.dev',
      phone: '+201000000014',
      fullName: 'Eng. Karim Zaki',
      passwordHash,
      status: UserStatus.ACTIVE,
      roleGrants: {
        create: { role: Role.OWNER_ADMIN, branchId: null },
      },
      staffProfile: {
        create: { title: 'SUPER ADMIN', active: true },
      },
    },
  });

  const managerA = await prisma.user.create({
    data: {
      email: 'manager.b1@ebtesamty.dev',
      phone: '+201000000002',
      fullName: 'Amr Fouad',
      passwordHash,
      status: UserStatus.ACTIVE,
      roleGrants: {
        create: { role: Role.BRANCH_MANAGER, branchId: branchA.id },
      },
      staffProfile: {
        create: { title: 'OPERATIONS & FINANCE', active: true },
      },
    },
  });

  // 3 Receptionists (1 per branch)
  const receptionA = await prisma.user.create({
    data: {
      email: 'mariam.reception@ebtesamty.dev',
      phone: '+201000000003',
      fullName: 'Mariam Hanna',
      passwordHash,
      status: UserStatus.ACTIVE,
      roleGrants: {
        create: { role: Role.RECEPTIONIST, branchId: branchA.id },
      },
      staffProfile: {
        create: { title: 'Senior Receptionist — Branch A', active: true },
      },
    },
  });

  const receptionB = await prisma.user.create({
    data: {
      email: 'sandy.reception@ebtesamty.dev',
      phone: '+201000000004',
      fullName: 'Sandy Abd',
      passwordHash,
      status: UserStatus.ACTIVE,
      roleGrants: {
        create: { role: Role.RECEPTIONIST, branchId: branchB.id },
      },
      staffProfile: {
        create: { title: 'Receptionist — Branch B', active: true },
      },
    },
  });

  const receptionC = await prisma.user.create({
    data: {
      email: 'salma.reception@ebtesamty.dev',
      phone: '+201000000008',
      fullName: 'Salma Adel',
      passwordHash,
      status: UserStatus.ACTIVE,
      roleGrants: {
        create: { role: Role.RECEPTIONIST, branchId: branchC.id },
      },
      staffProfile: {
        create: { title: 'Receptionist — Branch C', active: true },
      },
    },
  });

  // 5 Dentists: Branch A (2), Branch B (2), Branch C (1)
  const dentistSandy = await prisma.user.create({
    data: {
      email: 'dr.sandy@ebtesamty.dev',
      phone: '+201000000005',
      fullName: 'Dr. Sandy Saad',
      passwordHash,
      status: UserStatus.ACTIVE,
      roleGrants: {
        create: { role: Role.DENTIST, branchId: branchA.id },
      },
      staffProfile: {
        create: {
          title: 'Lead Restorative & Cosmetic Dentist',
          licenseNumber: 'EGY-DEN-44912',
          specialty: 'Restorative & Cosmetic Dentistry',
          active: true,
        },
      },
    },
  });

  const dentistFeby = await prisma.user.create({
    data: {
      email: 'dr.feby@ebtesamty.dev',
      phone: '+201000000006',
      fullName: 'Dr. Feby Samer',
      passwordHash,
      status: UserStatus.ACTIVE,
      roleGrants: {
        create: { role: Role.DENTIST, branchId: branchA.id },
      },
      staffProfile: {
        create: {
          title: 'Endodontics Specialist',
          licenseNumber: 'EGY-DEN-51209',
          specialty: 'Endodontics',
          active: true,
        },
      },
    },
  });

  const dentistAhmed = await prisma.user.create({
    data: {
      email: 'dr.ahmed@ebtesamty.dev',
      phone: '+201000000007',
      fullName: 'Dr. Ahmed Hassan',
      passwordHash,
      status: UserStatus.ACTIVE,
      roleGrants: {
        create: { role: Role.DENTIST, branchId: branchB.id },
      },
      staffProfile: {
        create: {
          title: 'Oral Surgery & Implantologist',
          licenseNumber: 'EGY-DEN-38290',
          specialty: 'Dental Implants & Oral Surgery',
          active: true,
        },
      },
    },
  });

  const dentistYoussef = await prisma.user.create({
    data: {
      email: 'dr.youssef@ebtesamty.dev',
      phone: '+201000000009',
      fullName: 'Dr. Youssef El-Mansy',
      passwordHash,
      status: UserStatus.ACTIVE,
      roleGrants: {
        create: { role: Role.DENTIST, branchId: branchB.id },
      },
      staffProfile: {
        create: {
          title: 'Orthodontist & Clear Aligner Specialist',
          licenseNumber: 'EGY-DEN-49821',
          specialty: 'Orthodontics & Clear Aligners',
          active: true,
        },
      },
    },
  });

  const dentistNadia = await prisma.user.create({
    data: {
      email: 'dr.nadia@ebtesamty.dev',
      phone: '+201000000010',
      fullName: 'Dr. Nadia El-Hariry',
      passwordHash,
      status: UserStatus.ACTIVE,
      roleGrants: {
        create: { role: Role.DENTIST, branchId: branchC.id },
      },
      staffProfile: {
        create: {
          title: 'Family, Preventive & Pediatric Dentist',
          licenseNumber: 'EGY-DEN-53110',
          specialty: 'Family & Pediatric Dentistry',
          active: true,
        },
      },
    },
  });

  // 4. Create Portal Patients (User accounts)
  const patientHassanUser = await prisma.user.create({
    data: {
      email: 'hassan.patient@ebtesamty.dev',
      phone: '+201001234567',
      fullName: 'Hassan El-Sayed',
      passwordHash,
      status: UserStatus.ACTIVE,
      roleGrants: {
        create: { role: Role.PATIENT, branchId: null },
      },
    },
  });

  const patientNourUser = await prisma.user.create({
    data: {
      email: 'nour.patient@ebtesamty.dev',
      phone: '+201009876543',
      fullName: 'Nour Mansour',
      passwordHash,
      status: UserStatus.ACTIVE,
      roleGrants: {
        create: { role: Role.PATIENT, branchId: null },
      },
    },
  });

  const patientLaylaUser = await prisma.user.create({
    data: {
      email: 'layla.patient@ebtesamty.dev',
      phone: '+201005556677',
      fullName: 'Layla Mahmoud',
      passwordHash,
      status: UserStatus.ACTIVE,
      roleGrants: {
        create: { role: Role.PATIENT, branchId: null },
      },
    },
  });

  // 5. Create Fictional Clinical Patients (7 distinct records)
  const patient1 = await prisma.patient.create({
    data: {
      patientNumber: 'EBT-PAT-2026-0001',
      fullName: 'Hassan El-Sayed',
      dateOfBirth: new Date('1990-05-14'),
      gender: 'MALE',
      primaryPhone: '+201001234567',
      nationalIdOrPassport: '29005140102345',
      address: '15 El-Horreya St, Heliopolis, Cairo',
      emergencyContactName: 'Mona El-Sayed',
      emergencyContactPhone: '+201007654321',
      source: PatientSource.CLINIC_ENTRY,
      migrationStatus: MigrationStatus.FULLY_DIGITIZED,
      primaryBranchId: branchA.id,
      contacts: {
        create: [
          { contactType: 'PHONE', value: '+201001234567', isPrimary: true, isVerified: true },
          { contactType: 'EMAIL', value: 'hassan.patient@ebtesamty.dev', isPrimary: false, isVerified: true },
        ],
      },
    },
  });

  await prisma.portalPatientLink.create({
    data: {
      userId: patientHassanUser.id,
      patientId: patient1.id,
      status: LinkStatus.APPROVED,
      verifiedByUserId: receptionA.id,
      verifiedAt: new Date('2026-09-01T10:00:00Z'),
      verificationNotes: 'National ID physically verified by receptionist Mariam at Branch A front desk.',
    },
  });

  await prisma.patientCareAssignment.create({
    data: {
      patientId: patient1.id,
      dentistUserId: dentistSandy.id,
      branchId: branchA.id,
      assignedByUserId: receptionA.id,
      active: true,
    },
  });

  const v1Intake = await prisma.medicalHistorySubmission.create({
    data: {
      patientId: patient1.id,
      versionNumber: 1,
      status: IntakeStatus.SUPERSEDED,
      submissionSource: IntakeSource.PATIENT_PORTAL,
      submittedByUserId: patientHassanUser.id,
      submittedAt: new Date('2026-09-02T11:00:00Z'),
      answersJson: {
        conditions: {
          hypertension: { value: 'NO' },
          diabetes: { value: 'NO' },
          bleedingDisorder: { value: 'NO' },
          heartDisease: { value: 'NO' },
        },
        allergies: {
          penicillin: { value: 'YES', reaction: 'Mild skin rash' },
          latex: { value: 'NO' },
          localAnesthetics: { value: 'UNKNOWN', notes: 'Never received dental anesthesia previously' },
        },
        medications: {
          bloodThinners: { value: 'NO' },
          currentMedsList: 'Multivitamins once daily',
        },
        dental: {
          chiefComplaint: 'Routine checkup and occasional molar sensitivity',
          dentalAnxiety: 'MILD',
        },
      },
    },
  });

  await prisma.medicalHistoryReview.create({
    data: {
      submissionId: v1Intake.id,
      dentistUserId: dentistSandy.id,
      outcome: ReviewOutcome.APPROVED,
      clinicalNotes: 'Verified penicillin allergy noted. Avoid amoxicillin/augmentin; use clindamycin if antibiotics required. Cleared for examination.',
      reviewedAt: new Date('2026-09-02T14:30:00Z'),
    },
  });

  await prisma.medicalHistorySubmission.create({
    data: {
      patientId: patient1.id,
      versionNumber: 2,
      status: IntakeStatus.PENDING_REVIEW,
      submissionSource: IntakeSource.PATIENT_PORTAL,
      submittedByUserId: patientHassanUser.id,
      submittedAt: new Date('2026-10-10T09:15:00Z'),
      answersJson: {
        conditions: {
          hypertension: { value: 'YES', notes: 'Diagnosed last month, controlled with Concor 5mg' },
          diabetes: { value: 'NO' },
          bleedingDisorder: { value: 'NO' },
          heartDisease: { value: 'NO' },
        },
        allergies: {
          penicillin: { value: 'YES', reaction: 'Mild skin rash' },
          latex: { value: 'NO' },
          localAnesthetics: { value: 'UNKNOWN', notes: 'Never received dental anesthesia' },
        },
        medications: {
          bloodThinners: { value: 'NO' },
          currentMedsList: 'Concor 5mg, Multivitamins',
        },
        dental: {
          chiefComplaint: 'Sharp pain in lower right tooth when chewing',
          dentalAnxiety: 'MILD',
        },
      },
    },
  });

  const patient2 = await prisma.patient.create({
    data: {
      patientNumber: 'EBT-PAT-2026-0002',
      fullName: 'Tarek El-Sayed',
      dateOfBirth: new Date('1994-11-20'),
      gender: 'MALE',
      primaryPhone: '+201001234567',
      nationalIdOrPassport: '29411200109988',
      address: '15 El-Horreya St, Heliopolis, Cairo',
      emergencyContactName: 'Hassan El-Sayed',
      emergencyContactPhone: '+201001234567',
      source: PatientSource.CLINIC_ENTRY,
      migrationStatus: MigrationStatus.FULLY_DIGITIZED,
      primaryBranchId: branchA.id,
    },
  });

  const patient3 = await prisma.patient.create({
    data: {
      patientNumber: 'EBT-PAT-2026-0003',
      fullName: 'Omar Farouk',
      dateOfBirth: new Date('1985-08-03'),
      gender: 'MALE',
      primaryPhone: '+201112223344',
      nationalIdOrPassport: '28508030101122',
      address: '42 Abbas El-Akkad, Nasr City, Cairo',
      source: PatientSource.CLINIC_ENTRY,
      migrationStatus: MigrationStatus.FULLY_DIGITIZED,
      primaryBranchId: branchA.id,
    },
  });

  await prisma.patientCareAssignment.create({
    data: {
      patientId: patient3.id,
      dentistUserId: dentistSandy.id,
      branchId: branchA.id,
      assignedByUserId: receptionA.id,
      active: true,
    },
  });

  await prisma.medicalHistorySubmission.create({
    data: {
      patientId: patient3.id,
      versionNumber: 1,
      status: IntakeStatus.PENDING_REVIEW,
      submissionSource: IntakeSource.PATIENT_ASSISTED_BY_RECEPTION,
      submittedByUserId: receptionA.id,
      submittedAt: new Date('2026-10-12T16:00:00Z'),
      answersJson: {
        conditions: {
          hypertension: { value: 'NO' },
          diabetes: { value: 'YES', notes: 'Type 2 Diabetes, Metformin 500mg' },
          bleedingDisorder: { value: 'NO' },
          heartDisease: { value: 'NO' },
        },
        allergies: {
          penicillin: { value: 'NO' },
          latex: { value: 'NO' },
          localAnesthetics: { value: 'NO' },
        },
        medications: {
          bloodThinners: { value: 'NO' },
          currentMedsList: 'Metformin 500mg BID',
        },
        dental: {
          chiefComplaint: 'Bleeding gums when brushing',
          dentalAnxiety: 'NONE',
        },
      },
    },
  });

  const patient4 = await prisma.patient.create({
    data: {
      patientNumber: 'EBT-PAT-2026-0004',
      fullName: 'Mona Shenouda',
      dateOfBirth: new Date('1978-02-18'),
      gender: 'FEMALE',
      primaryPhone: '+201009876543',
      nationalIdOrPassport: '27802180104455',
      address: 'Sector 1, New Cairo',
      source: PatientSource.MIGRATED_LEGACY,
      migrationStatus: MigrationStatus.PARTIALLY_DIGITIZED,
      legacyBalanceNotes: 'Historical paper notebook records indicate an unverified outstanding balance of EGP 1,200 from 2024. Clinical allergies not yet digitized.',
      primaryBranchId: branchB.id,
    },
  });

  await prisma.portalPatientLink.create({
    data: {
      userId: patientNourUser.id,
      patientId: patient4.id,
      status: LinkStatus.PENDING,
      requestedAt: new Date('2026-10-15T14:20:00Z'),
    },
  });

  const patient5 = await prisma.patient.create({
    data: {
      patientNumber: 'EBT-PAT-2026-0005',
      fullName: 'Youssef Nabil',
      dateOfBirth: new Date('2000-12-01'),
      gender: 'MALE',
      primaryPhone: '+201223344556',
      source: PatientSource.MIGRATED_LEGACY,
      migrationStatus: MigrationStatus.NOT_DIGITIZED,
      legacyBalanceNotes: 'Paper folder at Branch B shelf 3. Full clinical & payment history unverified.',
      primaryBranchId: branchB.id,
    },
  });

  const patient6 = await prisma.patient.create({
    data: {
      patientNumber: 'EBT-PAT-2026-0006',
      fullName: 'Hassan A. El-Sayed',
      dateOfBirth: new Date('1989-09-19'),
      gender: 'MALE',
      primaryPhone: '+201001234568',
      source: PatientSource.CLINIC_ENTRY,
      migrationStatus: MigrationStatus.FULLY_DIGITIZED,
      primaryBranchId: branchA.id,
    },
  });

  const [pair1A, pair1B] = [patient1.id, patient2.id].sort();
  await prisma.potentialDuplicateReview.create({
    data: {
      patientAId: pair1A,
      patientBId: pair1B,
      matchType: 'SAME_PHONE',
      status: DuplicateReviewStatus.PENDING,
    },
  });

  const [pair2A, pair2B] = [patient1.id, patient6.id].sort();
  await prisma.potentialDuplicateReview.create({
    data: {
      patientAId: pair2A,
      patientBId: pair2B,
      matchType: 'SIMILAR_NAME_PHONE',
      status: DuplicateReviewStatus.PENDING,
    },
  });

  const patient7 = await prisma.patient.create({
    data: {
      patientNumber: 'EBT-PAT-2026-0007',
      fullName: 'Layla Mahmoud',
      dateOfBirth: new Date('1996-07-22'),
      gender: 'FEMALE',
      primaryPhone: '+201005556677',
      source: PatientSource.ONLINE_SELF_REG,
      migrationStatus: MigrationStatus.FULLY_DIGITIZED,
      primaryBranchId: branchC.id,
    },
  });

  await prisma.portalPatientLink.create({
    data: {
      userId: patientLaylaUser.id,
      patientId: patient7.id,
      status: LinkStatus.APPROVED,
      verifiedByUserId: adminUser.id,
      verifiedAt: new Date('2026-10-14T09:00:00Z'),
      verificationNotes: 'Self-registered and identity confirmed during initial phone onboarding.',
    },
  });

  await prisma.medicalHistorySubmission.create({
    data: {
      patientId: patient7.id,
      versionNumber: 1,
      status: IntakeStatus.DRAFT,
      submissionSource: IntakeSource.PATIENT_PORTAL,
      submittedByUserId: patientLaylaUser.id,
      answersJson: {
        conditions: {
          hypertension: { value: 'NO' },
          diabetes: { value: 'NO' },
        },
        allergies: {
          penicillin: { value: 'UNKNOWN', notes: 'Never tested' },
        },
        dental: {
          chiefComplaint: 'Tooth whitening consultation',
        },
      },
    },
  });

  // 6. Seed DoctorDuty Shifts Across Next 14 Days for All 5 Dentists (Branches A, B, C)
  const dutyRecords: Array<{
    dentistUserId: string;
    branchId: string;
    dutyDate: Date;
    startTime: string;
    endTime: string;
    status: DutyStatus;
  }> = [];

  for (let offset = 0; offset <= 14; offset++) {
    const d = new Date(Date.now() + 86400000 * offset);
    d.setHours(10, 0, 0, 0);
    // Skip Fridays (day 5) except when offset is 3 or 10 (used for Hassan's seeded appointments)
    if (d.getDay() === 5 && offset !== 3 && offset !== 10) continue;

    dutyRecords.push(
      {
        dentistUserId: dentistSandy.id,
        branchId: branchA.id,
        dutyDate: new Date(d),
        startTime: '09:00',
        endTime: '17:00',
        status: DutyStatus.CONFIRMED,
      },
      {
        dentistUserId: dentistFeby.id,
        branchId: branchA.id,
        dutyDate: new Date(d),
        startTime: '12:00',
        endTime: '20:00',
        status: DutyStatus.CONFIRMED,
      },
      {
        dentistUserId: dentistAhmed.id,
        branchId: branchB.id,
        dutyDate: new Date(d),
        startTime: '10:00',
        endTime: '18:00',
        status: DutyStatus.CONFIRMED,
      },
      {
        dentistUserId: dentistYoussef.id,
        branchId: branchB.id,
        dutyDate: new Date(d),
        startTime: '13:00',
        endTime: '21:00',
        status: DutyStatus.CONFIRMED,
      },
      {
        dentistUserId: dentistNadia.id,
        branchId: branchC.id,
        dutyDate: new Date(d),
        startTime: '11:00',
        endTime: '19:00',
        status: DutyStatus.CONFIRMED,
      }
    );
  }

  await prisma.doctorDuty.createMany({ data: dutyRecords });

  const visit1Date = new Date(Date.now() + 86400000 * 3);
  visit1Date.setHours(10, 0, 0, 0);
  const visit2Date = new Date(Date.now() + 86400000 * 10);
  visit2Date.setHours(10, 0, 0, 0);

  // 2 upcoming confirmed appointments for Hassan
  await prisma.appointment.create({
    data: {
      patientId: patient1.id,
      branchId: branchA.id,
      dentistUserId: dentistSandy.id,
      appointmentDate: visit1Date,
      startTime: '11:00',
      endTime: '11:45',
      durationMinutes: 45,
      serviceDescription: 'Endodontic Follow-Up & Post-Core Assessment (#36)',
      status: AppointmentStatus.CONFIRMED,
    },
  });

  await prisma.appointment.create({
    data: {
      patientId: patient1.id,
      branchId: branchA.id,
      dentistUserId: dentistSandy.id,
      appointmentDate: visit2Date,
      startTime: '14:00',
      endTime: '15:00',
      durationMinutes: 60,
      serviceDescription: 'Digital Crown Impression & Shade Matching (#36)',
      status: AppointmentStatus.CONFIRMED,
    },
  });

  // 1 Follow-Up Recall Task for CRM & Retention demonstration
  await prisma.followUp.create({
    data: {
      patientId: patient1.id,
      branchId: branchA.id,
      dentistUserId: dentistSandy.id,
      recommendedDate: visit2Date,
      procedureType: 'Zirconia Crown Cementation & Bite Check (#36)',
      notes: 'Confirm lab delivery of #36 zirconia crown prior to patient arrival.',
    },
  });

  // 1 Finalized Encounter & Tooth Findings for Hassan (#36 & #11)
  const initialEncounter = await prisma.encounter.create({
    data: {
      patientId: patient1.id,
      branchId: branchA.id,
      dentistUserId: dentistSandy.id,
      chiefComplaint: 'Sharp sensitivity in lower left first molar (#36)',
      examinationFindings: 'Deep occlusal caries extending to pulp chamber on #36; existing intact zirconia crown on #11.',
      provisionalDiagnosis: 'Symptomatic irreversible pulpitis #36',
      finalizedDiagnosis: 'Symptomatic irreversible pulpitis #36 — Root Canal Therapy Completed',
      clinicalNotes: 'Completed rotary endodontic instrumentation and obturation on tooth #36 under rubber dam isolation.',
      status: EncounterStatus.FINALIZED,
      finalizedAt: new Date('2026-10-12T13:00:00Z'),
    },
  });

  await prisma.toothFinding.createMany({
    data: [
      {
        patientId: patient1.id,
        encounterId: initialEncounter.id,
        toothNumber: '36',
        surface: 'MOD',
        condition: 'CARIES',
        notes: 'Deep dentinal caries treated with rotary endodontics; awaiting post & crown.',
        recordedByUserId: dentistSandy.id,
      },
      {
        patientId: patient1.id,
        encounterId: initialEncounter.id,
        toothNumber: '11',
        condition: 'RESTORED',
        notes: 'Intact layered zirconia crown placed in 2024.',
        recordedByUserId: dentistSandy.id,
      },
    ],
  });

  await prisma.treatmentPlan.create({
    data: {
      patientId: patient1.id,
      dentistUserId: dentistSandy.id,
      branchId: branchA.id,
      title: 'Quadrant 3 Rehabilitation',
      status: TreatmentPlanStatus.ACCEPTED,
      totalEstimatedCostPiasters: 700000,
      notes: 'Phased molar rehabilitation: Phase 1 endodontics completed; Phase 2 post & core + crown planned.',
      items: {
        create: [
          {
            sequenceOrder: 1,
            procedureName: 'Root Canal Treatment — Molar',
            toothNumber: '36',
            estimatedCostPiasters: 250000,
            status: TreatmentItemStatus.PERFORMED,
            performedEncounterId: initialEncounter.id,
            performedAt: new Date('2026-10-12T12:45:00Z'),
            notes: 'Completed under magnification.',
          },
          {
            sequenceOrder: 2,
            procedureName: 'Post & Core Build-Up',
            toothNumber: '36',
            estimatedCostPiasters: 100000,
            status: TreatmentItemStatus.PLANNED,
          },
          {
            sequenceOrder: 3,
            procedureName: 'Ceramic Crown',
            toothNumber: '36',
            estimatedCostPiasters: 350000,
            status: TreatmentItemStatus.PLANNED,
          },
        ],
      },
    },
  });

  // Service Catalog Items
  const srvCons = await prisma.serviceCatalogItem.create({
    data: {
      code: 'SRV-CONS-01',
      nameEn: 'Comprehensive Dental Examination & Digital Charting',
      nameAr: 'فحص شامل للأسنان وتخطيط رقمي',
      category: 'DIAGNOSTIC',
      basePricePiasters: 30000,
    },
  });
  await prisma.serviceCatalogItem.createMany({
    data: [
      {
        code: 'SRV-HYG-01',
        nameEn: 'Ultrasonic Scaling & Polishing',
        nameAr: 'تنظيف الجير بالموجات فوق الصوتية وتلميع الأسنان',
        category: 'HYGIENE',
        basePricePiasters: 80000,
      },
      {
        code: 'SRV-REST-01',
        nameEn: 'Nano-Hybrid Composite Restoration (2 Surfaces)',
        nameAr: 'حشو تجميلي كومبوزيت (سطحين)',
        category: 'RESTORATIVE',
        basePricePiasters: 120000,
      },
      {
        code: 'SRV-ENDO-01',
        nameEn: 'Rotary Root Canal Therapy — Molar',
        nameAr: 'علاج جذور الأسنان بالروتاري — ضرس خلفي',
        category: 'ENDODONTICS',
        basePricePiasters: 250000,
      },
      {
        code: 'SRV-PROS-01',
        nameEn: 'Full-Contour Zirconia Crown',
        nameAr: 'طربوش زيركونيا كامل للأسنان',
        category: 'PROSTHODONTICS',
        basePricePiasters: 350000,
      },
    ],
  });

  // ONE Invoice for Hassan: 3,000 EGP invoiced, 1,500 EGP paid, 1,500 EGP verified balance due
  const hassanInvoice = await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-2026-0001',
      patientId: patient1.id,
      branchId: branchA.id,
      encounterId: initialEncounter.id,
      status: InvoiceStatus.PARTIALLY_PAID,
      totalAmountPiasters: 300000,
      paidAmountPiasters: 150000,
      issuedByUserId: receptionA.id,
      notes: 'Phase 1 Diagnostic Consultation & Molar Root Canal Therapy (#36)',
      lines: {
        create: [
          {
            serviceItemId: srvCons.id,
            description: 'Comprehensive Consultation & Periapical X-Ray',
            unitPricePiasters: 50000,
            quantity: 1,
            lineTotalPiasters: 50000,
          },
          {
            description: 'Rotary Root Canal Therapy — Molar (#36)',
            toothNumber: '36',
            unitPricePiasters: 250000,
            quantity: 1,
            lineTotalPiasters: 250000,
          },
        ],
      },
    },
  });

  const hassanPayment = await prisma.payment.create({
    data: {
      receiptNumber: 'RCP-2026-0001',
      patientId: patient1.id,
      collectionBranchId: branchA.id,
      amountPiasters: 150000,
      paymentMethod: PaymentMethod.INSTAPAY,
      idempotencyKey: 'seed-rcp-2026-0001',
      status: PaymentStatus.POSTED,
      collectedByUserId: receptionA.id,
      notes: '50% downpayment settled via InstaPay at reception desk.',
    },
  });

  await prisma.paymentAllocation.create({
    data: {
      paymentId: hassanPayment.id,
      invoiceId: hassanInvoice.id,
      allocatedAmountPiasters: 150000,
    },
  });

  const due1 = new Date(Date.now() + 86400000 * 14);
  const due2 = new Date(Date.now() + 86400000 * 44);
  const due3 = new Date(Date.now() + 86400000 * 74);

  await prisma.installmentPlan.create({
    data: {
      patientId: patient1.id,
      invoiceId: hassanInvoice.id,
      totalInstallments: 3,
      totalAmountPiasters: 150000,
      status: InstallmentPlanStatus.ACTIVE,
      installments: {
        create: [
          {
            installmentNumber: 1,
            dueDate: due1,
            amountPiasters: 50000,
            status: InstallmentStatus.PENDING,
          },
          {
            installmentNumber: 2,
            dueDate: due2,
            amountPiasters: 50000,
            status: InstallmentStatus.PENDING,
          },
          {
            installmentNumber: 3,
            dueDate: due3,
            amountPiasters: 50000,
            status: InstallmentStatus.PENDING,
          },
        ],
      },
    },
  });

  // 7. Seed Inventory Catalog, Stock Lots & Suppliers
  const matComp = await prisma.material.create({
    data: {
      sku: 'MAT-COMP-A2',
      nameEn: 'Filtek Z350 XT Composite Syringe (Shade A2)',
      nameAr: 'سرنجة حشو كومبوزيت فيلتك Z350 (درجة A2)',
      category: 'COMPOSITES',
      unit: 'SYRINGE',
      unitCostPiasters: 125000,
      reorderPoint: 10,
    },
  });
  const matAnest = await prisma.material.create({
    data: {
      sku: 'MAT-ANEST-01',
      nameEn: 'Articaine 4% with Epinephrine 1:100,000 (Box of 50)',
      nameAr: 'بنج أرتيكايين ٤٪ مع أدرينالين (علبة ٥٠ أمبول)',
      category: 'ANESTHETICS',
      unit: 'BOX',
      unitCostPiasters: 95000,
      reorderPoint: 10,
    },
  });
  const matImp = await prisma.material.create({
    data: {
      sku: 'MAT-IMP-01',
      nameEn: 'Straumann Bone Level Tapered Implant 4.1x10mm',
      nameAr: 'غرسة زراعة سترومان التيتانيوم 4.1x10 مم',
      category: 'IMPLANTS',
      unit: 'UNIT',
      unitCostPiasters: 450000,
      reorderPoint: 5,
    },
  });
  const matGloves = await prisma.material.create({
    data: {
      sku: 'MAT-HYG-01',
      nameEn: 'Nitrile Examination Gloves Powder-Free (Box of 100)',
      nameAr: 'قفازات فحص نيتريل بدون بودرة (علبة ١٠٠)',
      category: 'HYGIENE',
      unit: 'BOX',
      unitCostPiasters: 22000,
      reorderPoint: 15,
    },
  });
  const matEndo = await prisma.material.create({
    data: {
      sku: 'MAT-ENDO-01',
      nameEn: 'ProTaper Gold Rotary Files Assorted Pack (SX-F3)',
      nameAr: 'طقم مبارد روتاري علاج جذور بروتيبر جولد',
      category: 'ENDODONTICS',
      unit: 'PACK',
      unitCostPiasters: 85000,
      reorderPoint: 8,
    },
  });

  await prisma.stockLot.createMany({
    data: [
      {
        materialId: matComp.id,
        branchId: branchA.id,
        lotNumber: 'LOT-Z350-2026A',
        expiryDate: new Date('2028-06-30'),
        quantityOnHand: 24,
      },
      {
        materialId: matAnest.id,
        branchId: branchA.id,
        lotNumber: 'LOT-ART-2026A',
        expiryDate: new Date('2027-12-31'),
        quantityOnHand: 18,
      },
      {
        materialId: matImp.id,
        branchId: branchA.id,
        lotNumber: 'LOT-STR-2026A',
        expiryDate: new Date('2029-12-31'),
        quantityOnHand: 12,
      },
      {
        materialId: matGloves.id,
        branchId: branchA.id,
        lotNumber: 'LOT-GLV-2026A',
        expiryDate: new Date('2028-10-31'),
        quantityOnHand: 40,
      },
      {
        materialId: matEndo.id,
        branchId: branchA.id,
        lotNumber: 'LOT-PTG-2026A',
        expiryDate: new Date('2028-09-30'),
        quantityOnHand: 5,
      },
      {
        materialId: matComp.id,
        branchId: branchB.id,
        lotNumber: 'LOT-Z350-2026B',
        expiryDate: new Date('2028-06-30'),
        quantityOnHand: 16,
      },
      {
        materialId: matComp.id,
        branchId: branchC.id,
        lotNumber: 'LOT-Z350-2026C',
        expiryDate: new Date('2028-06-30'),
        quantityOnHand: 12,
      },
    ],
  });

  await prisma.supplier.createMany({
    data: [
      {
        name: 'Cairo Medical & Dental Supplies Co.',
        contactPerson: 'Eng. Tarek Mansour',
        phone: '+20 2 2391 8844',
        email: 'orders@cairodentalsupplies.eg',
        address: '14 Kasr El-Ainy St, Downtown Cairo',
      },
      {
        name: 'Nile Valley Implant & Biomaterials Distribution',
        contactPerson: 'Dr. Sherif Hafez',
        phone: '+20 2 2418 9920',
        email: 'procurement@nileimplant.eg',
        address: '82 Merghany St, Heliopolis, Cairo',
      },
    ],
  });

  // 8. Seed Equipment Assets
  await prisma.equipmentAsset.createMany({
    data: [
      {
        branchId: branchA.id,
        name: 'A-dec 500 Dental Chair Operatory 1',
        serialNumber: 'SN-ADEC-500-01',
        model: 'A-dec 500 Premium',
        category: EquipmentCategory.DENTAL_CHAIR,
        status: EquipmentStatus.OPERATIONAL,
        criticality: CriticalityLevel.HIGH,
        lastServiceDate: new Date('2026-08-15'),
        nextServiceDue: new Date('2027-02-15'),
      },
      {
        branchId: branchA.id,
        name: 'Melag Vacuklav 40B+ Autoclave Sterilizer',
        serialNumber: 'SN-MELAG-40B-01',
        model: 'Vacuklav 40B+',
        category: EquipmentCategory.AUTOCLAVE,
        status: EquipmentStatus.OPERATIONAL,
        criticality: CriticalityLevel.HIGH,
        lastServiceDate: new Date('2026-09-01'),
        nextServiceDue: new Date('2026-12-01'),
      },
      {
        branchId: branchB.id,
        name: 'Carestream CS 8100 3D Extraoral CBCT / Panoramic',
        serialNumber: 'SN-CS-8100-01',
        model: 'CS 8100 3D',
        category: EquipmentCategory.XRAY_UNIT,
        status: EquipmentStatus.OPERATIONAL,
        criticality: CriticalityLevel.HIGH,
        lastServiceDate: new Date('2026-07-20'),
        nextServiceDue: new Date('2027-01-20'),
      },
      {
        branchId: branchC.id,
        name: 'Planmeca Compact i5 Dental Unit — Maadi Operatory 1',
        serialNumber: 'SN-PLAN-I5-MAADI',
        model: 'Planmeca Compact i5',
        category: EquipmentCategory.DENTAL_CHAIR,
        status: EquipmentStatus.OPERATIONAL,
        criticality: CriticalityLevel.HIGH,
        lastServiceDate: new Date('2026-09-10'),
        nextServiceDue: new Date('2027-03-10'),
      },
    ],
  });

  // 9. Seed Multi-Branch Completed Appointments, Booking Requests, Financials, Inventory Movements & CRM Pipeline
  const past3Days = new Date(Date.now() - 86400000 * 3);
  past3Days.setHours(10, 0, 0, 0);
  const past7Days = new Date(Date.now() - 86400000 * 7);
  past7Days.setHours(10, 0, 0, 0);
  const past14Days = new Date(Date.now() - 86400000 * 14);
  past14Days.setHours(10, 0, 0, 0);
  const past35Days = new Date(Date.now() - 86400000 * 35);
  past35Days.setHours(10, 0, 0, 0);
  const past65Days = new Date(Date.now() - 86400000 * 65);
  past65Days.setHours(10, 0, 0, 0);

  // Online Booking Requests across BR-A, BR-B, BR-C for CRM Conversion Funnel
  await prisma.appointmentRequest.createMany({
    data: [
      {
        patientId: patient1.id,
        branchId: branchA.id,
        dentistPreferenceId: dentistSandy.id,
        serviceName: 'Endodontic Follow-Up & Post-Core Assessment (#36)',
        preferredDate: visit1Date,
        preferredTimeWindow: 'MORNING',
        status: AppointmentRequestStatus.CONFIRMED,
        reason: 'Follow-up after molar root canal',
      },
      {
        patientId: patient3.id,
        branchId: branchA.id,
        dentistPreferenceId: dentistFeby.id,
        serviceName: 'Ultrasonic Scaling & Polishing',
        preferredDate: past3Days,
        preferredTimeWindow: 'AFTERNOON',
        status: AppointmentRequestStatus.CONFIRMED,
        reason: 'Periodontal hygiene cleaning',
      },
      {
        patientId: patient4.id,
        branchId: branchB.id,
        dentistPreferenceId: dentistAhmed.id,
        serviceName: 'Dental Implants & Oral Surgery Consultation',
        preferredDate: past7Days,
        preferredTimeWindow: 'MORNING',
        status: AppointmentRequestStatus.CONFIRMED,
        reason: 'Implant replacement for missing lower molar',
      },
      {
        patientId: patient5.id,
        branchId: branchB.id,
        dentistPreferenceId: dentistYoussef.id,
        serviceName: 'Orthodontics & Clear Aligners Assessment',
        preferredDate: past14Days,
        preferredTimeWindow: 'EVENING',
        status: AppointmentRequestStatus.CONFIRMED,
        reason: 'Clear aligner 3D scan',
      },
      {
        patientId: patient7.id,
        branchId: branchC.id,
        dentistPreferenceId: dentistNadia.id,
        serviceName: 'Cosmetic Dentistry & Whitening',
        preferredDate: past3Days,
        preferredTimeWindow: 'MORNING',
        status: AppointmentRequestStatus.CONFIRMED,
        reason: 'Laser whitening session at Maadi',
      },
      {
        patientId: patient2.id,
        branchId: branchA.id,
        dentistPreferenceId: dentistSandy.id,
        serviceName: 'Comprehensive Dental Examination',
        preferredDate: visit2Date,
        preferredTimeWindow: 'MORNING',
        status: AppointmentRequestStatus.REQUESTED,
        reason: 'Annual dental checkup',
      },
    ],
  });

  // Historical Appointments (COMPLETED, CANCELLED, NO_SHOW) across BR-A, BR-B, BR-C
  await prisma.appointment.createMany({
    data: [
      {
        patientId: patient3.id,
        branchId: branchA.id,
        dentistUserId: dentistFeby.id,
        appointmentDate: past3Days,
        startTime: '13:00',
        endTime: '13:45',
        durationMinutes: 45,
        serviceDescription: 'Ultrasonic Scaling & Periodontal Polishing',
        status: AppointmentStatus.COMPLETED,
      },
      {
        patientId: patient2.id,
        branchId: branchA.id,
        dentistUserId: dentistSandy.id,
        appointmentDate: past7Days,
        startTime: '10:00',
        endTime: '10:45',
        durationMinutes: 45,
        serviceDescription: 'Nano-Hybrid Composite Restoration (#24)',
        status: AppointmentStatus.COMPLETED,
      },
      {
        patientId: patient4.id,
        branchId: branchB.id,
        dentistUserId: dentistAhmed.id,
        appointmentDate: past7Days,
        startTime: '11:00',
        endTime: '12:00',
        durationMinutes: 60,
        serviceDescription: '3D CBCT Guided Titanium Implant Placement (#46)',
        status: AppointmentStatus.COMPLETED,
      },
      {
        patientId: patient5.id,
        branchId: branchB.id,
        dentistUserId: dentistYoussef.id,
        appointmentDate: past14Days,
        startTime: '15:00',
        endTime: '16:00',
        durationMinutes: 60,
        serviceDescription: 'Orthodontic 3D Intraoral Scan & Aligner Setup',
        status: AppointmentStatus.COMPLETED,
      },
      {
        patientId: patient7.id,
        branchId: branchC.id,
        dentistUserId: dentistNadia.id,
        appointmentDate: past3Days,
        startTime: '11:30',
        endTime: '12:15',
        durationMinutes: 45,
        serviceDescription: 'Comprehensive Checkup & Fluoride Prophylaxis',
        status: AppointmentStatus.COMPLETED,
      },
      {
        patientId: patient5.id,
        branchId: branchB.id,
        dentistUserId: dentistAhmed.id,
        appointmentDate: past3Days,
        startTime: '16:00',
        endTime: '16:45',
        durationMinutes: 45,
        serviceDescription: 'Surgical Follow-Up Check',
        status: AppointmentStatus.CANCELLED,
        cancellationReason: 'Patient travelling outside Cairo; rescheduled for next week',
      },
      {
        patientId: patient6.id,
        branchId: branchA.id,
        dentistUserId: dentistFeby.id,
        appointmentDate: past14Days,
        startTime: '17:00',
        endTime: '17:45',
        durationMinutes: 45,
        serviceDescription: 'Emergency Endodontic Consultation',
        status: AppointmentStatus.NO_SHOW,
      },
    ],
  });

  // Additional Multi-Branch Invoices & Multi-Method Payments (for non-Hassan patients so Hassan's portal balance stays exact)
  const omarInvoice = await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-2026-0002',
      patientId: patient3.id,
      branchId: branchA.id,
      status: InvoiceStatus.PAID,
      totalAmountPiasters: 200000, // 2,000 EGP
      paidAmountPiasters: 200000,
      issuedByUserId: receptionA.id,
      issuedAt: past3Days,
      notes: 'Scaling & Composite Restoration (#24)',
      lines: {
        create: [
          {
            description: 'Ultrasonic Scaling & Polishing',
            unitPricePiasters: 80000,
            quantity: 1,
            lineTotalPiasters: 80000,
          },
          {
            description: 'Nano-Hybrid Composite Restoration (2 Surfaces)',
            toothNumber: '24',
            unitPricePiasters: 120000,
            quantity: 1,
            lineTotalPiasters: 120000,
          },
        ],
      },
    },
  });

  const omarPayment = await prisma.payment.create({
    data: {
      receiptNumber: 'RCP-2026-0002',
      patientId: patient3.id,
      collectionBranchId: branchA.id,
      amountPiasters: 200000,
      paymentMethod: PaymentMethod.CASH,
      idempotencyKey: 'seed-rcp-2026-0002',
      status: PaymentStatus.POSTED,
      collectedByUserId: receptionA.id,
      collectedAt: past3Days,
      notes: 'Paid in full in cash at Branch A desk.',
    },
  });

  await prisma.paymentAllocation.create({
    data: {
      paymentId: omarPayment.id,
      invoiceId: omarInvoice.id,
      allocatedAmountPiasters: 200000,
    },
  });

  // Branch B (New Cairo) Invoice & Credit Card + Fawry Payments (with 31-60d aging balance)
  const monaInvoice = await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-2026-0003',
      patientId: patient4.id,
      branchId: branchB.id,
      status: InvoiceStatus.PARTIALLY_PAID,
      totalAmountPiasters: 650000, // 6,500 EGP
      paidAmountPiasters: 450000, // 4,500 EGP paid, 2,000 EGP balance (35 days old -> 31-60d bucket)
      issuedByUserId: receptionB.id,
      issuedAt: past35Days,
      notes: 'Surgical Implant Placement & 3D CBCT Guide (#46)',
      lines: {
        create: [
          {
            description: 'Straumann Titanium Dental Implant Fixture (#46)',
            toothNumber: '46',
            unitPricePiasters: 650000,
            quantity: 1,
            lineTotalPiasters: 650000,
          },
        ],
      },
    },
  });

  const monaPaymentCard = await prisma.payment.create({
    data: {
      receiptNumber: 'RCP-2026-0003',
      patientId: patient4.id,
      collectionBranchId: branchB.id,
      amountPiasters: 350000, // 3,500 EGP via Credit Card
      paymentMethod: PaymentMethod.CREDIT_CARD,
      idempotencyKey: 'seed-rcp-2026-0003',
      status: PaymentStatus.POSTED,
      collectedByUserId: receptionB.id,
      collectedAt: past35Days,
      notes: 'POS Visa payment at New Cairo branch.',
    },
  });

  const monaPaymentFawry = await prisma.payment.create({
    data: {
      receiptNumber: 'RCP-2026-0004',
      patientId: patient4.id,
      collectionBranchId: branchB.id,
      amountPiasters: 100000, // 1,000 EGP via Fawry
      paymentMethod: PaymentMethod.FAWRY,
      idempotencyKey: 'seed-rcp-2026-0004',
      status: PaymentStatus.POSTED,
      collectedByUserId: receptionB.id,
      collectedAt: past14Days,
      notes: 'Second payment settled via Fawry reference.',
    },
  });

  await prisma.paymentAllocation.createMany({
    data: [
      { paymentId: monaPaymentCard.id, invoiceId: monaInvoice.id, allocatedAmountPiasters: 350000 },
      { paymentId: monaPaymentFawry.id, invoiceId: monaInvoice.id, allocatedAmountPiasters: 100000 },
    ],
  });

  // Branch C (Maadi) Invoice & Payment + 61-90+ day aging invoice for Youssef
  const laylaInvoice = await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-2026-0004',
      patientId: patient7.id,
      branchId: branchC.id,
      status: InvoiceStatus.PAID,
      totalAmountPiasters: 180000, // 1,800 EGP
      paidAmountPiasters: 180000,
      issuedByUserId: receptionC.id,
      issuedAt: past3Days,
      notes: 'Comprehensive Checkup, Scaling & Cosmetic Whitening Session',
      lines: {
        create: [
          {
            description: 'Comprehensive Checkup & Cosmetic Whitening',
            unitPricePiasters: 180000,
            quantity: 1,
            lineTotalPiasters: 180000,
          },
        ],
      },
    },
  });

  const laylaPayment = await prisma.payment.create({
    data: {
      receiptNumber: 'RCP-2026-0005',
      patientId: patient7.id,
      collectionBranchId: branchC.id,
      amountPiasters: 180000,
      paymentMethod: PaymentMethod.CREDIT_CARD,
      idempotencyKey: 'seed-rcp-2026-0005',
      status: PaymentStatus.POSTED,
      collectedByUserId: receptionC.id,
      collectedAt: past3Days,
      notes: 'Paid by Mastercard at Maadi reception.',
    },
  });

  await prisma.paymentAllocation.create({
    data: {
      paymentId: laylaPayment.id,
      invoiceId: laylaInvoice.id,
      allocatedAmountPiasters: 180000,
    },
  });

  await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-2026-0005',
      patientId: patient5.id,
      branchId: branchB.id,
      status: InvoiceStatus.ISSUED,
      totalAmountPiasters: 120000, // 1,200 EGP unpaid (65 days old -> 61-90+d aging bucket)
      paidAmountPiasters: 0,
      issuedByUserId: receptionB.id,
      issuedAt: past65Days,
      notes: 'Orthodontic Diagnostic Study Models & Cephalometric X-Ray',
      lines: {
        create: [
          {
            description: 'Orthodontic Diagnostic Study & 3D Scan',
            unitPricePiasters: 120000,
            quantity: 1,
            lineTotalPiasters: 120000,
          },
        ],
      },
    },
  });

  // Multi-Branch Operating Expenses across Categories
  await prisma.expense.createMany({
    data: [
      {
        branchId: branchA.id,
        category: ExpenseCategory.SUPPLIES,
        payee: 'Cairo Medical & Dental Supplies Co.',
        amountPiasters: 65000, // 650 EGP
        notes: 'Endodontic files and sterilization pouches replenishment',
        createdByUserId: adminUser.id,
        expenseDate: past7Days,
      },
      {
        branchId: branchA.id,
        category: ExpenseCategory.LAB_FEES,
        payee: 'Cairo Digital CAD/CAM Prosthetic Lab',
        amountPiasters: 90000, // 900 EGP
        notes: 'Layered Zirconia crown milling fee',
        createdByUserId: adminUser.id,
        expenseDate: past3Days,
      },
      {
        branchId: branchB.id,
        category: ExpenseCategory.RENT,
        payee: 'Medical Park Premier Management',
        amountPiasters: 140000, // 1,400 EGP
        notes: 'Monthly clinical suite service & facility charge',
        createdByUserId: adminUser.id,
        expenseDate: past14Days,
      },
      {
        branchId: branchB.id,
        category: ExpenseCategory.MAINTENANCE,
        payee: 'Carestream Authorized Calibration Egypt',
        amountPiasters: 45000, // 450 EGP
        notes: 'Quarterly CBCT sensor calibration',
        createdByUserId: adminUser.id,
        expenseDate: past3Days,
      },
      {
        branchId: branchC.id,
        category: ExpenseCategory.UTILITIES,
        payee: 'South Cairo Electricity & Medical Waste Disposal',
        amountPiasters: 55000, // 550 EGP
        notes: 'Monthly clinical utilities and licensed biohazard pickup',
        createdByUserId: adminUser.id,
        expenseDate: past7Days,
      },
    ],
  });

  // Additional Multi-Branch Stock Lots (including near-expiry and low-stock items) & Stock Movements
  const nearExpiryDate = new Date(Date.now() + 86400000 * 28); // Expires in 28 days
  await prisma.stockLot.createMany({
    data: [
      {
        materialId: matAnest.id,
        branchId: branchB.id,
        lotNumber: 'LOT-ART-2026B',
        expiryDate: nearExpiryDate,
        quantityOnHand: 6, // Below reorder point 10 & near expiry!
      },
      {
        materialId: matImp.id,
        branchId: branchB.id,
        lotNumber: 'LOT-STR-2026B',
        expiryDate: new Date('2029-06-30'),
        quantityOnHand: 9,
      },
      {
        materialId: matGloves.id,
        branchId: branchB.id,
        lotNumber: 'LOT-GLV-2026B',
        expiryDate: new Date('2028-10-31'),
        quantityOnHand: 28,
      },
      {
        materialId: matAnest.id,
        branchId: branchC.id,
        lotNumber: 'LOT-ART-2026C',
        expiryDate: new Date('2027-11-30'),
        quantityOnHand: 14,
      },
      {
        materialId: matGloves.id,
        branchId: branchC.id,
        lotNumber: 'LOT-GLV-2026C',
        expiryDate: nearExpiryDate,
        quantityOnHand: 8, // Below reorder point 15 & near expiry!
      },
    ],
  });

  await prisma.stockMovement.createMany({
    data: [
      {
        materialId: matComp.id,
        branchId: branchA.id,
        quantity: 26,
        movementType: StockMovementType.RECEIPT,
        performedByUserId: adminUser.id,
        notes: 'Lot LOT-Z350-2026A. Initial supplier delivery from Cairo Medical Supplies',
      },
      {
        materialId: matComp.id,
        branchId: branchA.id,
        quantity: -2,
        movementType: StockMovementType.CONSUMPTION,
        performedByUserId: dentistSandy.id,
        notes: 'Lot LOT-Z350-2026A. Dispensed for restorative fillings',
      },
      {
        materialId: matEndo.id,
        branchId: branchA.id,
        quantity: -3,
        movementType: StockMovementType.CONSUMPTION,
        performedByUserId: dentistSandy.id,
        notes: 'Lot LOT-PTG-2026A. Used for molar root canal instrumentation (#36)',
      },
      {
        materialId: matImp.id,
        branchId: branchB.id,
        quantity: 10,
        movementType: StockMovementType.RECEIPT,
        performedByUserId: adminUser.id,
        notes: 'Lot LOT-STR-2026B. Implant stock receipt at New Cairo',
      },
      {
        materialId: matImp.id,
        branchId: branchB.id,
        quantity: -1,
        movementType: StockMovementType.CONSUMPTION,
        performedByUserId: dentistAhmed.id,
        notes: 'Lot LOT-STR-2026B. Used in surgical implant placement (#46)',
      },
      {
        materialId: matGloves.id,
        branchId: branchC.id,
        quantity: -1,
        movementType: StockMovementType.WASTE,
        performedByUserId: receptionC.id,
        notes: 'Lot LOT-GLV-2026C. Damaged outer box during unpacking',
      },
    ],
  });

  // Additional CRM Inquiries (across Website, Phone Call, WhatsApp, Walk-In) & Follow-Up Recalls
  await prisma.feedbackCase.createMany({
    data: [
      {
        patientId: patient1.id,
        branchId: branchA.id,
        category: FeedbackCategory.PRAISE,
        status: FeedbackStatus.RESOLVED,
        assignedStaffId: receptionA.id,
        subject: '[WEBSITE] Smooth root canal session with Dr. Sandy Saad',
        description: 'Thank you for the clear explanation of my treatment plan and painless molar root canal procedure.',
        patientVisibleResponse: 'Thank you, Mr. Hassan! Wishing you a smooth recovery ahead of your next visit.',
      },
      {
        patientId: patient7.id,
        branchId: branchC.id,
        category: FeedbackCategory.INQUIRY,
        status: FeedbackStatus.OPEN,
        subject: '[WEBSITE] Evening consultation hours at Branch C - Maadi',
        description: 'Are cosmetic dentistry consultations available after 6:00 PM on weekdays at the Maadi clinic?',
      },
      {
        patientId: patient4.id,
        branchId: branchB.id,
        category: FeedbackCategory.INQUIRY,
        status: FeedbackStatus.RESPONDED,
        assignedStaffId: receptionB.id,
        subject: '[PHONE_CALL] Titanium implant package & installment plan options',
        description: 'Caller inquired whether Straumann implant placement includes the final zirconia crown and 3-month installments.',
        patientVisibleResponse: 'Contacted patient by phone and confirmed phased implant + crown installment schedule.',
      },
      {
        patientId: patient3.id,
        branchId: branchA.id,
        category: FeedbackCategory.INQUIRY,
        status: FeedbackStatus.RESOLVED,
        assignedStaffId: receptionA.id,
        subject: '[WHATSAPP] Ultrasonic scaling & polishing appointment slot',
        description: 'WhatsApp inquiry requesting same-week dental hygiene cleaning at Heliopolis.',
        patientVisibleResponse: 'Booked and completed hygiene visit with Dr. Feby Samer.',
      },
      {
        patientId: patient5.id,
        branchId: branchB.id,
        category: FeedbackCategory.INQUIRY,
        status: FeedbackStatus.OPEN,
        subject: '[WALK_IN] Clear aligner orthodontic duration & monthly visits',
        description: 'Walk-in inquiry at New Cairo reception asking about clear aligner treatment duration.',
      },
    ],
  });

  await prisma.followUp.createMany({
    data: [
      {
        patientId: patient3.id,
        branchId: branchA.id,
        dentistUserId: dentistFeby.id,
        recommendedDate: new Date(Date.now() + 86400000 * 21),
        procedureType: '6-Month Periodontal Maintenance & Scaling Recall',
        status: FollowUpStatus.CONTACTED,
        notes: 'Contacted via phone; patient prefers Thursday afternoon slot.',
      },
      {
        patientId: patient4.id,
        branchId: branchB.id,
        dentistUserId: dentistAhmed.id,
        recommendedDate: new Date(Date.now() + 86400000 * 14),
        procedureType: 'Implant Osseointegration Check & Healing Abutment (#46)',
        status: FollowUpStatus.SCHEDULED,
        notes: 'Post-op check scheduled at Branch B — New Cairo.',
      },
      {
        patientId: patient7.id,
        branchId: branchC.id,
        dentistUserId: dentistNadia.id,
        recommendedDate: new Date(Date.now() + 86400000 * 7),
        procedureType: 'Whitening Shade Stability & Desensitizing Check',
        status: FollowUpStatus.PENDING,
        notes: 'Follow up with patient 1 week after whitening consultation.',
      },
    ],
  });

  await prisma.operationalAlert.create({
    data: {
      branchId: branchA.id,
      alertType: AlertType.LOW_STOCK_THRESHOLD,
      severity: AlertSeverity.WARNING,
      title: `Low Stock Reorder Alert: ${matEndo.nameEn}`,
      description: `Current on-hand count is 5 PACK (reorder point is 8).`,
      entityId: matEndo.id,
      status: AlertStatus.ACTIVE,
    },
  });

  // 10. Record Initial Audit Events
  await prisma.auditEvent.createMany({
    data: [
      {
        actorUserId: adminUser.id,
        actorRole: 'OWNER_ADMIN',
        action: 'SYSTEM_SEEDED',
        entityType: 'System',
        entityId: 'ROOT',
        metadataJson: { branchCount: 3, dentistCount: 5, receptionistCount: 3, patientCount: 7 },
      },
      {
        actorUserId: receptionA.id,
        actorRole: 'RECEPTIONIST',
        action: 'PORTAL_LINK_APPROVED',
        entityType: 'PortalPatientLink',
        entityId: patient1.id,
        branchId: branchA.id,
        metadataJson: { patientNumber: 'EBT-PAT-2026-0001', verifiedMethod: 'PHYSICAL_ID_CHECK' },
      },
      {
        actorUserId: dentistSandy.id,
        actorRole: 'DENTIST',
        action: 'INTAKE_REVIEWED',
        entityType: 'MedicalHistoryReview',
        entityId: v1Intake.id,
        branchId: branchA.id,
        metadataJson: { versionNumber: 1, outcome: 'APPROVED', hasAllergyFlags: true },
      },
    ],
  });

  console.log('Seeding completed successfully!');
  console.log('Summary: 3 branches (Heliopolis, New Cairo, Maadi), 5 dentists (2+2+1), 3 receptionists (1+1+1), 3 portal users, 7 clinical patients.');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
