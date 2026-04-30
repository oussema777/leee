export interface Album {
  slug: string;
  nameEn: string;
  nameAr: string;
}

export interface GalleryImage {
  id: string;
  imageUrl: string;
  captionEn: string;
  captionAr: string;
  albumSlug: string;
}

export const albums: Album[] = [
  { slug: "summits", nameEn: "Summits & Conferences", nameAr: "القمم والمؤتمرات" },
  { slug: "nawra", nameEn: "NAWARA Program", nameAr: "برنامج نوّارة" },
  { slug: "trainings", nameEn: "Trainings & Workshops", nameAr: "التدريبات وورش العمل" },
  { slug: "community", nameEn: "Community Impact", nameAr: "الأثر المجتمعي" },
  { slug: "women", nameEn: "Women Empowerment", nameAr: "تمكين المرأة" },
];

export const galleryImages: GalleryImage[] = [
  // ══════════════════════════════════════
  // Summits & Conferences (GITS, Berytech)
  // ══════════════════════════════════════
  {
    id: "1",
    imageUrl: "/images/projects/gits-1.jpg",
    captionEn: "Keynote address at the GITS Global Investment & Trade Summit",
    captionAr: "الكلمة الرئيسية في قمة GITS العالمية للاستثمار والتجارة",
    albumSlug: "summits",
  },
  {
    id: "2",
    imageUrl: "/images/projects/gits-2.jpg",
    captionEn: "Panel discussion at GITS — connecting MENA and Africa entrepreneurs",
    captionAr: "حلقة نقاش في GITS — ربط رواد أعمال الشرق الأوسط وأفريقيا",
    albumSlug: "summits",
  },
  {
    id: "3",
    imageUrl: "/images/projects/gits-5.jpg",
    captionEn: "International delegates and partners at the GITS Summit",
    captionAr: "مندوبون وشركاء دوليون في قمة GITS",
    albumSlug: "summits",
  },
  {
    id: "4",
    imageUrl: "/images/projects/gits-8.jpg",
    captionEn: "GITS Summit group photo — participants from across MENA and Africa",
    captionAr: "صورة جماعية لقمة GITS — مشاركون من الشرق الأوسط وأفريقيا",
    albumSlug: "summits",
  },
  {
    id: "5",
    imageUrl: "/images/projects/gits-6.jpg",
    captionEn: "Networking session at GITS — building cross-border partnerships",
    captionAr: "جلسة تشبيك في GITS — بناء شراكات عابرة للحدود",
    albumSlug: "summits",
  },
  {
    id: "6",
    imageUrl: "/images/projects/gits-9.jpg",
    captionEn: "GITS exhibition showcasing entrepreneurial innovations",
    captionAr: "معرض GITS لعرض الابتكارات الريادية",
    albumSlug: "summits",
  },
  {
    id: "7",
    imageUrl: "/images/projects/kims-ifc-3.jpg",
    captionEn: "KIMS-IFC senior management training cohort in Somalia",
    captionAr: "دفعة تدريب الإدارة العليا KIMS-IFC في الصومال",
    albumSlug: "summits",
  },

  // ══════════════════════════════════════
  // NAWARA Program (nawara-irc)
  // ══════════════════════════════════════
  {
    id: "8",
    imageUrl: "/images/projects/nawara-irc-7.jpg",
    captionEn: "NAWARA program participants celebrating with empowerment signs",
    captionAr: "مشاركات برنامج نوّارة يحتفلن بلافتات التمكين",
    albumSlug: "nawra",
  },
  {
    id: "9",
    imageUrl: "/images/projects/nawara-irc-3.jpg",
    captionEn: "Women entrepreneurs in hands-on business coaching session",
    captionAr: "رائدات أعمال في جلسة إرشاد عملية",
    albumSlug: "nawra",
  },
  {
    id: "10",
    imageUrl: "/images/projects/nawara-irc-1.jpg",
    captionEn: "NAWARA entrepreneurship training workshop in progress",
    captionAr: "ورشة تدريب ريادة الأعمال في برنامج نوّارة",
    albumSlug: "nawra",
  },
  {
    id: "11",
    imageUrl: "/images/projects/nawara-irc-4.jpg",
    captionEn: "Participants developing their business plans during NAWARA program",
    captionAr: "المشاركات يطوّرن خطط أعمالهن خلال برنامج نوّارة",
    albumSlug: "nawra",
  },
  {
    id: "12",
    imageUrl: "/images/projects/nawara-irc-6.jpg",
    captionEn: "NAWARA graduation ceremony — celebrating new women entrepreneurs",
    captionAr: "حفل تخريج نوّارة — الاحتفاء برائدات أعمال جدد",
    albumSlug: "nawra",
  },
  {
    id: "13",
    imageUrl: "/images/projects/nawara-irc-9.jpg",
    captionEn: "Women presenting their business ideas at NAWARA pitch day",
    captionAr: "نساء يقدّمن أفكار مشاريعهن في يوم العروض",
    albumSlug: "nawra",
  },

  // ══════════════════════════════════════
  // Trainings & Workshops (ILO, PSDP, Berytech, CAWTAR)
  // ══════════════════════════════════════
  {
    id: "14",
    imageUrl: "/images/projects/ilo-3.jpg",
    captionEn: "ILO SIYB training session — entrepreneurs in group work",
    captionAr: "جلسة تدريب SIYB من منظمة العمل الدولية — عمل جماعي",
    albumSlug: "trainings",
  },
  {
    id: "15",
    imageUrl: "/images/projects/psdp-8.jpg",
    captionEn: "PSDP business development workshop — participants engaged in discussion",
    captionAr: "ورشة تطوير الأعمال PSDP — مشاركون في نقاش",
    albumSlug: "trainings",
  },
  {
    id: "16",
    imageUrl: "/images/projects/cawtar-3.jpg",
    captionEn: "CAWTAR women's empowerment planning session with regional leaders",
    captionAr: "جلسة تخطيط تمكين المرأة مع CAWTAR والقيادات الإقليمية",
    albumSlug: "trainings",
  },
  {
    id: "17",
    imageUrl: "/images/projects/berytech-5.jpg",
    captionEn: "Berytech-EU startup incubation — hands-on greenhouse training",
    captionAr: "حاضنة Berytech-EU — تدريب عملي في البيوت البلاستيكية",
    albumSlug: "trainings",
  },
  {
    id: "18",
    imageUrl: "/images/projects/cawtar-7.jpg",
    captionEn: "CAWTAR experts evaluating women entrepreneurs' proposals",
    captionAr: "خبراء CAWTAR يقيّمون مقترحات رائدات الأعمال",
    albumSlug: "trainings",
  },
  {
    id: "19",
    imageUrl: "/images/projects/ilo-1.jpg",
    captionEn: "ILO-certified ENABLE training — building sustainable businesses",
    captionAr: "تدريب ENABLE المعتمد من ILO — بناء أعمال مستدامة",
    albumSlug: "trainings",
  },
  {
    id: "20",
    imageUrl: "/images/projects/kims-ifc-6.jpg",
    captionEn: "KIMS-IFC leadership workshop — interactive group exercise",
    captionAr: "ورشة قيادة KIMS-IFC — تمرين جماعي تفاعلي",
    albumSlug: "trainings",
  },
  {
    id: "21",
    imageUrl: "/images/projects/psdp-3.jpg",
    captionEn: "PSDP training participants collaborating on business strategies",
    captionAr: "مشاركو تدريب PSDP يتعاونون على استراتيجيات الأعمال",
    albumSlug: "trainings",
  },

  // ══════════════════════════════════════
  // Community Impact (Salama, Relief, Prospects, PSDP products)
  // ══════════════════════════════════════
  {
    id: "22",
    imageUrl: "/images/projects/salama-3.jpg",
    captionEn: "LEE Experience community outreach tent — psychosocial support services",
    captionAr: "خيمة التواصل المجتمعي — خدمات الدعم النفسي الاجتماعي",
    albumSlug: "community",
  },
  {
    id: "23",
    imageUrl: "/images/projects/relief-1.jpg",
    captionEn: "LEE team on the ground — community outreach during crisis response",
    captionAr: "فريق LEE في الميدان — التواصل المجتمعي خلال الاستجابة للأزمات",
    albumSlug: "community",
  },
  {
    id: "24",
    imageUrl: "/images/projects/berytech-3.jpg",
    captionEn: "Seedlings nursery — green economy and agricultural entrepreneurship",
    captionAr: "مشتل شتلات — الاقتصاد الأخضر وريادة الأعمال الزراعية",
    albumSlug: "community",
  },
  {
    id: "25",
    imageUrl: "/images/projects/psdp-5.jpg",
    captionEn: "Local products by women-led enterprises — market access support",
    captionAr: "منتجات محلية من مشاريع بقيادة نساء — دعم الوصول للأسواق",
    albumSlug: "community",
  },
  {
    id: "26",
    imageUrl: "/images/projects/salama-7.jpg",
    captionEn: "Salama PSS program — community healing and mental health support",
    captionAr: "برنامج سلامة — الشفاء المجتمعي ودعم الصحة النفسية",
    albumSlug: "community",
  },
  {
    id: "27",
    imageUrl: "/images/projects/prospects-3.jpg",
    captionEn: "Prospects program — agricultural training and field visits",
    captionAr: "برنامج Prospects — التدريب الزراعي والزيارات الميدانية",
    albumSlug: "community",
  },
  {
    id: "28",
    imageUrl: "/images/projects/relief-2.jpg",
    captionEn: "Livelihoods resilience program — supporting Lebanese and Syrian communities",
    captionAr: "برنامج صمود سبل العيش — دعم المجتمعات اللبنانية والسورية",
    albumSlug: "community",
  },

  // ══════════════════════════════════════
  // Women Empowerment (UNIFIL, CAWTAR, PSDP, cross-program)
  // ══════════════════════════════════════
  {
    id: "29",
    imageUrl: "/images/projects/unifil-1.jpg",
    captionEn: "UNIFIL women's sewing workshop — economic empowerment in South Lebanon",
    captionAr: "ورشة خياطة النساء مع اليونيفيل — التمكين الاقتصادي في جنوب لبنان",
    albumSlug: "women",
  },
  {
    id: "30",
    imageUrl: "/images/projects/psdp-1.jpg",
    captionEn: "Women Do Business Experience — pitch competition finalists",
    captionAr: "تجربة سيدات الأعمال — المتأهلات لنهائي مسابقة العروض",
    albumSlug: "women",
  },
  {
    id: "31",
    imageUrl: "/images/projects/cawtar-1.jpg",
    captionEn: "Empowering women entrepreneurs across 6 MENA countries with CAWTAR",
    captionAr: "تمكين رائدات الأعمال عبر 6 دول مع CAWTAR",
    albumSlug: "women",
  },
  {
    id: "32",
    imageUrl: "/images/projects/nawara-irc-2.jpg",
    captionEn: "Women collaborating on business plans during training session",
    captionAr: "نساء يتعاونّ على خطط الأعمال خلال جلسة التدريب",
    albumSlug: "women",
  },
  {
    id: "33",
    imageUrl: "/images/projects/psdp-9.jpg",
    captionEn: "PSDP women entrepreneurs showcasing their products at market day",
    captionAr: "رائدات أعمال PSDP يعرضن منتجاتهن في يوم السوق",
    albumSlug: "women",
  },
  {
    id: "34",
    imageUrl: "/images/projects/cawtar-5.jpg",
    captionEn: "Regional women's empowerment workshop — building business skills",
    captionAr: "ورشة تمكين المرأة الإقليمية — بناء مهارات الأعمال",
    albumSlug: "women",
  },
  {
    id: "35",
    imageUrl: "/images/projects/unifil-4.jpg",
    captionEn: "Women's cooperative products from the Houla sewing factory",
    captionAr: "منتجات التعاونية النسائية من مصنع حولا للخياطة",
    albumSlug: "women",
  },
];
