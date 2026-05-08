"use client";

import { useState, useRef, useEffect } from "react";
import { useLocale } from "next-intl";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { NewsletterSection } from "@/components/sections/home/NewsletterSection";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Play,
  Camera,
  Video,
  Instagram,
  Zap,
} from "lucide-react";

/* ─── media data ─── */
const PHOTOS = Array.from({ length: 37 }, (_, i) => {
  const num = String(i + 1).padStart(2, "0");
  return { src: `/images/spark/spark-${num}.jpg`, id: `photo-${num}` };
});

const VIDEOS = Array.from({ length: 18 }, (_, i) => {
  const num = String(i + 1).padStart(2, "0");
  return { src: `/images/spark/spark-video-${num}.mp4`, id: `video-${num}` };
});

/* ─── masonry height classes for visual variety ─── */
const MASONRY_HEIGHTS = [
  "row-span-2", // tall
  "",            // standard
  "",            // standard
  "row-span-2", // tall
  "",            // standard
  "",            // standard
  "",            // standard
  "row-span-2", // tall
  "",            // standard
  "",            // standard
];

type Tab = "all" | "photos" | "videos";

export function SparkPage() {
  const locale = useLocale();
  const isAr = locale === "ar";
  const [tab, setTab] = useState<Tab>("all");
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [lightboxType, setLightboxType] = useState<"photo" | "video">("photo");

  const text = {
    pageTitle: isAr ? "ذا سبارك" : "The Spark",
    pageSubtitle: isAr
      ? "نافذتك على عالم LEE Experience — قصص، إنجازات، ولحظات ملهمة من برامجنا ومجتمعاتنا."
      : "Your window into the LEE Experience world — stories, achievements, and inspiring moments from our programs and communities.",
    all: isAr ? "الكل" : "All",
    photos: isAr ? "صور" : "Photos",
    videos: isAr ? "فيديوهات" : "Reels",
    followUs: isAr ? "تابعونا على إنستغرام" : "Follow us on Instagram",
    photoCount: isAr ? "٣٧ صورة" : "37 Photos",
    videoCount: isAr ? "١٨ فيديو" : "18 Reels",
    totalPosts: isAr ? "٥٥ منشور" : "55 Posts",
    sectionTitle: isAr
      ? "من قلب الميدان"
      : "From the Field",
    sectionSubtitle: isAr
      ? "لحظات حقيقية من برامج LEE Experience في لبنان والشرق الأوسط وأفريقيا."
      : "Real moments from LEE Experience programs across Lebanon, MENA and Africa.",
    reelsTitle: isAr ? "أحدث الفيديوهات" : "Latest Reels",
    reelsSubtitle: isAr
      ? "شاهدوا قصص نجاح رواد الأعمال والمجتمعات التي ندعمها."
      : "Watch success stories from the entrepreneurs and communities we support.",
  };

  /* ─── lightbox navigation ─── */
  const currentItems = tab === "videos" ? VIDEOS : tab === "photos" ? PHOTOS : [...PHOTOS, ...VIDEOS];
  const isVideo = (idx: number) => {
    if (tab === "videos") return true;
    if (tab === "photos") return false;
    return idx >= PHOTOS.length;
  };

  function openLightbox(idx: number, type: "photo" | "video") {
    setLightboxIdx(idx);
    setLightboxType(type);
  }

  function closeLightbox() {
    setLightboxIdx(null);
  }

  function lightboxPrev() {
    if (lightboxIdx === null) return;
    const items = lightboxType === "photo" ? PHOTOS : VIDEOS;
    setLightboxIdx((lightboxIdx - 1 + items.length) % items.length);
  }

  function lightboxNext() {
    if (lightboxIdx === null) return;
    const items = lightboxType === "photo" ? PHOTOS : VIDEOS;
    setLightboxIdx((lightboxIdx + 1) % items.length);
  }

  /* keyboard nav */
  useEffect(() => {
    if (lightboxIdx === null) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") isAr ? lightboxNext() : lightboxPrev();
      if (e.key === "ArrowRight") isAr ? lightboxPrev() : lightboxNext();
    }
    window.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [lightboxIdx, isAr]);

  return (
    <>
      {/* Hero Header */}
      <PageHeader
        title={text.pageTitle}
        subtitle={text.pageSubtitle}
        breadcrumbs={[
          { label: isAr ? "الرئيسية" : "Home", href: "/" },
          { label: text.pageTitle },
        ]}
      />

      {/* Stats Bar */}
      <section className="relative -mt-6 z-30">
        <Container>
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 px-6 py-5 flex flex-wrap items-center justify-between gap-4 max-w-3xl mx-auto">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 via-red-500 to-amber-500 flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-accent-navy">{text.totalPosts}</p>
                <p className="text-xs text-text-secondary">{isAr ? "محتوى" : "Content"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-brand-blue/10 flex items-center justify-center">
                <Camera className="w-5 h-5 text-brand-blue" />
              </div>
              <div>
                <p className="text-sm font-bold text-accent-navy">{text.photoCount}</p>
                <p className="text-xs text-text-secondary">{isAr ? "صور" : "Photos"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-pink-50 flex items-center justify-center">
                <Video className="w-5 h-5 text-pink-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-accent-navy">{text.videoCount}</p>
                <p className="text-xs text-text-secondary">{isAr ? "فيديوهات" : "Reels"}</p>
              </div>
            </div>
            <a
              href="https://www.instagram.com/the_lee_experience/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 via-red-500 to-amber-500 text-white text-sm font-semibold hover:shadow-lg hover:scale-[1.02] transition-all"
            >
              <Instagram className="w-4 h-4" />
              <span className="hidden sm:inline">{text.followUs}</span>
              <span className="sm:hidden">Instagram</span>
            </a>
          </div>
        </Container>
      </section>

      {/* Photo Gallery Section */}
      <section className="py-16 md:py-24 bg-surface-primary">
        <Container>
          {/* Section header */}
          <div className="text-center mb-10">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="font-serif text-3xl md:text-4xl text-accent-navy mb-3"
            >
              {text.sectionTitle}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-text-secondary text-lg max-w-2xl mx-auto"
            >
              {text.sectionSubtitle}
            </motion.p>
          </div>

          {/* Tab filter */}
          <div className="flex justify-center mb-10">
            <div className="inline-flex bg-gray-100 rounded-xl p-1 gap-1">
              {(["all", "photos", "videos"] as Tab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    tab === t
                      ? "bg-white text-accent-navy shadow-sm"
                      : "text-text-secondary hover:text-accent-navy"
                  }`}
                >
                  {t === "all" && text.all}
                  {t === "photos" && (
                    <span className="flex items-center gap-1.5">
                      <Camera className="w-4 h-4" />
                      {text.photos}
                    </span>
                  )}
                  {t === "videos" && (
                    <span className="flex items-center gap-1.5">
                      <Play className="w-4 h-4" />
                      {text.videos}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Photo Masonry Grid */}
          {(tab === "all" || tab === "photos") && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {tab === "all" && (
                <h3 className="text-xl font-bold text-accent-navy mb-6 flex items-center gap-2">
                  <Camera className="w-5 h-5 text-brand-blue" />
                  {text.photos}
                </h3>
              )}
              <div className="columns-2 md:columns-3 lg:columns-4 gap-3 space-y-3">
                {PHOTOS.map((photo, idx) => (
                  <motion.div
                    key={photo.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ delay: (idx % 8) * 0.05 }}
                    className="break-inside-avoid group cursor-pointer"
                    onClick={() => openLightbox(idx, "photo")}
                  >
                    <div className="relative overflow-hidden rounded-xl bg-gray-100">
                      <Image
                        src={photo.src}
                        alt={`The Spark - Post ${idx + 1}`}
                        width={600}
                        height={600}
                        className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      />
                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-accent-navy/0 group-hover:bg-accent-navy/40 transition-all duration-300 flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform group-hover:scale-100 scale-75">
                          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                            <Camera className="w-5 h-5 text-white" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Videos Grid */}
          {(tab === "all" || tab === "videos") && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className={tab === "all" ? "mt-16" : ""}
            >
              {tab === "all" && (
                <h3 className="text-xl font-bold text-accent-navy mb-3 flex items-center gap-2">
                  <Play className="w-5 h-5 text-pink-600" />
                  {text.reelsTitle}
                </h3>
              )}
              {tab === "all" && (
                <p className="text-text-secondary mb-6">{text.reelsSubtitle}</p>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {VIDEOS.map((video, idx) => (
                  <motion.div
                    key={video.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true, margin: "-30px" }}
                    transition={{ delay: (idx % 6) * 0.05 }}
                    className="group cursor-pointer"
                    onClick={() => openLightbox(idx, "video")}
                  >
                    <div className="relative aspect-[9/16] overflow-hidden rounded-xl bg-gray-900">
                      <video
                        src={video.src}
                        muted
                        playsInline
                        preload="metadata"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        onMouseEnter={(e) => {
                          const v = e.currentTarget;
                          v.currentTime = 0;
                          v.play().catch(() => {});
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.pause();
                          e.currentTarget.currentTime = 0;
                        }}
                      />
                      {/* Play overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30 group-hover:bg-white/30 transition-all group-hover:scale-110">
                          <Play className="w-5 h-5 text-white fill-white ms-0.5" />
                        </div>
                      </div>
                      {/* Reel indicator */}
                      <div className="absolute top-2 end-2 flex items-center gap-1 bg-black/40 backdrop-blur-sm rounded-full px-2 py-1">
                        <Video className="w-3 h-3 text-white" />
                        <span className="text-[10px] text-white font-medium">Reel</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </Container>
      </section>

      {/* Instagram CTA Banner */}
      <section className="py-12 bg-gradient-to-r from-pink-500 via-red-500 to-amber-500">
        <Container>
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-white">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Instagram className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">@the_lee_experience</h3>
                <p className="text-white/80 text-sm">
                  {isAr
                    ? "تابعونا للمزيد من القصص والتحديثات"
                    : "Follow us for more stories and updates"}
                </p>
              </div>
            </div>
            <a
              href="https://www.instagram.com/the_lee_experience/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-3.5 bg-white text-pink-600 font-bold rounded-xl hover:bg-white/90 hover:shadow-xl transition-all text-sm"
            >
              {text.followUs}
            </a>
          </div>
        </Container>
      </section>

      {/* Newsletter */}
      <NewsletterSection />

      {/* ─── Lightbox ─── */}
      <AnimatePresence>
        {lightboxIdx !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
            onClick={closeLightbox}
          >
            {/* Close */}
            <button
              onClick={closeLightbox}
              className="absolute top-4 end-4 z-50 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>

            {/* Prev */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                lightboxPrev();
              }}
              className="absolute start-4 top-1/2 -translate-y-1/2 z-50 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <ChevronLeft className="w-6 h-6 text-white rtl:rotate-180" />
            </button>

            {/* Next */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                lightboxNext();
              }}
              className="absolute end-4 top-1/2 -translate-y-1/2 z-50 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <ChevronRight className="w-6 h-6 text-white rtl:rotate-180" />
            </button>

            {/* Counter */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 text-white/60 text-sm font-medium">
              {lightboxIdx + 1} / {lightboxType === "photo" ? PHOTOS.length : VIDEOS.length}
            </div>

            {/* Content */}
            <div
              className="relative max-w-5xl max-h-[85vh] w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              {lightboxType === "photo" ? (
                <motion.div
                  key={`photo-${lightboxIdx}`}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center justify-center"
                >
                  <Image
                    src={PHOTOS[lightboxIdx].src}
                    alt={`The Spark - Post ${lightboxIdx + 1}`}
                    width={1200}
                    height={1200}
                    className="max-h-[85vh] w-auto h-auto object-contain rounded-lg"
                    priority
                  />
                </motion.div>
              ) : (
                <motion.div
                  key={`video-${lightboxIdx}`}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center justify-center"
                >
                  <video
                    src={VIDEOS[lightboxIdx].src}
                    controls
                    autoPlay
                    playsInline
                    className="max-h-[85vh] max-w-full rounded-lg"
                  />
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
