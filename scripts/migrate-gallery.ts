/**
 * One-time migration: copy the demo gallery images from the static data file
 * into the GalleryImage table so the (now DB-driven) gallery page keeps its
 * current content.
 *
 * Gallery images have NO unique slug, so this is made idempotent the simple way:
 * if any gallery images already exist, log and skip; otherwise create them all.
 *
 * Field mapping (demo GalleryImage -> DB GalleryImage):
 *   albumSlug -> albumSlug; imageUrl, captionEn, captionAr map directly.
 *   order is set from the array index. albumName/albumNameAr are left null
 *   (the public filter uses albumSlug + the static `albums` list for labels).
 *
 * Run: npx tsx scripts/migrate-gallery.ts
 */
import { PrismaClient } from "@prisma/client";
import { galleryImages } from "../src/components/sections/gallery/galleryData";

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.galleryImage.count();
  if (existing > 0) {
    console.log(`GalleryImage table already has ${existing} row(s) — skipping migration.`);
    return;
  }

  let n = 0;
  for (const [index, img] of galleryImages.entries()) {
    await prisma.galleryImage.create({
      data: {
        imageUrl: img.imageUrl,
        captionEn: img.captionEn,
        captionAr: img.captionAr,
        albumSlug: img.albumSlug,
        order: index,
        isActive: true,
      },
    });
    n++;
    console.log(`  created: ${img.captionEn}`);
  }
  console.log(`\nDone! ${n} gallery images migrated.`);
}

main().catch((err) => { console.error(err); process.exit(1); }).finally(() => prisma.$disconnect());
