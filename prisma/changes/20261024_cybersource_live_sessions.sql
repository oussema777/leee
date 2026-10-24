-- Local preparation. Requires live settlement and background-job migrations.
BEGIN;
ALTER TABLE "CybersourceLiveAttempt"
  ADD COLUMN "sessionState" TEXT NOT NULL DEFAULT 'NONE' CHECK ("sessionState" IN ('NONE','CREATING','READY','UNCERTAIN')),
  ADD COLUMN "sessionCipher" TEXT,
  ADD COLUMN "sessionExpiresAt" TIMESTAMP(3),
  ADD COLUMN "sessionStartedAt" TIMESTAMP(3);
COMMIT;
