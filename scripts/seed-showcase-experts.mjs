/**
 * Seeds placeholder EXPERT / MENTOR members for the About "Our Experts & Mentors"
 * showcase. Idempotent: only seeds if there are currently zero EXPERT/MENTOR members.
 * The client replaces/edits these in /admin → Members.
 *
 * Run: npx tsx scripts/seed-showcase-experts.mjs
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const placeholders = [
  { memberType: "EXPERT", nameEn: "Expert Placeholder One", nameAr: "خبير افتراضي ١", titleEn: "Business Development Expert", titleAr: "خبير تطوير الأعمال", order: 0 },
  { memberType: "EXPERT", nameEn: "Expert Placeholder Two", nameAr: "خبير افتراضي ٢", titleEn: "Digital Marketing Expert", titleAr: "خبير التسويق الرقمي", order: 1 },
  { memberType: "MENTOR", nameEn: "Mentor Placeholder One", nameAr: "مرشد افتراضي ١", titleEn: "Entrepreneurship Mentor", titleAr: "مرشد ريادة الأعمال", order: 0 },
  { memberType: "MENTOR", nameEn: "Mentor Placeholder Two", nameAr: "مرشد افتراضي ٢", titleEn: "Green Economy Mentor", titleAr: "مرشد الاقتصاد الأخضر", order: 1 },
];

async function main() {
  const existing = await prisma.boardMember.count({
    where: { memberType: { in: ["EXPERT", "MENTOR"] } },
  });

  if (existing > 0) {
    console.log(`Skipped: ${existing} EXPERT/MENTOR member(s) already exist. No placeholders created.`);
    return;
  }

  for (const p of placeholders) {
    await prisma.boardMember.create({
      data: {
        nameEn: p.nameEn,
        nameAr: p.nameAr,
        titleEn: p.titleEn,
        titleAr: p.titleAr,
        bioEn: "Placeholder — edit or replace this profile in the admin dashboard.",
        bioAr: "نص افتراضي — يمكنك تعديل هذا الملف أو استبداله من لوحة التحكم.",
        imageUrl: "",
        memberType: p.memberType,
        order: p.order,
        isActive: true,
      },
    });
    console.log(`  CREATED ${p.memberType}: ${p.nameEn}`);
  }

  console.log(`\nDone! Created ${placeholders.length} placeholder showcase members.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
