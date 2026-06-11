import { db } from "@/lib/db";
import type { Event } from "@prisma/client";

export type EventListItem = {
  id: string;
  slug: string;
  titleEn: string;
  titleAr: string;
  summaryEn: string;
  summaryAr: string;
  imageUrl: string;
  startDate: string;
  endDate?: string;
  location: string;
  locationAr: string;
  category: string;
  registrationUrl?: string;
  isFeatured: boolean;
};

export type EventDetail = EventListItem & {
  descriptionEn: string;
  descriptionAr: string;
  galleryImages: string[];
};

function toListItem(e: Event): EventListItem {
  return {
    id: e.id,
    slug: e.slug,
    titleEn: e.titleEn,
    titleAr: e.titleAr,
    summaryEn: e.summaryEn ?? "",
    summaryAr: e.summaryAr ?? "",
    imageUrl: e.imageUrl ?? "",
    startDate: e.startDate.toISOString(),
    endDate: e.endDate ? e.endDate.toISOString() : undefined,
    location: e.location ?? "",
    locationAr: e.locationAr ?? "",
    category: e.category ?? "",
    registrationUrl: e.registrationUrl ?? undefined,
    isFeatured: e.isFeatured,
  };
}

export async function getEvents(): Promise<EventListItem[]> {
  const events = await db.event.findMany({
    where: { isActive: true },
    orderBy: { startDate: "desc" },
  });
  return events.map(toListItem);
}

export async function getEventBySlug(slug: string): Promise<EventDetail | null> {
  const e = await db.event.findUnique({ where: { slug } });
  if (!e || !e.isActive) return null;
  return {
    ...toListItem(e),
    descriptionEn: e.descriptionEn,
    descriptionAr: e.descriptionAr,
    galleryImages: e.galleryImages,
  };
}

export async function getRelatedEvents(currentSlug: string, category: string, limit = 3): Promise<EventListItem[]> {
  const events = await db.event.findMany({
    where: { isActive: true, slug: { not: currentSlug } },
    orderBy: { startDate: "desc" },
  });
  const mapped = events.map(toListItem);
  const same = mapped.filter((e) => category && e.category === category);
  const others = mapped.filter((e) => !category || e.category !== category);
  return [...same, ...others].slice(0, limit);
}
