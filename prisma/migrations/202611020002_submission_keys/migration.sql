ALTER TABLE "appointment_requests" ADD COLUMN "submissionKey" TEXT, ADD COLUMN "submissionHash" TEXT;
CREATE UNIQUE INDEX "appointment_requests_submissionKey_key" ON "appointment_requests"("submissionKey");
ALTER TABLE "goods_receipts" ADD COLUMN "idempotencyKey" TEXT, ADD COLUMN "requestHash" TEXT;
CREATE UNIQUE INDEX "goods_receipts_idempotencyKey_key" ON "goods_receipts"("idempotencyKey");
