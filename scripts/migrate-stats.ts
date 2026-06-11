/** Migrate impact stats into the ExperienceNumber table. Idempotent: skips if rows exist. */
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const stats = [
  { labelEn: "Lives Touched", labelAr: "حياة تأثرت", value: 38790, suffix: "+", prefix: "", icon: "users", color: "#5A5A59" },
  { labelEn: "Startups Incubated", labelAr: "شركات ناشئة احتُضنت", value: 2365, suffix: "+", prefix: "", icon: "rocket", color: "#F8B51F" },
  { labelEn: "Funds Mobilized", labelAr: "أموال مُعبأة", value: 3, suffix: "M+", prefix: "$", icon: "coins", color: "#3FAC49" },
  { labelEn: "Countries", labelAr: "دول", value: 10, suffix: "", prefix: "", icon: "globe", color: "#147DBB" },
  { labelEn: "Green Ventures", labelAr: "مشاريع خضراء", value: 60, suffix: "%", prefix: "", icon: "leaf", color: "#ED6E28" },
  { labelEn: "Women Reached", labelAr: "نساء مستفيدات", value: 65, suffix: "%", prefix: "", icon: "heart", color: "#1B3765" },
  { labelEn: "Youth Supported", labelAr: "شباب مدعوم", value: 12400, suffix: "+", prefix: "", icon: "graduation-cap", color: "#5193CF" },
  { labelEn: "Programs Delivered", labelAr: "برامج منفذة", value: 45, suffix: "+", prefix: "", icon: "folder-open", color: "#DE1881" },
];

async function main() {
  const existing = await prisma.experienceNumber.count();
  if (existing > 0) { console.log(`Skip: ${existing} stats exist.`); return; }
  let i = 0;
  for (const s of stats) {
    await prisma.experienceNumber.create({ data: { ...s, order: i++, isActive: true } });
  }
  console.log(`Done! ${stats.length} stats created.`);
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
