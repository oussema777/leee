BEGIN;
ALTER TABLE "CybersourceLiveAttempt" ADD COLUMN "customerCheckAfter" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
CREATE TABLE "CardPaymentOpsNote" (
  "id" TEXT PRIMARY KEY,
  "attemptId" TEXT NOT NULL REFERENCES "CybersourceLiveAttempt"("id") ON DELETE RESTRICT,
  "actorId" TEXT NOT NULL,
  "action" TEXT NOT NULL CHECK ("action" IN ('NOTE','QUEUE_CHECK')),
  "note" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "CardPaymentOpsNote_attempt_created" ON "CardPaymentOpsNote"("attemptId","createdAt");
CREATE TABLE "CardPaymentJobStatus" (
  "id" TEXT PRIMARY KEY,
  "token" TEXT NOT NULL,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "finishedAt" TIMESTAMP(3),
  "state" TEXT NOT NULL CHECK ("state" IN ('RUNNING','OK','FAILED')),
  "summary" JSONB
);
ALTER TABLE "CardPaymentOpsNote" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CardPaymentJobStatus" ENABLE ROW LEVEL SECURITY;
COMMIT;
