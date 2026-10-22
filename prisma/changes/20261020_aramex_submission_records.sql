BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';

-- Additive storage only. No carrier calls or status/data rewrites.
-- AlterTable
ALTER TABLE "BookShipment" ADD COLUMN     "bookedAt" TIMESTAMP(3),
ADD COLUMN     "labelUrl" TEXT,
ADD COLUMN     "trackingNumber" TEXT;

-- CreateTable
CREATE TABLE "BookShipmentAttempt" (
    "id" TEXT NOT NULL,
    "shipmentId" TEXT NOT NULL,
    "submissionKey" TEXT NOT NULL,
    "draftVersion" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SUBMITTING',
    "preparation" JSONB NOT NULL,
    "orderFingerprint" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "failureCode" TEXT,
    "trackingNumber" TEXT,
    "labelUrl" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "BookShipmentAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BookShipmentAttempt_submissionKey_key" ON "BookShipmentAttempt"("submissionKey");

-- CreateIndex
CREATE INDEX "BookShipmentAttempt_shipmentId_startedAt_idx" ON "BookShipmentAttempt"("shipmentId", "startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "BookShipment_provider_environment_trackingNumber_key" ON "BookShipment"("provider", "environment", "trackingNumber");

-- AddForeignKey
ALTER TABLE "BookShipmentAttempt" ADD CONSTRAINT "BookShipmentAttempt_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "BookShipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "BookShipmentAttempt" ENABLE ROW LEVEL SECURITY;
COMMIT;
