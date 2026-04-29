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
  { slug: "trainings", nameEn: "Trainings & Workshops", nameAr: "التدريبات وورش العمل" },
  { slug: "testimonials", nameEn: "Success Stories", nameAr: "قصص النجاح" },
  { slug: "webinars", nameEn: "Webinars", nameAr: "الندوات" },
];

export function getYouTubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return match ? match[1] : null;
}

export const demoVideos: VideoItem[] = [
  // Event Highlights
  {
    id: "1",
    titleEn: "Youth Entrepreneurship Summit 2025 — Highlights",
    titleAr: "قمة ريادة الأعمال للشباب 2025 — أبرز اللحظات",
    descriptionEn: "Relive the best moments from the 2025 Youth Entrepreneurship Summit in Beirut, featuring keynote speeches, pitch competitions, and networking sessions.",
    descriptionAr: "عش أفضل لحظات قمة ريادة الأعمال للشباب 2025 في بيروت، بما في ذلك الخطابات الرئيسية ومسابقات العروض وجلسات التواصل.",
    youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    categorySlug: "highlights",
  },
  {
    id: "2",
    titleEn: "NAWARA Green Ventures Pitch Competition Recap",
    titleAr: "ملخص مسابقة عروض مشاريع نورة الخضراء",
    descriptionEn: "Watch the highlights from the NAWARA pitch competition where 15 women-led green startups competed for seed funding across 3 MENA countries.",
    descriptionAr: "شاهد أبرز لحظات مسابقة عروض نورة حيث تنافست 15 شركة ناشئة خضراء بقيادة نساء على التمويل الأولي.",
    youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    categorySlug: "highlights",
  },
  {
    id: "3",
    titleEn: "SIYB Graduation Ceremony 2025 — Full Coverage",
    titleAr: "حفل تخريج SIYB 2025 — تغطية كاملة",
    descriptionEn: "Celebrating the graduation of 120 entrepreneurs who completed the ILO-certified SIYB training program.",
    descriptionAr: "الاحتفال بتخريج 120 رائد أعمال أكملوا برنامج التدريب المعتمد من منظمة العمل الدولية.",
    youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    categorySlug: "highlights",
  },

  // Trainings & Workshops
  {
    id: "4",
    titleEn: "How to Write a Business Plan — SIYB Training Series",
    titleAr: "كيف تكتب خطة عمل — سلسلة تدريب SIYB",
    descriptionEn: "Step-by-step guide on writing a solid business plan, from the ILO-certified Start & Improve Your Business training program.",
    descriptionAr: "دليل خطوة بخطوة لكتابة خطة عمل متينة، من برنامج تدريب ابدأ وحسّن عملك المعتمد من منظمة العمل الدولية.",
    youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    categorySlug: "trainings",
  },
  {
    id: "5",
    titleEn: "Digital Marketing for Social Enterprises — Workshop Recap",
    titleAr: "التسويق الرقمي للمؤسسات الاجتماعية — ملخص الورشة",
    descriptionEn: "Key takeaways from our intensive digital marketing bootcamp covering social media strategy, content creation, and branding.",
    descriptionAr: "أهم النقاط من معسكرنا التدريبي المكثف للتسويق الرقمي الذي يغطي استراتيجية وسائل التواصل الاجتماعي وإنشاء المحتوى.",
    youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    categorySlug: "trainings",
  },
  {
    id: "6",
    titleEn: "Financial Literacy for Women Entrepreneurs",
    titleAr: "محو الأمية المالية لرائدات الأعمال",
    descriptionEn: "Learn budgeting, savings strategies, and micro-lending options in this financial literacy workshop designed for women entrepreneurs.",
    descriptionAr: "تعلمي إعداد الميزانية واستراتيجيات الادخار وخيارات الإقراض الصغير في ورشة محو الأمية المالية المصممة لرائدات الأعمال.",
    youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    categorySlug: "trainings",
  },

  // Success Stories
  {
    id: "7",
    titleEn: "From Idea to Impact — Rima's Green Fashion Journey",
    titleAr: "من الفكرة إلى الأثر — رحلة ريما في الأزياء الخضراء",
    descriptionEn: "Rima shares how the NAWARA program helped her launch a sustainable fashion brand in South Lebanon, creating jobs for 12 women.",
    descriptionAr: "تشارك ريما كيف ساعدها برنامج نورة في إطلاق علامة تجارية للأزياء المستدامة في جنوب لبنان، مما وفر فرص عمل لـ 12 امرأة.",
    youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    categorySlug: "testimonials",
  },
  {
    id: "8",
    titleEn: "Building a Community Kitchen — Ahmad's Story",
    titleAr: "بناء مطبخ مجتمعي — قصة أحمد",
    descriptionEn: "Ahmad transformed his SIYB training into a community kitchen that serves 200 families daily in the Bekaa Valley.",
    descriptionAr: "حوّل أحمد تدريبه في SIYB إلى مطبخ مجتمعي يخدم 200 عائلة يومياً في سهل البقاع.",
    youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    categorySlug: "testimonials",
  },
  {
    id: "9",
    titleEn: "Women Leading Change — Voices from NAWARA",
    titleAr: "نساء يقدن التغيير — أصوات من نورة",
    descriptionEn: "Three women entrepreneurs from Lebanon, Tunisia, and Morocco share their experiences with the NAWARA Green Ventures program.",
    descriptionAr: "ثلاث رائدات أعمال من لبنان وتونس والمغرب يشاركن تجربتهن مع برنامج مشاريع نورة الخضراء.",
    youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    categorySlug: "testimonials",
  },

  // Webinars
  {
    id: "10",
    titleEn: "Climate-Smart Agriculture — Green Business Webinar",
    titleAr: "الزراعة الذكية مناخياً — ندوة الأعمال الخضراء",
    descriptionEn: "Expert panel discussing climate-smart agricultural practices and green business models for agritech entrepreneurs.",
    descriptionAr: "حلقة نقاش خبراء حول الممارسات الزراعية الذكية مناخياً ونماذج الأعمال الخضراء لرواد أعمال التكنولوجيا الزراعية.",
    youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    categorySlug: "webinars",
  },
  {
    id: "11",
    titleEn: "Scaling Your Social Enterprise — Expert Panel",
    titleAr: "توسيع مؤسستك الاجتماعية — حلقة نقاش خبراء",
    descriptionEn: "Industry leaders share strategies for scaling social enterprises while maintaining impact and sustainability.",
    descriptionAr: "يشارك قادة الصناعة استراتيجيات لتوسيع المؤسسات الاجتماعية مع الحفاظ على الأثر والاستدامة.",
    youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    categorySlug: "webinars",
  },
  {
    id: "12",
    titleEn: "E-Commerce for Rural Communities — Online Workshop",
    titleAr: "التجارة الإلكترونية للمجتمعات الريفية — ورشة عبر الإنترنت",
    descriptionEn: "Practical session on setting up e-commerce platforms for artisans and producers in rural areas.",
    descriptionAr: "جلسة عملية حول إنشاء منصات التجارة الإلكترونية للحرفيين والمنتجين في المناطق الريفية.",
    youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    categorySlug: "webinars",
  },
];
