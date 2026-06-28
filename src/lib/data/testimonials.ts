import { db } from "@/lib/db";
import type { Testimonial } from "@prisma/client";

/**
 * Return shape mirrors the static demo `TestimonialItem` (kept field names:
 * roleEn/roleAr, programEn/Ar, categorySlug, isOriginalCard) so the
 * TestimonialsGrid client component needs minimal change.
 */
export type TestimonialListItem = {
  id: string;
  nameEn: string;
  nameAr: string;
  roleEn: string;
  roleAr: string;
  quoteEn: string;
  quoteAr: string;
  imageUrl: string;
  programEn: string;
  programAr: string;
  categorySlug: string;
  year: number;
  isOriginalCard: boolean;
};

function toListItem(t: Testimonial): TestimonialListItem {
  return {
    id: t.id,
    nameEn: t.nameEn,
    nameAr: t.nameAr,
    // The model's "title" IS the person's role.
    roleEn: t.titleEn ?? "",
    roleAr: t.titleAr ?? "",
    quoteEn: t.quoteEn,
    quoteAr: t.quoteAr,
    imageUrl: t.imageUrl ?? "",
    programEn: t.programEn ?? "",
    programAr: t.programAr ?? "",
    categorySlug: t.category ?? "",
    year: t.year ?? 0,
    isOriginalCard: t.isOriginalCard,
  };
}

export async function getTestimonials(): Promise<TestimonialListItem[]> {
  const testimonials = await db.testimonial.findMany({
    where: { isActive: true },
    // `id` (a cuid) is a stable tiebreaker so "top N" stays deterministic
    // across requests even when several rows share the default order = 0.
    orderBy: [{ order: "asc" }, { id: "asc" }],
  });
  return testimonials.map(toListItem);
}
