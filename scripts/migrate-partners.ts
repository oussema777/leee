/** Migrate partner logos into the Partner table. Idempotent: skips if rows exist. */
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const partners = [
  { nameEn: "ILO", logoUrl: "/images/partners/ILO.png" },
  { nameEn: "European Union", logoUrl: "/images/partners/European Union.png" },
  { nameEn: "UNDP", logoUrl: "/images/partners/UNDP_logo.svg.png" },
  { nameEn: "World Food Programme", logoUrl: "/images/partners/WFP.png" },
  { nameEn: "World Bank", logoUrl: "/images/partners/World Bank.jpg" },
  { nameEn: "IRC", logoUrl: "/images/partners/IRC.png" },
  { nameEn: "UNIFIL", logoUrl: "/images/partners/UNIFIL.jpg" },
  { nameEn: "Canada Embassy", logoUrl: "/images/partners/Canada Embassy.png" },
  { nameEn: "Netherlands Embassy", logoUrl: "/images/partners/logo-netherlands-embassy.png" },
  { nameEn: "Norway Embassy", logoUrl: "/images/partners/Norway Embassy.png" },
  { nameEn: "BMZ Germany", logoUrl: "/images/partners/BMZ Germany.jpg" },
  { nameEn: "PROSPECTS", logoUrl: "/images/partners/PROSPECTS.png" },
  { nameEn: "Oxfam", logoUrl: "/images/partners/Oxfam.webp" },
  { nameEn: "CAWTAR", logoUrl: "/images/partners/CAWTAR.jpg" },
  { nameEn: "Kvinna till Kvinna", logoUrl: "/images/partners/Kvinna till Kvinna.jpg" },
  { nameEn: "Solidarités International", logoUrl: "/images/partners/Solidarités Int..jpg" },
  { nameEn: "Relief International", logoUrl: "/images/partners/Relief Int..jpg" },
  { nameEn: "Action Against Hunger", logoUrl: "/images/partners/Action Against Hunger.png" },
  { nameEn: "WHH", logoUrl: "/images/partners/WHH.png" },
  { nameEn: "Lutheran World Relief", logoUrl: "/images/partners/Lutheran WR.webp" },
  { nameEn: "International Alert", logoUrl: "/images/partners/Int. Alert.png" },
];

async function main() {
  const existing = await prisma.partner.count();
  if (existing > 0) { console.log(`Skip: ${existing} partners exist.`); return; }
  let i = 0;
  for (const p of partners) {
    await prisma.partner.create({ data: { nameEn: p.nameEn, nameAr: p.nameEn, logoUrl: p.logoUrl, type: "PARTNER", order: i++, isActive: true } });
  }
  console.log(`Done! ${partners.length} partners created.`);
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
