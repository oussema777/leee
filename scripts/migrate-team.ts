/** Migrate the static team into BoardMember (memberType TEAM). Idempotent: skips if TEAM rows exist. */
import { PrismaClient } from "@prisma/client";
import { teamMembers } from "../src/components/sections/about/aboutData";
const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.boardMember.count({ where: { memberType: "TEAM" } });
  if (existing > 0) { console.log(`Skip: ${existing} TEAM members exist.`); return; }
  let i = 0;
  for (const m of teamMembers) {
    await prisma.boardMember.create({
      data: {
        nameEn: m.nameEn,
        nameAr: m.nameAr,
        titleEn: m.roleEn,
        titleAr: m.roleAr,
        quoteEn: m.quoteEn,
        quoteAr: m.quoteAr,
        imageUrl: m.imageUrl,
        memberType: "TEAM",
        order: i++,
        isActive: true,
      },
    });
  }
  console.log(`Done! ${teamMembers.length} team members created.`);
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
