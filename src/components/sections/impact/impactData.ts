export interface ImpactStat {
  id: string;
  labelEn: string;
  labelAr: string;
  value: number;
  suffix?: string;
  prefix?: string;
  category: 'economic' | 'social' | 'environmental';
  tab: 'for-profit' | 'non-profit';
  icon: string;
}

export interface CaseStudy {
  id: string;
  slug: string;
  titleEn: string;
  titleAr: string;
  subtitleEn: string;
  subtitleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  imageUrl: string;
  stats: { labelEn: string; labelAr: string; value: string }[];
  outcomes: { en: string; ar: string }[];
}

export interface MenaCountry {
  id: string;
  nameEn: string;
  nameAr: string;
  programs: number;
  beneficiaries: string;
  highlightEn: string;
  highlightAr: string;
}

export interface LessonCard {
  id: string;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  icon: string;
}

export interface DownloadItem {
  id: string;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  coverImageUrl: string;
  fileUrl: string;
  fileType: 'pdf' | 'xlsx';
}

export interface JourneyMilestone {
  year: number;
  metricValue: string;
  labelEn: string;
  labelAr: string;
}

export const impactStats: ImpactStat[] = [
  // For-profit tab
  { id: "fp1", labelEn: "Startups Incubated", labelAr: "شركات ناشئة محتضنة", value: 2365, suffix: "+", category: "economic", tab: "for-profit", icon: "rocket" },
  { id: "fp2", labelEn: "MSMEs Accelerated", labelAr: "مشاريع صغيرة مُسَرَّعة", value: 3421, suffix: "+", category: "economic", tab: "for-profit", icon: "trending-up" },
  { id: "fp3", labelEn: "Seed Funding Mobilized", labelAr: "تمويل أولي", value: 1.06, prefix: "$", suffix: "M+", category: "economic", tab: "for-profit", icon: "coins" },
  { id: "fp4", labelEn: "Feasibility Studies", labelAr: "دراسات جدوى", value: 5130, suffix: "+", category: "economic", tab: "for-profit", icon: "file-text" },
  { id: "fp5", labelEn: "Green Ventures Thriving", labelAr: "مشاريع خضراء مزدهرة", value: 60, suffix: "%", category: "environmental", tab: "for-profit", icon: "leaf" },
  { id: "fp6", labelEn: "Green Jobs Created", labelAr: "وظائف خضراء", value: 1800, suffix: "+", category: "environmental", tab: "for-profit", icon: "briefcase" },
  // Non-profit tab
  { id: "np1", labelEn: "Lives Touched", labelAr: "حياة تأثرت", value: 38790, suffix: "+", category: "social", tab: "non-profit", icon: "users" },
  { id: "np2", labelEn: "Meals Distributed", labelAr: "وجبات موزعة", value: 52000, suffix: "+", category: "social", tab: "non-profit", icon: "hand-helping" },
  { id: "np3", labelEn: "PSS Sessions Delivered", labelAr: "جلسات دعم نفسي اجتماعي", value: 4200, suffix: "+", category: "social", tab: "non-profit", icon: "user-check" },
  { id: "np4", labelEn: "CFW Workers Supported", labelAr: "عمال نقد مقابل عمل", value: 1850, suffix: "+", category: "social", tab: "non-profit", icon: "briefcase" },
  { id: "np5", labelEn: "Women Reached", labelAr: "نساء تم الوصول إليهن", value: 80, suffix: "%", category: "social", tab: "non-profit", icon: "user-check" },
  { id: "np6", labelEn: "Countries", labelAr: "دول", value: 10, category: "social", tab: "non-profit", icon: "globe" },
];

