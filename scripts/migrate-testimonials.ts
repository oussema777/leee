/**
 * One-time migration: copy the demo testimonials from the static data file into
 * the Testimonial table so the (now DB-driven) testimonials page keeps its
 * current content.
 *
 * Testimonials have NO unique slug, so this is made idempotent by guarding on
 * row count: if any testimonials already exist, it logs and skips. Otherwise it
 * creates all demoTestimonials, preserving array order via `order: index`.
 *
 * Field mapping (demo TestimonialItem -> DB Testimonial):
 *   roleEn -> titleEn, roleAr -> titleAr (the model's "title" IS the role),
 *   categorySlug -> category, everything else maps directly.
 *
 * Run: npx tsx scripts/migrate-testimonials.ts
 */
import { PrismaClient } from "@prisma/client";
import { demoTestimonials } from "../src/components/sections/testimonials/testimonialsData";

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.testimonial.count();
  if (existing > 0) {
    console.log(`Skipping migration: ${existing} testimonial(s) already in DB.`);
    return;
  }

  let n = 0;
  for (let index = 0; index < demoTestimonials.length; index++) {
    const t = demoTestimonials[index];
    await prisma.testimonial.create({
      data: {
        nameEn: t.nameEn,
        nameAr: t.nameAr,
        titleEn: t.roleEn,
        titleAr: t.roleAr,
        quoteEn: t.quoteEn,
        quoteAr: t.quoteAr,
        imageUrl: t.imageUrl,
        programEn: t.programEn,
        programAr: t.programAr,
        category: t.categorySlug,
        year: t.year,
        isOriginalCard: t.isOriginalCard ?? false,
        order: index,
        isActive: true,
      },
    });
    n++;
    console.log(`  created: ${t.nameEn}`);
  }
  console.log(`\nDone! ${n} testimonials migrated.`);
}

main().catch((err) => { console.error(err); process.exit(1); }).finally(() => prisma.$disconnect());
