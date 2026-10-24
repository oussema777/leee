-- Keeps interrupted/submitted checkout waiting across browsers and devices.
BEGIN;
ALTER TABLE "CybersourceLiveAttempt" DROP CONSTRAINT "CybersourceLiveAttempt_sessionState_check";
ALTER TABLE "CybersourceLiveAttempt" ADD CONSTRAINT "CybersourceLiveAttempt_sessionState_check"
  CHECK ("sessionState" IN ('NONE','CREATING','READY','SUBMITTED','UNCERTAIN'));
COMMIT;
