-- CreateEnum
-- Additive migration: no physical-book rows are changed.
CREATE TYPE "EbookOrderState" AS ENUM ('AWAITING_PAYMENT', 'UNDER_REVIEW', 'CHANGES_REQUESTED', 'VERIFIED', 'CANCELLED', 'REFUNDED');

-- CreateTable
CREATE TABLE "Ebook" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "titleAr" TEXT NOT NULL DEFAULT '',
    "author" TEXT NOT NULL,
    "descriptionEn" TEXT NOT NULL DEFAULT '',
    "descriptionAr" TEXT NOT NULL DEFAULT '',
    "coverUrl" TEXT NOT NULL DEFAULT '',
    "priceCents" INTEGER NOT NULL,
    "direction" TEXT NOT NULL DEFAULT 'rtl',
    "published" BOOLEAN NOT NULL DEFAULT false,
    "activeVersionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ebook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EbookVersion" (
    "id" TEXT NOT NULL,
    "ebookId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "pageCount" INTEGER NOT NULL,
    "ready" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EbookVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EbookPage" (
    "id" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "storagePath" TEXT NOT NULL,

    CONSTRAINT "EbookPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EbookReader" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EbookReader_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EbookLoginCode" (
    "email" TEXT NOT NULL,
    "digest" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EbookLoginCode_pkey" PRIMARY KEY ("email")
);

-- CreateTable
CREATE TABLE "EbookSession" (
    "id" TEXT NOT NULL,
    "readerId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EbookSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EbookRateLimit" (
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EbookRateLimit_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "EbookOrder" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "readerId" TEXT NOT NULL,
    "ebookId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "method" TEXT NOT NULL,
    "snapshot" JSONB NOT NULL,
    "state" "EbookOrderState" NOT NULL DEFAULT 'AWAITING_PAYMENT',
    "submittedReference" TEXT,
    "verifiedReference" TEXT,
    "customerNote" TEXT NOT NULL DEFAULT '',
    "receiptPath" TEXT,
    "termsVersion" TEXT NOT NULL DEFAULT 'ebook-online-v1',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EbookOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EbookAccess" (
    "id" TEXT NOT NULL,
    "readerId" TEXT NOT NULL,
    "ebookId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastPage" INTEGER NOT NULL DEFAULT 1,
    "progressVersionId" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EbookAccess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EbookOrderEvent" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EbookOrderEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EbookEmail" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "html" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "cancelled" BOOLEAN NOT NULL DEFAULT false,
    "sentAt" TIMESTAMP(3),
    "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EbookEmail_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Ebook_slug_key" ON "Ebook"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Ebook_activeVersionId_key" ON "Ebook"("activeVersionId");

-- CreateIndex
CREATE INDEX "EbookVersion_ebookId_idx" ON "EbookVersion"("ebookId");

-- CreateIndex
CREATE UNIQUE INDEX "EbookPage_versionId_number_key" ON "EbookPage"("versionId", "number");

-- CreateIndex
CREATE UNIQUE INDEX "EbookReader_email_key" ON "EbookReader"("email");

-- CreateIndex
CREATE INDEX "EbookSession_readerId_idx" ON "EbookSession"("readerId");

-- CreateIndex
CREATE UNIQUE INDEX "EbookOrder_reference_key" ON "EbookOrder"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "EbookOrder_verifiedReference_key" ON "EbookOrder"("verifiedReference");

-- CreateIndex
CREATE INDEX "EbookOrder_readerId_ebookId_idx" ON "EbookOrder"("readerId", "ebookId");

-- CreateIndex
CREATE INDEX "EbookOrder_state_createdAt_idx" ON "EbookOrder"("state", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "EbookAccess_orderId_key" ON "EbookAccess"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "EbookAccess_readerId_ebookId_key" ON "EbookAccess"("readerId", "ebookId");

-- CreateIndex
CREATE INDEX "EbookOrderEvent_orderId_createdAt_idx" ON "EbookOrderEvent"("orderId", "createdAt");

-- CreateIndex
CREATE INDEX "EbookEmail_sentAt_nextAttemptAt_idx" ON "EbookEmail"("sentAt", "nextAttemptAt");

-- CreateIndex
CREATE INDEX "EbookEmail_orderId_idx" ON "EbookEmail"("orderId");

-- AddForeignKey
ALTER TABLE "Ebook" ADD CONSTRAINT "Ebook_activeVersionId_fkey" FOREIGN KEY ("activeVersionId") REFERENCES "EbookVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EbookVersion" ADD CONSTRAINT "EbookVersion_ebookId_fkey" FOREIGN KEY ("ebookId") REFERENCES "Ebook"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EbookPage" ADD CONSTRAINT "EbookPage_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "EbookVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EbookSession" ADD CONSTRAINT "EbookSession_readerId_fkey" FOREIGN KEY ("readerId") REFERENCES "EbookReader"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EbookOrder" ADD CONSTRAINT "EbookOrder_readerId_fkey" FOREIGN KEY ("readerId") REFERENCES "EbookReader"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EbookOrder" ADD CONSTRAINT "EbookOrder_ebookId_fkey" FOREIGN KEY ("ebookId") REFERENCES "Ebook"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EbookAccess" ADD CONSTRAINT "EbookAccess_readerId_fkey" FOREIGN KEY ("readerId") REFERENCES "EbookReader"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EbookAccess" ADD CONSTRAINT "EbookAccess_ebookId_fkey" FOREIGN KEY ("ebookId") REFERENCES "Ebook"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EbookAccess" ADD CONSTRAINT "EbookAccess_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "EbookOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EbookOrderEvent" ADD CONSTRAINT "EbookOrderEvent_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "EbookOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EbookEmail" ADD CONSTRAINT "EbookEmail_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "EbookOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- No anonymous/authenticated PostgREST access. All ebook authorization is server-side.
ALTER TABLE "Ebook" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EbookVersion" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EbookPage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EbookReader" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EbookSession" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EbookLoginCode" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EbookRateLimit" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EbookOrder" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EbookAccess" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EbookOrderEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EbookEmail" ENABLE ROW LEVEL SECURITY;
