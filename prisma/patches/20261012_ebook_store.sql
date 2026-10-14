-- Apply after 20261012_ebooks.sql. Only digital catalogue metadata is changed.
ALTER TABLE "Ebook" ADD COLUMN IF NOT EXISTS "language" "BookLanguage" NOT NULL DEFAULT 'ARABIC';
ALTER TABLE "Ebook" ADD COLUMN IF NOT EXISTS "categories" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
