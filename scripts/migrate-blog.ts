/**
 * One-time migration: copy the demo blog posts from the static data file into the
 * BlogPost table so the (now DB-driven) blog pages keep their current content.
 * Idempotent: upserts by slug, safe to re-run.
 *
 * Run: npx tsx scripts/migrate-blog.ts
 */
import { PrismaClient } from "@prisma/client";
import { demoPosts } from "../src/components/sections/blog/blogData";

const prisma = new PrismaClient();

async function main() {
  let n = 0;
  for (const p of demoPosts) {
    const data = {
      titleEn: p.titleEn,
      titleAr: p.titleAr,
      summaryEn: p.excerptEn,
      summaryAr: p.excerptAr,
      bodyEn: p.contentEn,
      bodyAr: p.contentAr,
      coverImageUrl: p.coverImageUrl ?? null,
      authorName: p.authorNameEn ?? null,
      authorNameAr: p.authorNameAr ?? null,
      authorRole: p.authorRole ?? null,
      authorImageUrl: p.authorImageUrl ?? null,
      readTimeMin: p.readTimeMin ?? null,
      isFeatured: p.isFeatured ?? false,
      category: p.categorySlug ?? null,
      isPublished: true,
      publishedAt: p.publishedAt ? new Date(p.publishedAt) : null,
    };
    await prisma.blogPost.upsert({
      where: { slug: p.slug },
      update: data,
      create: { slug: p.slug, ...data },
    });
    n++;
    console.log(`  upserted: ${p.slug}`);
  }
  console.log(`\nDone! ${n} blog posts migrated.`);
}

main().catch((err) => { console.error(err); process.exit(1); }).finally(() => prisma.$disconnect());
