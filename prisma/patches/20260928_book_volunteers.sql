-- Additive Book Restore volunteer inbox. Apply before deploying the volunteer form.
BEGIN;
CREATE TYPE "BookVolunteerStatus" AS ENUM ('NEW', 'CONTACTED', 'ONBOARDED', 'DECLINED');
CREATE TABLE "BookVolunteerSubmission" (
  "id" TEXT NOT NULL,
  "reference" TEXT NOT NULL,
  "fullName" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "email" TEXT,
  "governorate" TEXT NOT NULL,
  "area" TEXT NOT NULL,
  "interests" TEXT[] NOT NULL,
  "otherInterest" TEXT,
  "availability" TEXT NOT NULL,
  "experience" TEXT,
  "notes" TEXT,
  "locale" TEXT NOT NULL,
  "privacyConsent" BOOLEAN NOT NULL,
  "consentTextVersion" TEXT NOT NULL,
  "status" "BookVolunteerStatus" NOT NULL DEFAULT 'NEW',
  "isRead" BOOLEAN NOT NULL DEFAULT false,
  "adminNotes" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BookVolunteerSubmission_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "BookVolunteerSubmission_reference_key" ON "BookVolunteerSubmission"("reference");
CREATE INDEX "BookVolunteerSubmission_status_createdAt_idx" ON "BookVolunteerSubmission"("status", "createdAt");
CREATE INDEX "BookVolunteerSubmission_createdAt_idx" ON "BookVolunteerSubmission"("createdAt");
ALTER TABLE "BookVolunteerSubmission" ENABLE ROW LEVEL SECURITY;
COMMIT;
