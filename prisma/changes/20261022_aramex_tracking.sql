BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';
CREATE TABLE "AramexTrackingEvent" (
  "id" TEXT NOT NULL,
  "environment" TEXT NOT NULL,
  "digest" TEXT NOT NULL,
  "trackingNumber" TEXT NOT NULL,
  "shipmentId" TEXT,
  "code" TEXT NOT NULL,
  "problemCode" TEXT NOT NULL,
  "occurredAt" TIMESTAMP(3) NOT NULL,
  "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "location" TEXT NOT NULL,
  "comments" TEXT NOT NULL,
  "orderNumber" TEXT NOT NULL,
  CONSTRAINT "AramexTrackingEvent_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "AramexTrackingEvent_environment_digest_key" ON "AramexTrackingEvent"("environment", "digest");
CREATE INDEX "AramexTrackingEvent_environment_trackingNumber_occurredAt_idx" ON "AramexTrackingEvent"("environment", "trackingNumber", "occurredAt");
CREATE INDEX "AramexTrackingEvent_shipmentId_occurredAt_idx" ON "AramexTrackingEvent"("shipmentId", "occurredAt");
ALTER TABLE "AramexTrackingEvent" ADD CONSTRAINT "AramexTrackingEvent_shipmentId_fkey"
  FOREIGN KEY ("shipmentId") REFERENCES "BookShipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AramexTrackingEvent" ENABLE ROW LEVEL SECURITY;
COMMIT;
