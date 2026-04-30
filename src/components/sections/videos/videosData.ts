export interface VideoCategory {
  slug: string;
  nameEn: string;
  nameAr: string;
}

export interface VideoItem {
  id: string;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  youtubeUrl: string;
  categorySlug: string;
}

export const videoCategories: VideoCategory[] = [
  { slug: "highlights", nameEn: "Event Highlights", nameAr: "أبرز الفعاليات" },
  { slug: "trainings", nameEn: "Trainings & Programs", nameAr: "التدريبات والبرامج" },
  { slug: "testimonials", nameEn: "Success Stories", nameAr: "قصص النجاح" },
  { slug: "pitches", nameEn: "Business Pitches", nameAr: "عروض المشاريع" },
];

export function getYouTubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return match ? match[1] : null;
}

export const demoVideos: VideoItem[] = [
  // ── Event Highlights ──
  {
    id: "1",
    titleEn: "5 Years of LEE Experience — Highlights Reel",
    titleAr: "5 سنوات من تجربة LEE — أبرز اللحظات",
    descriptionEn: "A look back at five years of impact, innovation, and empowerment across the MENA region and Africa.",
    descriptionAr: "نظرة على خمس سنوات من التأثير والابتكار والتمكين عبر منطقة الشرق الأوسط وشمال أفريقيا وأفريقيا.",
    youtubeUrl: "https://www.youtube.com/watch?v=B2VF4nWQS38",
    categorySlug: "highlights",
  },
  {
    id: "2",
    titleEn: "NAWARA — More Than Training, It's an Opportunity",
    titleAr: "نوّارة مش بس تدريب .. نوّارة فرصة",
    descriptionEn: "Discover how NAWARA goes beyond training to create real opportunities for women entrepreneurs in Lebanon.",
    descriptionAr: "اكتشفي كيف أن نوّارة ليست مجرد تدريب بل فرصة حقيقية لرائدات الأعمال في لبنان.",
    youtubeUrl: "https://www.youtube.com/watch?v=k7cvmGGdlWM",
    categorySlug: "highlights",
  },
  {
    id: "3",
    titleEn: "PSDP — Women Do Business Experience Pitch Competition",
    titleAr: "مسابقة تجربة سيدات الأعمال مالكات المشاريع — PSDP",
    descriptionEn: "Highlights from the Women Do Business Experience pitch competition under the PSDP program, empowering women-led enterprises.",
    descriptionAr: "أبرز لحظات مسابقة عروض تجربة سيدات الأعمال مالكات المشاريع ضمن مشروع تطوير القطاعات الإنتاجية.",
    youtubeUrl: "https://www.youtube.com/watch?v=wa_CWRQknog",
    categorySlug: "highlights",
  },
  {
    id: "4",
    titleEn: "PSDP — Women Do Business Experience Overview",
    titleAr: "تجربة سيدات الأعمال مالكات المشاريع — PSDP",
    descriptionEn: "An overview of the Women Do Business Experience under the Productive Sectors Development Programme (PSDP).",
    descriptionAr: "نظرة عامة على تجربة سيدات الأعمال مالكات المشاريع في إطار مشروع تطوير القطاعات الإنتاجية.",
    youtubeUrl: "https://www.youtube.com/watch?v=Gm087twsyvo",
    categorySlug: "highlights",
  },

  // ── Trainings & Programs ──
  {
    id: "5",
    titleEn: "PSDP — Rural Women Market Expansion",
    titleAr: "توسيع أسواق النساء الريفيات — PSDP",
    descriptionEn: "How the PSDP program helps rural women entrepreneurs expand their market access and grow their businesses.",
    descriptionAr: "كيف يساعد برنامج PSDP رائدات الأعمال الريفيات على توسيع وصولهن إلى الأسواق وتنمية أعمالهن.",
    youtubeUrl: "https://www.youtube.com/watch?v=t9g7Bp0Jldo",
    categorySlug: "trainings",
  },
  {
    id: "6",
    titleEn: "My First Business — Entrepreneurship Program",
    titleAr: "هيدا مشروعي — برنامج ريادة الأعمال",
    descriptionEn: "A look at the My First Business program that guides aspiring entrepreneurs from idea to launch.",
    descriptionAr: "نظرة على برنامج مشروعي الأول الذي يوجّه رواد الأعمال الطامحين من الفكرة إلى الإطلاق.",
    youtubeUrl: "https://www.youtube.com/watch?v=uwbpFvH-2vM",
    categorySlug: "trainings",
  },
  {
    id: "7",
    titleEn: "Women Entrepreneurs Sustainability Guide — CAWTAR",
    titleAr: "دليل استدامة سيدات الأعمال — CAWTAR",
    descriptionEn: "A comprehensive sustainability guide for women entrepreneurs developed in partnership with CAWTAR.",
    descriptionAr: "دليل شامل لاستدامة سيدات الأعمال تم تطويره بالشراكة مع مركز المرأة العربية للتدريب والبحوث.",
    youtubeUrl: "https://www.youtube.com/watch?v=x7J5aHvPSXY",
    categorySlug: "trainings",
  },

  // ── Success Stories ──
  {
    id: "8",
    titleEn: "Stephan El Mur — Alchemist (PSDP Success Story)",
    titleAr: "ستيفان المر — Alchemist (قصة نجاح PSDP)",
    descriptionEn: "Stephan shares how the PSDP program helped him build and grow his business Alchemist.",
    descriptionAr: "يشارك ستيفان كيف ساعده برنامج PSDP في بناء وتنمية مشروعه Alchemist.",
    youtubeUrl: "https://www.youtube.com/watch?v=ol9y8H-WFzY",
    categorySlug: "testimonials",
  },
  {
    id: "9",
    titleEn: "Kawthar Alawa — Equilibre (PSDP Success Story)",
    titleAr: "كوثر علوة — Equilibre (قصة نجاح PSDP)",
    descriptionEn: "Kawthar tells her journey of building Equilibre with the support of the PSDP program.",
    descriptionAr: "تروي كوثر رحلتها في بناء مشروع Equilibre بدعم من برنامج PSDP.",
    youtubeUrl: "https://www.youtube.com/watch?v=v0VAScpKOdE",
    categorySlug: "testimonials",
  },
  {
    id: "10",
    titleEn: "This Is My Project — Hestia (Episode 8)",
    titleAr: "هيدا مشروعي الحلقة الثامنة — هستيا",
    descriptionEn: "Episode 8 of the 'This Is My Project' series featuring the Hestia entrepreneurial journey.",
    descriptionAr: "الحلقة الثامنة من سلسلة هيدا مشروعي تعرض رحلة ريادة الأعمال مع هستيا.",
    youtubeUrl: "https://www.youtube.com/watch?v=hUjatkrG3xg",
    categorySlug: "testimonials",
  },

  // ── Business Pitches ──
  {
    id: "11",
    titleEn: "Maysaa's Business Pitch",
    titleAr: "عرض مشروع ميساء الصغير",
    descriptionEn: "Watch Maysaa present her business idea in a live pitch competition.",
    descriptionAr: "شاهدي عرض ميساء لفكرة مشروعها في مسابقة عروض مباشرة.",
    youtubeUrl: "https://www.youtube.com/watch?v=VQ_tDucYZVU",
    categorySlug: "pitches",
  },
  {
    id: "12",
    titleEn: "Nihad Nakad's Business Pitch",
    titleAr: "عرض مشروع نهاد نكد",
    descriptionEn: "Nihad Nakad presents her business venture and growth plans.",
    descriptionAr: "تقدّم نهاد نكد مشروعها التجاري وخطط النمو.",
    youtubeUrl: "https://www.youtube.com/watch?v=MIF5pnWFA_I",
    categorySlug: "pitches",
  },
  {
    id: "13",
    titleEn: "Manal Maamo's Business Pitch",
    titleAr: "عرض مشروع منال معمو",
    descriptionEn: "Manal Maamo showcases her entrepreneurial project and vision.",
    descriptionAr: "تستعرض منال معمو مشروعها الريادي ورؤيتها.",
    youtubeUrl: "https://www.youtube.com/watch?v=uu90GyZkx0w",
    categorySlug: "pitches",
  },
  {
    id: "14",
    titleEn: "Alaa Ghamrawi's Business Pitch",
    titleAr: "عرض مشروع آلاء غمراوي",
    descriptionEn: "Alaa Ghamrawi pitches her business concept and impact story.",
    descriptionAr: "تقدّم آلاء غمراوي فكرة مشروعها وقصة أثرها.",
    youtubeUrl: "https://www.youtube.com/watch?v=LdgvQ39yuQQ",
    categorySlug: "pitches",
  },
  {
    id: "15",
    titleEn: "Viviane Philip's Business Pitch",
    titleAr: "عرض مشروع فيفيان فيليب",
    descriptionEn: "Viviane Philip presents her business idea and entrepreneurial journey.",
    descriptionAr: "تقدّم فيفيان فيليب فكرة مشروعها ورحلتها الريادية.",
    youtubeUrl: "https://www.youtube.com/watch?v=PoW99oA8riI",
    categorySlug: "pitches",
  },
];
