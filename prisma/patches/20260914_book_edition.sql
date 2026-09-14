-- One catalogue book can have several editions with independent stock.
CREATE TABLE IF NOT EXISTS "BookInventoryEdition" (
  "id" TEXT NOT NULL,
  "inventoryItemId" TEXT NOT NULL,
  "label" TEXT,
  "publicationYear" INTEGER,
  "stockQuantity" INTEGER NOT NULL DEFAULT 1,
  "coverImageUrl" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BookInventoryEdition_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "BookInventoryEdition_inventoryItemId_active_idx"
  ON "BookInventoryEdition"("inventoryItemId", "active");

DO $$ BEGIN
  ALTER TABLE "BookInventoryEdition" ADD CONSTRAINT "BookInventoryEdition_inventoryItemId_fkey"
    FOREIGN KEY ("inventoryItemId") REFERENCES "BookInventoryItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE "BookOrderItem" ADD COLUMN IF NOT EXISTS "editionId" TEXT;
CREATE INDEX IF NOT EXISTS "BookOrderItem_editionId_idx" ON "BookOrderItem"("editionId");

DO $$ BEGIN
  ALTER TABLE "BookOrderItem" ADD CONSTRAINT "BookOrderItem_editionId_fkey"
    FOREIGN KEY ("editionId") REFERENCES "BookInventoryEdition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Existing stock becomes one default edition, preserving all current books and orders.
INSERT INTO "BookInventoryEdition" ("id", "inventoryItemId", "label", "publicationYear", "stockQuantity", "coverImageUrl", "active", "updatedAt")
SELECT 'edition-' || b."id", b."id", NULL, b."publicationYear", b."stockQuantity", NULL, true, CURRENT_TIMESTAMP
FROM "BookInventoryItem" b
WHERE NOT EXISTS (SELECT 1 FROM "BookInventoryEdition" e WHERE e."inventoryItemId" = b."id");

UPDATE "BookOrderItem" oi
SET "editionId" = e."id"
FROM "BookInventoryEdition" e
WHERE oi."editionId" IS NULL AND e."inventoryItemId" = oi."inventoryItemId"
  AND e."id" = (SELECT e2."id" FROM "BookInventoryEdition" e2 WHERE e2."inventoryItemId" = oi."inventoryItemId" ORDER BY e2."createdAt" LIMIT 1);
