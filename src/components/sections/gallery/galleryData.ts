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
  { slug: "nawra", nameEn: "NAWRA Program", nameAr: "برنامج نورة" },
  { slug: "trainings", nameEn: "Trainings & Workshops", nameAr: "التدريبات وورش العمل" },
  { slug: "community", nameEn: "Community Impact", nameAr: "الأثر المجتمعي" },
  { slug: "ceremonies", nameEn: "Ceremonies & Graduations", nameAr: "الحفلات والتخريجات" },
];

export const galleryImages: GalleryImage[] = [
  // Summits & Conferences
  {
    id: "1",
    imageUrl: "/images/international-professionals.jpg",
    captionEn: "International professionals at the MENA Entrepreneurship Summit",
    captionAr: "محترفون دوليون في قمة ريادة الأعمال في منطقة الشرق الأوسط",
    albumSlug: "summits",
  },
  {
    id: "2",
    imageUrl: "/images/team-partners-meeting.jpg",
    captionEn: "Strategic partners meeting with LEEE team",
    captionAr: "اجتماع الشركاء الاستراتيجيين مع فريق LEEE",
    albumSlug: "summits",
  },
  {
    id: "3",
    imageUrl: "/images/outdoor-certificate-ceremony.jpg",
    captionEn: "Outdoor ceremony at the regional entrepreneurship conference",
    captionAr: "حفل في الهواء الطلق في مؤتمر ريادة الأعمال الإقليمي",
    albumSlug: "summits",
  },

  // NAWRA Program
  {
    id: "4",
    imageUrl: "/images/nawra-women-training.jpg",
    captionEn: "NAWRA women entrepreneurs during green business training",
    captionAr: "رائدات أعمال نورة خلال تدريب الأعمال الخضراء",
    albumSlug: "nawra",
  },
  {
    id: "5",
    imageUrl: "/images/nawra-dream-to-jury.jpg",
    captionEn: "NAWRA pitch competition — startups presenting to jury panel",
    captionAr: "مسابقة عروض نورة — الشركات الناشئة تقدم أمام لجنة التحكيم",
    albumSlug: "nawra",
  },
  {
    id: "6",
    imageUrl: "/images/women-empowerment-art.jpg",
    captionEn: "Women empowerment art exhibition at NAWRA event",
    captionAr: "معرض فني لتمكين المرأة في فعالية نورة",
    albumSlug: "nawra",
  },
  {
    id: "7",
    imageUrl: "/images/nawra-program-graphic.jpg",
    captionEn: "NAWRA Green Ventures program launch across 3 countries",
    captionAr: "إطلاق برنامج مشاريع نورة الخضراء عبر 3 دول",
    albumSlug: "nawra",
  },

  // Trainings & Workshops
  {
    id: "8",
    imageUrl: "/images/group-training-workshop.jpg",
    captionEn: "Entrepreneurs during an ILO-certified SIYB training session",
    captionAr: "رواد أعمال خلال جلسة تدريب SIYB المعتمدة من منظمة العمل الدولية",
    albumSlug: "trainings",
  },
  {
    id: "9",
    imageUrl: "/images/training-presentation.jpg",
    captionEn: "Digital marketing bootcamp presentation for social enterprises",
    captionAr: "عرض معسكر التسويق الرقمي للمؤسسات الاجتماعية",
    albumSlug: "trainings",
  },
  {
    id: "10",
    imageUrl: "/images/mentoring-session.jpg",
    captionEn: "One-on-one mentoring session with a business coach",
    captionAr: "جلسة إرشاد فردية مع مدرب أعمال",
    albumSlug: "trainings",
  },

  // Community Impact
  {
    id: "11",
    imageUrl: "/images/field-visit-rural.jpg",
    captionEn: "Field visit to agricultural communities in rural Lebanon",
    captionAr: "زيارة ميدانية للمجتمعات الزراعية في ريف لبنان",
    albumSlug: "community",
  },
  {
    id: "12",
    imageUrl: "/images/handcrafted-products.jpg",
    captionEn: "Handcrafted products by women-led cooperatives",
    captionAr: "منتجات يدوية من تعاونيات بقيادة نساء",
    albumSlug: "community",
  },
  {
    id: "13",
    imageUrl: "/images/women-group-certificates.jpg",
    captionEn: "Community kitchen volunteers receiving their certificates",
    captionAr: "متطوعو المطبخ المجتمعي يتسلمون شهاداتهم",
    albumSlug: "community",
  },
  {
    id: "14",
    imageUrl: "/images/womens-day-post.jpg",
    captionEn: "International Women's Day celebration with local communities",
    captionAr: "الاحتفال بيوم المرأة العالمي مع المجتمعات المحلية",
    albumSlug: "community",
  },

  // Ceremonies & Graduations
  {
    id: "15",
    imageUrl: "/images/certificate-presentation.jpg",
    captionEn: "SIYB program graduation — certificate presentation ceremony",
    captionAr: "تخريج برنامج SIYB — حفل تقديم الشهادات",
    albumSlug: "ceremonies",
  },
  {
    id: "16",
    imageUrl: "/images/journey-banner.jpg",
    captionEn: "LEEE Experience journey milestones banner",
    captionAr: "لافتة معالم رحلة LEEE Experience",
    albumSlug: "ceremonies",
  },
  {
    id: "17",
    imageUrl: "/images/dep-program-poster.jpg",
    captionEn: "DEP program poster unveiling at the annual ceremony",
    captionAr: "الكشف عن ملصق برنامج DEP في الحفل السنوي",
    albumSlug: "ceremonies",
  },
];
