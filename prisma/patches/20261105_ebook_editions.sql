ALTER TABLE "EbookVersion" ADD COLUMN IF NOT EXISTS "editionLanguage" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "EbookVersion_ebookId_editionLanguage_key" ON "EbookVersion"("ebookId", "editionLanguage");
