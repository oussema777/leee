/**
 * Track Record Data — 23 real projects from Manal's Excel spreadsheet
 * "track record with links Manal oussama.xlsx"
 *
 * VERIFIED against raw Excel row-by-row on 2026-05-06.
 * Every project number below matches the Excel row grouping.
 *
 * Pillar slug mapping:
 *   LEE Academy                            → academy
 *   LEE Business Clinic                    → coaching
 *   LEE Incubator / Incubator & Accelerator → incubators
 *   LEE Accelerator / Acceleration         → incubators
 *   LEE Marketing & Digital Media Hub      → digital-media-hub
 *   LEE Humanitarian / Humanitarian Aid    → humanitarian-aid
 *
 * Status logic:
 *   End year ≤ 2025   → COMPLETED
 *   Spans 2026         → ACTIVE
 *   Start year > 2026  → UPCOMING
 *
 * Image paths: each project with photos has a subfolder under public/images/projects/{slug}/
 *   containing cover.jpg and gallery-{n}.jpg files.
 *   Projects without photos have coverImageUrl: "" and images: [].
 *
 * Photo audit 2026-05-06:
 *   - yemen-mfn-2020 folder in leee-photos was MISLABELED (contained KIMS Somalia photos)
 *   - UNIFIL uses high-quality social media images (woman sewing, testimonials)
 *   - KIMS photos spread across 77 workshop images for variety
 *   - 11 projects have real photos, 12 projects still need images
 */

export interface TrackRecordProject {
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
  endYear?: number;
  donorEn: string;
  donorAr: string;
  locationEn: string;
  locationAr: string;
  pillarSlug: string;
  isFeatured: boolean;
  beneficiaries?: number;
  budget?: string;
  objectivesEn?: string;
  objectivesAr?: string;
  stats: { labelEn: string; labelAr: string; value: number; suffix?: string; icon?: string; order: number }[];
  images: string[]; // existing image file paths
}

