import { db } from "@/lib/db";
import type { Report } from "@prisma/client";

export type ReportListItem = {
  id: string;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  coverImageUrl: string;
  fileUrl: string;
  year: number;
  categorySlug: string;
};

function toListItem(r: Report): ReportListItem {
  return {
    id: r.id,
    titleEn: r.titleEn,
    titleAr: r.titleAr,
    descriptionEn: r.descriptionEn ?? "",
    descriptionAr: r.descriptionAr ?? "",
    coverImageUrl: r.coverImageUrl ?? "",
    fileUrl: r.fileUrl ?? "",
    year: r.year ?? new Date().getFullYear(),
    categorySlug: r.category ?? "",
  };
}

export async function getReports(): Promise<ReportListItem[]> {
  const reports = await db.report.findMany({
    where: { isActive: true },
    orderBy: { year: "desc" },
  });
  return reports.map(toListItem);
}