export const caseStudies: CaseStudy[] = [
  {
    id: "akroum-dairy",
    slug: "akroum-dairy",
    titleEn: "Akroum Dairy",
    titleAr: "ألبان عكروم",
    subtitleEn: "Social & Solidarity Economy Project",
    subtitleAr: "مشروع الاقتصاد الاجتماعي والتضامني",
    descriptionEn: "A community-driven dairy cooperative in northern Lebanon that transformed local livelihoods through sustainable agriculture and women-led production. With LEEE's incubation support, Akroum Dairy scaled from a small village initiative to a registered cooperative serving regional markets.",
    descriptionAr: "تعاونية ألبان مجتمعية في شمال لبنان حوّلت سبل العيش المحلية من خلال الزراعة المستدامة والإنتاج بقيادة النساء. بدعم حاضنات LEEE، توسعت ألبان عكروم من مبادرة قرية صغيرة إلى تعاونية مسجلة تخدم الأسواق الإقليمية.",
    imageUrl: "/images/new/greenhouse-visit.jpg",
    stats: [
      { labelEn: "Women Employed", labelAr: "نساء موظفات", value: "35+" },
      { labelEn: "Monthly Revenue", labelAr: "إيرادات شهرية", value: "$12K" },
      { labelEn: "Products Launched", labelAr: "منتجات أُطلقت", value: "8" },
    ],
    outcomes: [
      { en: "Registered cooperative with 35+ women members", ar: "تعاونية مسجلة تضم أكثر من 35 عضوة" },
      { en: "Consistent monthly revenue exceeding $12,000", ar: "إيرادات شهرية ثابتة تتجاوز 12,000 دولار" },
      { en: "8 dairy products launched in local and regional markets", ar: "8 منتجات ألبان أُطلقت في الأسواق المحلية والإقليمية" },
      { en: "Model replicated in 2 neighboring communities", ar: "نموذج مُكرر في مجتمعين مجاورين" },
    ],
  },
  {
    id: "mounet-setti",
    slug: "mounet-setti",
    titleEn: "Mounet Setti",
    titleAr: "مونة ستي",
    subtitleEn: "Women-Led Food Heritage Enterprise",
    subtitleAr: "مشروع تراث غذائي بقيادة نسائية",
    descriptionEn: "Preserving Lebanese culinary heritage through women-led artisanal food production. Mounet Setti connects rural women producers with urban and international markets, turning traditional preservation techniques into a sustainable livelihood model.",
    descriptionAr: "الحفاظ على التراث الغذائي اللبناني من خلال إنتاج الأغذية الحرفية بقيادة النساء. تربط مونة ستي بين المنتِجات الريفيات والأسواق الحضرية والدولية، محوّلةً تقنيات الحفظ التقليدية إلى نموذج معيشة مستدام.",
    imageUrl: "/images/new/community-table.jpg",
    stats: [
      { labelEn: "Women Producers", labelAr: "منتجات", value: "50+" },
      { labelEn: "Product Lines", labelAr: "خطوط إنتاج", value: "15" },
      { labelEn: "Markets Reached", labelAr: "أسواق", value: "4" },
    ],
    outcomes: [
      { en: "50+ rural women earning steady income from traditional recipes", ar: "أكثر من 50 امرأة ريفية تحقق دخلاً ثابتاً من الوصفات التقليدية" },
      { en: "15 artisanal product lines with branded packaging", ar: "15 خط إنتاج حرفي بتغليف ذي علامة تجارية" },
      { en: "Expanded to 4 markets including export channels", ar: "توسع إلى 4 أسواق بما فيها قنوات التصدير" },
      { en: "Featured in national media as a model social enterprise", ar: "ظهرت في الإعلام الوطني كنموذج مؤسسة اجتماعية" },
    ],
  },
];

export const menaCountries: MenaCountry[] = [
  { id: "lb", nameEn: "Lebanon", nameAr: "لبنان", programs: 18, beneficiaries: "22,000+", highlightEn: "Headquarters — 18 programs across all pillars", highlightAr: "المقر الرئيسي — 18 برنامجاً عبر جميع الركائز" },
  { id: "eg", nameEn: "Egypt", nameAr: "مصر", programs: 5, beneficiaries: "4,500+", highlightEn: "Cairo hub — incubation & academy programs", highlightAr: "مركز القاهرة — برامج حاضنات وأكاديمية" },
  { id: "jo", nameEn: "Jordan", nameAr: "الأردن", programs: 3, beneficiaries: "2,800+", highlightEn: "Youth entrepreneurship & refugee support", highlightAr: "ريادة الشباب ودعم اللاجئين" },
  { id: "iq", nameEn: "Iraq", nameAr: "العراق", programs: 2, beneficiaries: "1,500+", highlightEn: "Women-led MSME acceleration", highlightAr: "تسريع المشاريع الصغيرة بقيادة النساء" },
  { id: "ps", nameEn: "Palestine", nameAr: "فلسطين", programs: 2, beneficiaries: "1,200+", highlightEn: "Humanitarian aid & livelihood support", highlightAr: "مساعدات إنسانية ودعم سبل العيش" },
  { id: "tn", nameEn: "Tunisia", nameAr: "تونس", programs: 2, beneficiaries: "1,800+", highlightEn: "Green economy & social enterprise", highlightAr: "اقتصاد أخضر ومؤسسات اجتماعية" },
  { id: "ma", nameEn: "Morocco", nameAr: "المغرب", programs: 1, beneficiaries: "900+", highlightEn: "Business clinic pilot program", highlightAr: "برنامج عيادة أعمال تجريبي" },
  { id: "sd", nameEn: "Sudan", nameAr: "السودان", programs: 1, beneficiaries: "1,100+", highlightEn: "Emergency humanitarian response", highlightAr: "استجابة إنسانية طارئة" },
  { id: "ly", nameEn: "Libya", nameAr: "ليبيا", programs: 1, beneficiaries: "700+", highlightEn: "Youth capacity building", highlightAr: "بناء قدرات الشباب" },
  { id: "ke", nameEn: "Kenya", nameAr: "كينيا", programs: 1, beneficiaries: "1,200+", highlightEn: "Africa expansion — green business incubation", highlightAr: "التوسع الأفريقي — حاضنات الأعمال الخضراء" },
];