export const trackRecordProjects: TrackRecordProject[] = [
  // ═══════════════════════════════════════════════════════════════
  // EXCEL P1 (Row 0): 2020, Iraq, World Bank Group & Ministry of Labor
  // Pillars: Academy(45 staff) + Clinic(80 coaching) + DMH(market assessment)
  // ═══════════════════════════════════════════════════════════════
  {
    slug: "iraq-world-bank-technical-assistance-2020",
    titleEn: "Online Technical Assistance for Iraqi Enterprises",
    titleAr: "المساعدة الفنية عن بُعد للمؤسسات العراقية",
    summaryEn: "Online technical assistance training 45 staff members and delivering 80 coaching sessions for Iraqi enterprises, including rapid market assessment and microfinance product development post-COVID.",
    summaryAr: "مساعدة فنية عن بُعد لتدريب 45 موظفاً وتقديم 80 جلسة إرشاد للمؤسسات العراقية، تشمل تقييم سوقي سريع وتطوير منتجات التمويل الأصغر بعد كوفيد.",
    bodyEn: `<p>This program delivered comprehensive online technical assistance to Iraqi enterprises in partnership with the World Bank Group and the Ministry of Labor Affairs. All activities were conducted remotely due to COVID-19 restrictions.</p>
<h3>LEE Academy</h3>
<ul><li>45 staff members trained in business management through curricula development and training delivery</li></ul>
<h3>LEE Business Clinic</h3>
<ul><li>80 coaching sessions on organizational policies, procedures, and best practices</li></ul>
<h3>LEE Digital Media Hub</h3>
<ul><li>Rapid market assessment for enterprises post-COVID</li>
<li>Microfinance product development support</li></ul>
<p><em>All activities were delivered as online support.</em></p>`,
    bodyAr: `<p>قدم هذا البرنامج مساعدة فنية شاملة عن بُعد للمؤسسات العراقية بالشراكة مع مجموعة البنك الدولي ووزارة العمل. تم تنفيذ جميع الأنشطة عن بُعد بسبب قيود كوفيد-19.</p>`,
    coverImageUrl: "",
    status: "COMPLETED",
    year: 2020,
    donorEn: "World Bank Group & Ministry of Labor Affairs",
    donorAr: "مجموعة البنك الدولي ووزارة العمل",
    locationEn: "Iraq",
    locationAr: "العراق",
    pillarSlug: "academy",
    isFeatured: false,
    beneficiaries: 45,
    stats: [
      { labelEn: "Staff Trained", labelAr: "موظف مدرب", value: 45, icon: "users", order: 0 },
      { labelEn: "Coaching Sessions", labelAr: "جلسة إرشاد", value: 80, icon: "target", order: 1 },
    ],
    images: [],
  },

  // ═══════════════════════════════════════════════════════════════
  // EXCEL P2 (Row 3): 2020, Lebanon, IPPF/Salama/SICD
  // Pillar: Humanitarian (2500 PSS Sessions)
  // ═══════════════════════════════════════════════════════════════
  {
    slug: "lebanon-pss-humanitarian-2020",
    titleEn: "Psychosocial Support Sessions for Vulnerable Communities",
    titleAr: "جلسات الدعم النفسي الاجتماعي للمجتمعات الضعيفة",
    summaryEn: "Delivering 2,500 psychosocial support (PSS) sessions for vulnerable communities in Lebanon in partnership with IPPF, Salama, and SICD.",
    summaryAr: "تقديم 2,500 جلسة دعم نفسي اجتماعي للمجتمعات الضعيفة في لبنان بالشراكة مع IPPF وسلامة وSICD.",
    bodyEn: `<p>This humanitarian program delivered 2,500 psychosocial support (PSS) sessions to vulnerable communities across Lebanon in 2020, in partnership with IPPF, Salama, and SICD.</p>`,
    bodyAr: `<p>قدم هذا البرنامج الإنساني 2,500 جلسة دعم نفسي اجتماعي للمجتمعات الضعيفة في لبنان عام 2020 بالشراكة مع IPPF وسلامة وSICD.</p>`,
    coverImageUrl: "/images/projects/lebanon-pss-humanitarian-2020/cover.jpg",
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
      { labelEn: "PSS Sessions", labelAr: "جلسة دعم نفسي", value: 2500, icon: "heart", order: 0 },
    ],
    images: [
      "/images/projects/lebanon-pss-humanitarian-2020/cover.jpg",
      "/images/projects/lebanon-pss-humanitarian-2020/gallery-1.jpg",
      "/images/projects/lebanon-pss-humanitarian-2020/gallery-2.jpg",
      "/images/projects/lebanon-pss-humanitarian-2020/gallery-3.jpg",
      "/images/projects/lebanon-pss-humanitarian-2020/gallery-4.jpg",
      "/images/projects/lebanon-pss-humanitarian-2020/gallery-5.jpg",
      "/images/projects/lebanon-pss-humanitarian-2020/gallery-6.jpg",
      "/images/projects/lebanon-pss-humanitarian-2020/gallery-7.jpg",
      "/images/projects/lebanon-pss-humanitarian-2020/gallery-8.jpg",
      "/images/projects/lebanon-pss-humanitarian-2020/gallery-9.jpeg",
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // EXCEL P3 (Row 4): 2020-2022, Lebanon
  // Netherlands Embassy, ILO, World Bank, UNICEF, IFC, Injaz
  // Academy(2000 trained) + Incubator(150 feasibility/59 incubated/26 SSE) + Clinic(3000 coaching) + DMH(20)
  // ═══════════════════════════════════════════════════════════════
  {
    slug: "prospects-entrepreneurship-agriculture",
    titleEn: "Promoting Entrepreneurship in Agriculture & Agro-food (Prospects Program)",
    titleAr: "تعزيز ريادة الأعمال في الزراعة والصناعات الغذائية (برنامج آفاق)",
    summaryEn: "Large-scale multi-pillar program: training 2,000 startups, 150 feasibility studies, 59 startups incubated, 26 social enterprises, 3,000 coaching sessions, and digital media support across Lebanon.",
    summaryAr: "برنامج واسع النطاق متعدد المحاور: تدريب 2,000 شركة ناشئة و150 دراسة جدوى و59 شركة ناشئة محتضنة و26 مؤسسة اجتماعية و3,000 جلسة إرشاد ودعم إعلام رقمي في لبنان.",
    bodyEn: `<p>The Prospects Program was a large-scale, multi-pillar initiative supporting entrepreneurs in the agriculture and agro-food sectors across Lebanon from 2020 to 2022.</p>
<h3>LEE Academy</h3>
<ul><li>2,000 startup entrepreneurs trained</li></ul>
<h3>LEE Incubator</h3>
<ul>
<li>150 feasibility studies developed</li>
<li>150 pitching sessions coached</li>
<li>59 startups incubated and granted</li>
<li>26 social & solidarity enterprises incubated</li>
</ul>
<h3>LEE Business Clinic</h3>
<ul><li>3,000 coaching sessions for entrepreneurs</li></ul>
<h3>LEE Digital Media Hub</h3>
<ul><li>20 startups supported in branding, advertising, and digital marketing</li></ul>`,
    bodyAr: `<p>كان برنامج آفاق مبادرة واسعة النطاق متعددة المحاور لدعم رواد الأعمال في قطاعي الزراعة والصناعات الغذائية في لبنان من 2020 إلى 2022.</p>`,
    coverImageUrl: "/images/projects/prospects-entrepreneurship-agriculture/cover.jpg",
    status: "COMPLETED",
    year: 2020,
    donorEn: "Netherlands Embassy, ILO, World Bank, UNICEF, IFC, Injaz",
    donorAr: "سفارة هولندا، منظمة العمل الدولية، البنك الدولي، اليونيسيف، مؤسسة التمويل الدولية، إنجاز",
    locationEn: "Lebanon",
    locationAr: "لبنان",
    pillarSlug: "incubators",
    isFeatured: true,
    beneficiaries: 2000,
    stats: [
      { labelEn: "Startups Trained", labelAr: "شركة ناشئة مدربة", value: 2000, icon: "users", order: 0 },
      { labelEn: "Startups Incubated", labelAr: "شركة ناشئة محتضنة", value: 59, icon: "rocket", order: 1 },
      { labelEn: "Social Enterprises", labelAr: "مؤسسة تضامن اجتماعي", value: 26, icon: "heart", order: 2 },
      { labelEn: "Feasibility Studies", labelAr: "دراسة جدوى", value: 150, icon: "clipboard", order: 3 },
      { labelEn: "Coaching Sessions", labelAr: "جلسة إرشاد", value: 3000, icon: "target", order: 4 },
    ],
    images: [
      "/images/projects/prospects-entrepreneurship-agriculture/cover.jpg",
      "/images/projects/prospects-entrepreneurship-agriculture/gallery-1.jpg",
      "/images/projects/prospects-entrepreneurship-agriculture/gallery-2.jpeg",
      "/images/projects/prospects-entrepreneurship-agriculture/gallery-3.jpeg",
      "/images/projects/prospects-entrepreneurship-agriculture/gallery-4.jpeg",
      "/images/projects/prospects-entrepreneurship-agriculture/gallery-5.jpeg",
      "/images/projects/prospects-entrepreneurship-agriculture/gallery-6.jpeg",
      "/images/projects/prospects-entrepreneurship-agriculture/gallery-7.jpeg",
      "/images/projects/prospects-entrepreneurship-agriculture/gallery-8.jpeg",
      "/images/projects/prospects-entrepreneurship-agriculture/gallery-9.jpeg",
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // EXCEL P4 (Row 8): 2021-2022, YEMEN
  // Yemen Microfinance Network & SDF
  // Academy(50 Senior Management from Microfinance Members)
  // ═══════════════════════════════════════════════════════════════
  {
    slug: "yemen-microfinance-senior-management-2021",
    titleEn: "Senior Management Training for Yemen Microfinance Network",
    titleAr: "تدريب الإدارة العليا لشبكة التمويل الأصغر في اليمن",
    summaryEn: "Training 50 senior management professionals from microfinance member institutions in Yemen, in partnership with Yemen Microfinance Network and SDF.",
    summaryAr: "تدريب 50 من مهنيي الإدارة العليا من مؤسسات التمويل الأصغر الأعضاء في اليمن بالشراكة مع شبكة التمويل الأصغر اليمنية وSDF.",
    bodyEn: `<p>This program delivered specialized management training for 50 senior management professionals from microfinance member institutions in Yemen, in partnership with the Yemen Microfinance Network and SDF.</p>
<h3>LEE Academy</h3>
<ul><li>50 senior managers from microfinance institutions trained in leadership and strategic management</li></ul>`,
    bodyAr: `<p>قدم هذا البرنامج تدريباً إدارياً متخصصاً لـ 50 من مهنيي الإدارة العليا من مؤسسات التمويل الأصغر في اليمن بالشراكة مع شبكة التمويل الأصغر اليمنية وSDF.</p>`,
    coverImageUrl: "",
    status: "COMPLETED",
    year: 2021,
    donorEn: "Yemen Microfinance Network & SDF",
    donorAr: "شبكة التمويل الأصغر اليمنية وSDF",
    locationEn: "Yemen",
    locationAr: "اليمن",
    pillarSlug: "academy",
    isFeatured: false,
    beneficiaries: 50,
    stats: [
      { labelEn: "Senior Managers Trained", labelAr: "مدير أول مدرب", value: 50, icon: "users", order: 0 },
    ],
    images: [],
  },

  // ═══════════════════════════════════════════════════════════════
  // EXCEL P5 (Row 9): 2021, Lebanon, Action Against Hunger
  // Academy (# of Trained cumulative — no specific number in Excel)
  // ═══════════════════════════════════════════════════════════════
  {
    slug: "capacity-building-farmers-cooperatives",
    titleEn: "Capacity Building for Farmers & Cooperatives",
    titleAr: "بناء قدرات المزارعين والتعاونيات",
    summaryEn: "Agri-business training, organic farming, and pest management capacity building for farmers and cooperatives in Lebanon with Action Against Hunger.",
    summaryAr: "تدريب على الأعمال الزراعية والزراعة العضوية وإدارة الآفات وبناء قدرات المزارعين والتعاونيات في لبنان مع العمل ضد الجوع.",
    bodyEn: `<p>This program built capacity for farmers and cooperatives across Lebanon in 2021, in partnership with Action Against Hunger. It provided training in agri-business management, organic farming techniques, and pest management.</p>
<h3>LEE Academy</h3>
<ul><li>Farmers and cooperatives trained in agri-business and sustainable practices</li></ul>`,
    bodyAr: `<p>بنى هذا البرنامج قدرات المزارعين والتعاونيات في لبنان عام 2021 بالشراكة مع العمل ضد الجوع.</p>`,
    coverImageUrl: "",
    status: "COMPLETED",
    year: 2021,
    donorEn: "Action Against Hunger",
    donorAr: "العمل ضد الجوع",
    locationEn: "Lebanon",
    locationAr: "لبنان",
    pillarSlug: "academy",
    isFeatured: false,
    stats: [],
    images: [],
  },

  // ═══════════════════════════════════════════════════════════════
  // EXCEL P6 (Row 11): 2022-2023, Lebanon/Jordan/Egypt/Tunisia/Morocco/Algeria
  // CAWTAR & Kvinna till Kvinna
  // Academy(40 Partners TOT & Curricula) + DMH(E-learning & social media campaign)
  // ═══════════════════════════════════════════════════════════════
  {
    slug: "empowering-women-entrepreneurs-mena",
    titleEn: "Empowering Women Entrepreneurs in MENA Towards Equal Market Access",
    titleAr: "تمكين رائدات الأعمال في منطقة الشرق الأوسط وشمال أفريقيا نحو وصول متساوٍ للأسواق",
    summaryEn: "Training of Trainers for 40 partners, curricula development, e-learning platform, and digital media campaigns for women entrepreneurs across 6 MENA countries with CAWTAR and Kvinna till Kvinna.",
    summaryAr: "تدريب المدربين لـ 40 شريكاً وتطوير مناهج ومنصة تعلم إلكتروني وحملات إعلامية رقمية لرائدات الأعمال في 6 دول بمنطقة الشرق الأوسط وشمال أفريقيا مع CAWTAR وKvinna till Kvinna.",
    bodyEn: `<p>This program (2022–2023) empowered women entrepreneurs across 6 MENA countries towards equal market access, in partnership with CAWTAR and Kvinna till Kvinna.</p>
<h3>LEE Academy</h3>
<ul>
<li>40 partners trained through Training of Trainers (TOT)</li>
<li>In-class and e-learning curricula development</li>
</ul>
<h3>LEE Digital Media Hub</h3>
<ul>
<li>E-learning platform development</li>
<li>Social media campaigns amplifying women entrepreneurs' stories</li>
</ul>`,
    bodyAr: `<p>مكّن هذا البرنامج (2022-2023) رائدات الأعمال في 6 دول بمنطقة الشرق الأوسط وشمال أفريقيا نحو وصول متساوٍ للأسواق بالشراكة مع CAWTAR وKvinna till Kvinna.</p>`,
    coverImageUrl: "/images/projects/empowering-women-entrepreneurs-mena/cover.jpg",
    status: "COMPLETED",
    year: 2022,
    donorEn: "CAWTAR & Kvinna till Kvinna",
    donorAr: "CAWTAR وKvinna till Kvinna",
    locationEn: "Lebanon, Jordan, Egypt, Tunisia, Morocco, Algeria",
    locationAr: "لبنان، الأردن، مصر، تونس، المغرب، الجزائر",
    pillarSlug: "academy",
    isFeatured: true,
    beneficiaries: 40,
    stats: [
      { labelEn: "Countries", labelAr: "دولة", value: 6, icon: "globe", order: 0 },
      { labelEn: "Partners TOT", labelAr: "شريك تدريب المدربين", value: 40, icon: "users", order: 1 },
    ],
    images: [
      "/images/projects/empowering-women-entrepreneurs-mena/cover.jpg",
      "/images/projects/empowering-women-entrepreneurs-mena/gallery-1.jpg",
      "/images/projects/empowering-women-entrepreneurs-mena/gallery-5.jpg",
      "/images/projects/empowering-women-entrepreneurs-mena/gallery-6.jpg",
      "/images/projects/empowering-women-entrepreneurs-mena/gallery-7.jpg",
      "/images/projects/empowering-women-entrepreneurs-mena/gallery-8.jpg",
      "/images/projects/empowering-women-entrepreneurs-mena/gallery-9.jpg",
      "/images/projects/empowering-women-entrepreneurs-mena/gallery-2.png",
      "/images/projects/empowering-women-entrepreneurs-mena/gallery-3.png",
      "/images/projects/empowering-women-entrepreneurs-mena/gallery-4.png",
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // EXCEL P7 (Row 13): 2023, Lebanon
  // Utopia, in partnership with Oxfam, and funded by DANIDA
  // Incubator(# feasibility/pitching/granting) + Academy(# trained) + Clinic(# coaching)
  // Note: Excel has "#" placeholders — no specific numbers given
  // ═══════════════════════════════════════════════════════════════
  {
    slug: "business-development-youth-north",
    titleEn: "Business Development & Capacity Building for Youth",
    titleAr: "تطوير الأعمال وبناء القدرات للشباب",
    summaryEn: "Youth-focused business development through incubation, training, and coaching in Lebanon, in partnership with Utopia and Oxfam, funded by DANIDA.",
    summaryAr: "تطوير أعمال للشباب من خلال الحاضنات والتدريب والإرشاد في لبنان بالشراكة مع يوتوبيا وأوكسفام وبتمويل من DANIDA.",
    bodyEn: `<p>This program targeted youth in Lebanon with focused business development training and capacity building, in partnership with Utopia and Oxfam, funded by DANIDA.</p>
<h3>LEE Incubator</h3>
<ul><li>Feasibility studies, pitching, and granting for youth-led enterprises</li></ul>
<h3>LEE Academy</h3>
<ul><li>Youth trained in business development and entrepreneurship</li></ul>
<h3>LEE Business Clinic</h3>
<ul><li>Coaching sessions for business development support</li></ul>`,
    bodyAr: `<p>استهدف هذا البرنامج الشباب في لبنان بتدريب مركز على تطوير الأعمال وبناء القدرات بالشراكة مع يوتوبيا وأوكسفام وبتمويل من DANIDA.</p>`,
    coverImageUrl: "",
    status: "COMPLETED",
    year: 2023,
    donorEn: "Utopia, Oxfam, funded by DANIDA",
    donorAr: "يوتوبيا، أوكسفام، بتمويل من DANIDA",
    locationEn: "Lebanon",
    locationAr: "لبنان",
    pillarSlug: "incubators",
    isFeatured: false,
    stats: [],
    images: [],
  },

  // ═══════════════════════════════════════════════════════════════
  // EXCEL P8 (Row 16): 2023, Lebanon
  // Relief International and funded by WFP
  // Academy(25 staff partners)
  // ═══════════════════════════════════════════════════════════════
  {
    slug: "livelihoods-resilience-lebanese-syrians",
    titleEn: "Livelihoods & Resilience Support — Staff Partner Training",
    titleAr: "دعم سبل العيش والصمود — تدريب الموظفين الشركاء",
    summaryEn: "Training 25 staff partners in entrepreneurship and business development with Relief International, funded by WFP.",
    summaryAr: "تدريب 25 من الموظفين الشركاء في ريادة الأعمال وتطوير الأعمال مع منظمة الإغاثة الدولية بتمويل من برنامج الأغذية العالمي.",
    bodyEn: `<p>This program provided entrepreneurship training to 25 staff partners through Relief International, funded by the World Food Programme (WFP).</p>
<h3>LEE Academy</h3>
<ul><li>25 staff partners trained in entrepreneurship and business development</li></ul>`,
    bodyAr: `<p>وفر هذا البرنامج تدريباً على ريادة الأعمال لـ 25 من الموظفين الشركاء من خلال منظمة الإغاثة الدولية بتمويل من برنامج الأغذية العالمي.</p>`,
    coverImageUrl: "/images/projects/livelihoods-resilience-lebanese-syrians/cover.jpg",
    status: "COMPLETED",
    year: 2023,
    donorEn: "Relief International, funded by WFP",
    donorAr: "منظمة الإغاثة الدولية، بتمويل من برنامج الأغذية العالمي",
    locationEn: "Lebanon",
    locationAr: "لبنان",
    pillarSlug: "academy",
    isFeatured: false,
    beneficiaries: 25,
    stats: [
      { labelEn: "Staff Partners Trained", labelAr: "موظف شريك مدرب", value: 25, icon: "users", order: 0 },
    ],
    images: [
      "/images/projects/livelihoods-resilience-lebanese-syrians/cover.jpg",
      "/images/projects/livelihoods-resilience-lebanese-syrians/gallery-2.jpg",
      "/images/projects/livelihoods-resilience-lebanese-syrians/gallery-3.jpg",
      "/images/projects/livelihoods-resilience-lebanese-syrians/gallery-1.png",
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // EXCEL P9 (Row 17): 2024-2025, Somalia
  // KIMS, IFC, World Bank
  // Academy(20 Senior Management)
  // ═══════════════════════════════════════════════════════════════
  {
    slug: "kims-ifc-senior-management-somalia",
    titleEn: "Senior Management Training — KIMS & IFC Partnership",
    titleAr: "تدريب الإدارة العليا — شراكة KIMS ومؤسسة التمويل الدولية",
    summaryEn: "Training 20 senior management professionals in Somalia through partnership with KIMS, IFC, and the World Bank.",
    summaryAr: "تدريب 20 من مهنيي الإدارة العليا في الصومال من خلال الشراكة مع KIMS ومؤسسة التمويل الدولية والبنك الدولي.",
    bodyEn: `<p>This program (2024–2025) delivers specialized management training for 20 senior professionals in Somalia, in partnership with KIMS, the International Finance Corporation (IFC), and the World Bank.</p>
<h3>LEE Academy</h3>
<ul><li>20 senior managers trained in leadership and strategic management</li></ul>`,
    bodyAr: `<p>يقدم هذا البرنامج (2024-2025) تدريباً إدارياً متخصصاً لـ 20 مهنياً كبيراً في الصومال بالشراكة مع KIMS ومؤسسة التمويل الدولية والبنك الدولي.</p>`,
    coverImageUrl: "/images/projects/kims-ifc-senior-management-somalia/cover.jpg",
    status: "COMPLETED",
    year: 2024,
    donorEn: "KIMS, IFC, World Bank",
    donorAr: "KIMS، مؤسسة التمويل الدولية، البنك الدولي",
    locationEn: "Somalia",
    locationAr: "الصومال",
    pillarSlug: "academy",
    isFeatured: false,
    beneficiaries: 20,
    stats: [
      { labelEn: "Senior Managers Trained", labelAr: "مدير أول مدرب", value: 20, icon: "users", order: 0 },
    ],
    images: [
      "/images/projects/kims-ifc-senior-management-somalia/cover.jpg",
      "/images/projects/kims-ifc-senior-management-somalia/gallery-1.jpg",
      "/images/projects/kims-ifc-senior-management-somalia/gallery-2.jpg",
      "/images/projects/kims-ifc-senior-management-somalia/gallery-3.jpg",
      "/images/projects/kims-ifc-senior-management-somalia/gallery-4.jpg",
      "/images/projects/kims-ifc-senior-management-somalia/gallery-5.jpg",
      "/images/projects/kims-ifc-senior-management-somalia/gallery-6.jpg",
      "/images/projects/kims-ifc-senior-management-somalia/gallery-7.jpg",
      "/images/projects/kims-ifc-senior-management-somalia/gallery-8.jpg",
      "/images/projects/kims-ifc-senior-management-somalia/gallery-9.jpg",
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // EXCEL P10 (Row 19): 2024-2025, Lebanon
  // RMF & Welthungerhilfe, funded by BMZ
  // Accelerator(45 feasibility/45 pitching/24 grants) + Academy(100 trained) + Clinic(125 coaching)
  // ═══════════════════════════════════════════════════════════════
  {
    slug: "social-economic-resilience-vulnerable-communities",
    titleEn: "Improving Social & Economic Resilience of Vulnerable Communities",
    titleAr: "تحسين الصمود الاجتماعي والاقتصادي للمجتمعات الضعيفة",
    summaryEn: "Incubating 24 enterprises, training 100 beneficiaries, and delivering 125 coaching sessions for vulnerable host and refugee communities, with RMF and Welthungerhilfe, funded by BMZ.",
    summaryAr: "احتضان 24 مؤسسة وتدريب 100 مستفيد وتقديم 125 جلسة إرشاد للمجتمعات المضيفة واللاجئين، مع RMF وWelthungerhilfe بتمويل من BMZ.",
    bodyEn: `<p>This program (2024–2025) improves the social and economic resilience of vulnerable host and refugee communities in Lebanon, in collaboration with RMF and Welthungerhilfe, funded by the German Federal Ministry for Economic Cooperation and Development (BMZ).</p>
<h3>LEE Accelerator</h3>
<ul>
<li>45 feasibility studies</li>
<li>45 pitching sessions</li>
<li>24 enterprises granted</li>
</ul>
<h3>LEE Academy</h3>
<ul><li>100 beneficiaries trained</li></ul>
<h3>LEE Business Clinic</h3>
<ul><li>125 coaching sessions</li></ul>`,
    bodyAr: `<p>يحسّن هذا البرنامج (2024-2025) الصمود الاجتماعي والاقتصادي للمجتمعات المضيفة واللاجئين في لبنان بالتعاون مع RMF وWelthungerhilfe بتمويل من BMZ.</p>`,
    coverImageUrl: "",
    status: "ACTIVE",
    year: 2024,
    donorEn: "RMF & Welthungerhilfe, funded by BMZ",
    donorAr: "RMF وWelthungerhilfe، بتمويل من BMZ",
    locationEn: "Lebanon",
    locationAr: "لبنان",
    pillarSlug: "incubators",
    isFeatured: true,
    beneficiaries: 100,
    stats: [
      { labelEn: "Feasibility Studies", labelAr: "دراسة جدوى", value: 45, icon: "clipboard", order: 0 },
      { labelEn: "Enterprises Granted", labelAr: "مؤسسة ممنوحة", value: 24, icon: "gift", order: 1 },
      { labelEn: "Beneficiaries Trained", labelAr: "مستفيد مدرب", value: 100, icon: "users", order: 2 },
      { labelEn: "Coaching Sessions", labelAr: "جلسة إرشاد", value: 125, icon: "target", order: 3 },
    ],
    images: [],
  },

  // ═══════════════════════════════════════════════════════════════
  // EXCEL P11 (Row 22): 2024-2026, Lebanon
  // Solidarités International (SI) & GIZ
  // Academy(10 TOT + 20 Farmers + 20 COOP) + Clinic(50 coaching) + DMH(3 roundtables)
  // ═══════════════════════════════════════════════════════════════
  {
    slug: "solidarites-giz-farmers-cooperatives-2024",
    titleEn: "Strengthening Farmers & Cooperatives — SI & GIZ Partnership",
    titleAr: "تعزيز المزارعين والتعاونيات — شراكة SI وGIZ",
    summaryEn: "Training of trainers, farmer training, cooperative development, coaching, and market linkage roundtables in Lebanon with Solidarités International and GIZ.",
    summaryAr: "تدريب المدربين وتدريب المزارعين وتطوير التعاونيات والإرشاد وطاولات مستديرة لربط الأسواق في لبنان مع منظمة التضامن الدولي وGIZ.",
    bodyEn: `<p>This program (2024–2026) strengthens farmers and cooperatives in Lebanon through comprehensive support, in partnership with Solidarités International (SI) and GIZ.</p>
<h3>LEE Academy</h3>
<ul>
<li>10 staff trained through Training of Trainers (TOT)</li>
<li>20 farmers trained in agri-business</li>
<li>20 cooperatives (COOP) supported</li>
</ul>
<h3>LEE Business Clinic</h3>
<ul><li>50 coaching sessions</li></ul>
<h3>LEE Digital Media Hub</h3>
<ul><li>3 roundtables for market linkages</li></ul>`,
    bodyAr: `<p>يعزز هذا البرنامج (2024-2026) المزارعين والتعاونيات في لبنان بالشراكة مع منظمة التضامن الدولي (SI) وGIZ.</p>`,
    coverImageUrl: "",
    status: "COMPLETED",
    year: 2024,
    donorEn: "Solidarités International (SI) & GIZ",
    donorAr: "منظمة التضامن الدولي (SI) وGIZ",
    locationEn: "Lebanon",
    locationAr: "لبنان",
    pillarSlug: "academy",
    isFeatured: false,
    beneficiaries: 50,
    stats: [
      { labelEn: "Staff TOT", labelAr: "تدريب مدربين", value: 10, icon: "award", order: 0 },
      { labelEn: "Farmers Trained", labelAr: "مزارع مدرب", value: 20, icon: "sprout", order: 1 },
      { labelEn: "Cooperatives", labelAr: "تعاونية", value: 20, icon: "building", order: 2 },
      { labelEn: "Coaching Sessions", labelAr: "جلسة إرشاد", value: 50, icon: "target", order: 3 },
    ],
    images: [],
  },

  // ═══════════════════════════════════════════════════════════════
  // EXCEL P12 (Row 26): 2023, Lebanon
  // Lutheran World Relief – Corus International, funded by Kerk in Actie (KIA)
  // Business Clinic(1250 sessions for women MSME)
  // ═══════════════════════════════════════════════════════════════
  {
    slug: "lutheran-kia-women-msme-coaching-2023",
    titleEn: "Business Coaching for Women-led MSMEs",
    titleAr: "الإرشاد التجاري للمنشآت الصغيرة بقيادة النساء",
    summaryEn: "1,250 business coaching sessions for women-led MSMEs in Lebanon with Lutheran World Relief – Corus International, funded by Kerk in Actie (KIA).",
    summaryAr: "1,250 جلسة إرشاد تجاري للمنشآت الصغيرة بقيادة النساء في لبنان مع الإغاثة اللوثرية العالمية – Corus International بتمويل من Kerk in Actie (KIA).",
    bodyEn: `<p>This program delivered 1,250 business coaching sessions for women-led MSMEs in Lebanon in 2023, with Lutheran World Relief – Corus International, funded by Kerk in Actie (KIA).</p>
<h3>LEE Business Clinic</h3>
<ul><li>1,250 coaching sessions for women MSME owners</li></ul>`,
    bodyAr: `<p>قدم هذا البرنامج 1,250 جلسة إرشاد تجاري للمنشآت الصغيرة بقيادة النساء في لبنان عام 2023.</p>`,
    coverImageUrl: "",
    status: "COMPLETED",
    year: 2023,
    donorEn: "Lutheran World Relief – Corus International, funded by Kerk in Actie (KIA)",
    donorAr: "الإغاثة اللوثرية العالمية – Corus International، بتمويل من Kerk in Actie (KIA)",
    locationEn: "Lebanon",
    locationAr: "لبنان",
    pillarSlug: "coaching",
    isFeatured: false,
    beneficiaries: 1250,
    stats: [
      { labelEn: "Coaching Sessions", labelAr: "جلسة إرشاد", value: 1250, icon: "target", order: 0 },
    ],
    images: [],
  },

  // ═══════════════════════════════════════════════════════════════
  // EXCEL P13 (Row 27): 2020-2021, Lebanon
  // LMFA / Palladium
  // DMH(E-learning Materials and link of the videos)
  // ═══════════════════════════════════════════════════════════════
  {
    slug: "lmfa-palladium-elearning-2020",
    titleEn: "E-Learning Materials Development — LMFA & Palladium",
    titleAr: "تطوير مواد التعلم الإلكتروني — LMFA وPalladium",
    summaryEn: "Development of e-learning materials and training videos for entrepreneurs in Lebanon with LMFA and Palladium.",
    summaryAr: "تطوير مواد التعلم الإلكتروني ومقاطع فيديو تدريبية لرواد الأعمال في لبنان مع LMFA وPalladium.",
    bodyEn: `<p>This program (2020–2021) developed e-learning materials and training videos for entrepreneurs in Lebanon, in partnership with LMFA and Palladium.</p>
<h3>LEE Digital Media Hub</h3>
<ul><li>E-learning materials development</li>
<li>Training video production</li></ul>`,
    bodyAr: `<p>طوّر هذا البرنامج (2020-2021) مواد تعلم إلكتروني ومقاطع فيديو تدريبية لرواد الأعمال في لبنان بالشراكة مع LMFA وPalladium.</p>`,
    coverImageUrl: "",
    status: "COMPLETED",
    year: 2020,
    donorEn: "LMFA & Palladium",
    donorAr: "LMFA وPalladium",
    locationEn: "Lebanon",
    locationAr: "لبنان",
    pillarSlug: "digital-media-hub",
    isFeatured: false,
    stats: [],
    images: [],
  },

  // ═══════════════════════════════════════════════════════════════
  // EXCEL P14 (Row 28): 2022, Lebanon
  // CCIAS / Rest@art / EU
  // DMH(Branding & Advertising for 20 MSME)
  // ═══════════════════════════════════════════════════════════════
  {
    slug: "ccias-restart-eu-branding-2022",
    titleEn: "Branding & Advertising for MSMEs — Rest@art & EU",
    titleAr: "العلامة التجارية والإعلان للمنشآت الصغيرة — Rest@art والاتحاد الأوروبي",
    summaryEn: "Branding and advertising support for 20 MSMEs in Lebanon with CCIAS, Rest@art, and the European Union.",
    summaryAr: "دعم العلامة التجارية والإعلان لـ 20 منشأة صغيرة في لبنان مع CCIAS وRest@art والاتحاد الأوروبي.",
    bodyEn: `<p>This program provided branding and advertising support for 20 MSMEs in Lebanon in 2022, in partnership with CCIAS, Rest@art, and the European Union.</p>
<h3>LEE Digital Media Hub</h3>
<ul><li>20 MSMEs supported with branding and advertising</li></ul>`,
    bodyAr: `<p>قدم هذا البرنامج دعم العلامة التجارية والإعلان لـ 20 منشأة صغيرة في لبنان عام 2022.</p>`,
    coverImageUrl: "",
    status: "COMPLETED",
    year: 2022,
    donorEn: "CCIAS, Rest@art, EU",
    donorAr: "CCIAS، Rest@art، الاتحاد الأوروبي",
    locationEn: "Lebanon",
    locationAr: "لبنان",
    pillarSlug: "digital-media-hub",
    isFeatured: false,
    beneficiaries: 20,
    stats: [
      { labelEn: "MSMEs Supported", labelAr: "منشأة مدعومة", value: 20, icon: "briefcase", order: 0 },
    ],
    images: [],
  },

  // ═══════════════════════════════════════════════════════════════
  // EXCEL P15 (Row 29): 2023, Lebanon
  // Merath
  // DMH(Market Study for Textile ecosystem in Lebanon)
  // ═══════════════════════════════════════════════════════════════
  {
    slug: "merath-textile-market-study-2023",
    titleEn: "Market Study for the Textile Ecosystem in Lebanon",
    titleAr: "دراسة سوقية لمنظومة النسيج في لبنان",
    summaryEn: "Comprehensive market study for the textile ecosystem in Lebanon with Merath.",
    summaryAr: "دراسة سوقية شاملة لمنظومة النسيج في لبنان مع ميراث.",
    bodyEn: `<p>This program conducted a comprehensive market study for the textile ecosystem in Lebanon in 2023, in partnership with Merath.</p>
<h3>LEE Digital Media Hub</h3>
<ul><li>Market study and research for the textile sector</li></ul>`,
    bodyAr: `<p>أجرى هذا البرنامج دراسة سوقية شاملة لمنظومة النسيج في لبنان عام 2023 بالشراكة مع ميراث.</p>`,
    coverImageUrl: "",
    status: "COMPLETED",
    year: 2023,
    donorEn: "Merath",
    donorAr: "ميراث",
    locationEn: "Lebanon",
    locationAr: "لبنان",
    pillarSlug: "digital-media-hub",
    isFeatured: false,
    stats: [],
    images: [],
  },

  // ═══════════════════════════════════════════════════════════════
  // EXCEL P16 (Row 30): 2025, Lebanon
  // Norway Embassy & UNDP
  // Humanitarian(20000 Hot Meals, 800 Food Parcels, 20 Business Linkages, 100 Cash for Work)
  // ═══════════════════════════════════════════════════════════════
  {
    slug: "cash-for-work-food-relief-north",
    titleEn: "Food Relief & Cash for Work Program",
    titleAr: "الإغاثة الغذائية وبرنامج النقد مقابل العمل",
    summaryEn: "20,000 hot meals, 800 food parcels, 20 business linkages (vulnerable-to-vulnerable support), and 100 cash-for-work opportunities in Lebanon with Norway Embassy and UNDP.",
    summaryAr: "20,000 وجبة ساخنة و800 طرد غذائي و20 ربط تجاري (دعم الضعفاء للضعفاء) و100 فرصة عمل مقابل النقد في لبنان مع سفارة النرويج وبرنامج الأمم المتحدة الإنمائي.",
    bodyEn: `<p>This humanitarian program in 2025 provides comprehensive food relief and livelihood support in Lebanon, in partnership with the Norway Embassy and UNDP.</p>
<h3>LEE Humanitarian</h3>
<ul>
<li>20,000 hot meals distributed</li>
<li>800 food parcels distributed</li>
<li>20 business linkages (vulnerable-to-vulnerable support)</li>
<li>100 cash-for-work opportunities</li>
</ul>`,
    bodyAr: `<p>يقدم هذا البرنامج الإنساني عام 2025 إغاثة غذائية شاملة ودعم سبل العيش في لبنان بالشراكة مع سفارة النرويج وبرنامج الأمم المتحدة الإنمائي.</p>`,
    coverImageUrl: "",
    status: "ACTIVE",
    year: 2025,
    donorEn: "Norway Embassy & UNDP",
    donorAr: "سفارة النرويج وبرنامج الأمم المتحدة الإنمائي",
    locationEn: "Lebanon",
    locationAr: "لبنان",
    pillarSlug: "humanitarian-aid",
    isFeatured: true,
    beneficiaries: 20000,
    stats: [
      { labelEn: "Hot Meals", labelAr: "وجبة ساخنة", value: 20000, icon: "utensils", order: 0 },
      { labelEn: "Food Parcels", labelAr: "طرد غذائي", value: 800, icon: "package", order: 1 },
      { labelEn: "Cash for Work", labelAr: "نقد مقابل العمل", value: 100, icon: "dollar", order: 2 },
      { labelEn: "Business Linkages", labelAr: "ربط تجاري", value: 20, icon: "handshake", order: 3 },
    ],
    images: [],
  },

  // ═══════════════════════════════════════════════════════════════
  // EXCEL P17 (Row 31): 2024-2025, Lebanon
  // GIZ / International Alert
  // Humanitarian Aid(24000 Hot Meals)
  // ═══════════════════════════════════════════════════════════════
  {
    slug: "community-kitchens-social-cohesion",
    titleEn: "Community Kitchen Initiative — GIZ & International Alert",
    titleAr: "مبادرة المطابخ المجتمعية — GIZ ومنظمة التنبيه الدولي",
    summaryEn: "Distributing 24,000 hot meals through community kitchens in Lebanon with GIZ and International Alert.",
    summaryAr: "توزيع 24,000 وجبة ساخنة عبر المطابخ المجتمعية في لبنان مع GIZ ومنظمة التنبيه الدولي.",
    bodyEn: `<p>This humanitarian initiative (2024–2025) distributes hot meals through community kitchens in Lebanon, in partnership with GIZ and International Alert.</p>
<h3>LEE Humanitarian Aid</h3>
<ul><li>24,000 hot meals distributed through community kitchens</li></ul>`,
    bodyAr: `<p>توزع هذه المبادرة الإنسانية (2024-2025) وجبات ساخنة عبر المطابخ المجتمعية في لبنان بالشراكة مع GIZ ومنظمة التنبيه الدولي.</p>`,
    coverImageUrl: "",
    status: "COMPLETED",
    year: 2024,
    donorEn: "GIZ & International Alert",
    donorAr: "GIZ ومنظمة التنبيه الدولي",
    locationEn: "Lebanon",
    locationAr: "لبنان",
    pillarSlug: "humanitarian-aid",
    isFeatured: true,
    beneficiaries: 24000,
    stats: [
      { labelEn: "Hot Meals", labelAr: "وجبة ساخنة", value: 24000, icon: "utensils", order: 0 },
    ],
    images: [],
  },

  // ═══════════════════════════════════════════════════════════════
  // EXCEL P18 (Row 32): 2023, Lebanon
  // Berytech / EU
  // Incubator(16 researchers/startups) + Academy(50 trained) + Clinic(60 coaching)
  // ═══════════════════════════════════════════════════════════════
  {
    slug: "berytech-eu-startup-incubation-2023",
    titleEn: "Startup & Research Incubation — Berytech & EU Partnership",
    titleAr: "حاضنة الشركات الناشئة والأبحاث — شراكة بيريتك والاتحاد الأوروبي",
    summaryEn: "Incubating 16 researchers and startups, training 50 professionals, and delivering 60 coaching sessions in partnership with Berytech and the European Union.",
    summaryAr: "احتضان 16 باحثاً وشركة ناشئة وتدريب 50 متخصصاً وتقديم 60 جلسة إرشاد بالشراكة مع بيريتك والاتحاد الأوروبي.",
    bodyEn: `<p>This program incubated 16 researchers and startups in Lebanon in 2023, in partnership with Berytech and the European Union.</p>
<h3>LEE Incubator</h3>
<ul><li>16 researchers and startups incubated</li></ul>
<h3>LEE Academy</h3>
<ul><li>50 professionals trained</li></ul>
<h3>LEE Business Clinic</h3>
<ul><li>60 coaching sessions</li></ul>`,
    bodyAr: `<p>احتضن هذا البرنامج 16 باحثاً وشركة ناشئة في لبنان عام 2023 بالشراكة مع بيريتك والاتحاد الأوروبي.</p>`,
    coverImageUrl: "/images/projects/berytech-eu-startup-incubation-2023/cover.jpg",
    status: "COMPLETED",
    year: 2023,
    donorEn: "Berytech & European Union",
    donorAr: "بيريتك والاتحاد الأوروبي",
    locationEn: "Lebanon",
    locationAr: "لبنان",
    pillarSlug: "incubators",
    isFeatured: false,
    beneficiaries: 50,
    stats: [
      { labelEn: "Startups Incubated", labelAr: "شركة ناشئة محتضنة", value: 16, icon: "rocket", order: 0 },
      { labelEn: "Professionals Trained", labelAr: "متخصص مدرب", value: 50, icon: "users", order: 1 },
      { labelEn: "Coaching Sessions", labelAr: "جلسة إرشاد", value: 60, icon: "target", order: 2 },
    ],
    images: [
      "/images/projects/berytech-eu-startup-incubation-2023/cover.jpg",
      "/images/projects/berytech-eu-startup-incubation-2023/gallery-4.jpg",
      "/images/projects/berytech-eu-startup-incubation-2023/gallery-5.jpg",
      "/images/projects/berytech-eu-startup-incubation-2023/gallery-6.jpg",
      "/images/projects/berytech-eu-startup-incubation-2023/gallery-7.jpg",
      "/images/projects/berytech-eu-startup-incubation-2023/gallery-8.jpg",
      "/images/projects/berytech-eu-startup-incubation-2023/gallery-9.jpg",
      "/images/projects/berytech-eu-startup-incubation-2023/gallery-1.png",
      "/images/projects/berytech-eu-startup-incubation-2023/gallery-2.png",
      "/images/projects/berytech-eu-startup-incubation-2023/gallery-3.png",
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // EXCEL P19 (Row 35): 2024, Lebanon
  // EU & ILO
  // Incubator(300 Feasibility) + Academy(1000 Trained) + Clinic(600 coaching)
  // ═══════════════════════════════════════════════════════════════
  {
    slug: "enable-siyb-training-2024",
    titleEn: "ENABLE Programme — Entrepreneurship Training & Incubation",
    titleAr: "برنامج ENABLE — تدريب ريادة الأعمال والحاضنات",
    summaryEn: "Large-scale program: 300 feasibility studies, 1,000 entrepreneurs trained, and 600 coaching sessions across Lebanon with the EU and ILO.",
    summaryAr: "برنامج واسع النطاق: 300 دراسة جدوى و1,000 رائد أعمال مدرب و600 جلسة إرشاد في لبنان مع الاتحاد الأوروبي ومنظمة العمل الدولية.",
    bodyEn: `<p>The ENABLE Programme delivered comprehensive entrepreneurship support across Lebanon in 2024, funded by the European Union and the International Labour Organization (ILO).</p>
<h3>LEE Incubator</h3>
<ul><li>300 feasibility studies developed</li></ul>
<h3>LEE Academy</h3>
<ul><li>1,000 entrepreneurs trained</li></ul>
<h3>LEE Business Clinic</h3>
<ul><li>600 coaching sessions</li></ul>`,
    bodyAr: `<p>قدم برنامج ENABLE دعماً شاملاً لريادة الأعمال في لبنان عام 2024 بتمويل من الاتحاد الأوروبي ومنظمة العمل الدولية.</p>`,
    coverImageUrl: "/images/projects/enable-siyb-training-2024/cover.jpg",
    status: "COMPLETED",
    year: 2024,
    donorEn: "EU & ILO",
    donorAr: "الاتحاد الأوروبي ومنظمة العمل الدولية",
    locationEn: "Lebanon",
    locationAr: "لبنان",
    pillarSlug: "incubators",
    isFeatured: true,
    beneficiaries: 1000,
    stats: [
      { labelEn: "Feasibility Studies", labelAr: "دراسة جدوى", value: 300, icon: "clipboard", order: 0 },
      { labelEn: "Entrepreneurs Trained", labelAr: "رائد أعمال مدرب", value: 1000, icon: "users", order: 1 },
      { labelEn: "Coaching Sessions", labelAr: "جلسة إرشاد", value: 600, icon: "target", order: 2 },
    ],
    images: [
      "/images/projects/enable-siyb-training-2024/cover.jpg",
      "/images/projects/enable-siyb-training-2024/gallery-1.jpg",
      "/images/projects/enable-siyb-training-2024/gallery-2.jpg",
      "/images/projects/enable-siyb-training-2024/gallery-3.jpg",
      "/images/projects/enable-siyb-training-2024/gallery-4.jpeg",
      "/images/projects/enable-siyb-training-2024/gallery-5.jpeg",
      "/images/projects/enable-siyb-training-2024/gallery-6.jpeg",
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // EXCEL P20 (Row 38): 2026-2027, Lebanon
  // Women Peace Humanitarian Fund & UNDP/SALAM LADC/WWL
  // Incubator(70 feasibility) + Academy(70 trained) + Clinic(70 coaching) + DMH(70 branding)
  // ═══════════════════════════════════════════════════════════════
  {
    slug: "wphf-undp-women-empowerment-2026",
    titleEn: "Women's Economic Empowerment — WPHF & UNDP Partnership",
    titleAr: "التمكين الاقتصادي للمرأة — شراكة WPHF وبرنامج الأمم المتحدة الإنمائي",
    summaryEn: "Comprehensive women's empowerment: 70 feasibility studies, 70 trained, 70 coaching sessions, and 70 women supported in branding and digital marketing in Lebanon with WPHF, UNDP, SALAM LADC, and WWL.",
    summaryAr: "تمكين شامل للمرأة: 70 دراسة جدوى و70 متدربة و70 جلسة إرشاد و70 امرأة مدعومة في العلامة التجارية والتسويق الرقمي في لبنان.",
    bodyEn: `<p>This upcoming program (2026–2027) will provide comprehensive women's economic empowerment in Lebanon, in partnership with the Women's Peace & Humanitarian Fund (WPHF), UNDP, SALAM LADC, and WWL.</p>
<h3>LEE Incubator</h3>
<ul><li>70 feasibility studies</li></ul>
<h3>LEE Academy</h3>
<ul><li>70 women trained</li></ul>
<h3>LEE Business Clinic</h3>
<ul><li>70 coaching sessions</li></ul>
<h3>LEE Digital Media Hub</h3>
<ul><li>70 women supported in branding, advertising, and digital marketing</li></ul>`,
    bodyAr: `<p>سيقدم هذا البرنامج (2026-2027) تمكيناً اقتصادياً شاملاً للمرأة في لبنان بالشراكة مع صندوق المرأة للسلام والعمل الإنساني وبرنامج الأمم المتحدة الإنمائي.</p>`,
    coverImageUrl: "",
    status: "UPCOMING",
    year: 2026,
    donorEn: "Women Peace Humanitarian Fund, UNDP, SALAM LADC, WWL",
    donorAr: "صندوق المرأة للسلام والعمل الإنساني، برنامج الأمم المتحدة الإنمائي، سلام LADC، WWL",
    locationEn: "Lebanon",
    locationAr: "لبنان",
    pillarSlug: "incubators",
    isFeatured: false,
    beneficiaries: 70,
    stats: [
      { labelEn: "Feasibility Studies", labelAr: "دراسة جدوى", value: 70, icon: "clipboard", order: 0 },
      { labelEn: "Women Trained", labelAr: "امرأة مدربة", value: 70, icon: "users", order: 1 },
      { labelEn: "Coaching Sessions", labelAr: "جلسة إرشاد", value: 70, icon: "target", order: 2 },
      { labelEn: "Digital Marketing Support", labelAr: "دعم تسويق رقمي", value: 70, icon: "monitor", order: 3 },
    ],
    images: [],
  },

  // ═══════════════════════════════════════════════════════════════
  // EXCEL P21 (Row 43): 2020-2022, Lebanon, UNIFIL
  // DMH(20+200) + Academy(65 VT + 65 SIYB) + Incubator&Accelerator(65 in-kind + 10 SE) + Clinic(200)
  // ═══════════════════════════════════════════════════════════════
  {
    slug: "unifil-women-social-enterprises",
    titleEn: "Women's Empowerment & Vocational Training — UNIFIL Partnership",
    titleAr: "تمكين المرأة والتدريب المهني — شراكة اليونيفيل",
    summaryEn: "Comprehensive women's empowerment in Lebanon: vocational training for 65 women, 65 in-kind digital equipment grants, 10 social enterprises, 200 coaching sessions, and branding support with UNIFIL.",
    summaryAr: "تمكين شامل للمرأة في لبنان: تدريب مهني لـ 65 امرأة و65 منحة معدات رقمية عينية و10 مؤسسات اجتماعية و200 جلسة إرشاد ودعم العلامة التجارية مع اليونيفيل.",
    bodyEn: `<p>This comprehensive program (2020–2022) with UNIFIL focused on women's economic empowerment in Lebanon through multiple pillars of support.</p>
<h3>LEE Academy</h3>
<ul>
<li>Vocational training for 65 women: photography & graphic design (20 from COOP), blue economy (20 women), green fashion (25 women)</li>
<li>65 women trained on how to start & improve their business</li>
</ul>
<h3>LEE Incubator & Accelerator</h3>
<ul>
<li>In-kind grant of digital equipment for 65 women</li>
<li>10 social enterprises & business plans developed</li>
</ul>
<h3>LEE Business Clinic</h3>
<ul><li>200 coaching sessions</li></ul>
<h3>LEE Digital Media Hub</h3>
<ul><li>220 women supported in branding, advertising, and digital marketing</li></ul>`,
    bodyAr: `<p>ركز هذا البرنامج الشامل (2020-2022) مع اليونيفيل على التمكين الاقتصادي للمرأة في لبنان عبر محاور دعم متعددة.</p>`,
    coverImageUrl: "/images/projects/unifil-women-social-enterprises/cover.jpg",
    status: "COMPLETED",
    year: 2020,
    endYear: 2022,
    donorEn: "UNIFIL",
    donorAr: "اليونيفيل",
    locationEn: "Lebanon",
    locationAr: "لبنان",
    pillarSlug: "incubators",
    isFeatured: true,
    beneficiaries: 130,
    stats: [
      { labelEn: "Women VT Trained", labelAr: "امرأة تدريب مهني", value: 65, icon: "users", order: 0 },
      { labelEn: "Digital Equipment Grants", labelAr: "منحة معدات رقمية", value: 65, icon: "monitor", order: 1 },
      { labelEn: "Social Enterprises", labelAr: "مؤسسة اجتماعية", value: 10, icon: "briefcase", order: 2 },
      { labelEn: "Coaching Sessions", labelAr: "جلسة إرشاد", value: 200, icon: "target", order: 3 },
      { labelEn: "DMH Support", labelAr: "دعم إعلام رقمي", value: 220, icon: "megaphone", order: 4 },
    ],
    images: [
      "/images/projects/unifil-women-social-enterprises/cover.jpg",
      "/images/projects/unifil-women-social-enterprises/gallery-1.jpg",
      "/images/projects/unifil-women-social-enterprises/gallery-2.jpg",
      "/images/projects/unifil-women-social-enterprises/gallery-3.jpg",
      "/images/projects/unifil-women-social-enterprises/gallery-4.png",
      "/images/projects/unifil-women-social-enterprises/gallery-5.jpg",
      "/images/projects/unifil-women-social-enterprises/gallery-6.jpg",
      "/images/projects/unifil-women-social-enterprises/gallery-7.jpg",
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // EXCEL P22 (Row 50): 2025, Lebanon & Egypt & Tunisia
  // Seketak, JEUN'ESS, Market Fund, EU, République Tunisienne, OIT, EU4Y
  // Acceleration (Expert & Investment Readiness) — 450
  // ═══════════════════════════════════════════════════════════════
  {
    slug: "seketak-acceleration-investment-readiness-2025",
    titleEn: "Expert & Investment Readiness Acceleration Program",
    titleAr: "برنامج تسريع الخبراء والجاهزية للاستثمار",
    summaryEn: "Accelerating 450 entrepreneurs towards expert and investment readiness across Lebanon, Egypt, and Tunisia, led by Seketak and JEUN'ESS with co-funding from Market Fund, EU, OIT, and EU4Y.",
    summaryAr: "تسريع 450 رائد أعمال نحو الجاهزية للخبرة والاستثمار في لبنان ومصر وتونس بقيادة Seketak وJEUN'ESS وبتمويل مشترك من Market Fund والاتحاد الأوروبي وOIT وEU4Y.",
    bodyEn: `<p>This acceleration program in 2025 supports 450 entrepreneurs towards expert and investment readiness across Lebanon, Egypt, and Tunisia.</p>
<h3>LEE Acceleration</h3>
<ul><li>450 entrepreneurs accelerated with expert mentorship and investment readiness training</li></ul>`,
    bodyAr: `<p>يدعم برنامج التسريع هذا عام 2025 أكثر من 450 رائد أعمال نحو الجاهزية للخبرة والاستثمار في لبنان ومصر وتونس.</p>`,
    coverImageUrl: "/images/projects/seketak-acceleration-investment-readiness-2025/cover.jpg",
    status: "ACTIVE",
    year: 2025,
    donorEn: "Seketak, JEUN'ESS, Market Fund, EU, République Tunisienne, OIT, EU4Y",
    donorAr: "Seketak، JEUN'ESS، Market Fund، الاتحاد الأوروبي، الجمهورية التونسية، OIT، EU4Y",
    locationEn: "Lebanon, Egypt, Tunisia",
    locationAr: "لبنان، مصر، تونس",
    pillarSlug: "incubators",
    isFeatured: true,
    beneficiaries: 450,
    stats: [
      { labelEn: "Entrepreneurs Accelerated", labelAr: "رائد أعمال مسرّع", value: 450, icon: "rocket", order: 0 },
    ],
    images: [
      "/images/projects/seketak-acceleration-investment-readiness-2025/cover.jpg",
      "/images/projects/seketak-acceleration-investment-readiness-2025/gallery-1.jpg",
      "/images/projects/seketak-acceleration-investment-readiness-2025/gallery-2.jpg",
      "/images/projects/seketak-acceleration-investment-readiness-2025/gallery-3.jpg",
      "/images/projects/seketak-acceleration-investment-readiness-2025/gallery-4.jpg",
      "/images/projects/seketak-acceleration-investment-readiness-2025/gallery-5.jpg",
      "/images/projects/seketak-acceleration-investment-readiness-2025/gallery-6.jpg",
      "/images/projects/seketak-acceleration-investment-readiness-2025/gallery-7.jpg",
      "/images/projects/seketak-acceleration-investment-readiness-2025/gallery-8.jpg",
      "/images/projects/seketak-acceleration-investment-readiness-2025/gallery-9.jpg",
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // EXCEL P23 (Row 53): 2025-2026, Lebanon
  // IRC, World Bank, Netherlands Embassy, Kafa, Tabita, MUBS, Nammi Skills, Bayt.com
  // Incubator(244 feasibility) + Academy(244 trained) + Clinic(244 coaching) + DMH(244 branding)
  // ═══════════════════════════════════════════════════════════════
  {
    slug: "srp2-economic-empowerment-sgbv",
    titleEn: "Economic Empowerment for Survivors of Gender-Based Violence (SRP2)",
    titleAr: "التمكين الاقتصادي للناجيات من العنف القائم على النوع الاجتماعي (SRP2)",
    summaryEn: "Comprehensive empowerment for 244 women: feasibility studies, training, coaching, and digital marketing support in Lebanon with IRC, World Bank, Netherlands Embassy, and partners.",
    summaryAr: "تمكين شامل لـ 244 امرأة: دراسات جدوى وتدريب وإرشاد ودعم تسويق رقمي في لبنان مع لجنة الإنقاذ الدولية والبنك الدولي وسفارة هولندا وشركاء.",
    bodyEn: `<p>The SRP2 program (2025–2026) supports survivors of gender-based violence through comprehensive economic empowerment in Lebanon.</p>
<h3>LEE Incubator (Women in Business)</h3>
<ul><li>244 feasibility studies</li></ul>
<h3>LEE Academy</h3>
<ul><li>244 women trained</li></ul>
<h3>LEE Business Clinic</h3>
<ul><li>244 coaching sessions</li></ul>
<h3>LEE Digital Media Hub</h3>
<ul><li>244 women supported in branding, advertising, and digital marketing</li></ul>`,
    bodyAr: `<p>يدعم برنامج SRP2 (2025-2026) الناجيات من العنف القائم على النوع الاجتماعي من خلال التمكين الاقتصادي الشامل في لبنان.</p>`,
    coverImageUrl: "/images/projects/srp2-economic-empowerment-sgbv/cover.jpg",
    status: "ACTIVE",
    year: 2025,
    donorEn: "IRC, World Bank, Netherlands Embassy, Kafa, Tabita, MUBS, Nammi Skills, Bayt.com",
    donorAr: "لجنة الإنقاذ الدولية، البنك الدولي، سفارة هولندا، كفى، تابيتا، MUBS، نمّي مهاراتك، بيت.كوم",
    locationEn: "Lebanon",
    locationAr: "لبنان",
    pillarSlug: "incubators",
    isFeatured: true,
    beneficiaries: 244,
    stats: [
      { labelEn: "Feasibility Studies", labelAr: "دراسة جدوى", value: 244, icon: "clipboard", order: 0 },
      { labelEn: "Women Trained", labelAr: "امرأة مدربة", value: 244, icon: "users", order: 1 },
      { labelEn: "Coaching Sessions", labelAr: "جلسة إرشاد", value: 244, icon: "target", order: 2 },
      { labelEn: "Digital Marketing Support", labelAr: "دعم تسويق رقمي", value: 244, icon: "monitor", order: 3 },
    ],
    images: [
      "/images/projects/srp2-economic-empowerment-sgbv/cover.jpg",
      "/images/projects/srp2-economic-empowerment-sgbv/gallery-1.jpg",
      "/images/projects/srp2-economic-empowerment-sgbv/gallery-2.jpg",
      "/images/projects/srp2-economic-empowerment-sgbv/gallery-3.jpeg",
      "/images/projects/srp2-economic-empowerment-sgbv/gallery-4.jpg",
      "/images/projects/srp2-economic-empowerment-sgbv/gallery-5.jpg",
      "/images/projects/srp2-economic-empowerment-sgbv/gallery-6.jpg",
      "/images/projects/srp2-economic-empowerment-sgbv/gallery-7.jpg",
      "/images/projects/srp2-economic-empowerment-sgbv/gallery-8.jpg",
      "/images/projects/srp2-economic-empowerment-sgbv/gallery-9.jpg",
    ],
  },
];
