import { db } from "@/lib/db";
import type { Video } from "@prisma/client";

export type VideoListItem = {
  id: string;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  youtubeUrl: string;
  categorySlug: string;
};

function toListItem(v: Video): VideoListItem {
  return {
    id: v.id,
    titleEn: v.titleEn,
    titleAr: v.titleAr,
    descriptionEn: v.descriptionEn ?? "",
    descriptionAr: v.descriptionAr ?? "",
    youtubeUrl: v.youtubeUrl ?? "",
    categorySlug: v.category ?? "",
  };
}

export async function getVideos(): Promise<VideoListItem[]> {
  const videos = await db.video.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
  });
  return videos.map(toListItem);
}
