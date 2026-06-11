/** Migrate core values into the CoreValue table. Idempotent: skips if rows exist. */
import { PrismaClient } from "@prisma/client";
import { coreValues } from "../src/components/sections/about/aboutData";
const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.coreValue.count();
  if (existing > 0) { console.log(`Skip: ${existing} core values exist.`); return; }
  let i = 0;
  for (const v of coreValues) {
    await prisma.coreValue.create({
      data: {
        titleEn: v.nameEn,
        titleAr: v.nameAr,
        descriptionEn: v.descriptionEn,
        descriptionAr: v.descriptionAr,
        storyEn: v.storyEn,
        storyAr: v.storyAr,
        sdgNumber: v.sdgNumber,
        icon: v.icon,
        order: i++,
        isActive: true,
      },
    });
  }
  console.log(`Done! ${coreValues.length} core values created.`);
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
