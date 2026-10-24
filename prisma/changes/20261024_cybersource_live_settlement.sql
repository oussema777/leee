-- Preparation only. Apply to isolated test DB first; never run automatically.
-- No production checkout/verifier is wired to these tables yet.
BEGIN;
CREATE TABLE "CybersourceLiveAttempt" (
  "id" TEXT PRIMARY KEY,
  "bookOrderId" TEXT REFERENCES "BookOrder"("id") ON DELETE RESTRICT,
  "ebookOrderId" TEXT REFERENCES "EbookOrder"("id") ON DELETE RESTRICT,
  "orderReference" TEXT NOT NULL,
  "merchantId" TEXT NOT NULL,
  "amountCents" INTEGER NOT NULL CHECK ("amountCents" > 0),
  "currency" TEXT NOT NULL DEFAULT 'USD' CHECK ("currency" = 'USD'),
  "environment" TEXT NOT NULL DEFAULT 'PRODUCTION' CHECK ("environment" = 'PRODUCTION'),
  "state" TEXT NOT NULL DEFAULT 'READY' CHECK ("state" IN ('READY','VERIFIED_CAPTURE','APPLIED','REVIEW_REQUIRED')),
  "transactionId" TEXT UNIQUE,
  "verifiedAt" TIMESTAMP(3),
  "reviewReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CybersourceLiveAttempt_one_order" CHECK (("bookOrderId" IS NOT NULL)::int + ("ebookOrderId" IS NOT NULL)::int = 1),
  CONSTRAINT "CybersourceLiveAttempt_verified" CHECK ("state" = 'READY' OR ("transactionId" IS NOT NULL AND "verifiedAt" IS NOT NULL))
);
CREATE INDEX "CybersourceLiveAttempt_book_created" ON "CybersourceLiveAttempt"("bookOrderId","createdAt");
CREATE INDEX "CybersourceLiveAttempt_ebook_created" ON "CybersourceLiveAttempt"("ebookOrderId","createdAt");
CREATE TABLE "CardPaymentOutbox" (
  "id" TEXT PRIMARY KEY,
  "attemptId" TEXT NOT NULL REFERENCES "CybersourceLiveAttempt"("id") ON DELETE RESTRICT,
  "event" TEXT NOT NULL CHECK ("event" IN ('PAYMENT_CONFIRMED','PAYMENT_REVIEW_REQUIRED')),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "processedAt" TIMESTAMP(3),
  UNIQUE ("attemptId", "event")
);
CREATE INDEX "CardPaymentOutbox_pending" ON "CardPaymentOutbox"("processedAt","createdAt");
ALTER TABLE "CybersourceLiveAttempt" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CardPaymentOutbox" ENABLE ROW LEVEL SECURITY;
COMMIT;
