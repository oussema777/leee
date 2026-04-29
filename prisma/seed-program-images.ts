import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Maps optimized images from public/images/projects/ to programs in the database.
 *
 * For existing programs: adds ProgramImage records.
 * For new programs (from Jana's spreadsheet): creates the program + images.
 *
 * Images are 1200×800 JPEGs, optimized at quality 82.
 * Source: leee-photos folder (April 2026), up to 10 per program.
 */

interface ImageMapping {
  prefix: string;
  images: string[];
  existingSlug?: string;
  newProgram?: {
    slug: string;
    titleEn: string;
    titleAr: string;
    summaryEn: string;
    summaryAr: string;
    bodyEn: string;
    bodyAr: string;
    coverImageUrl: string;
    status: "ACTIVE" | "COMPLETED" | "UPCOMING";
    year: number;
    donorEn: string;
    donorAr: string;
    locationEn: string;
    locationAr: string;
    pillarSlug: string;
    isFeatured: boolean;
    beneficiaries?: number;
    budget?: string;
    stats?: { labelEn: string; labelAr: string; value: number; suffix?: string; icon?: string; order: number }[];
  };
}

const imageMappings: ImageMapping[] = [
  // 1. CAWTAR → existing "empowering-women-entrepreneurs-mena"
  {
    prefix: "cawtar",
    images: [
      "/images/projects/cawtar-1.jpg", "/images/projects/cawtar-2.jpg", "/images/projects/cawtar-3.jpg",
      "/images/projects/cawtar-4.jpg", "/images/projects/cawtar-5.jpg", "/images/projects/cawtar-6.jpg",
      "/images/projects/cawtar-7.jpg", "/images/projects/cawtar-8.jpg", "/images/projects/cawtar-9.jpg",
      "/images/projects/cawtar-10.jpg",
    ],
    existingSlug: "empowering-women-entrepreneurs-mena",
  },
  // 2. GITS 2025 → new program
  {
    prefix: "gits",
    images: [
      "/images/projects/gits-1.jpg", "/images/projects/gits-2.jpg", "/images/projects/gits-3.jpg",
      "/images/projects/gits-4.jpg", "/images/projects/gits-5.jpg", "/images/projects/gits-6.jpg",
      "/images/projects/gits-7.jpg", "/images/projects/gits-8.jpg", "/images/projects/gits-9.jpg",
      "/images/projects/gits-10.jpg",
    ],
    newProgram: {
      slug: "gits-global-investment-trade-summit-2025",
      titleEn: "Global Investment & Trade Summit — GITS 2025",
      titleAr: "القمة العالمية للاستثمار والتجارة — GITS 2025",
      summaryEn: "Global Collaboration for a Sustainable Impact — connecting investors, entrepreneurs, and ecosystem builders across MENA and Africa.",
      summaryAr: "التعاون العالمي من أجل تأثير مستدام — ربط المستثمرين ورواد الأعمال وبناة النظم البيئية عبر منطقة الشرق الأوسط وأفريقيا.",
      bodyEn: "<p>The Global Investment & Trade Summit (GITS) 2025 brings together investors, entrepreneurs, policymakers, and ecosystem builders from across the MENA region and Africa for a multi-day event focused on sustainable economic impact. Through panels, workshops, and networking sessions, GITS facilitates meaningful connections and partnerships.</p>",
      bodyAr: "<p>يجمع مؤتمر القمة العالمية للاستثمار والتجارة (GITS) 2025 المستثمرين ورواد الأعمال وصناع السياسات وبناة النظم البيئية من جميع أنحاء منطقة الشرق الأوسط وأفريقيا لحدث متعدد الأيام يركز على الأثر الاقتصادي المستدام.</p>",
      coverImageUrl: "/images/projects/gits-2.jpg",
      status: "COMPLETED",
      year: 2025,
      donorEn: "GTS Seketak, AfriLabs, Falak, SUNI",
      donorAr: "GTS سكتك، AfriLabs، فلك، SUNI",
      locationEn: "Multi-country (MENA & Africa)",
      locationAr: "متعدد الدول (الشرق الأوسط وأفريقيا)",
      pillarSlug: "academy",
      isFeatured: true,
      stats: [
        { labelEn: "Partners", labelAr: "شريك", value: 20, suffix: "+", icon: "handshake", order: 0 },
        { labelEn: "Countries Represented", labelAr: "دولة ممثلة", value: 15, suffix: "+", icon: "globe", order: 1 },
      ],
    },
  },
  // 3. KIMS / IFC / World Bank (Somalia) → new program
  {
    prefix: "kims-ifc",
    images: [
      "/images/projects/kims-ifc-1.jpg", "/images/projects/kims-ifc-2.jpg", "/images/projects/kims-ifc-3.jpg",
      "/images/projects/kims-ifc-4.jpg", "/images/projects/kims-ifc-5.jpg", "/images/projects/kims-ifc-6.jpg",
      "/images/projects/kims-ifc-7.jpg", "/images/projects/kims-ifc-8.jpg", "/images/projects/kims-ifc-9.jpg",
      "/images/projects/kims-ifc-10.jpg",
    ],
    newProgram: {
      slug: "kims-ifc-senior-management-somalia",
      titleEn: "Senior Management Training — KIMS & IFC Partnership",
      titleAr: "تدريب الإدارة العليا — شراكة KIMS ومؤسسة التمويل الدولية",
      summaryEn: "Training 20 senior management professionals in Somalia through partnership with KIMS, IFC, and the World Bank.",
      summaryAr: "تدريب 20 من مهنيي الإدارة العليا في الصومال من خلال الشراكة مع KIMS ومؤسسة التمويل الدولية والبنك الدولي.",
      bodyEn: "<p>This program delivers specialized management training for 20 senior professionals in Somalia. In partnership with KIMS, the International Finance Corporation (IFC), and the World Bank, the program builds leadership capacity and strengthens management practices in the Somali business ecosystem.</p>",
      bodyAr: "<p>يقدم هذا البرنامج تدريبًا إداريًا متخصصًا لـ 20 مهنيًا كبيرًا في الصومال بالشراكة مع KIMS ومؤسسة التمويل الدولية والبنك الدولي.</p>",
      coverImageUrl: "/images/projects/kims-ifc-1.jpg",
      status: "ACTIVE",
      year: 2024,
      donorEn: "KIMS, IFC, World Bank",
      donorAr: "KIMS، مؤسسة التمويل الدولية، البنك الدولي",
      locationEn: "Somalia",
      locationAr: "الصومال",
      pillarSlug: "academy",
      isFeatured: true,
      beneficiaries: 20,
      stats: [
        { labelEn: "Senior Managers Trained", labelAr: "مدير أول مدرب", value: 20, suffix: "", icon: "users", order: 0 },
      ],
    },
  },
  // 4. ILO / EU → existing "enable-siyb-training-2024"
  {
    prefix: "ilo",
    images: [
      "/images/projects/ilo-1.jpg", "/images/projects/ilo-2.jpg", "/images/projects/ilo-3.jpg",
      "/images/projects/ilo-4.jpg", "/images/projects/ilo-5.jpg", "/images/projects/ilo-6.jpg",
      "/images/projects/ilo-7.jpg",
    ],
    existingSlug: "enable-siyb-training-2024",
  },
  // 5. PSDP → existing "psdp-gender-sensitive-business-support"
  {
    prefix: "psdp",
    images: [
      "/images/projects/psdp-1.jpg", "/images/projects/psdp-2.jpg", "/images/projects/psdp-3.jpg",
      "/images/projects/psdp-4.jpg", "/images/projects/psdp-5.jpg", "/images/projects/psdp-6.jpg",
      "/images/projects/psdp-7.jpg", "/images/projects/psdp-8.jpg", "/images/projects/psdp-9.jpg",
      "/images/projects/psdp-10.jpg",
    ],
    existingSlug: "psdp-gender-sensitive-business-support",
  },
  // 6. UNIFIL → existing "unifil-women-social-enterprises"
  {
    prefix: "unifil",
    images: [
      "/images/projects/unifil-1.jpg", "/images/projects/unifil-2.jpg",
      "/images/projects/unifil-3.jpg", "/images/projects/unifil-4.jpg",
    ],
    existingSlug: "unifil-women-social-enterprises",
  },
  // 7. Berytech / EU → new program
  {
    prefix: "berytech",
    images: [
      "/images/projects/berytech-1.jpg", "/images/projects/berytech-2.jpg", "/images/projects/berytech-3.jpg",
      "/images/projects/berytech-4.jpg", "/images/projects/berytech-5.jpg", "/images/projects/berytech-6.jpg",
      "/images/projects/berytech-7.jpg",
    ],
    newProgram: {
      slug: "berytech-eu-startup-incubation-2023",
      titleEn: "Startup & Research Incubation — Berytech & EU Partnership",
      titleAr: "حاضنة الشركات الناشئة والأبحاث — شراكة بيريتك والاتحاد الأوروبي",
      summaryEn: "Incubating 16 researchers and startups with 50 trained professionals and 60 coaching sessions, in partnership with Berytech and EU.",
      summaryAr: "احتضان 16 باحثًا وشركة ناشئة مع 50 متدربًا محترفًا و60 جلسة تدريب، بالشراكة مع بيريتك والاتحاد الأوروبي.",
      bodyEn: "<p>This program incubates 16 researchers and startups through a comprehensive support framework including technical training, business coaching, and mentorship. In partnership with Berytech and the European Union, participants receive 50 training sessions and 60 one-on-one coaching sessions to develop their innovations into viable businesses.</p>",
      bodyAr: "<p>يحتضن هذا البرنامج 16 باحثًا وشركة ناشئة من خلال إطار دعم شامل يتضمن التدريب التقني والإرشاد التجاري والتوجيه بالشراكة مع بيريتك والاتحاد الأوروبي.</p>",
      coverImageUrl: "/images/projects/berytech-1.jpg",
      status: "COMPLETED",
      year: 2023,
      donorEn: "Berytech & EU",
      donorAr: "بيريتك والاتحاد الأوروبي",
      locationEn: "Lebanon",
      locationAr: "لبنان",
      pillarSlug: "incubators",
      isFeatured: false,
      beneficiaries: 16,
      stats: [
        { labelEn: "Startups Incubated", labelAr: "شركة ناشئة محتضنة", value: 16, suffix: "", icon: "rocket", order: 0 },
        { labelEn: "Professionals Trained", labelAr: "محترف مدرب", value: 50, suffix: "", icon: "users", order: 1 },
        { labelEn: "Coaching Sessions", labelAr: "جلسة تدريب", value: 60, suffix: "", icon: "target", order: 2 },
      ],
    },
  },
  // 8. Nawara / IRC → existing "srp2-economic-empowerment-sgbv"
  {
    prefix: "nawara-irc",
    images: [
      "/images/projects/nawara-irc-1.jpg", "/images/projects/nawara-irc-2.jpg", "/images/projects/nawara-irc-3.jpg",
      "/images/projects/nawara-irc-4.jpg", "/images/projects/nawara-irc-5.jpg", "/images/projects/nawara-irc-6.jpg",
      "/images/projects/nawara-irc-7.jpg", "/images/projects/nawara-irc-8.jpg", "/images/projects/nawara-irc-9.jpg",
      "/images/projects/nawara-irc-10.jpg",
    ],
    existingSlug: "srp2-economic-empowerment-sgbv",
  },
  // 9. Prospects / Netherlands Embassy → existing "prospects-entrepreneurship-agriculture"
  {
    prefix: "prospects",
    images: [
      "/images/projects/prospects-1.jpg", "/images/projects/prospects-2.jpg", "/images/projects/prospects-3.jpg",
      "/images/projects/prospects-4.jpg", "/images/projects/prospects-5.jpg", "/images/projects/prospects-6.jpg",
      "/images/projects/prospects-7.jpg", "/images/projects/prospects-8.jpg", "/images/projects/prospects-9.jpg",
      "/images/projects/prospects-10.jpg",
    ],
    existingSlug: "prospects-entrepreneurship-agriculture",
  },
  // 10. Relief International / WFP → existing "livelihoods-resilience-lebanese-syrians"
  {
    prefix: "relief",
    images: [
      "/images/projects/relief-1.jpg", "/images/projects/relief-2.jpg", "/images/projects/relief-3.jpg",
    ],
    existingSlug: "livelihoods-resilience-lebanese-syrians",
  },
  // 11. Salama / IPPF → new program (humanitarian)
  {
    prefix: "salama",
    images: [
      "/images/projects/salama-1.jpg", "/images/projects/salama-2.jpg", "/images/projects/salama-3.jpg",
      "/images/projects/salama-4.jpg", "/images/projects/salama-5.jpg", "/images/projects/salama-6.jpg",
      "/images/projects/salama-7.jpg", "/images/projects/salama-8.jpg", "/images/projects/salama-9.jpg",
      "/images/projects/salama-10.jpg",
    ],
    newProgram: {
      slug: "salama-pss-humanitarian-2020",
      titleEn: "Psychosocial Support Sessions — Salama & IPPF Partnership",
      titleAr: "جلسات الدعم النفسي الاجتماعي — شراكة سلامة و IPPF",
      summaryEn: "Delivering 2,500 psychosocial support (PSS) sessions for vulnerable communities in Lebanon through Salama, IPPF, and SICD partnership.",
      summaryAr: "تقديم 2,500 جلسة دعم نفسي اجتماعي للمجتمعات الضعيفة في لبنان من خلال شراكة سلامة و IPPF و SICD.",
      bodyEn: "<p>This humanitarian program delivers 2,500 psychosocial support (PSS) sessions to vulnerable communities across Lebanon. In partnership with IPPF, Salama, and SICD, the program provides critical mental health and social support services to those affected by the ongoing crisis.</p>",
      bodyAr: "<p>يقدم هذا البرنامج الإنساني 2,500 جلسة دعم نفسي اجتماعي للمجتمعات الضعيفة في جميع أنحاء لبنان بالشراكة مع IPPF وسلامة وSICD.</p>",
      coverImageUrl: "/images/projects/salama-1.jpg",
      status: "COMPLETED",
      year: 2020,
      donorEn: "IPPF, Salama, SICD",
      donorAr: "IPPF، سلامة، SICD",
      locationEn: "Lebanon",
      locationAr: "لبنان",
      pillarSlug: "humanitarian-aid",
      isFeatured: false,
      beneficiaries: 2500,
      stats: [
        { labelEn: "PSS Sessions", labelAr: "جلسة دعم نفسي", value: 2500, suffix: "", icon: "heart", order: 0 },
      ],
    },
  },
];

async function main() {
  console.log("Seeding program images...\n");

  // Build pillar slug → id map
  const pillars = await prisma.pillar.findMany({ select: { id: true, slug: true } });
  const pillarMap: Record<string, string> = {};
  for (const p of pillars) {
    pillarMap[p.slug] = p.id;
  }
  console.log(`  Found ${pillars.length} pillars: ${Object.keys(pillarMap).join(", ")}\n`);

  let imagesAdded = 0;
  let programsCreated = 0;
  let errors = 0;

  for (const mapping of imageMappings) {
    const label = mapping.existingSlug || mapping.newProgram?.slug || mapping.prefix;

    // Skip entries with no images
    if (mapping.images.length === 0) {
      console.log(`  SKIP (no images): ${label}`);
      continue;
    }

    try {
      if (mapping.existingSlug) {
        // Find existing program
        const existing = await prisma.program.findUnique({
          where: { slug: mapping.existingSlug },
          select: { id: true, coverImageUrl: true, images: { select: { imageUrl: true } } },
        });

        if (!existing) {
          console.log(`  SKIP (not found): ${mapping.existingSlug}`);
          errors++;
          continue;
        }

        // Check for duplicate images
        const existingUrls = new Set(existing.images.map((i) => i.imageUrl));
        const newImages = mapping.images.filter((url) => !existingUrls.has(url));

        if (newImages.length === 0) {
          console.log(`  SKIP (images exist): ${label}`);
          continue;
        }

        // Add images
        const startOrder = existing.images.length;
        for (let i = 0; i < newImages.length; i++) {
          await prisma.programImage.create({
            data: {
              programId: existing.id,
              imageUrl: newImages[i],
              caption: null,
              order: startOrder + i,
            },
          });
        }

        console.log(`  ADDED ${newImages.length} images to: ${label}`);
        imagesAdded += newImages.length;

        // Update cover image if program uses a placeholder (not a real /images/projects/ photo)
        if (!existing.coverImageUrl || !existing.coverImageUrl.includes("/images/projects/")) {
          await prisma.program.update({
            where: { id: existing.id },
            data: { coverImageUrl: mapping.images[0] },
          });
          console.log(`     -> Updated cover image for ${label}`);
        }

      } else if (mapping.newProgram) {
        const np = mapping.newProgram;
        const existing = await prisma.program.findUnique({ where: { slug: np.slug } });

        if (existing) {
          // Program exists, just add images
          const existingImages = await prisma.programImage.findMany({
            where: { programId: existing.id },
            select: { imageUrl: true },
          });
          const existingUrls = new Set(existingImages.map((i) => i.imageUrl));
          const newImages = mapping.images.filter((url) => !existingUrls.has(url));

          if (newImages.length > 0) {
            for (let i = 0; i < newImages.length; i++) {
              await prisma.programImage.create({
                data: {
                  programId: existing.id,
                  imageUrl: newImages[i],
                  caption: null,
                  order: existingImages.length + i,
                },
              });
            }
            console.log(`  ADDED ${newImages.length} images to existing: ${np.slug}`);
            imagesAdded += newImages.length;
          } else {
            console.log(`  SKIP (already seeded): ${np.slug}`);
          }
          continue;
        }

        const pillarId = pillarMap[np.pillarSlug];
        if (!pillarId) {
          console.log(`  SKIP (pillar not found: ${np.pillarSlug}): ${np.slug}`);
          errors++;
          continue;
        }

        const { pillarSlug, stats, ...programData } = np;

        await prisma.program.create({
          data: {
            ...programData,
            pillarId,
            images: {
              create: mapping.images.map((url, i) => ({
                imageUrl: url,
                caption: null,
                order: i,
              })),
            },
            stats: stats?.length ? { create: stats } : undefined,
          },
        });

        console.log(`  CREATED program + ${mapping.images.length} images: ${np.slug}`);
        programsCreated++;
        imagesAdded += mapping.images.length;
      }
    } catch (err) {
      console.error(`  ERROR for ${label}:`, err);
      errors++;
    }
  }

  console.log(`\n----------------------------------------`);
  console.log(`  Programs created: ${programsCreated}`);
  console.log(`  Images added:     ${imagesAdded}`);
  console.log(`  Errors/skips:     ${errors}`);
  console.log(`----------------------------------------\n`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
