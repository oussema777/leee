"use client";

import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import { motion } from "framer-motion";
import type { SliderItem } from "@/lib/data/sliders";

/**
 * Static collage hero, but admin-editable:
 *  - The 3 collage photos come from the first 3 active Sliders (Admin → Sliders),
 *    by `order`. Slider #1 = big top-left, #2 = bottom-right, #3 = small top-right.
 *  - The headline / subtitle / CTA come from Slider #1 (title supports a line break
 *    "\n" — the first line is dark, the rest is highlighted blue).
 *  - Anything missing falls back to the hardcoded defaults below, so the hero is
 *    never empty even with no sliders in the DB.
 *  - The eyebrow tag is fixed copy (bilingual).
 */

const FALLBACK = {
  en: {
    tag: "Leadership & Empowerment",
    title: "We turn mindset",
    titleHighlight: "into movement",
    subtitle: "empowering women & youth through green, tech‑oriented, and inclusive business development.",
    cta: "Explore Our Programs",
  },
  ar: {
    tag: "القيادة والتمكين",
    title: "نحوّل العقلية",
    titleHighlight: "إلى حركة",
    subtitle: "تمكين النساء والشباب من خلال التنمية الخضراء والتقنية والشاملة للأعمال.",
    cta: "اكتشف برامجنا",
  },
};

// Fallback collage images (used per-slot when fewer than 3 sliders exist).
const FALLBACK_IMAGES = [
  "/images/projects/seketak-acceleration-investment-readiness-2025/cover.jpg",
  "/images/projects/prospects-entrepreneurship-agriculture/cover.jpg",
  "/images/new/pitch-winner.jpg",
];

/* ── Staggered entrance helper ── */
const stagger = (delay: number) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.65, delay, ease: "easeOut" as const },
});

export function HeroSlider({ slides }: { slides?: SliderItem[] }) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const fb = isAr ? FALLBACK.ar : FALLBACK.en;

  const first = slides?.[0];

  // Title: split Slider #1's title on a newline → first line dark, rest blue.
  let titleMain = fb.title;
  let titleHighlight: string | undefined = fb.titleHighlight;
  if (first) {
    const lines = (isAr ? first.titleAr : first.titleEn).split("\n").filter(Boolean);
    titleMain = lines[0] ?? fb.title;
    titleHighlight = lines.slice(1).join(" ") || undefined;
  }

  const subtitle = (first && (isAr ? first.subtitleAr : first.subtitleEn)) || fb.subtitle;
  const ctaLabel = (first && (isAr ? first.ctaLabelAr : first.ctaLabelEn)) || fb.cta;
  const ctaUrl = first?.ctaUrl || "/programs";
  const tag = fb.tag;

  const imageAt = (i: number) => slides?.[i]?.imageUrl || FALLBACK_IMAGES[i];

  return (
    <section
      className={cn(
        "relative bg-gradient-to-br from-surface-primary via-brand-blue-light to-surface-secondary overflow-hidden",
        "min-h-0 md:min-h-[680px] lg:min-h-[720px] flex items-center"
      )}
    >
      {/* Subtle ambient glow — one only */}
      <div className="absolute -top-32 -start-32 w-[500px] h-[500px] bg-brand-blue/[0.04] rounded-full blur-3xl pointer-events-none" />

      {/* ── MAIN CONTENT ── */}
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10 relative z-10 w-full py-16 md:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">

          {/* ── Left: Text column ── */}
          <div className={cn("relative", isAr && "text-end")}>
            {/* Tag line */}
            <motion.span
              {...stagger(0)}
              className="relative inline-flex items-center gap-2 text-brand-blue text-sm font-semibold uppercase tracking-[0.15em] mb-6"
            >
              <span className="w-8 h-[2px] bg-brand-blue rounded-full" />
              {tag}
            </motion.span>

            {/* Title */}
            <motion.div {...stagger(0.12)}>
              <h1 className="font-serif text-[clamp(2.2rem,5vw,4.2rem)] text-text-primary leading-[1.05]">
                {titleMain}
                {titleHighlight && (
                  <span className="block text-brand-blue">{titleHighlight}</span>
                )}
              </h1>
            </motion.div>

            {/* Subtitle */}
            {subtitle && (
              <motion.p
                {...stagger(0.24)}
                className="relative text-text-secondary text-xl md:text-2xl leading-relaxed mt-6 mb-10 max-w-xl"
              >
                {subtitle}
              </motion.p>
            )}

            {/* CTA Button */}
            {ctaLabel && (
              <motion.div {...stagger(0.36)}>
                <Link
                  href={ctaUrl}
                  className="group relative inline-flex items-center gap-3 bg-brand-blue text-white font-bold text-sm uppercase tracking-[0.15em] px-8 py-4 rounded-full hover:bg-brand-blue-dark active:scale-95 transition-all duration-300 shadow-lg hover:shadow-xl hover:translate-y-[-2px]"
                >
                  {ctaLabel}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform rtl:rotate-180 rtl:group-hover:-translate-x-1" />
                </Link>
              </motion.div>
            )}
          </div>

          {/* ── Mobile: Single hero image ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4, ease: "easeOut" }}
            className="relative h-[240px] rounded-2xl overflow-hidden shadow-xl md:hidden"
          >
            <Image
              src={imageAt(0)}
              alt={titleMain}
              fill
              className="object-cover object-top"
              priority
              sizes="100vw"
            />
          </motion.div>

          {/* ── Desktop: Image collage ── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.25, ease: "easeOut" }}
            className="relative h-[400px] md:h-[500px] lg:h-[550px] hidden md:block"
          >
            {/* Main image (Slider #1) */}
            <div className="group absolute top-0 start-0 w-[55%] h-[58%] rounded-2xl overflow-hidden shadow-2xl z-10 transition-all duration-500 hover:translate-y-[-4px]">
              <Image
                src={imageAt(0)}
                alt={titleMain}
                fill
                className="object-cover object-top transition-transform duration-700 group-hover:scale-105"
                priority
              />
            </div>

            {/* Second image (Slider #2) */}
            <div className="group absolute bottom-0 end-0 w-[50%] h-[48%] rounded-2xl overflow-hidden shadow-xl border-4 border-white z-10 transition-all duration-500 hover:translate-y-[-4px]">
              <Image
                src={imageAt(1)}
                alt=""
                fill
                className="object-cover object-top transition-transform duration-700 group-hover:scale-105"
              />
            </div>

            {/* Third image (Slider #3) */}
            <div className="group absolute top-[15%] end-[5%] w-[35%] h-[35%] rounded-2xl overflow-hidden shadow-lg border-4 border-white z-10 transition-all duration-500 hover:translate-y-[-4px]">
              <Image
                src={imageAt(2)}
                alt=""
                fill
                className="object-cover object-top transition-transform duration-700 group-hover:scale-105"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
