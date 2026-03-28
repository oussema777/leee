export interface ZowadaFeature {
  id: string;
  icon: string;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
}

export interface ZowadaCapability {
  id: string;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  icon: string;
}

export interface ZowadaStory {
  id: string;
  nameEn: string;
  nameAr: string;
  locationEn: string;
  locationAr: string;
  quoteEn: string;
  quoteAr: string;
  imageUrl: string;
}

export interface PartnerPathway {
  id: string;
  audienceEn: string;
  audienceAr: string;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  icon: string;
}

export const features: ZowadaFeature[] = [
  {
    id: "1",
    icon: "shopping-cart",
    titleEn: "Green Marketplace",
    titleAr: "TODO_AR: السوق الأخضر",
    descriptionEn: "List your products and reach conscious buyers across the region. Built for women entrepreneurs in agriculture, crafts, and sustainable goods.",
    descriptionAr: "TODO_AR: اعرض منتجاتك وتواصل مع المشترين الواعين",
  },
  {
    id: "2",
    icon: "book-open",
    titleEn: "Learn",
    titleAr: "TODO_AR: تعلّم",
    descriptionEn: "Bite-sized courses on green business, financial management, digital skills, and market access — designed for mobile-first learning.",
    descriptionAr: "TODO_AR: دورات قصيرة حول الأعمال الخضراء والإدارة المالية",
  },
  {
    id: "3",
    icon: "users",
    titleEn: "Mentor",
    titleAr: "TODO_AR: مرشد",
    descriptionEn: "Book 1:1 sessions with vetted experts. Pay with cash or time credits through our Time Banking system.",
    descriptionAr: "TODO_AR: احجز جلسات فردية مع خبراء معتمدين",
  },
  {
    id: "4",
    icon: "lightbulb",
    titleEn: "Crowdfund",
    titleAr: "TODO_AR: تمويل جماعي",
    descriptionEn: "Raise capital for your green venture with built-in impact tracking. Connect with investors who believe in sustainable growth.",
    descriptionAr: "TODO_AR: اجمع رأس المال لمشروعك الأخضر",
  },
];

export const capabilities: ZowadaCapability[] = [
  {
    id: "1",
    titleEn: "Offline-First",
    titleAr: "TODO_AR: يعمل بدون إنترنت",
    descriptionEn: "Use core features without internet. Perfect for rural areas with limited connectivity.",
    descriptionAr: "TODO_AR: استخدم الميزات الأساسية بدون إنترنت",
    icon: "wifi-off",
  },
  {
    id: "2",
    titleEn: "Low-Data Mode",
    titleAr: "TODO_AR: وضع البيانات المنخفضة",
    descriptionEn: "Images compress automatically. Text prioritizes. Your data plan stays intact.",
    descriptionAr: "TODO_AR: الصور تُضغط تلقائياً",
    icon: "minimize",
  },
  {
    id: "3",
    titleEn: "Multi-Language",
    titleAr: "TODO_AR: متعدد اللغات",
    descriptionEn: "Full support for Arabic, French, and English — with local dialect adaptations.",
    descriptionAr: "TODO_AR: دعم كامل للعربية والفرنسية والإنجليزية",
    icon: "languages",
  },
  {
    id: "4",
    titleEn: "Inclusive UX",
    titleAr: "TODO_AR: تجربة مستخدم شاملة",
    descriptionEn: "Tested with women, youth, and low-literacy users. Designed for everyone, not just tech-savvy users.",
    descriptionAr: "TODO_AR: مُختبر مع النساء والشباب",
    icon: "accessibility",
  },
];

export const zowadaStories: ZowadaStory[] = [
  {
    id: "1",
    nameEn: "Aline",
    nameAr: "ألين",
    locationEn: "Bekaa, Lebanon",
    locationAr: "TODO_AR: البقاع، لبنان",
    quoteEn: "I sold 500 organic seedlings in 2 months through Zowada. My nursery went from local to regional.",
    quoteAr: "TODO_AR: بعت 500 شتلة عضوية في شهرين عبر زوادة",
    imageUrl: "/images/placeholder-zowada-aline.jpg",
  },
  {
    id: "2",
    nameEn: "Houla Collective",
    nameAr: "TODO_AR: تعاونية حولا",
    locationEn: "South Lebanon",
    locationAr: "TODO_AR: جنوب لبنان",
    quoteEn: "50 women, 1 factory, 100% online sales. Zowada gave us the platform to reach buyers we never could before.",
    quoteAr: "TODO_AR: 50 امرأة، مصنع واحد، 100% مبيعات إلكترونية",
    imageUrl: "/images/placeholder-zowada-houla.jpg",
  },
];

export const partnerPathways: PartnerPathway[] = [
  {
    id: "1",
    audienceEn: "For NGOs",
    audienceAr: "TODO_AR: للمنظمات غير الحكومية",
    titleEn: "White-Label Zowada",
    titleAr: "TODO_AR: زوادة بعلامتك التجارية",
    descriptionEn: "Deploy Zowada for your beneficiaries with your branding. Track impact through our dashboard.",
    descriptionAr: "TODO_AR: انشر زوادة لمستفيديك بعلامتك التجارية",
    icon: "building",
  },
  {
    id: "2",
    audienceEn: "For Corporates",
    audienceAr: "TODO_AR: للشركات",
    titleEn: "Source Sustainable Products",
    titleAr: "TODO_AR: احصل على منتجات مستدامة",
    descriptionEn: "Connect with women entrepreneurs producing sustainable goods. ESG-aligned sourcing made easy.",
    descriptionAr: "TODO_AR: تواصل مع رائدات الأعمال",
    icon: "briefcase",
  },
  {
    id: "3",
    audienceEn: "For Investors",
    audienceAr: "TODO_AR: للمستثمرين",
    titleEn: "Access Vetted Green Startups",
    titleAr: "TODO_AR: اطلع على شركات ناشئة خضراء",
    descriptionEn: "Browse a curated pipeline of climate-focused ventures. Impact metrics included.",
    descriptionAr: "TODO_AR: تصفح مجموعة منسقة من المشاريع",
    icon: "bar-chart",
  },
];
