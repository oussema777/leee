"use client";

import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import { motion } from "framer-motion";

const heroContent = {
  en: {
    tag: "Leadership & Empowerment",
    title: "We turn mindset",
    titleHighlight: "into movement",
    subtitle: "empowering women & youth through green, tech\u2011oriented, and inclusive business development.",
    cta: "Explore Our Programs",
  },
  ar: {
    tag: "\u0627\u0644\u0642\u064A\u0627\u062F\u0629 \u0648\u0627\u0644\u062A\u0645\u0643\u064A\u0646",
    title: "\u0646\u062D\u0648\u0651\u0644 \u0627\u0644\u0639\u0642\u0644\u064A\u0629",
    titleHighlight: "\u0625\u0644\u0649 \u062D\u0631\u0643\u0629",
    subtitle: "\u062A\u0645\u0643\u064A\u0646 \u0627\u0644\u0646\u0633\u0627\u0621 \u0648\u0627\u0644\u0634\u0628\u0627\u0628 \u0645\u0646 \u062E\u0644\u0627\u0644 \u0627\u0644\u062A\u0646\u0645\u064A\u0629 \u0627\u0644\u062E\u0636\u0631\u0627\u0621 \u0648\u0627\u0644\u062A\u0642\u0646\u064A\u0629 \u0648\u0627\u0644\u0634\u0627\u0645\u0644\u0629 \u0644\u0644\u0623\u0639\u0645\u0627\u0644.",
    cta: "\u0627\u0643\u062A\u0634\u0641 \u0628\u0631\u0627\u0645\u062C\u0646\u0627",
  },
};

/* ── Staggered entrance helper ── */
const stagger = (delay: number) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.65, delay, ease: "easeOut" as const },
});

export function HeroSlider() {
  const locale = useLocale();
  const isAr = locale === "ar";
  const content = isAr ? heroContent.ar : heroContent.en;

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
              {content.tag}
            </motion.span>

            {/* Title */}
            <motion.div {...stagger(0.12)}>
              <h1 className="font-serif text-[clamp(2.2rem,5vw,4.2rem)] text-text-primary leading-[1.05]">
                {content.title}
                <span className="block text-brand-blue">{content.titleHighlight}</span>
              </h1>
            </motion.div>

            {/* Subtitle */}
            <motion.p
              {...stagger(0.24)}
              className="relative text-text-secondary text-xl md:text-2xl leading-relaxed mt-6 mb-10 max-w-xl"
            >
              {content.subtitle}
            </motion.p>

            {/* CTA Button */}
            <motion.div {...stagger(0.36)}>
              <Link
                href="/programs"
                className="group relative inline-flex items-center gap-3 bg-brand-blue text-white font-bold text-sm uppercase tracking-[0.15em] px-8 py-4 rounded-full hover:bg-brand-blue-dark active:scale-95 transition-all duration-300 shadow-lg hover:shadow-xl hover:translate-y-[-2px]"
              >
                {content.cta}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform rtl:rotate-180 rtl:group-hover:-translate-x-1" />
              </Link>
            </motion.div>
          </div>

          {/* ── Mobile: Single hero image ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4, ease: "easeOut" }}
            className="relative h-[240px] rounded-2xl overflow-hidden shadow-xl md:hidden"
          >
            <Image
              src="/images/projects/seketak-acceleration-investment-readiness-2025/cover.jpg"
              alt="Leadership at GITS Summit"
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
            {/* Main image */}
            <div className="group absolute top-0 start-0 w-[55%] h-[58%] rounded-2xl overflow-hidden shadow-2xl z-10 transition-all duration-500 hover:translate-y-[-4px]">
              <Image
                src="/images/projects/seketak-acceleration-investment-readiness-2025/cover.jpg"
                alt="Leadership at GITS Summit"
                fill
                className="object-cover object-top transition-transform duration-700 group-hover:scale-105"
                priority
              />
            </div>

            {/* Second image */}
            <div className="group absolute bottom-0 end-0 w-[50%] h-[48%] rounded-2xl overflow-hidden shadow-xl border-4 border-white z-10 transition-all duration-500 hover:translate-y-[-4px]">
              <Image
                src="/images/projects/prospects-entrepreneurship-agriculture/cover.jpg"
                alt="Entrepreneur pitching on stage"
                fill
                className="object-cover object-top transition-transform duration-700 group-hover:scale-105"
              />
            </div>

            {/* Third image */}
            <div className="group absolute top-[15%] end-[5%] w-[35%] h-[35%] rounded-2xl overflow-hidden shadow-lg border-4 border-white z-10 transition-all duration-500 hover:translate-y-[-4px]">
              <Image
                src="/images/new/pitch-winner.jpg"
                alt="Pitch Competition Winner"
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
