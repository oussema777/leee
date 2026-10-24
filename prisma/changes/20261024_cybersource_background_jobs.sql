-- Local preparation; requires 20261024_cybersource_live_settlement.sql.
BEGIN;
ALTER TABLE "CybersourceLiveAttempt"
  ADD COLUMN "nextCheckAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "checkAttempts" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "checkLeaseToken" TEXT,
  ADD COLUMN "checkLeaseUntil" TIMESTAMP(3),
  ADD COLUMN "checkError" TEXT;
CREATE INDEX "CybersourceLiveAttempt_recovery" ON "CybersourceLiveAttempt"("state","nextCheckAt");
ALTER TABLE "CardPaymentOutbox"
  ADD COLUMN "state" TEXT NOT NULL DEFAULT 'PENDING' CHECK ("state" IN ('PENDING','SENT','SKIPPED','REVIEW_REQUIRED')),
  ADD COLUMN "payload" JSONB,
  ADD COLUMN "attempts" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "firstSendAt" TIMESTAMP(3),
  ADD COLUMN "leaseToken" TEXT,
  ADD COLUMN "leaseUntil" TIMESTAMP(3),
  ADD COLUMN "lastError" TEXT,
  ADD COLUMN "providerMessageId" TEXT;
CREATE INDEX "CardPaymentOutbox_due" ON "CardPaymentOutbox"("state","nextAttemptAt");
COMMIT;
