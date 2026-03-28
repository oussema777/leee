export interface ImpactStat {
  id: string;
  labelEn: string;
  labelAr: string;
  value: number;
  suffix?: string;
  prefix?: string;
  category: 'economic' | 'social' | 'environmental';
  icon: string;
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
  { id: "e1", labelEn: "Startups Incubated", labelAr: "TODO_AR: شركات ناشئة محتضنة", value: 2365, suffix: "+", category: "economic", icon: "rocket" },
  { id: "e2", labelEn: "MSMEs Accelerated", labelAr: "TODO_AR: مشاريع صغيرة مُسَرَّعة", value: 3421, suffix: "+", category: "economic", icon: "trending-up" },
  { id: "e3", labelEn: "Seed Funding Mobilized", labelAr: "TODO_AR: تمويل أولي", value: 1.06, prefix: "$", suffix: "M+", category: "economic", icon: "coins" },
  { id: "e4", labelEn: "Feasibility Studies", labelAr: "TODO_AR: دراسات جدوى", value: 5130, suffix: "+", category: "economic", icon: "file-text" },
  { id: "s1", labelEn: "Lives Touched", labelAr: "TODO_AR: حياة تأثرت", value: 38790, suffix: "+", category: "social", icon: "users" },
  { id: "s2", labelEn: "Directly Supported", labelAr: "TODO_AR: دعم مباشر", value: 8615, suffix: "+", category: "social", icon: "hand-helping" },
  { id: "s3", labelEn: "Women Entrepreneurs", labelAr: "TODO_AR: رائدات أعمال", value: 80, suffix: "%", category: "social", icon: "user-check" },
  { id: "s4", labelEn: "Countries", labelAr: "TODO_AR: دول", value: 10, category: "social", icon: "globe" },
  { id: "v1", labelEn: "Green Ventures Thriving Post-Crisis", labelAr: "TODO_AR: مشاريع خضراء مزدهرة", value: 60, suffix: "%", category: "environmental", icon: "leaf" },
  { id: "v2", labelEn: "Green Jobs Created", labelAr: "TODO_AR: وظائف خضراء", value: 1800, suffix: "+", category: "environmental", icon: "briefcase" },
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
