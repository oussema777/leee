import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Sync DB programs with Track Record 2026 (source of truth).
 *
 * 1. Remove programs NOT in Track Record
 * 2. Fix pillar assignments to match Track Record
 * 3. Create programs that are in Track Record but missing from DB
 */

// ═══════════════════════════════════════════════════════════
// Pillar slug mapping: Track Record pillar → DB pillar slug
// ═══════════════════════════════════════════════════════════
const pillarMap = {
  'LEE Humanitarian': 'humanitarian-aid',
  'LEE Humanitarian Aid': 'humanitarian-aid',
  'LEE Academy': 'academy',
  'LEE Incubator': 'incubators',
  'LEE incubator': 'incubators',
  'LEE Business Clinic': 'coaching',
  'LEE Business clinic': 'coaching',
  'LEE Digital Media Hub': 'digital-media-hub',
  'LEE digital Media Hub': 'digital-media-hub',
};

function resolvePillar(trPillar) {
  // Strip parenthetical notes like "(Women in Green)"
  const clean = trPillar.replace(/\s*\(.*\)/, '').trim();
  return pillarMap[clean] || null;
}

// ═══════════════════════════════════════════════════════════
// Programs to REMOVE (in DB but NOT in Track Record)
// ═══════════════════════════════════════════════════════════
const slugsToRemove = [
  'nawra-green-ventures-acceleration',
];

// ═══════════════════════════════════════════════════════════
// Pillar FIXES (Track Record pillar differs from DB)
// ═══════════════════════════════════════════════════════════
const pillarFixes = [
  { slug: 'capacity-building-farmers-cooperatives', newPillar: 'academy', reason: 'TR says LEE Academy, DB had Technical Assistance' },
  { slug: 'business-development-youth-north', newPillar: 'academy', reason: 'TR says LEE Academy, DB had Technical Assistance' },
  { slug: 'financial-education-women', newPillar: 'coaching', reason: 'TR says LEE Business Clinic (Women Mentoring), DB had LEE Academy' },
  { slug: 'digital-learning-women-sustainable-business', newPillar: 'digital-media-hub', reason: 'TR says LEE Digital Media Hub, DB had LEE Academy' },
  { slug: 'livelihoods-resilience-lebanese-syrians', newPillar: 'academy', reason: 'TR says LEE Academy, DB had LEE Business Clinic' },
  { slug: 'optimizing-women-entrepreneurs-bekaa', newPillar: 'academy', reason: 'TR says LEE Academy, DB had LEE Business Clinic' },
  { slug: 'social-economic-resilience-vulnerable-communities', newPillar: 'academy', reason: 'TR says LEE Academy, DB had LEE Business Clinic' },
  { slug: 'gits-global-investment-trade-summit-2025', newPillar: 'incubators', reason: 'TR says LEE Incubator (Investment readiness), DB had LEE Academy' },
];

