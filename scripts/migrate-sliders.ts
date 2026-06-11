/** Seed the homepage hero carousel (Slider table). Idempotent: skips if rows exist. */
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const slides = [
  {
    titleEn: "We turn mindset\ninto movement",
    titleAr: "نحوّل العقلية\nإلى حركة",
    subtitleEn: "Empowering women & youth through green, tech-oriented, and inclusive business development.",
    subtitleAr: "تمكين النساء والشباب من خلال التنمية الخضراء والتقنية والشاملة للأعمال.",
    ctaLabelEn: "Explore Our Programs",
    ctaLabelAr: "اكتشف برامجنا",
    ctaUrl: "/programs",
    imageUrl: "/images/projects/seketak-acceleration-investment-readiness-2025/cover.jpg",
  },
  {
    titleEn: "Real programs.\nReal impact.",
    titleAr: "برامج حقيقية.\nأثر حقيقي.",
    subtitleEn: "38,790+ lives touched across 10+ countries in MENA and Africa.",
    subtitleAr: "أكثر من 38,790 حياة تأثرت في أكثر من 10 دول عبر الشرق الأوسط وأفريقيا.",
    ctaLabelEn: "See Our Impact",
    ctaLabelAr: "اطّلع على أثرنا",
    ctaUrl: "/impact",
    imageUrl: "/images/projects/prospects-entrepreneurship-agriculture/cover.jpg",
  },
  {
    titleEn: "Join the\nentrepreneurs",
    titleAr: "انضم إلى\nرواد الأعمال",
    subtitleEn: "From idea to launch, we back women and youth building the future.",
    subtitleAr: "من الفكرة إلى الإطلاق، ندعم النساء والشباب الذين يبنون المستقبل.",
    ctaLabelEn: "Get Involved",
    ctaLabelAr: "شارك معنا",
    ctaUrl: "/get-involved",
    imageUrl: "/images/new/pitch-winner.jpg",
  },
];

async function main() {
  const existing = await prisma.slider.count();
  if (existing > 0) { console.log(`Skip: ${existing} sliders exist.`); return; }
  let i = 0;
  for (const s of slides) {
    await prisma.slider.create({ data: { ...s, order: i++, isActive: true } });
  }
  console.log(`Done! ${slides.length} slides created.`);
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
