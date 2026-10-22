BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';

-- Additive change only. Apply once; do not use db push on the shared database.
-- CreateTable
CREATE TABLE "BookShipment" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'ARAMEX',
    "environment" TEXT NOT NULL DEFAULT 'UAT',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 1,
    "input" JSONB NOT NULL,
    "preparation" JSONB NOT NULL,
    "orderFingerprint" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BookShipment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BookShipment_orderId_key" ON "BookShipment"("orderId");

-- AddForeignKey
ALTER TABLE "BookShipment" ADD CONSTRAINT "BookShipment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "BookOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Private customer data: access through the authenticated server only.
-- No browser/anon/authenticated Supabase policies are granted.
ALTER TABLE "BookShipment" ENABLE ROW LEVEL SECURITY;

COMMIT;
