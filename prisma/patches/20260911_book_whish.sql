-- Review before applying. Additive Whish preparation; does not enable checkout.
BEGIN;
-- CreateEnum
CREATE TYPE "BookWhishState" AS ENUM ('AWAITING_PAYMENT', 'UNDER_REVIEW', 'CHANGES_REQUESTED', 'VERIFIED', 'EXPIRED', 'CANCELLED', 'REFUNDED');

-- CreateTable
CREATE TABLE "BookWhishSettings" (
    "id" TEXT NOT NULL DEFAULT 'book-restore',
    "config" JSONB NOT NULL,
    "updatedBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookWhishSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookWhishPayment" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "state" "BookWhishState" NOT NULL DEFAULT 'AWAITING_PAYMENT',
    "accessTokenHash" TEXT NOT NULL,
    "requestHash" TEXT NOT NULL,
    "snapshot" JSONB NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "submittedReference" TEXT,
    "senderPhone" TEXT,
    "submittedAt" TIMESTAMP(3),
    "verifiedReference" TEXT,
    "customerNote" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookWhishPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookWhishEvent" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "details" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookWhishEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BookWhishPayment_orderId_key" ON "BookWhishPayment"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "BookWhishPayment_accessTokenHash_key" ON "BookWhishPayment"("accessTokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "BookWhishPayment_verifiedReference_key" ON "BookWhishPayment"("verifiedReference");

-- CreateIndex
CREATE INDEX "BookWhishPayment_state_expiresAt_idx" ON "BookWhishPayment"("state", "expiresAt");

-- CreateIndex
CREATE INDEX "BookWhishEvent_paymentId_createdAt_idx" ON "BookWhishEvent"("paymentId", "createdAt");

-- AddForeignKey
ALTER TABLE "BookWhishPayment" ADD CONSTRAINT "BookWhishPayment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "BookOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookWhishEvent" ADD CONSTRAINT "BookWhishEvent_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "BookWhishPayment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Payment records must not be exposed through the public Supabase API.
ALTER TABLE "BookWhishSettings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BookWhishPayment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BookWhishEvent" ENABLE ROW LEVEL SECURITY;
COMMIT;
