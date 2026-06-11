"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { useLocale } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { Play, VideoOff, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { videoCategories, getYouTubeId } from "./videosData";
import type { VideoListItem } from "@/lib/data/videos";

export function VideosGrid({ videos }: { videos: VideoListItem[] }) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentCategory = searchParams.get("category") || "";
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);

  const filteredVideos = currentCategory
    ? videos.filter((v) => v.categorySlug === currentCategory)
    : videos;

  const updateCategory = useCallback(
    (slug: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (slug) {
        params.set("category", slug);
      } else {
        params.delete("category");
      }
      router.push(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  const activeVideo = activeVideoId
    ? videos.find((v) => v.id === activeVideoId)
    : null;
  const activeYouTubeId = activeVideo
    ? getYouTubeId(activeVideo.youtubeUrl)
    : null;

  return (
    <>
      {/* Category Filter Tabs */}
      <div className="flex items-center gap-1 flex-wrap mb-6 overflow-x-auto pb-2">
        <button
          onClick={() => updateCategory("")}
          className={cn(
            "px-5 py-2.5 text-sm font-semibold transition-all border-b-2 whitespace-nowrap",
            !currentCategory
              ? "border-brand-blue text-brand-blue bg-brand-blue-light/50"
              : "border-transparent text-text-secondary hover:text-brand-blue hover:border-brand-blue/30"
          )}
        >
          {isAr ? "جميع الفيديوهات" : "All Videos"}
        </button>
        {videoCategories.map((cat) => (
          <button
            key={cat.slug}
            onClick={() => updateCategory(cat.slug)}
            className={cn(
              "px-5 py-2.5 text-sm font-semibold transition-all border-b-2 whitespace-nowrap",
              currentCategory === cat.slug
                ? "border-brand-blue text-brand-blue bg-brand-blue-light/50"
                : "border-transparent text-text-secondary hover:text-brand-blue hover:border-brand-blue/30"
            )}
          >
            {isAr ? cat.nameAr : cat.nameEn}
          </button>
        ))}
      </div>

      {/* Video Count */}
      <p className="text-sm text-text-muted mb-6">
        {filteredVideos.length} {isAr ? "فيديو" : "videos"}
      </p>

      {/* Video Grid */}
      {filteredVideos.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVideos.map((video) => {
            const ytId = getYouTubeId(video.youtubeUrl);
            if (!ytId) return null;

            return (
              <button
                key={video.id}
                onClick={() => setActiveVideoId(video.id)}
                className="group text-start bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Thumbnail */}
                <div className="relative aspect-video bg-gray-100 overflow-hidden">
                  <Image
                    src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`}
                    alt={isAr ? video.titleAr : video.titleEn}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {/* Play overlay */}
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                    <div className="w-14 h-14 bg-brand-blue/90 group-hover:bg-brand-blue flex items-center justify-center transition-colors">
                      <Play className="w-6 h-6 text-white ms-0.5" fill="white" />
                    </div>
                  </div>
                </div>

                {/* Info */}
                <div className="p-4">
                  <h3 className="text-sm font-semibold text-text-primary mb-1.5 line-clamp-2 group-hover:text-brand-blue transition-colors">
                    {isAr ? video.titleAr : video.titleEn}
                  </h3>
                  <p className="text-xs text-text-muted line-clamp-2">
                    {isAr ? video.descriptionAr : video.descriptionEn}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16">
          <VideoOff className="w-16 h-16 mx-auto text-text-muted mb-4" />
          <p className="text-text-secondary text-lg">
            {isAr
              ? "لم يتم العثور على فيديوهات في هذه الفئة."
              : "No videos found in this category."}
          </p>
        </div>
      )}

      {/* Video Player Modal */}
      {activeVideo && activeYouTubeId && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setActiveVideoId(null)}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              setActiveVideoId(null);
            }}
            className="absolute top-4 end-4 text-white/80 hover:text-white z-10"
          >
            <X className="w-8 h-8" />
          </button>

          <div
            className="w-full max-w-4xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative aspect-video bg-black">
              <iframe
                src={`https://www.youtube.com/embed/${activeYouTubeId}?autoplay=1`}
                title={isAr ? activeVideo.titleAr : activeVideo.titleEn}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 w-full h-full"
              />
            </div>
            <div className="mt-4">
              <h3 className="text-white text-lg font-semibold mb-1">
                {isAr ? activeVideo.titleAr : activeVideo.titleEn}
              </h3>
              <p className="text-white/60 text-sm">
                {isAr ? activeVideo.descriptionAr : activeVideo.descriptionEn}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
