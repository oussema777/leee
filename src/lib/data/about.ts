import { db } from "@/lib/db";

export type CoreValueItem = {
  id: string;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  storyEn: string;
  storyAr: string;
  sdgNumber: number;
  icon: string;
};

export type MilestoneItem = {
  year: number;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  imageUrl: string;
};

export async function getCoreValues(): Promise<CoreValueItem[]> {
  const rows = await db.coreValue.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
  });
  return rows.map((v) => ({
    id: v.id,
    nameEn: v.titleEn,
    nameAr: v.titleAr,
    descriptionEn: v.descriptionEn,
    descriptionAr: v.descriptionAr,
    storyEn: v.storyEn ?? "",
    storyAr: v.storyAr ?? "",
    sdgNumber: v.sdgNumber ?? 0,
    icon: v.icon ?? "users",
  }));
}

export async function getMilestones(): Promise<MilestoneItem[]> {
  const rows = await db.successMilestone.findMany({
    orderBy: { order: "asc" },
  });
  return rows.map((m) => ({
    year: m.year,
    titleEn: m.titleEn,
    titleAr: m.titleAr,
    descriptionEn: m.descriptionEn ?? "",
    descriptionAr: m.descriptionAr ?? "",
    imageUrl: m.imageUrl ?? "",
  }));
}
