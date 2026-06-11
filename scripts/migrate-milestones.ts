/** Migrate timeline into the SuccessMilestone table. Idempotent: skips if rows exist. */
import { PrismaClient } from "@prisma/client";
import { timelineData } from "../src/components/sections/about/aboutData";
const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.successMilestone.count();
  if (existing > 0) { console.log(`Skip: ${existing} milestones exist.`); return; }
  let i = 0;
  for (const m of timelineData) {
    await prisma.successMilestone.create({
      data: {
        year: m.year,
        titleEn: m.titleEn,
        titleAr: m.titleAr,
        descriptionEn: m.descriptionEn,
        descriptionAr: m.descriptionAr,
        imageUrl: m.imageUrl,
        order: i++,
      },
    });
  }
  console.log(`Done! ${timelineData.length} milestones created.`);
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
