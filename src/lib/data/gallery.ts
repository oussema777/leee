import { db } from "@/lib/db";
import type { GalleryImage as PrismaGalleryImage } from "@prisma/client";

// NOTE: the static demo file exports a type named `GalleryImage`, and the Prisma
// model is ALSO named `GalleryImage`. To avoid the collision we name the public
// return type `GalleryImageItem` here, and alias the Prisma type on import above.
export type GalleryImageItem = {
  id: string;
  imageUrl: string;
  captionEn: string;
  captionAr: string;
  albumSlug: string;
};

function toListItem(g: PrismaGalleryImage): GalleryImageItem {
  return {
    id: g.id,
    imageUrl: g.imageUrl ?? "",
    captionEn: g.captionEn ?? "",
    captionAr: g.captionAr ?? "",
    albumSlug: g.albumSlug ?? "",
  };
}

export async function getGalleryImages(): Promise<GalleryImageItem[]> {
  const images = await db.galleryImage.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
  });
  return images.map(toListItem);
}
