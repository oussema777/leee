BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';

CREATE TABLE "BookShipmentReconciliation" (
  "id" TEXT NOT NULL,
  "attemptId" TEXT NOT NULL,
  "outcome" TEXT NOT NULL,
  "previousShipmentStatus" TEXT NOT NULL,
  "previousAttemptStatus" TEXT NOT NULL,
  "evidenceSource" TEXT NOT NULL,
  "evidenceReference" TEXT NOT NULL,
  "notes" TEXT NOT NULL,
  "trackingNumber" TEXT,
  "labelUrl" TEXT,
  "actor" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BookShipmentReconciliation_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "BookShipmentReconciliation_attemptId_key" ON "BookShipmentReconciliation"("attemptId");
ALTER TABLE "BookShipmentReconciliation" ADD CONSTRAINT "BookShipmentReconciliation_attemptId_fkey"
  FOREIGN KEY ("attemptId") REFERENCES "BookShipmentAttempt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BookShipmentReconciliation" ENABLE ROW LEVEL SECURITY;
COMMIT;
