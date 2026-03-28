export interface ReportCategory {
  slug: string;
  nameEn: string;
  nameAr: string;
}

export interface ReportItem {
  id: string;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  coverImageUrl: string;
  fileUrl: string;
  year: number;
  categorySlug: string;
}

export const reportCategories: ReportCategory[] = [
  { slug: "annual", nameEn: "Annual Reports", nameAr: "التقارير السنوية" },
  { slug: "impact", nameEn: "Impact Studies", nameAr: "دراسات الأثر" },
  { slug: "research", nameEn: "Research & Policy", nameAr: "الأبحاث والسياسات" },
  { slug: "program", nameEn: "Program Reports", nameAr: "تقارير البرامج" },
];

export const demoReports: ReportItem[] = [
  // Annual Reports
  {
    id: "1",
    titleEn: "LEEE Experience Annual Report 2025",
    titleAr: "التقرير السنوي لـ LEEE Experience 2025",
    descriptionEn: "A comprehensive overview of our programs, impact, and financial performance in 2025 across 10 countries.",
    descriptionAr: "نظرة شاملة على برامجنا وأثرنا وأدائنا المالي في عام 2025 عبر 10 دول.",
    coverImageUrl: "/images/international-professionals.jpg",
    fileUrl: "#",
    year: 2025,
    categorySlug: "annual",
  },
  {
    id: "2",
    titleEn: "LEEE Experience Annual Report 2024",
    titleAr: "التقرير السنوي لـ LEEE Experience 2024",
    descriptionEn: "Highlights from our 2024 operations including 32+ active programs and 38,790 beneficiaries reached.",
    descriptionAr: "أبرز إنجازات عملياتنا في 2024 بما في ذلك أكثر من 32 برنامجاً نشطاً و38,790 مستفيداً.",
    coverImageUrl: "/images/team-partners-meeting.jpg",
    fileUrl: "#",
    year: 2024,
    categorySlug: "annual",
  },
  {
    id: "3",
    titleEn: "LEEE Experience Annual Report 2023",
    titleAr: "التقرير السنوي لـ LEEE Experience 2023",
    descriptionEn: "Review of our growth trajectory in 2023, expanding from 5 to 9 branches across Lebanon and the MENA region.",
    descriptionAr: "مراجعة مسار نمونا في 2023، التوسع من 5 إلى 9 فروع عبر لبنان ومنطقة الشرق الأوسط.",
    coverImageUrl: "/images/outdoor-certificate-ceremony.jpg",
    fileUrl: "#",
    year: 2023,
    categorySlug: "annual",
  },

  // Impact Studies
  {
    id: "4",
    titleEn: "NAWRA Green Ventures — Impact Assessment Report",
    titleAr: "مشاريع نورة الخضراء — تقرير تقييم الأثر",
    descriptionEn: "Evaluation of the NAWRA program's impact on women-led green startups across Lebanon, Tunisia, and Morocco.",
    descriptionAr: "تقييم أثر برنامج نورة على الشركات الناشئة الخضراء بقيادة نساء في لبنان وتونس والمغرب.",
    coverImageUrl: "/images/nawra-women-training.jpg",
    fileUrl: "#",
    year: 2025,
    categorySlug: "impact",
  },
  {
    id: "5",
    titleEn: "SIYB Program — Beneficiary Outcomes Study",
    titleAr: "برنامج SIYB — دراسة نتائج المستفيدين",
    descriptionEn: "Longitudinal study tracking employment and income outcomes for 500+ SIYB graduates across 4 governorates.",
    descriptionAr: "دراسة طولية لتتبع نتائج التوظيف والدخل لأكثر من 500 خريج من برنامج SIYB عبر 4 محافظات.",
    coverImageUrl: "/images/group-training-workshop.jpg",
    fileUrl: "#",
    year: 2024,
    categorySlug: "impact",
  },
  {
    id: "6",
    titleEn: "Community Kitchens — Social Impact Report",
    titleAr: "المطابخ المجتمعية — تقرير الأثر الاجتماعي",
    descriptionEn: "Assessment of community kitchen initiatives in Chouf and Bekaa, measuring food security and social cohesion outcomes.",
    descriptionAr: "تقييم مبادرات المطابخ المجتمعية في الشوف والبقاع، وقياس نتائج الأمن الغذائي والتماسك الاجتماعي.",
    coverImageUrl: "/images/women-group-certificates.jpg",
    fileUrl: "#",
    year: 2024,
    categorySlug: "impact",
  },

  // Research & Policy
  {
    id: "7",
    titleEn: "Green Entrepreneurship in Post-Crisis Economies",
    titleAr: "ريادة الأعمال الخضراء في اقتصادات ما بعد الأزمة",
    descriptionEn: "Research paper examining opportunities and barriers for green entrepreneurship in Lebanon's post-crisis economic landscape.",
    descriptionAr: "ورقة بحثية تدرس الفرص والعوائق أمام ريادة الأعمال الخضراء في المشهد الاقتصادي اللبناني بعد الأزمة.",
    coverImageUrl: "/images/field-visit-rural.jpg",
    fileUrl: "#",
    year: 2025,
    categorySlug: "research",
  },
  {
    id: "8",
    titleEn: "Women's Economic Empowerment — Policy Brief",
    titleAr: "التمكين الاقتصادي للمرأة — موجز سياسات",
    descriptionEn: "Policy recommendations for strengthening women's economic participation based on insights from NAWRA and SIYB programs.",
    descriptionAr: "توصيات سياسية لتعزيز المشاركة الاقتصادية للمرأة بناءً على رؤى من برنامجي نورة وSIYB.",
    coverImageUrl: "/images/women-empowerment-art.jpg",
    fileUrl: "#",
    year: 2024,
    categorySlug: "research",
  },

  // Program Reports
  {
    id: "9",
    titleEn: "ENABLE Programme — Mid-Term Evaluation",
    titleAr: "برنامج ENABLE — تقييم منتصف المدة",
    descriptionEn: "Mid-term evaluation of the EU & ILO-funded ENABLE programme's SIYB training component across 4 Lebanese governorates.",
    descriptionAr: "تقييم منتصف المدة لمكوّن تدريب SIYB في برنامج ENABLE الممول من الاتحاد الأوروبي ومنظمة العمل الدولية.",
    coverImageUrl: "/images/training-presentation.jpg",
    fileUrl: "#",
    year: 2025,
    categorySlug: "program",
  },
  {
    id: "10",
    titleEn: "Houla Green Fashion Factory — Progress Report",
    titleAr: "مصنع حولا للأزياء الخضراء — تقرير التقدم",
    descriptionEn: "Progress update on the women-led green fashion factory in South Lebanon, covering production output and community impact.",
    descriptionAr: "تحديث التقدم في مصنع الأزياء الخضراء بقيادة النساء في جنوب لبنان، يغطي الإنتاج والأثر المجتمعي.",
    coverImageUrl: "/images/handcrafted-products.jpg",
    fileUrl: "#",
    year: 2024,
    categorySlug: "program",
  },
  {
    id: "11",
    titleEn: "DEP — Digital Entrepreneurship Program Final Report",
    titleAr: "DEP — التقرير النهائي لبرنامج ريادة الأعمال الرقمية",
    descriptionEn: "Final report summarizing outcomes, lessons learned, and recommendations from the Digital Entrepreneurship Program.",
    descriptionAr: "التقرير النهائي يلخص النتائج والدروس المستفادة والتوصيات من برنامج ريادة الأعمال الرقمية.",
    coverImageUrl: "/images/dep-program-poster.jpg",
    fileUrl: "#",
    year: 2023,
    categorySlug: "program",
  },
  {
    id: "12",
    titleEn: "Agritech Innovation — Scaling Green Solutions Report",
    titleAr: "ابتكار التكنولوجيا الزراعية — تقرير توسيع الحلول الخضراء",
    descriptionEn: "Report on agritech innovation pilots across rural communities, documenting scalable green solutions for smallholder farmers.",
    descriptionAr: "تقرير عن مشاريع ابتكار التكنولوجيا الزراعية التجريبية عبر المجتمعات الريفية، يوثق حلولاً خضراء قابلة للتوسع.",
    coverImageUrl: "/images/field-visit-rural.jpg",
    fileUrl: "#",
    year: 2023,
    categorySlug: "program",
  },
];