export const journeyMilestones: JourneyMilestone[] = [
  { year: 2020, metricValue: "1", labelEn: "Project launched", labelAr: "TODO_AR: مشروع أُطلق" },
  { year: 2021, metricValue: "5", labelEn: "Programs running", labelAr: "TODO_AR: برامج قيد التنفيذ" },
  { year: 2022, metricValue: "10", labelEn: "Countries reached", labelAr: "TODO_AR: دول تم الوصول إليها" },
  { year: 2023, metricValue: "20K+", labelEn: "Beneficiaries crossed", labelAr: "TODO_AR: مستفيد تم تجاوزهم" },
  { year: 2024, metricValue: "$1.06M", labelEn: "Seed funding mobilized", labelAr: "TODO_AR: تمويل أولي" },
  { year: 2025, metricValue: "38,790+", labelEn: "Lives touched", labelAr: "TODO_AR: حياة تأثرت" },
];

export const lessonsLearned: LessonCard[] = [
  {
    id: "1",
    titleEn: "Adaptability beats perfection",
    titleAr: "TODO_AR: القدرة على التكيف تتفوق على الكمال",
    descriptionEn: "Our pivot to digital during lockdown wasn't planned—it was necessary. And it became our strongest asset.",
    descriptionAr: "TODO_AR: تحولنا إلى الرقمي خلال الإغلاق لم يكن مخططاً",
    icon: "refresh-cw",
  },
  {
    id: "2",
    titleEn: "Local staff aren't 'implementers'—they're the strategy",
    titleAr: "TODO_AR: الموظفون المحليون ليسوا 'منفذين'—إنهم الاستراتيجية",
    descriptionEn: "The best ideas don't come from headquarters. They come from the field, where reality meets ambition.",
    descriptionAr: "TODO_AR: أفضل الأفكار لا تأتي من المقر الرئيسي",
    icon: "map-pin",
  },
  {
    id: "3",
    titleEn: "Green isn't a sector—it's a lens",
    titleAr: "TODO_AR: الأخضر ليس قطاعاً—إنه عدسة",
    descriptionEn: "We stopped asking 'Is this a green project?' and started asking 'How does this build climate resilience?' Here's what changed.",
    descriptionAr: "TODO_AR: توقفنا عن السؤال 'هل هذا مشروع أخضر؟'",
    icon: "eye",
  },
];

export const downloads: DownloadItem[] = [
  {
    id: "1",
    titleEn: "Annual Report 2025",
    titleAr: "TODO_AR: التقرير السنوي 2025",
    descriptionEn: "Our comprehensive look at six years of impact, growth, and lessons.",
    descriptionAr: "TODO_AR: نظرة شاملة على ست سنوات من الأثر",
    coverImageUrl: "/images/placeholder-report-annual.jpg",
    fileUrl: "#",
    fileType: "pdf",
  },
  {
    id: "2",
    titleEn: "Impact Methodology Brief",
    titleAr: "TODO_AR: موجز منهجية الأثر",
    descriptionEn: "How we measure what matters—our framework for tracking lasting change.",
    descriptionAr: "TODO_AR: كيف نقيس ما يهم",
    coverImageUrl: "/images/placeholder-report-methodology.jpg",
    fileUrl: "#",
    fileType: "pdf",
  },
  {
    id: "3",
    titleEn: "Project Factsheets",
    titleAr: "TODO_AR: صحائف وقائع المشاريع",
    descriptionEn: "One-page snapshots of every active project, filterable by country and pillar.",
    descriptionAr: "TODO_AR: لقطات من صفحة واحدة لكل مشروع نشط",
    coverImageUrl: "/images/placeholder-report-factsheets.jpg",
    fileUrl: "#",
    fileType: "pdf",
  },
];
