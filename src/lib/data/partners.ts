import { db } from "@/lib/db";

export type PartnerItem = {
  id: string;
  nameEn: string;
  nameAr: string;
  logoUrl: string;
  websiteUrl: string | null;
  type: string;
};

export async function getPartners(): Promise<PartnerItem[]> {
  const partners = await db.partner.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
  });
  return partners.map((p) => ({
    id: p.id,
    nameEn: p.nameEn,
    nameAr: p.nameAr,
    logoUrl: p.logoUrl,
    websiteUrl: p.websiteUrl,
    type: p.type,
  }));
}
