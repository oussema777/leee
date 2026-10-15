import { cache } from "react";
import { db } from "@/lib/db";

export const EBOOK_PUBLIC_ORIGIN = "https://www.theleeexperience.com";

// Sharing metadata and cover delivery may expose published, ready products only.
export const publicEbook = cache((slug: string) => db.ebook.findFirst({
  where: { slug, published: true, activeVersion: { ready: true } },
  select: {
    slug: true, titleEn: true, titleAr: true, author: true,
    descriptionEn: true, descriptionAr: true, coverUrl: true, updatedAt: true,
  },
}));
