"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { Container } from "@/components/ui/Container";
import { X, ChevronLeft, ChevronRight, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface GalleryImage {
  id: string;
  imageUrl: string;
  caption?: string | null;
}

interface Video {
  titleEn?: string | null;
  titleAr?: string | null;
  youtubeUrl: string;
}

interface ProgramGalleryVideosProps {
  images: GalleryImage[];
  videos: Video[];
}

function getYouTubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return match ? match[1] : null;
}

export function ProgramGalleryVideos({ images, videos }: ProgramGalleryVideosProps) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const hasImages = images.length > 0;
  const hasVideos = videos.length > 0;

  if (!hasImages && !hasVideos) return null;

  const closeLightbox = () => setLightboxIndex(null);
  const goNext = () => {
    if (lightboxIndex !== null) setLightboxIndex((lightboxIndex + 1) % images.length);
  };
  const goPrev = () => {
    if (lightboxIndex !== null) setLightboxIndex((lightboxIndex - 1 + images.length) % images.length);
  };

  return (
    <section id="gallery" className="scroll-mt-16 py-20 md:py-28 relative overflow-hidden">
      {/* Decorative shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[5%] end-[5%] w-16 h-16 rounded-full bg-brand-blue/[0.04] animate-[float-slow_7s_ease-in-out_infinite]" />
        <div className="absolute bottom-[8%] start-[4%] w-4 h-4 rounded-full bg-emerald-400/10 animate-[float-medium_5s_ease-in-out_infinite_0.5s]" />
        <div className="absolute top-[40%] start-[2%] text-amber-400/10 animate-[float-slow_6s_ease-in-out_infinite_1s]">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
          </svg>
        </div>
      </div>

      <Container>
        <div className="text-center mb-14">
          <span className="inline-flex items-center gap-3 text-brand-blue text-[11px] font-bold uppercase tracking-[0.3em] mb-4">
            <span className="w-6 h-[1.5px] bg-brand-blue" />
            {isAr ? "المعرض" : "Gallery & Media"}
            <span className="w-6 h-[1.5px] bg-brand-blue" />
          </span>
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-text-primary tracking-tight">
            {isAr ? "المعرض والفيديو" : "Gallery & Videos"}
          </h2>
        </div>

        {/* Photo Gallery */}
        {hasImages && (
          <div className="mb-14">
            <div
              className={cn(
                "grid gap-3",
                images.length === 1 && "grid-cols-1",
                images.length === 2 && "grid-cols-2",
                images.length >= 3 && "grid-cols-2 md:grid-cols-3",
                images.length >= 5 && "grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
              )}
            >
              {images.map((image, index) => (
                <button
                  key={image.id}
                  onClick={() => setLightboxIndex(index)}
                  className="relative group overflow-hidden aspect-video rounded-xl"
                >
                  <Image
                    src={image.imageUrl}
                    alt={image.caption || ""}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 768px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-accent-navy/0 group-hover:bg-accent-navy/20 transition-colors duration-300" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                      </svg>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Videos */}
        {hasVideos && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {videos.map((video, index) => {
                const videoId = getYouTubeId(video.youtubeUrl);
                return (
                  <div key={index}>
                    <div className="relative aspect-video bg-accent-navy rounded-xl overflow-hidden">
                      {videoId ? (
                        <iframe
                          src={`https://www.youtube.com/embed/${videoId}`}
                          title={isAr ? video.titleAr || "" : video.titleEn || ""}
                          className="w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Play className="w-12 h-12 text-white/50" />
                        </div>
                      )}
                    </div>
                    {(video.titleEn || video.titleAr) && (
                      <p className="mt-3 text-sm font-medium text-text-primary">
                        {isAr ? video.titleAr || video.titleEn : video.titleEn}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Container>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={closeLightbox}
        >
          <button
            onClick={(e) => { e.stopPropagation(); closeLightbox(); }}
            className="absolute top-5 right-5 text-white/70 hover:text-white transition-colors z-10"
          >
            <X className="w-7 h-7" />
          </button>
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); goPrev(); }}
                className="absolute left-5 text-white/70 hover:text-white transition-colors z-10"
              >
                <ChevronLeft className="w-10 h-10" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); goNext(); }}
                className="absolute right-5 text-white/70 hover:text-white transition-colors z-10"
              >
                <ChevronRight className="w-10 h-10" />
              </button>
            </>
          )}
          <img
            src={images[lightboxIndex].imageUrl}
            alt={images[lightboxIndex].caption || ""}
            className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
          {images[lightboxIndex].caption && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/70 text-sm bg-black/50 px-4 py-2 rounded-full backdrop-blur-sm">
              {images[lightboxIndex].caption}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
