-- Allow one catalogue title to attribute its available copies to several donors.
CREATE TABLE IF NOT EXISTS "BookInventoryDonorAllocation" (
  "id" TEXT NOT NULL,
  "inventoryItemId" TEXT NOT NULL,
  "donorId" TEXT NOT NULL,
  "stockQuantity" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BookInventoryDonorAllocation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "BookInventoryDonorAllocation_inventoryItemId_donorId_key"
  ON "BookInventoryDonorAllocation"("inventoryItemId", "donorId");
CREATE INDEX IF NOT EXISTS "BookInventoryDonorAllocation_donorId_idx"
  ON "BookInventoryDonorAllocation"("donorId");
CREATE INDEX IF NOT EXISTS "BookInventoryDonorAllocation_inventoryItemId_stockQuantity_idx"
  ON "BookInventoryDonorAllocation"("inventoryItemId", "stockQuantity");

DO $$ BEGIN
  ALTER TABLE "BookInventoryDonorAllocation"
    ADD CONSTRAINT "BookInventoryDonorAllocation_inventoryItemId_fkey"
    FOREIGN KEY ("inventoryItemId") REFERENCES "BookInventoryItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "BookInventoryDonorAllocation"
    ADD CONSTRAINT "BookInventoryDonorAllocation_donorId_fkey"
    FOREIGN KEY ("donorId") REFERENCES "BookDonor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "BookOrderItem" ADD COLUMN IF NOT EXISTS "donorAllocationId" TEXT;
CREATE INDEX IF NOT EXISTS "BookOrderItem_donorAllocationId_idx" ON "BookOrderItem"("donorAllocationId");
DO $$ BEGIN
  ALTER TABLE "BookOrderItem"
    ADD CONSTRAINT "BookOrderItem_donorAllocationId_fkey"
    FOREIGN KEY ("donorAllocationId") REFERENCES "BookInventoryDonorAllocation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Preserve every existing single-donor attribution and assign its currently
-- available stock to that donor. The legacy donorId remains as a compatibility
-- fallback and can be removed in a later cleanup migration.
INSERT INTO "BookInventoryDonorAllocation" (
  "id", "inventoryItemId", "donorId", "stockQuantity", "updatedAt"
)
SELECT
  'donor-allocation-' || b."id", b."id", b."donorId", b."stockQuantity", CURRENT_TIMESTAMP
FROM "BookInventoryItem" b
WHERE b."donorId" IS NOT NULL
ON CONFLICT ("inventoryItemId", "donorId") DO NOTHING;
