-- Add multiple categories without changing or removing existing classifications.
-- Existing records use their original category until edited in the inventory.
ALTER TABLE "BookInventoryItem"
  ADD COLUMN IF NOT EXISTS "categories" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
