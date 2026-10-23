-- Additive TEST-only ledger. Does not change order/payment/access/stock state.
BEGIN;
CREATE TABLE "CybersourceTestAttempt" (
  "id" TEXT PRIMARY KEY,
  "bookOrderId" TEXT REFERENCES "BookOrder"("id") ON DELETE RESTRICT,
  "ebookOrderId" TEXT REFERENCES "EbookOrder"("id") ON DELETE RESTRICT,
  "orderReference" TEXT NOT NULL,
  "amountCents" INTEGER NOT NULL CHECK ("amountCents" > 0),
  "currency" TEXT NOT NULL DEFAULT 'USD' CHECK ("currency" = 'USD'),
  "environment" TEXT NOT NULL DEFAULT 'TEST' CHECK ("environment" = 'TEST'),
  "fingerprint" TEXT NOT NULL,
  "state" TEXT NOT NULL DEFAULT 'CREATING' CHECK ("state" IN ('CREATING','READY','SESSION_FAILED','REVIEW_REQUIRED','TEST_AUTHORIZED','TEST_CAPTURED','TEST_DECLINED')),
  "sessionCipher" TEXT,
  "expiresAt" TIMESTAMP(3),
  "transactionId" TEXT UNIQUE,
  "verifiedAt" TIMESTAMP(3),
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CybersourceTestAttempt_one_order" CHECK (("bookOrderId" IS NOT NULL)::int + ("ebookOrderId" IS NOT NULL)::int = 1)
);
CREATE INDEX "CybersourceTestAttempt_book_created" ON "CybersourceTestAttempt"("bookOrderId","createdAt");
CREATE INDEX "CybersourceTestAttempt_ebook_created" ON "CybersourceTestAttempt"("ebookOrderId","createdAt");
ALTER TABLE "CybersourceTestAttempt" ENABLE ROW LEVEL SECURITY;
COMMIT;
