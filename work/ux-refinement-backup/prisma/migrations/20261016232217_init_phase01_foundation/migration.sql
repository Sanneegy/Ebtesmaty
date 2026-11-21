-- CreateEnum
CREATE TYPE "Role" AS ENUM ('PATIENT', 'RECEPTIONIST', 'DENTIST', 'BRANCH_MANAGER', 'OWNER_ADMIN');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION');

-- CreateEnum
CREATE TYPE "PatientSource" AS ENUM ('CLINIC_ENTRY', 'ONLINE_SELF_REG', 'MIGRATED_LEGACY');

-- CreateEnum
CREATE TYPE "MigrationStatus" AS ENUM ('NOT_DIGITIZED', 'PARTIALLY_DIGITIZED', 'FULLY_DIGITIZED');

-- CreateEnum
CREATE TYPE "LinkStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "DuplicateReviewStatus" AS ENUM ('PENDING', 'REVIEWED_DISTINCT', 'RESOLVED_MERGED');

-- CreateEnum
CREATE TYPE "IntakeStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'REVIEWED', 'SUPERSEDED');

-- CreateEnum
CREATE TYPE "IntakeSource" AS ENUM ('PATIENT_PORTAL', 'PATIENT_ASSISTED_BY_RECEPTION');

-- CreateEnum
CREATE TYPE "ReviewOutcome" AS ENUM ('APPROVED', 'CLARIFICATION_REQUESTED');

-- CreateTable
CREATE TABLE "branches" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "branches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "fullName" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_grants" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "branchId" TEXT,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "grantedBy" TEXT,

    CONSTRAINT "role_grants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "licenseNumber" TEXT,
    "specialty" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patients" (
    "id" TEXT NOT NULL,
    "patientNumber" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "gender" TEXT NOT NULL,
    "primaryPhone" TEXT NOT NULL,
    "secondaryPhone" TEXT,
    "nationalIdOrPassport" TEXT,
    "address" TEXT,
    "emergencyContactName" TEXT,
    "emergencyContactPhone" TEXT,
    "source" "PatientSource" NOT NULL DEFAULT 'CLINIC_ENTRY',
    "migrationStatus" "MigrationStatus" NOT NULL DEFAULT 'FULLY_DIGITIZED',
    "legacyBalanceNotes" TEXT,
    "primaryBranchId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_contacts" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "contactType" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "patient_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portal_patient_links" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "status" "LinkStatus" NOT NULL DEFAULT 'PENDING',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verifiedByUserId" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "verificationNotes" TEXT,

    CONSTRAINT "portal_patient_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_care_assignments" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "dentistUserId" TEXT NOT NULL,
    "branchId" TEXT,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedByUserId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "patient_care_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "potential_duplicate_reviews" (
    "id" TEXT NOT NULL,
    "patientAId" TEXT NOT NULL,
    "patientBId" TEXT NOT NULL,
    "matchType" TEXT NOT NULL,
    "status" "DuplicateReviewStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedByUserId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "resolutionNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "potential_duplicate_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medical_history_submissions" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "answersJson" JSONB NOT NULL,
    "status" "IntakeStatus" NOT NULL DEFAULT 'DRAFT',
    "submissionSource" "IntakeSource" NOT NULL DEFAULT 'PATIENT_PORTAL',
    "submittedByUserId" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "medical_history_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medical_history_reviews" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "dentistUserId" TEXT NOT NULL,
    "outcome" "ReviewOutcome" NOT NULL,
    "clinicalNotes" TEXT NOT NULL,
    "reviewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "medical_history_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_events" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT,
    "actorRole" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "branchId" TEXT,
    "metadataJson" JSONB,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "branches_code_key" ON "branches"("code");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions"("token");

-- CreateIndex
CREATE INDEX "sessions_token_idx" ON "sessions"("token");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

-- CreateIndex
CREATE INDEX "role_grants_userId_idx" ON "role_grants"("userId");

-- CreateIndex
CREATE INDEX "role_grants_branchId_idx" ON "role_grants"("branchId");

-- CreateIndex
CREATE UNIQUE INDEX "role_grants_userId_role_branchId_key" ON "role_grants"("userId", "role", "branchId");

-- CreateIndex
CREATE UNIQUE INDEX "staff_profiles_userId_key" ON "staff_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "patients_patientNumber_key" ON "patients"("patientNumber");

-- CreateIndex
CREATE INDEX "patients_primaryPhone_idx" ON "patients"("primaryPhone");

-- CreateIndex
CREATE INDEX "patients_fullName_idx" ON "patients"("fullName");

-- CreateIndex
CREATE INDEX "patients_patientNumber_idx" ON "patients"("patientNumber");

