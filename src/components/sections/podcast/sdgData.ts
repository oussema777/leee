/**
 * UN Sustainable Development Goals — numbers, titles, official colors, and icon paths.
 *
 * Icon PNGs are expected at `public/images/sdg/sdg-{n}.png`. If the official PNGs
 * are not present, `<SdgBadge>` falls back to a solid colored square with the
 * number centered (visually consistent until real assets are obtained).
 */
export interface SdgInfo {
  number: number;
  titleEn: string;
  titleAr: string;
  color: string; // official UN hex
  iconPath: string;
}

export const sdgs: Record<number, SdgInfo> = {
  1: { number: 1, titleEn: "No Poverty", titleAr: "القضاء على الفقر", color: "#E5243B", iconPath: "/images/sdg/sdg-1.jpg" },
  2: { number: 2, titleEn: "Zero Hunger", titleAr: "القضاء على الجوع", color: "#DDA63A", iconPath: "/images/sdg/sdg-2.jpg" },
  3: { number: 3, titleEn: "Good Health and Well-being", titleAr: "الصحة الجيدة والرفاه", color: "#4C9F38", iconPath: "/images/sdg/sdg-3.jpg" },
  4: { number: 4, titleEn: "Quality Education", titleAr: "التعليم الجيد", color: "#C5192D", iconPath: "/images/sdg/sdg-4.jpg" },
  5: { number: 5, titleEn: "Gender Equality", titleAr: "المساواة بين الجنسين", color: "#FF3A21", iconPath: "/images/sdg/sdg-5.jpg" },
  6: { number: 6, titleEn: "Clean Water and Sanitation", titleAr: "المياه النظيفة والنظافة الصحية", color: "#26BDE2", iconPath: "/images/sdg/sdg-6.jpg" },
  7: { number: 7, titleEn: "Affordable and Clean Energy", titleAr: "طاقة نظيفة وبأسعار معقولة", color: "#FCC30B", iconPath: "/images/sdg/sdg-7.jpg" },
  8: { number: 8, titleEn: "Decent Work and Economic Growth", titleAr: "العمل اللائق ونمو الاقتصاد", color: "#A21942", iconPath: "/images/sdg/sdg-8.jpg" },
  9: { number: 9, titleEn: "Industry, Innovation and Infrastructure", titleAr: "الصناعة والابتكار والبنية التحتية", color: "#FD6925", iconPath: "/images/sdg/sdg-9.jpg" },
  10: { number: 10, titleEn: "Reduced Inequalities", titleAr: "الحد من عدم المساواة", color: "#DD1367", iconPath: "/images/sdg/sdg-10.jpg" },
  11: { number: 11, titleEn: "Sustainable Cities and Communities", titleAr: "مدن ومجتمعات محلية مستدامة", color: "#FD9D24", iconPath: "/images/sdg/sdg-11.jpg" },
  12: { number: 12, titleEn: "Responsible Consumption and Production", titleAr: "الاستهلاك والإنتاج المسؤولان", color: "#BF8B2E", iconPath: "/images/sdg/sdg-12.jpg" },
  13: { number: 13, titleEn: "Climate Action", titleAr: "العمل المناخي", color: "#3F7E44", iconPath: "/images/sdg/sdg-13.jpg" },
  14: { number: 14, titleEn: "Life Below Water", titleAr: "الحياة تحت الماء", color: "#0A97D9", iconPath: "/images/sdg/sdg-14.jpg" },
  15: { number: 15, titleEn: "Life on Land", titleAr: "الحياة في البر", color: "#56C02B", iconPath: "/images/sdg/sdg-15.jpg" },
  16: { number: 16, titleEn: "Peace, Justice and Strong Institutions", titleAr: "السلام والعدل والمؤسسات القوية", color: "#00689D", iconPath: "/images/sdg/sdg-16.jpg" },
  17: { number: 17, titleEn: "Partnerships for the Goals", titleAr: "عقد الشراكات لتحقيق الأهداف", color: "#19486A", iconPath: "/images/sdg/sdg-17.jpg" },
};
