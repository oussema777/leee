import { PrismaClient } from "@prisma/client";
import { trackRecordProjects } from "./track-record-data";

const prisma = new PrismaClient();

async function main() {
  // ── 1. Upsert Pillars ──────────────────────────────────────────
  const pillarData = [
    { slug: "incubators", titleEn: "LEE Incubators", titleAr: "حاضنات LEE", descriptionEn: "Supporting startups and social enterprises through comprehensive incubation programs, seed funding, and market access.", descriptionAr: "دعم الشركات الناشئة والمؤسسات الاجتماعية من خلال برامج حاضنات شاملة والتمويل الأولي والوصول إلى الأسواق.", order: 0 },
    { slug: "coaching", titleEn: "LEE Business Clinic", titleAr: "عيادة الأعمال LEE", descriptionEn: "Expert guidance, one-on-one mentorship, and business clinic sessions to develop skills and leadership.", descriptionAr: "توجيه الخبراء والإرشاد الفردي وجلسات عيادة الأعمال لتطوير المهارات والقيادة.", order: 1 },
    { slug: "technical-assistance", titleEn: "Technical Assistance", titleAr: "المساعدة الفنية", descriptionEn: "Building organizational capacity through tailored training, technical support, and capacity building programs.", descriptionAr: "بناء القدرات المؤسسية من خلال التدريب المخصص والدعم الفني وبرامج بناء القدرات.", order: 2 },
    { slug: "academy", titleEn: "LEE Academy", titleAr: "أكاديمية LEE", descriptionEn: "Comprehensive learning programs including ILO-certified training for professional and personal development.", descriptionAr: "برامج تعلم شاملة بما في ذلك التدريب المعتمد من منظمة العمل الدولية للتطوير المهني والشخصي.", order: 3 },
    { slug: "digital-media-hub", titleEn: "LEE Digital Media Hub", titleAr: "مركز LEE للإعلام الرقمي", descriptionEn: "Digital campaigns, content creation, and media solutions amplifying impact stories across the region.", descriptionAr: "حملات رقمية وإنشاء محتوى وحلول إعلامية تعزز قصص الأثر عبر المنطقة.", order: 4 },
    { slug: "humanitarian-aid", titleEn: "LEE Humanitarian Aid", titleAr: "المساعدات الإنسانية LEE", descriptionEn: "Emergency response, food security, and livelihood support for vulnerable communities and displaced families.", descriptionAr: "الاستجابة الطارئة والأمن الغذائي ودعم سبل العيش للمجتمعات الضعيفة والعائلات النازحة.", order: 5 },
    { slug: "research", titleEn: "Research & Data", titleAr: "البحث والبيانات", descriptionEn: "Evidence-based research and data analysis to drive informed decisions and policy making.", descriptionAr: "بحث قائم على الأدلة وتحليل البيانات لدفع القرارات المستنيرة وصنع السياسات.", order: 6 },
    { slug: "marketing", titleEn: "Marketing & Comm.", titleAr: "التسويق والتواصل", descriptionEn: "Strategic marketing and communication solutions for impactful outreach and brand building.", descriptionAr: "حلول تسويق وتواصل استراتيجية للوصول المؤثر وبناء العلامة التجارية.", order: 7 },
  ];

  const pillarMap: Record<string, string> = {};

  for (const p of pillarData) {
    const pillar = await prisma.pillar.upsert({
      where: { slug: p.slug },
      update: {},
      create: p,
    });
    pillarMap[p.slug] = pillar.id;
    console.log(`  Pillar: ${p.titleEn} (${pillar.id})`);
  }

  // ── 2. Upsert Programs from Track Record ─────────────────────
  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const proj of trackRecordProjects) {
    const { pillarSlug, stats, images, ...rest } = proj;

    const pillarId = pillarMap[pillarSlug];
    if (!pillarId) {
      console.log(`  SKIP (pillar not found: ${pillarSlug}): ${proj.slug}`);
      skipped++;
      continue;
    }

    const existing = await prisma.program.findUnique({ where: { slug: proj.slug } });

    if (existing) {
      // Update existing program with latest data
      await prisma.program.update({
        where: { slug: proj.slug },
        data: {
          titleEn: rest.titleEn,
          titleAr: rest.titleAr,
          summaryEn: rest.summaryEn,
          summaryAr: rest.summaryAr,
          bodyEn: rest.bodyEn,
          bodyAr: rest.bodyAr,
          coverImageUrl: rest.coverImageUrl,
          status: rest.status,
          year: rest.year,
          donorEn: rest.donorEn,
          donorAr: rest.donorAr,
          locationEn: rest.locationEn,
          locationAr: rest.locationAr,
          pillarId,
          isFeatured: rest.isFeatured,
          beneficiaries: rest.beneficiaries || null,
          budget: rest.budget || null,
          objectivesEn: rest.objectivesEn || null,
          objectivesAr: rest.objectivesAr || null,
        },
      });

      // Delete old stats and re-create
      await prisma.programStat.deleteMany({ where: { programId: existing.id } });
      if (stats.length > 0) {
        await prisma.programStat.createMany({
          data: stats.map((s) => ({ ...s, programId: existing.id })),
        });
      }

      // Sync images: delete old, add new
      await prisma.programImage.deleteMany({ where: { programId: existing.id } });
      if (images.length > 0) {
        await prisma.programImage.createMany({
          data: images.map((url, i) => ({
            programId: existing.id,
            imageUrl: url,
            order: i,
          })),
        });
      }

      console.log(`  UPDATED: ${proj.slug} (${stats.length} stats, ${images.length} images)`);
      updated++;
    } else {
      // Create new program
      await prisma.program.create({
        data: {
          slug: rest.slug,
          titleEn: rest.titleEn,
          titleAr: rest.titleAr,
          summaryEn: rest.summaryEn,
          summaryAr: rest.summaryAr,
          bodyEn: rest.bodyEn,
          bodyAr: rest.bodyAr,
          coverImageUrl: rest.coverImageUrl,
          status: rest.status,
          year: rest.year,
          donorEn: rest.donorEn,
          donorAr: rest.donorAr,
          locationEn: rest.locationEn,
          locationAr: rest.locationAr,
          pillarId,
          isFeatured: rest.isFeatured,
          beneficiaries: rest.beneficiaries || null,
          budget: rest.budget || null,
          objectivesEn: rest.objectivesEn || null,
          objectivesAr: rest.objectivesAr || null,
          stats: stats.length > 0 ? { create: stats } : undefined,
          images: images.length > 0
            ? { create: images.map((url, i) => ({ imageUrl: url, order: i })) }
            : undefined,
        },
      });

      console.log(`  CREATED: ${proj.slug} (${stats.length} stats, ${images.length} images)`);
      created++;
    }
  }

  // ── 3. Clean up old demo programs not in track record ────────
  const trackSlugs = new Set(trackRecordProjects.map((p) => p.slug));
  const allPrograms = await prisma.program.findMany({ select: { id: true, slug: true } });
  let removed = 0;

  for (const prog of allPrograms) {
    if (!trackSlugs.has(prog.slug)) {
      await prisma.program.delete({ where: { id: prog.id } });
      console.log(`  REMOVED old: ${prog.slug}`);
      removed++;
    }
  }

  console.log(`\nDone! Created: ${created}, Updated: ${updated}, Removed: ${removed}, Skipped: ${skipped}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
