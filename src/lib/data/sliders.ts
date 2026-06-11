import { db } from "@/lib/db";

export type SliderItem = {
  id: string;
  titleEn: string;
  titleAr: string;
  subtitleEn: string;
  subtitleAr: string;
  ctaLabelEn: string;
  ctaLabelAr: string;
  ctaUrl: string;
  imageUrl: string;
};

export async function getSliders(): Promise<SliderItem[]> {
  const rows = await db.slider.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
  });
  return rows.map((s) => ({
    id: s.id,
    titleEn: s.titleEn,
    titleAr: s.titleAr,
    subtitleEn: s.subtitleEn ?? "",
    subtitleAr: s.subtitleAr ?? "",
    ctaLabelEn: s.ctaLabelEn ?? "",
    ctaLabelAr: s.ctaLabelAr ?? "",
    ctaUrl: s.ctaUrl ?? "/programs",
    imageUrl: s.imageUrl,
  }));
}
