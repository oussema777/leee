/**
 * One-time migration: copy the demo events from the static data file into the
 * Event table so the (now DB-driven) events pages keep their current content.
 * Idempotent: upserts by slug, safe to re-run.
 *
 * Run: npx tsx scripts/migrate-events.ts
 */
import { PrismaClient } from "@prisma/client";
import { demoEvents } from "../src/components/sections/events/eventsData";

const prisma = new PrismaClient();

async function main() {
  let n = 0;
  for (const e of demoEvents) {
    const data = {
      titleEn: e.titleEn,
      titleAr: e.titleAr,
      summaryEn: e.summaryEn,
      summaryAr: e.summaryAr,
      descriptionEn: e.descriptionEn,
      descriptionAr: e.descriptionAr,
      imageUrl: e.imageUrl,
      location: e.location,
      locationAr: e.locationAr,
      category: e.category,
      galleryImages: e.galleryImages ?? [],
      startDate: new Date(e.startDate),
      endDate: e.endDate ? new Date(e.endDate) : null,
      registrationUrl: e.registrationUrl ?? null,
      isFeatured: e.isFeatured ?? false,
      isActive: true,
    };
    await prisma.event.upsert({
      where: { slug: e.slug },
      update: data,
      create: { slug: e.slug, ...data },
    });
    n++;
    console.log(`  upserted: ${e.slug}`);
  }
  console.log(`\nDone! ${n} events migrated.`);
}

main().catch((err) => { console.error(err); process.exit(1); }).finally(() => prisma.$disconnect());
