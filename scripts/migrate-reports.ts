/**
 * One-time migration: copy the demo reports from the static data file into the
 * Report table so the (now DB-driven) reports page keeps its current content.
 *
 * Reports have NO unique slug, so this is made idempotent the simple way:
 * if any reports already exist, log and skip; otherwise create them all.
 *
 * Run: npx tsx scripts/migrate-reports.ts
 */
import { PrismaClient } from "@prisma/client";
import { demoReports } from "../src/components/sections/reports/reportsData";

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.report.count();
  if (existing > 0) {
    console.log(`Reports table already has ${existing} row(s) — skipping migration.`);
    return;
  }

  let n = 0;
  for (const r of demoReports) {
    await prisma.report.create({
      data: {
        titleEn: r.titleEn,
        titleAr: r.titleAr,
        descriptionEn: r.descriptionEn,
        descriptionAr: r.descriptionAr,
        coverImageUrl: r.coverImageUrl,
        fileUrl: r.fileUrl,
        category: r.categorySlug,
        year: r.year,
        isActive: true,
      },
    });
    n++;
    console.log(`  created: ${r.titleEn}`);
  }
  console.log(`\nDone! ${n} reports migrated.`);
}

main().catch((err) => { console.error(err); process.exit(1); }).finally(() => prisma.$disconnect());
