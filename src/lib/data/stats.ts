import { db } from "@/lib/db";

export type StatItem = {
  id: string;
  labelEn: string;
  labelAr: string;
  value: number;
  suffix: string;
  prefix: string;
  icon: string; // string key mapped to a lucide icon in StatsCounter
  color: string;
};

export async function getExperienceNumbers(): Promise<StatItem[]> {
  const rows = await db.experienceNumber.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
  });
  return rows.map((r) => ({
    id: r.id,
    labelEn: r.labelEn,
    labelAr: r.labelAr,
    value: r.value,
    suffix: r.suffix ?? "",
    prefix: r.prefix ?? "",
    icon: r.icon ?? "users",
    color: r.color ?? "#5895D0",
  }));
}
