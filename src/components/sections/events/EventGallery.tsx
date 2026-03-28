"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { X, ChevronLeft, ChevronRight, Images } from "lucide-react";

interface EventGalleryProps {
  images: string[];
  titleEn: string;
  titleAr: string;
}

export function EventGallery({ images, titleEn, titleAr }: EventGalleryProps) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (!images || images.length === 0) return null;

  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);

  const goNext = () => {
    if (lightboxIndex !== null) {
      setLightboxIndex((lightboxIndex + 1) % images.length);
    }
  };

  const goPrev = () => {
    if (lightboxIndex !== null) {
      setLightboxIndex((lightboxIndex - 1 + images.length) % images.length);
    }
  };

  return (
    <section className="py-10">
      <div className="flex items-center gap-2 mb-6">
        <Images className="w-5 h-5 text-brand-blue" />
        <h2 className="text-xl font-bold text-text-primary">
          {isAr ? "معرض الصور" : "Event Gallery"}
        </h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {images.map((src, i) => (
          <button
            key={i}
            onClick={() => openLightbox(i)}
            className="relative group overflow-hidden aspect-[4/3] bg-gray-100"
          >
            <img
              src={src}
              alt={`${isAr ? titleAr : titleEn} — ${i + 1}`}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-brand-blue-deeper/0 group-hover:bg-brand-blue-deeper/30 transition-colors duration-300" />
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={closeLightbox}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              closeLightbox();
            }}
            className="absolute top-4 end-4 text-white/80 hover:text-white z-10"
          >
            <X className="w-8 h-8" />
          </button>

          {images.length > 1 && (
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

          <img
            src={images[lightboxIndex]}
            alt={`${isAr ? titleAr : titleEn} — ${lightboxIndex + 1}`}
            className="max-w-[90vw] max-h-[85vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-sm">
            {lightboxIndex + 1} / {images.length}
          </div>
        </div>
      )}
    </section>
  );
}