-- CreateIndex
CREATE INDEX "patients_primaryBranchId_idx" ON "patients"("primaryBranchId");

-- CreateIndex
CREATE INDEX "patient_contacts_patientId_idx" ON "patient_contacts"("patientId");

-- CreateIndex
CREATE INDEX "portal_patient_links_userId_idx" ON "portal_patient_links"("userId");

-- CreateIndex
CREATE INDEX "portal_patient_links_patientId_idx" ON "portal_patient_links"("patientId");

-- CreateIndex
CREATE INDEX "portal_patient_links_status_idx" ON "portal_patient_links"("status");

-- CreateIndex
CREATE UNIQUE INDEX "portal_patient_links_userId_patientId_key" ON "portal_patient_links"("userId", "patientId");

-- CreateIndex
CREATE INDEX "patient_care_assignments_patientId_idx" ON "patient_care_assignments"("patientId");

-- CreateIndex
CREATE INDEX "patient_care_assignments_dentistUserId_idx" ON "patient_care_assignments"("dentistUserId");

-- CreateIndex
CREATE UNIQUE INDEX "patient_care_assignments_patientId_dentistUserId_branchId_key" ON "patient_care_assignments"("patientId", "dentistUserId", "branchId");

-- CreateIndex
CREATE INDEX "potential_duplicate_reviews_patientAId_idx" ON "potential_duplicate_reviews"("patientAId");

-- CreateIndex
CREATE INDEX "potential_duplicate_reviews_patientBId_idx" ON "potential_duplicate_reviews"("patientBId");

-- CreateIndex
CREATE INDEX "potential_duplicate_reviews_status_idx" ON "potential_duplicate_reviews"("status");

-- CreateIndex
CREATE INDEX "medical_history_submissions_patientId_idx" ON "medical_history_submissions"("patientId");

-- CreateIndex
CREATE INDEX "medical_history_submissions_status_idx" ON "medical_history_submissions"("status");

-- CreateIndex
CREATE UNIQUE INDEX "medical_history_submissions_patientId_versionNumber_key" ON "medical_history_submissions"("patientId", "versionNumber");

-- CreateIndex
CREATE INDEX "medical_history_reviews_submissionId_idx" ON "medical_history_reviews"("submissionId");

-- CreateIndex
CREATE INDEX "medical_history_reviews_dentistUserId_idx" ON "medical_history_reviews"("dentistUserId");

-- CreateIndex
CREATE INDEX "audit_events_actorUserId_idx" ON "audit_events"("actorUserId");

-- CreateIndex
CREATE INDEX "audit_events_action_idx" ON "audit_events"("action");

-- CreateIndex
CREATE INDEX "audit_events_entityType_entityId_idx" ON "audit_events"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "audit_events_createdAt_idx" ON "audit_events"("createdAt");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_grants" ADD CONSTRAINT "role_grants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_grants" ADD CONSTRAINT "role_grants_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_profiles" ADD CONSTRAINT "staff_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patients" ADD CONSTRAINT "patients_primaryBranchId_fkey" FOREIGN KEY ("primaryBranchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_contacts" ADD CONSTRAINT "patient_contacts_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portal_patient_links" ADD CONSTRAINT "portal_patient_links_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portal_patient_links" ADD CONSTRAINT "portal_patient_links_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portal_patient_links" ADD CONSTRAINT "portal_patient_links_verifiedByUserId_fkey" FOREIGN KEY ("verifiedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_care_assignments" ADD CONSTRAINT "patient_care_assignments_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_care_assignments" ADD CONSTRAINT "patient_care_assignments_dentistUserId_fkey" FOREIGN KEY ("dentistUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_care_assignments" ADD CONSTRAINT "patient_care_assignments_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_care_assignments" ADD CONSTRAINT "patient_care_assignments_assignedByUserId_fkey" FOREIGN KEY ("assignedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "potential_duplicate_reviews" ADD CONSTRAINT "potential_duplicate_reviews_patientAId_fkey" FOREIGN KEY ("patientAId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "potential_duplicate_reviews" ADD CONSTRAINT "potential_duplicate_reviews_patientBId_fkey" FOREIGN KEY ("patientBId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "potential_duplicate_reviews" ADD CONSTRAINT "potential_duplicate_reviews_reviewedByUserId_fkey" FOREIGN KEY ("reviewedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medical_history_submissions" ADD CONSTRAINT "medical_history_submissions_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medical_history_submissions" ADD CONSTRAINT "medical_history_submissions_submittedByUserId_fkey" FOREIGN KEY ("submittedByUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medical_history_reviews" ADD CONSTRAINT "medical_history_reviews_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "medical_history_submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medical_history_reviews" ADD CONSTRAINT "medical_history_reviews_dentistUserId_fkey" FOREIGN KEY ("dentistUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
