/**
 * Replace the expert/mentor PLACEHOLDERS on /about/experts with the 5 real
 * experts collected via the "Expert Profile Submission Form" (Aug 2026 responses).
 *
 * Excluded: Raeda Rashiiny — she selected "internal review only (profile will
 * not be published)" on the final consent question, so she is NOT published.
 *
 * All 5 are EXPERT type (no mentor submissions). Images are intentionally left
 * blank ("") — the client will provide headshots later; the card renders a
 * clean initials avatar in the meantime.
 *
 * Run: node scripts/seed-real-experts.mjs
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const experts = [
  {
    order: 0,
    nameEn: "Yara Kurumilian",
    nameAr: "يارا كوروميليان",
    titleEn: "Project Implementation Expert",
    titleAr: "خبيرة تنفيذ المشاريع",
    bioEn:
      "Yara Kurumilian brings 12 years of experience in NGO project implementation and project-cycle management, with a focus on livelihood and agriculture development. She has served as a proposal writer for national and international organizations and led market studies, partner capacity assessments, and organizational structuring.",
    bioAr:
      "تتمتع يارا كوروميليان بخبرة 12 عاماً في تنفيذ مشاريع المنظمات غير الحكومية وإدارة دورة المشاريع، مع تركيز على مشاريع سبل العيش والتنمية الزراعية. عملت كاتبةً للمقترحات لمنظمات وطنية ودولية، وقادت دراسات السوق وتقييم قدرات الشركاء وإعادة الهيكلة المؤسسية.",
    linkedinUrl: null,
    imageUrl: "",
  },
  {
    order: 1,
    nameEn: "Ziad Al Refai",
    nameAr: "زياد الرفاعي",
    titleEn: "Financial Inclusion & Microfinance Consultant",
    titleAr: "مستشار في الشمول المالي والتمويل الأصغر",
    bioEn:
      "Ziad Al Refai is a financial-inclusion consultant with 20+ years across MSME finance, microfinance, and Sharia-compliant finance in the MENA region. An ILO/CGAP-certified trainer and EFQM Lead Assessor, he has led institutional development and product innovation projects with the World Bank, IFC, GIZ, and the EU.",
    bioAr:
      "زياد الرفاعي مستشار في الشمول المالي يمتلك أكثر من 20 عاماً من الخبرة في تمويل المشاريع الصغيرة والمتوسطة والتمويل الأصغر والتمويل المتوافق مع الشريعة في منطقة الشرق الأوسط وشمال أفريقيا. وهو مدرّب معتمد من منظمة العمل الدولية و«CGAP» ومقيّم رئيسي معتمد من «EFQM»، وقد قاد مشاريع للتطوير المؤسسي وابتكار المنتجات مع البنك الدولي ومؤسسة التمويل الدولية و«GIZ» والاتحاد الأوروبي.",
    linkedinUrl: "https://www.linkedin.com/in/ziadalrefai",
    imageUrl: "",
  },
  {
    order: 2,
    nameEn: "Oussama Lamine",
    nameAr: "أسامة لمين",
    titleEn: "Innovation & Digital Strategy Consultant",
    titleAr: "مستشار الابتكار والاستراتيجية الرقمية",
    bioEn:
      "Oussama Lamine has over 5 years of experience in digital strategy, innovation consulting, and brand development across Tunisia and the MENA region. He led digital transformation for RedStart Tunisie and digital communications for CONECT, with engagements for GIZ, IACE, and Sharek. He now leads iLab TN, advising startups, SMEs, and institutions on digital strategy, product design, and go-to-market execution.",
    bioAr:
      "يمتلك أسامة لمين أكثر من 5 سنوات من الخبرة في الاستراتيجية الرقمية والاستشارات في مجال الابتكار وتطوير العلامات التجارية في تونس ومنطقة الشرق الأوسط وشمال أفريقيا. قاد التحول الرقمي لـ«RedStart Tunisie» والاتصالات الرقمية لـ«CONECT»، مع مهام استشارية لصالح «GIZ» و«IACE» و«Sharek». ويقود حالياً «iLab TN»، حيث يقدّم المشورة للشركات الناشئة والمؤسسات الصغيرة والمتوسطة والمؤسسات في الاستراتيجية الرقمية وتصميم المنتجات والانتشار في السوق.",
    linkedinUrl: "https://tn.linkedin.com/in/oussema-lamine",
    imageUrl: "",
  },
  {
    order: 3,
    nameEn: "Darine Saleh",
    nameAr: "دارين صالح",
    titleEn: "Clinical Psychologist & Psychotherapist",
    titleAr: "أخصائية نفسية سريرية ومعالجة نفسية",
    bioEn:
      "Darine Saleh is a licensed clinical psychologist with 20+ years in trauma-informed and psychosocial support and a member of LOPSY. She founded the NouNaïDa School for Holistic Mental Health & Clinical Yoga Therapy and created the Blindfold Yoga Therapy method in Lebanon. She specializes in analytical therapy, yoga and meditation for adults and children, and psychology for the deaf and blind.",
    bioAr:
      "دارين صالح أخصائية نفسية سريرية مرخّصة تتمتع بخبرة تتجاوز 20 عاماً في الدعم النفسي والاجتماعي القائم على مراعاة الصدمات، وهي عضو في نقابة علماء النفس (LOPSY). أسّست مدرسة «NouNaïDa» للصحة النفسية الشمولية والعلاج السريري باليوغا، وابتكرت طريقة «Blindfold Yoga Therapy» في لبنان. تتخصص في العلاج التحليلي واليوغا والتأمل للبالغين والأطفال وعلم النفس للصمّ والمكفوفين.",
    linkedinUrl: null,
    imageUrl: "",
  },
  {
    order: 4,
    nameEn: "Maya Kassem",
    nameAr: "مايا قاسم",
    titleEn: "Training Manager",
    titleAr: "مديرة التدريب",
    bioEn:
      "Maya Kassem is a training manager with 16–20 years of experience in capacity building, training and development, and performance management. A certified coach and trainer holding an MBA in Business Administration and AI, she designs and delivers programs that strengthen organizational and individual performance.",
    bioAr:
      "مايا قاسم مديرة تدريب تتمتع بخبرة تتراوح بين 16 و20 عاماً في بناء القدرات والتدريب والتطوير وإدارة الأداء. وهي مدرّبة ومدرّبة معتمدة (Certified Coach & Trainer) وتحمل ماجستيراً في إدارة الأعمال والذكاء الاصطناعي، وتصمّم وتقدّم برامج تعزّز الأداء المؤسسي والفردي.",
    linkedinUrl: "https://www.linkedin.com/in/maya-kasem-8603836b/",
    imageUrl: "",
  },
];

async function main() {
  const existing = await prisma.boardMember.findMany({
    where: { memberType: { in: ["EXPERT", "MENTOR"] } },
    select: { id: true, nameEn: true },
  });
  console.log(`Found ${existing.length} existing EXPERT/MENTOR rows (placeholders):`);
  existing.forEach((r) => console.log(`  - ${r.nameEn}`));

  await prisma.$transaction([
    prisma.boardMember.deleteMany({ where: { memberType: { in: ["EXPERT", "MENTOR"] } } }),
    ...experts.map((e) =>
      prisma.boardMember.create({
        data: {
          nameEn: e.nameEn,
          nameAr: e.nameAr,
          titleEn: e.titleEn,
          titleAr: e.titleAr,
          bioEn: e.bioEn,
          bioAr: e.bioAr,
          imageUrl: e.imageUrl,
          linkedinUrl: e.linkedinUrl,
          order: e.order,
          isActive: true,
          memberType: "EXPERT",
        },
      })
    ),
  ]);

  const after = await prisma.boardMember.findMany({
    where: { memberType: { in: ["EXPERT", "MENTOR"] } },
    orderBy: { order: "asc" },
    select: { nameEn: true, titleEn: true, memberType: true, linkedinUrl: true, imageUrl: true },
  });
  console.log(`\nDone. Now ${after.length} experts live:`);
  after.forEach((r) =>
    console.log(
      `  [${r.memberType}] ${r.nameEn} — ${r.titleEn}` +
        `${r.linkedinUrl ? " (LinkedIn ✓)" : ""}${r.imageUrl ? "" : " (no photo yet)"}`
    )
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
