/**
 * Hand-curated lookup of programs referenced from podcast episodes.
 *
 * Why a local mirror: avoids importing Prisma into client code and avoids
 * per-episode network fetches on the detail page.
 *
 * Drift: this mirrors a tiny subset (≤12 entries) of `prisma/seed-programs.ts`.
 * Whoever updates a podcast episode's `relatedProgramSlug` also updates this
 * file. Broken slugs simply cause the related-project section to be omitted
 * — no runtime error.
 *
 * `pillarSlug` uses the UI key set (`humanitarian-aid`, `incubators`,
 * `academy`, `business-clinic`, `digital-media-hub`). Note the Prisma seed
 * uses `coaching` for the Business Clinic pillar — translate that to
 * `business-clinic` here.
 */
export interface RelatedProgramSummary {
  slug: string;
  titleEn: string;
  titleAr: string;
  pillarSlug: string;
  coverImageUrl: string;
}

export const relatedPrograms: Record<string, RelatedProgramSummary> = {
  "nawra-green-ventures-acceleration": {
    slug: "nawra-green-ventures-acceleration",
    titleEn: "NAWRA — Green Ventures Acceleration Program",
    titleAr: "نورة — برنامج تسريع المشاريع الخضراء",
    pillarSlug: "incubators",
    coverImageUrl: "/images/nawra-dream-to-jury.jpg",
  },
  "houla-women-green-fashion-factory": {
    slug: "houla-women-green-fashion-factory",
    titleEn: "Houla Women's Green Fashion Factory",
    titleAr: "مصنع أزياء حولا الخضراء للنساء",
    pillarSlug: "incubators",
    coverImageUrl: "/images/handcrafted-products.jpg",
  },
  "financial-education-women": {
    slug: "financial-education-women",
    titleEn: "Financial Education Capacity Building for Women",
    titleAr: "بناء قدرات التعليم المالي للنساء",
    pillarSlug: "academy",
    coverImageUrl: "/images/certificate-presentation.jpg",
  },
  "prospects-entrepreneurship-agriculture": {
    slug: "prospects-entrepreneurship-agriculture",
    titleEn: "Promoting Entrepreneurship in Agriculture & Agro-food (Prospects)",
    titleAr: "تعزيز ريادة الأعمال في الزراعة والصناعات الغذائية (برنامج آفاق)",
    pillarSlug: "incubators",
    coverImageUrl: "/images/field-visit-rural.jpg",
  },
  "community-kitchens-social-cohesion": {
    slug: "community-kitchens-social-cohesion",
    titleEn: "Community Kitchen Initiative — Building CSO Capacity for Social Cohesion",
    titleAr: "مبادرة المطابخ المجتمعية — بناء قدرات المجتمع المدني للتماسك الاجتماعي",
    pillarSlug: "humanitarian-aid",
    coverImageUrl: "/images/certificate-presentation.jpg",
  },
  "enable-siyb-training-2024": {
    slug: "enable-siyb-training-2024",
    titleEn: "ENABLE Programme — SIYB Entrepreneurship Training",
    titleAr: "برنامج ENABLE — تدريب ريادة الأعمال SIYB",
    pillarSlug: "academy",
    coverImageUrl: "/images/group-training-workshop.jpg",
  },
  "empowering-women-entrepreneurs-mena": {
    slug: "empowering-women-entrepreneurs-mena",
    titleEn: "Empowering Women Entrepreneurs in MENA Towards Equal Market Access",
    titleAr: "تمكين رائدات الأعمال في منطقة الشرق الأوسط وشمال أفريقيا نحو وصول متساوٍ للأسواق",
    pillarSlug: "academy",
    coverImageUrl: "/images/women-empowerment-art.jpg",
  },
  "digital-learning-women-sustainable-business": {
    slug: "digital-learning-women-sustainable-business",
    titleEn: "Digital Learning for Women Sustainable Business",
    titleAr: "التعلم الرقمي للأعمال المستدامة للنساء",
    pillarSlug: "academy",
    coverImageUrl: "/images/nawra-women-training.jpg",
  },
};
