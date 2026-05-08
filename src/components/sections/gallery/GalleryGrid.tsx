"use client";

import { useState, useCallback } from "react";
import { useLocale } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { X, ChevronLeft, ChevronRight, ImageOff } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { albums, galleryImages } from "./galleryData";
import type { GalleryImage } from "./galleryData";

export function GalleryGrid() {
  const locale = useLocale();
  const isAr = locale === "ar";
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentAlbum = searchParams.get("album") || "";
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const filteredImages: GalleryImage[] = currentAlbum
    ? galleryImages.filter((img) => img.albumSlug === currentAlbum)
    : galleryImages;

  const updateAlbum = useCallback(
    (slug: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (slug) {
        params.set("album", slug);
      } else {
        params.delete("album");
      }
      router.push(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);

  const goNext = () => {
    if (lightboxIndex !== null) {
      setLightboxIndex((lightboxIndex + 1) % filteredImages.length);
    }
  };

  const goPrev = () => {
    if (lightboxIndex !== null) {
      setLightboxIndex(
        (lightboxIndex - 1 + filteredImages.length) % filteredImages.length
      );
    }
  };

  return (
    <>
      {/* Album Filter Tabs */}
      <div className="flex items-center gap-1 flex-wrap mb-6 overflow-x-auto pb-2">
        <button
          onClick={() => updateAlbum("")}
          className={cn(
            "px-5 py-2.5 text-sm font-semibold transition-all border-b-2 whitespace-nowrap",
            !currentAlbum
              ? "border-brand-blue text-brand-blue bg-brand-blue-light/50"
              : "border-transparent text-text-secondary hover:text-brand-blue hover:border-brand-blue/30"
          )}
        >
          {isAr ? "جميع الألبومات" : "All Albums"}
        </button>
        {albums.map((album) => (
          <button
            key={album.slug}
            onClick={() => updateAlbum(album.slug)}
            className={cn(
              "px-5 py-2.5 text-sm font-semibold transition-all border-b-2 whitespace-nowrap",
              currentAlbum === album.slug
                ? "border-brand-blue text-brand-blue bg-brand-blue-light/50"
                : "border-transparent text-text-secondary hover:text-brand-blue hover:border-brand-blue/30"
            )}
          >
            {isAr ? album.nameAr : album.nameEn}
          </button>
        ))}
      </div>

      {/* Photo Count */}
      <p className="text-sm text-text-muted mb-6">
        {filteredImages.length} {isAr ? "صور" : "photos"}
      </p>

      {/* Photo Grid */}
      {filteredImages.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filteredImages.map((img, i) => (
            <button
              key={img.id}
              onClick={() => openLightbox(i)}
              className="relative group overflow-hidden aspect-[4/3] bg-gray-100"
            >
              <Image
                src={img.imageUrl}
                alt={isAr ? img.captionAr : img.captionEn}
                fill
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                className="object-cover transition-transform duration-500 group-hover:scale-110"
              />
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-brand-blue-deeper/0 group-hover:bg-brand-blue-deeper/40 transition-colors duration-300" />
              {/* Caption on hover */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                <p className="text-white text-xs leading-snug line-clamp-2">
                  {isAr ? img.captionAr : img.captionEn}
                </p>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <ImageOff className="w-16 h-16 mx-auto text-text-muted mb-4" />
          <p className="text-text-secondary text-lg">
            {isAr
              ? "لم يتم العثور على صور في هذا الألبوم."
              : "No photos found in this album."}
          </p>
        </div>
      )}

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={closeLightbox}
        >
          {/* Close */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              closeLightbox();
            }}
            className="absolute top-4 end-4 text-white/80 hover:text-white z-10"
          >
            <X className="w-8 h-8" />
          </button>

          {/* Navigation */}
          {filteredImages.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goPrev();
                }}
                className="absolute start-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white z-10"
              >
                <ChevronLeft className="w-10 h-10 rtl:rotate-180" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goNext();
                }}
                className="absolute end-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white z-10"
              >
                <ChevronRight className="w-10 h-10 rtl:rotate-180" />
              </button>
            </>
          )}

          {/* Image */}
          <img
            src={filteredImages[lightboxIndex].imageUrl}
            alt={
              isAr
                ? filteredImages[lightboxIndex].captionAr
                : filteredImages[lightboxIndex].captionEn
            }
            className="max-w-[90vw] max-h-[80vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Caption + Counter */}
          <div
            className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center max-w-xl px-4"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-white/90 text-sm mb-1">
              {isAr
                ? filteredImages[lightboxIndex].captionAr
                : filteredImages[lightboxIndex].captionEn}
            </p>
            <p className="text-white/50 text-xs">
              {lightboxIndex + 1} / {filteredImages.length}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
