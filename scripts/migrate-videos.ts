/**
 * One-time migration: copy the demo videos from the static data file into the
 * Video table so the (now DB-driven) videos page keeps its current content.
 *
 * Videos have NO unique slug, so this is made idempotent the simple way:
 * if any videos already exist, log and skip; otherwise create them all.
 *
 * Run: npx tsx scripts/migrate-videos.ts
 */
import { PrismaClient } from "@prisma/client";
import { demoVideos } from "../src/components/sections/videos/videosData";

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.video.count();
  if (existing > 0) {
    console.log(`Videos table already has ${existing} row(s) — skipping migration.`);
    return;
  }

  let n = 0;
  for (const [index, v] of demoVideos.entries()) {
    await prisma.video.create({
      data: {
        titleEn: v.titleEn,
        titleAr: v.titleAr,
        descriptionEn: v.descriptionEn,
        descriptionAr: v.descriptionAr,
        youtubeUrl: v.youtubeUrl,
        category: v.categorySlug,
        order: index,
        isActive: true,
      },
    });
    n++;
    console.log(`  created: ${v.titleEn}`);
  }
  console.log(`\nDone! ${n} videos migrated.`);
}

main().catch((err) => { console.error(err); process.exit(1); }).finally(() => prisma.$disconnect());
