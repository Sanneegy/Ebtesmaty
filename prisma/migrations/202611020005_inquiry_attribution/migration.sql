ALTER TYPE "FollowUpStatus" ADD VALUE IF NOT EXISTS 'COMPLETED';
ALTER TABLE feedback_cases ADD COLUMN "sourceChannel" TEXT, ADD COLUMN "linkedRequestId" TEXT UNIQUE REFERENCES appointment_requests(id) ON DELETE SET NULL;
CREATE TABLE inquiry_activities (id TEXT PRIMARY KEY,"caseId" TEXT NOT NULL REFERENCES feedback_cases(id) ON DELETE CASCADE,"actorUserId" TEXT NOT NULL REFERENCES users(id),note TEXT NOT NULL,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP);
CREATE INDEX inquiry_activities_case_date ON inquiry_activities("caseId","createdAt");