// ═══════════════════════════════════════════════════════════
// Programs to CREATE (in Track Record but NOT in DB)
// ═══════════════════════════════════════════════════════════
const newPrograms = [
  {
    slug: 'world-bank-ministry-labour-technical-assistance',
    titleEn: 'Technical Assistance for Ministry of Labour',
    titleAr: 'المساعدة الفنية لوزارة العمل',
    summaryEn: 'Gap assessment, capacity building, policies and procedures, micro credit products and coaching for the Ministry of Labour in Lebanon.',
    summaryAr: 'تقييم الفجوات، بناء القدرات، السياسات والإجراءات، منتجات التمويل الصغير والتدريب لوزارة العمل في لبنان.',
    bodyEn: '<p>Comprehensive technical assistance for the Ministry of Labour including gap assessment, institutional capacity building, development of policies and procedures, micro-credit product design, and coaching. Delivered as a solo implementation for the overall contract in partnership with the World Bank Group.</p>',
    bodyAr: '<p>مساعدة فنية شاملة لوزارة العمل تشمل تقييم الفجوات وبناء القدرات المؤسسية وتطوير السياسات والإجراءات وتصميم منتجات التمويل الصغير والتدريب، بالشراكة مع مجموعة البنك الدولي.</p>',
    coverImageUrl: '/images/training-presentation.jpg',
    status: 'COMPLETED',
    year: 2020,
    donorEn: 'World Bank Group & Ministry of Labor Affairs',
    donorAr: 'مجموعة البنك الدولي ووزارة العمل',
    locationEn: 'Lebanon',
    locationAr: 'لبنان',
    pillarSlug: 'academy',
    isFeatured: false,
  },
  {
    slug: 'lmfa-elearning-microfinance-2020',
    titleEn: 'E-learning Development for Microfinance Institutions',
    titleAr: 'تطوير التعليم الإلكتروني لمؤسسات التمويل الأصغر',
    summaryEn: 'Development of e-learning curricula and digital content for microfinance institutions in Lebanon.',
    summaryAr: 'تطوير مناهج التعلم الإلكتروني والمحتوى الرقمي لمؤسسات التمويل الأصغر في لبنان.',
    bodyEn: '<p>This project developed e-learning curricula and digital content for microfinance institutions in Lebanon. Working with LMFA and USAID, the program delivered comprehensive digital training materials, including video and interactive content, to strengthen the capacity of microfinance professionals across the country.</p>',
    bodyAr: '<p>طوّر هذا المشروع مناهج التعلم الإلكتروني والمحتوى الرقمي لمؤسسات التمويل الأصغر في لبنان بالتعاون مع LMFA وUSAID.</p>',
    coverImageUrl: '/images/training-presentation.jpg',
    status: 'COMPLETED',
    year: 2020,
    donorEn: 'LMFA & USAID',
    donorAr: 'LMFA وUSAID',
    locationEn: 'Lebanon',
    locationAr: 'لبنان',
    pillarSlug: 'digital-media-hub',
    isFeatured: false,
  },
  {
    slug: 'yemen-microfinance-institutional-strengthening',
    titleEn: 'Institutional Strengthening for Microfinance Institutions in Yemen',
    titleAr: 'تعزيز المؤسسات لمؤسسات التمويل الأصغر في اليمن',
    summaryEn: 'Institutional assessment, capacity building, training delivery, and technical advisory for microfinance institutions in Yemen.',
    summaryAr: 'تقييم مؤسسي وبناء قدرات وتقديم التدريب والاستشارات الفنية لمؤسسات التمويل الأصغر في اليمن.',
    bodyEn: '<p>Working with the Yemen Microfinance Network, this program delivers institutional assessment, capacity building, training, and technical advisory services to strengthen microfinance institutions across Yemen. The program addresses institutional gaps and builds sustainable operational capacity.</p>',
    bodyAr: '<p>بالتعاون مع شبكة التمويل الأصغر في اليمن، يقدم هذا البرنامج تقييمًا مؤسسيًا وبناء قدرات وتدريبًا واستشارات فنية لتعزيز مؤسسات التمويل الأصغر في اليمن.</p>',
    coverImageUrl: '/images/group-training-workshop.jpg',
    status: 'COMPLETED',
    year: 2020,
    donorEn: 'Yemen Microfinance Network & SDF',
    donorAr: 'شبكة التمويل الأصغر في اليمن وSDF',
    locationEn: 'Yemen',
    locationAr: 'اليمن',
    pillarSlug: 'academy',
    isFeatured: false,
  },
  {
    slug: 'ccias-entrepreneurship-access-market-2022',
    titleEn: 'Entrepreneurship Support & Access to Market — CCIAS Saida',
    titleAr: 'دعم ريادة الأعمال والوصول إلى السوق — غرفة التجارة صيدا',
    summaryEn: 'Entrepreneurship training, business coaching, market linkage support, and branding for 20 MSMEs through the Chamber of Commerce of Saida.',
    summaryAr: 'تدريب ريادة الأعمال والتدريب التجاري ودعم الروابط السوقية والعلامات التجارية لـ 20 مشروعًا صغيرًا من خلال غرفة التجارة في صيدا.',
    bodyEn: '<p>In partnership with CCIAS (Chamber of Commerce, Industry and Agriculture of Saida), the Rest@art program, and the EU, this project provided entrepreneurship support and access-to-market services for small and medium enterprises. Activities included entrepreneurship curricula development, training delivery, business coaching, market linkage support, and branding for 20 MSMEs.</p>',
    bodyAr: '<p>بالشراكة مع غرفة التجارة والصناعة والزراعة في صيدا وبرنامج Rest@art والاتحاد الأوروبي، قدم هذا المشروع دعمًا لريادة الأعمال وخدمات الوصول إلى السوق للمشاريع الصغيرة والمتوسطة.</p>',
    coverImageUrl: '/images/mentoring-session.jpg',
    status: 'COMPLETED',
    year: 2022,
    donorEn: 'CCIAS / Rest@art / EU',
    donorAr: 'غرفة التجارة صيدا / Rest@art / الاتحاد الأوروبي',
    locationEn: 'Lebanon (Saida)',
    locationAr: 'لبنان (صيدا)',
    pillarSlug: 'digital-media-hub',
    isFeatured: false,
  },
  {
    slug: 'si-agricultural-cooperatives-training-2026',
    titleEn: 'Training & Coaching for Agricultural Cooperatives & Farmers',
    titleAr: 'التدريب والتوجيه للتعاونيات الزراعية والمزارعين',
    summaryEn: 'Training and coaching consultancy for agricultural cooperatives and farmers associations in Lebanon.',
    summaryAr: 'استشارات التدريب والتوجيه للتعاونيات الزراعية وجمعيات المزارعين في لبنان.',
    bodyEn: '<p>This program provides training and coaching for agricultural cooperatives and farmers associations across Lebanon. Working with Solidarités International, the program delivers project management, outreach, curricula development, training, grant distribution, coaching, and M&E reporting to strengthen rural agricultural enterprises.</p>',
    bodyAr: '<p>يقدم هذا البرنامج التدريب والتوجيه للتعاونيات الزراعية وجمعيات المزارعين في لبنان بالتعاون مع منظمة Solidarités International.</p>',
    coverImageUrl: '/images/field-visit-rural.jpg',
    status: 'ACTIVE',
    year: 2026,
    donorEn: 'Solidarités International',
    donorAr: 'Solidarités International',
    locationEn: 'Lebanon',
    locationAr: 'لبنان',
    pillarSlug: 'academy',
    isFeatured: false,
  },
  {
    slug: 'undp-salam-women-peace-community-dialogue',
    titleEn: 'Strengthening Inter-Community Dialogue & Women Empowerment',
    titleAr: 'تعزيز الحوار بين المجتمعات وتمكين المرأة',
    summaryEn: 'Equipping women from diverse communities with technical, livelihood, leadership, and peacebuilding skills to promote inter-community solidarity.',
    summaryAr: 'تزويد النساء من مجتمعات متنوعة بالمهارات التقنية والمعيشية والقيادية وبناء السلام لتعزيز التضامن بين المجتمعات.',
    bodyEn: '<p>This program strengthens inter-community dialogue and builds bridges between Lebanese and non-Lebanese communities. It equips women from diverse communities — including Lebanese, Syrian refugees, Palestinian-Syrian refugees, and migrant workers — with technical, livelihood, leadership, and peacebuilding skills, enabling them to co-design and lead inclusive community spaces that promote inter and intra-community solidarity initiatives.</p>',
    bodyAr: '<p>يعزز هذا البرنامج الحوار بين المجتمعات ويبني جسورًا بين المجتمعات اللبنانية وغير اللبنانية، ويزوّد النساء من مجتمعات متنوعة بالمهارات التقنية والمعيشية والقيادية وبناء السلام.</p>',
    coverImageUrl: '/images/women-group-certificates.jpg',
    status: 'UPCOMING',
    year: 2026,
    donorEn: 'Women Peace Humanitarian Fund & UNDP/SALAM/LADC/WWL',
    donorAr: 'صندوق السلام الإنساني للمرأة وUNDP/سلام/LADC/WWL',
    locationEn: 'Lebanon',
    locationAr: 'لبنان',
    pillarSlug: 'incubators',
    isFeatured: false,
  },
];

