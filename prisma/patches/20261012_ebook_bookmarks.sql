CREATE TABLE IF NOT EXISTS "EbookBookmark" (
  "accessId" TEXT NOT NULL REFERENCES "EbookAccess"("id") ON DELETE CASCADE,
  "versionId" TEXT NOT NULL,
  "page" INTEGER NOT NULL CHECK ("page" > 0),
  "label" TEXT NOT NULL DEFAULT '',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("accessId", "versionId", "page")
);
ALTER TABLE "EbookBookmark" ENABLE ROW LEVEL SECURITY;
