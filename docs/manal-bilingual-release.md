# Manal bilingual ebook — 5 November 2026

The existing `manal-366-days` product includes the Arabic and approved English editions under one paid entitlement. New orders use USD 9.99 (999 cents). Existing order amounts and reader access are preserved; existing paid readers also receive English access.

English source: `Manal Book/output/english_author_review_2026-11-03/Manal_366_Days_English_UPDATED_REVIEW.pdf`, SHA-256 `eefddf85fad8f7cd915c55144cd69f5cb14e70a218162a49ef200d8b2a09e149`. All 385 pages were rendered to private WebP assets and verified byte-for-byte after upload. The PDF and reading pages are excluded from public assets and deployment uploads.

`EbookVersion.editionLanguage` identifies an included, released translation; null versions retain the existing active-version behavior. The reader selects a language within the same product, applies the appropriate direction, and keeps bookmarks scoped to the edition. Paid access, refund/revocation checks, watermarking and private response caching rules apply to both languages. Reading position retains the existing single most-recent-edition behavior.

Production deployment: `dpl_ETBGVi3t1C1CTTgZMmhtAMFBki12`, runtime commit `1622ea9`, promoted on 5 November 2026. The isolated release worktree is `../leee-manal-bilingual-release`, branch `manal-bilingual-20261105`, based on `e875232` from the current Whish release. Do not deploy the older, independently modified main worktree over it.

Validation: 55 ebook tests passed on the release copy, including isolated PostgreSQL purchase, price, language, bookmark and refund checks. TypeScript and the Vercel production build passed. Desktop and mobile browser fixtures passed language switching, image requests and position saves; local fixtures used system fonts because remote font loading stalled. Anonymous reading was denied on the deployed endpoint.

Publication: `scripts/publish-manal-bilingual.mjs` inspects by default; `--apply` verifies private storage, uploads and verifies pages with bounded network retries, then atomically releases the English edition and changes the price/descriptions. `prisma/patches/20261105_ebook_editions.sql` is additive. The release worktree uses the current Prisma adapter; this older main worktree retains its Prisma 6 script constructor.

Public payment methods were already disabled by the existing payment configuration and remain disabled. This release does not enable unapproved payment integrations.
