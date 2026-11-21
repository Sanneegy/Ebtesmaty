-- CreateEnum
CREATE TYPE "BookingSource" AS ENUM ('WEBSITE', 'RECEPTION_PHONE', 'WHATSAPP', 'WALK_IN', 'OTHER');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Role" ADD VALUE 'FINANCE';
ALTER TYPE "Role" ADD VALUE 'INVENTORY';
ALTER TYPE "Role" ADD VALUE 'CRM';

-- AlterTable
ALTER TABLE "appointment_requests" ADD COLUMN     "durationMinutes" INTEGER NOT NULL DEFAULT 45,
ADD COLUMN     "selectedStartTime" TEXT,
ADD COLUMN     "source" "BookingSource" NOT NULL DEFAULT 'WEBSITE';

-- AlterTable
ALTER TABLE "appointments" ADD COLUMN     "source" "BookingSource" NOT NULL DEFAULT 'WEBSITE';

-- AlterTable
ALTER TABLE "queue_entries" ADD COLUMN     "clinicalPriority" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "priorityAt" TIMESTAMP(3),
ADD COLUMN     "priorityByUserId" TEXT;

-- CreateTable
CREATE TABLE "scheduling_policies" (
    "branchId" TEXT NOT NULL,
    "earlyArrivalMinutes" INTEGER NOT NULL DEFAULT 0,
    "lateGraceMinutes" INTEGER,
    "lateAction" TEXT NOT NULL DEFAULT 'STAFF_REVIEW',
    "walkInsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "cancellationNoticeHours" INTEGER NOT NULL DEFAULT 24,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedByUserId" TEXT,

    CONSTRAINT "scheduling_policies_pkey" PRIMARY KEY ("branchId")
);