async function main() {
  console.log('═══════════════════════════════════════════════');
  console.log('  SYNC DB WITH TRACK RECORD 2026');
  console.log('═══════════════════════════════════════════════\n');

  // Build pillar slug → id map
  const pillars = await prisma.pillar.findMany({ select: { id: true, slug: true, titleEn: true } });
  const pillarIdMap = {};
  for (const p of pillars) pillarIdMap[p.slug] = p.id;
  console.log(`Pillars loaded: ${pillars.map(p => p.slug).join(', ')}\n`);

  // ── STEP 1: Remove orphan programs ──
  console.log('── STEP 1: Remove programs NOT in Track Record ──');
  for (const slug of slugsToRemove) {
    const prog = await prisma.program.findUnique({ where: { slug }, select: { id: true, titleEn: true } });
    if (!prog) {
      console.log(`  SKIP (not found): ${slug}`);
      continue;
    }
    // Delete related records first
    await prisma.programImage.deleteMany({ where: { programId: prog.id } });
    await prisma.programStat.deleteMany({ where: { programId: prog.id } });
    await prisma.program.delete({ where: { id: prog.id } });
    console.log(`  REMOVED: ${slug} — ${prog.titleEn}`);
  }

  // ── STEP 2: Fix pillar assignments ──
  console.log('\n── STEP 2: Fix pillar assignments to match Track Record ──');
  for (const fix of pillarFixes) {
    const prog = await prisma.program.findUnique({
      where: { slug: fix.slug },
      select: { id: true, pillarId: true, pillar: { select: { slug: true, titleEn: true } } },
    });
    if (!prog) {
      console.log(`  SKIP (not found): ${fix.slug}`);
      continue;
    }
    if (prog.pillar?.slug === fix.newPillar) {
      console.log(`  OK (already correct): ${fix.slug} → ${fix.newPillar}`);
      continue;
    }
    const newPillarId = pillarIdMap[fix.newPillar];
    if (!newPillarId) {
      console.log(`  ERROR (pillar not found): ${fix.newPillar}`);
      continue;
    }
    await prisma.program.update({
      where: { id: prog.id },
      data: { pillarId: newPillarId },
    });
    console.log(`  FIXED: ${fix.slug} — "${prog.pillar?.titleEn}" → "${fix.newPillar}" (${fix.reason})`);
  }

  // ── STEP 3: Create missing programs ──
  console.log('\n── STEP 3: Create programs from Track Record missing in DB ──');
  for (const np of newPrograms) {
    const existing = await prisma.program.findUnique({ where: { slug: np.slug } });
    if (existing) {
      console.log(`  SKIP (exists): ${np.slug}`);
      continue;
    }
    const pillarId = pillarIdMap[np.pillarSlug];
    if (!pillarId) {
      console.log(`  ERROR (pillar not found: ${np.pillarSlug}): ${np.slug}`);
      continue;
    }
    const { pillarSlug, ...data } = np;
    await prisma.program.create({
      data: { ...data, pillarId },
    });
    console.log(`  CREATED: ${np.slug} — ${np.titleEn} (${np.year}, ${np.pillarSlug})`);
  }

  // ── FINAL: Show summary ──
  const total = await prisma.program.count();
  const allPrograms = await prisma.program.findMany({
    include: {
      pillar: { select: { titleEn: true } },
      images: { select: { imageUrl: true } },
    },
    orderBy: [{ year: 'asc' }, { titleEn: 'asc' }],
  });

  console.log('\n═══════════════════════════════════════════════');
  console.log(`  FINAL STATE: ${total} programs in DB`);
  console.log('═══════════════════════════════════════════════\n');

  const withPhotos = allPrograms.filter(p => p.images.some(i => i.imageUrl.includes('/images/projects/')));
  const withRealCover = allPrograms.filter(p => p.coverImageUrl?.includes('/images/projects/'));

  console.log(`With real photos: ${withPhotos.length}`);
  console.log(`With real cover: ${withRealCover.length}`);
  console.log(`With placeholder only: ${total - withPhotos.length}`);

  console.log('\nAll programs:');
  for (const p of allPrograms) {
    const real = p.images.filter(i => i.imageUrl.includes('/images/projects/')).length;
    const coverType = p.coverImageUrl?.includes('/images/projects/') ? '📸' : '🖼️';
    const photoStatus = real > 0 ? `${real} photos` : 'no photos';
    console.log(`  ${coverType} ${p.year || '?'} | ${p.pillar?.titleEn || '?'} | ${p.slug} (${photoStatus})`);
  }
}

main()
  .catch(e => { console.error('FATAL:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
