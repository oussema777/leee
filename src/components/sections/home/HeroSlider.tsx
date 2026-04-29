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
        "min-h-[600px] md:min-h-[680px] lg:min-h-[720px] flex items-center"
      )}
    >
      {/* ═══════════════════════════════════════════════════════
          ABSTRACT BACKGROUND LAYER
          ═══════════════════════════════════════════════════════ */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* ── Giant rings ── */}
        <div className="absolute -top-24 -start-24 w-[420px] h-[420px] rounded-full border border-white/[0.04] animate-[drift-horizontal_18s_ease-in-out_infinite]" />
        <div className="absolute -bottom-20 -end-20 w-[360px] h-[360px] rounded-full border border-white/[0.03] animate-[drift-horizontal_22s_ease-in-out_infinite_4s]" />
        <div className="absolute top-[40%] start-[55%] w-[260px] h-[260px] rounded-full border border-brand-blue/[0.05] animate-[drift-horizontal_16s_ease-in-out_infinite_2s]" />

        {/* ── Morphing blobs ── */}
        <div
          className="absolute top-[4%] end-[10%] w-[220px] h-[220px] bg-brand-blue/[0.04] animate-[morph-blob_13s_ease-in-out_infinite]"
          style={{ borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%" }}
        />
        <div
          className="absolute bottom-[6%] start-[3%] w-[180px] h-[180px] bg-emerald-400/[0.03] animate-[morph-blob_10s_ease-in-out_infinite_3s]"
          style={{ borderRadius: "40% 60% 70% 30% / 50% 60% 30% 60%" }}
        />
        <div
          className="absolute top-[55%] end-[42%] w-[140px] h-[140px] bg-brand-gold/[0.03] animate-[morph-blob_11s_ease-in-out_infinite_1.5s]"
          style={{ borderRadius: "50% 30% 60% 40% / 40% 50% 30% 60%" }}
        />

        {/* ── Floating colored shapes ── */}
        <div className="absolute top-[8%] end-[15%] w-14 h-14 rounded-full border-2 border-white/[0.06] animate-[float-slow_8s_ease-in-out_infinite]" />
        <div className="absolute top-[22%] start-[7%] w-5 h-5 rounded-full bg-emerald-400/20 animate-[float-medium_6s_ease-in-out_infinite_0.5s]" />
        <div className="absolute bottom-[15%] end-[8%] w-4 h-4 rounded-full bg-pink-400/20 animate-[drift-horizontal_7s_ease-in-out_infinite_0.8s]" />
        <div className="absolute bottom-[30%] start-[38%] w-3 h-3 rounded-full bg-cyan-400/15 animate-[float-slow_6.5s_ease-in-out_infinite_1.5s]" />
        <div className="absolute bottom-[10%] start-[18%] w-3 h-3 bg-violet-400/15 rotate-45 animate-[float-slow_5s_ease-in-out_infinite_1.2s]" />

        {/* ── Star shape ── */}
        <div className="absolute top-[18%] end-[28%] text-amber-400/20 animate-[float-slow_5s_ease-in-out_infinite_1s]">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
          </svg>
        </div>
        <div className="absolute bottom-[22%] end-[52%] text-brand-blue/15 animate-[float-medium_7s_ease-in-out_infinite_2s]">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
          </svg>
        </div>

        {/* ── Dotted arc SVGs ── */}
        <svg
          className="absolute top-[12%] end-[3%] w-28 h-28 text-brand-blue/[0.06] animate-[float-slow_12s_ease-in-out_infinite]"
          viewBox="0 0 112 112"
          fill="none"
        >
          <circle cx="56" cy="56" r="48" stroke="currentColor" strokeWidth="1" strokeDasharray="4 6" />
        </svg>
        <svg
          className="absolute bottom-[8%] start-[42%] w-20 h-20 text-white/[0.04] animate-[float-slow_14s_ease-in-out_infinite_3s]"
          viewBox="0 0 80 80"
          fill="none"
        >
          <circle cx="40" cy="40" r="34" stroke="currentColor" strokeWidth="1" strokeDasharray="3 5" />
        </svg>

        {/* ── Soft glows ── */}
        <div className="absolute -top-20 -start-20 w-[500px] h-[500px] bg-brand-blue/[0.04] rounded-full blur-3xl" />
        <div className="absolute bottom-0 end-0 w-[600px] h-[600px] bg-brand-gold/[0.03] rounded-full blur-3xl" />

        {/* ── Floating particles ── */}
        {[...Array(10)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-brand-blue/20 animate-float-particle"
            style={{
              width: `${2 + (i % 3)}px`,
              height: `${2 + (i % 3)}px`,
              left: `${6 + (i * 9.5) % 88}%`,
              top: `${8 + (i * 8.3) % 84}%`,
              animationDelay: `${(i * 0.65) % 6}s`,
              animationDuration: `${5 + (i % 4) * 1.5}s`,
            }}
          />
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════
          MAIN CONTENT
          ═══════════════════════════════════════════════════════ */}
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10 relative z-10 w-full py-16 md:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">

          {/* ── Left: Text column ── */}
          <div className={cn("relative", isAr && "text-right")}>
            {/* Dot-grid pattern background */}
            <div
              className="absolute -inset-8 pointer-events-none opacity-[0.035]"
              style={{
                backgroundImage:
                  "radial-gradient(circle, currentColor 1px, transparent 1px)",
                backgroundSize: "24px 24px",
              }}
            />

            {/* Tag line */}
            <motion.span
              {...stagger(0)}
              className="relative inline-flex items-center gap-2 text-brand-blue text-sm font-semibold uppercase tracking-[0.15em] mb-6"
            >
              <span className="w-8 h-[2px] bg-brand-blue rounded-full" />
              {content.tag}
            </motion.span>

            {/* Title line 1 */}
            <motion.div {...stagger(0.12)}>
              <h1 className="font-serif text-[clamp(2.2rem,5vw,4.2rem)] text-text-primary leading-[1.05] mb-0">
                {content.title}
              </h1>
            </motion.div>

            {/* Title highlight line 2 */}
            <motion.div {...stagger(0.24)}>
              <h1 className="font-serif text-[clamp(2.2rem,5vw,4.2rem)] text-brand-blue leading-[1.05] mb-6">
                {content.titleHighlight}
              </h1>
            </motion.div>

            {/* Subtitle */}
            <motion.p
              {...stagger(0.36)}
              className="relative text-text-secondary text-xl md:text-2xl leading-relaxed mb-10 max-w-xl"
            >
              {content.subtitle}
            </motion.p>

            {/* CTA Button */}
            <motion.div {...stagger(0.48)}>
              <Link
                href="/programs"
                className="group relative inline-flex items-center gap-3 bg-brand-blue text-white font-bold text-sm uppercase tracking-[0.15em] px-8 py-4 rounded-full hover:bg-brand-blue-dark transition-all duration-300 shadow-lg hover:shadow-xl hover:translate-y-[-2px]"
              >
                {content.cta}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform rtl:rotate-180 rtl:group-hover:-translate-x-1" />
              </Link>
            </motion.div>
          </div>

          {/* ── Right: Image collage ── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.25, ease: "easeOut" }}
            className="relative h-[400px] md:h-[500px] lg:h-[550px] hidden md:block"
          >
            {/* Grain texture overlay on image side */}
            <div className="absolute inset-0 grain-overlay rounded-3xl pointer-events-none z-20 opacity-40" />

            {/* Decorative ring behind top-left image */}
            <div className="absolute -top-6 -start-6 w-[200px] h-[200px] rounded-full border border-brand-blue/[0.08] transition-transform duration-700 hover:scale-110 z-0" />
            {/* Decorative ring behind bottom-right image */}
            <div className="absolute -bottom-5 -end-5 w-[160px] h-[160px] rounded-full border border-brand-gold/[0.08] transition-transform duration-700 hover:scale-110 z-0" />

            {/* Main image — Co-Founder speaking at GITS Summit */}
            <div className="group absolute top-0 start-0 w-[55%] h-[58%] rounded-2xl overflow-hidden shadow-2xl z-10 transition-all duration-500 hover:shadow-brand-blue/20 hover:translate-y-[-4px]">
              <Image
                src="/images/projects/gits-1.jpg"
                alt="Leadership at GITS Summit"
                fill
                className="object-cover object-top transition-transform duration-700 group-hover:scale-105"
                priority
              />
              {/* Corner accent top-left */}
              <div className="absolute top-0 start-0 w-8 h-8 border-t-2 border-s-2 border-white/30 rounded-tl-2xl pointer-events-none" />
              {/* Corner accent bottom-right */}
              <div className="absolute bottom-0 end-0 w-8 h-8 border-b-2 border-e-2 border-white/30 rounded-br-2xl pointer-events-none" />
            </div>

            {/* Second image — Woman entrepreneur pitching on stage */}
            <div className="group absolute bottom-0 end-0 w-[50%] h-[48%] rounded-2xl overflow-hidden shadow-xl border-4 border-white z-10 transition-all duration-500 hover:shadow-brand-gold/20 hover:translate-y-[-4px]">
              <Image
                src="/images/projects/prospects-1.jpg"
                alt="Entrepreneur pitching on stage"
                fill
                className="object-cover object-top transition-transform duration-700 group-hover:scale-105"
              />
              {/* Corner accent top-left */}
              <div className="absolute top-0 start-0 w-8 h-8 border-t-2 border-s-2 border-white/30 rounded-tl-2xl pointer-events-none" />
              {/* Corner accent bottom-right */}
              <div className="absolute bottom-0 end-0 w-8 h-8 border-b-2 border-e-2 border-white/30 rounded-br-2xl pointer-events-none" />
            </div>

            {/* Third image — Pitch competition winner */}
            <div className="group absolute top-[15%] end-[5%] w-[35%] h-[35%] rounded-2xl overflow-hidden shadow-lg border-4 border-white z-10 transition-all duration-500 hover:shadow-emerald-400/15 hover:translate-y-[-4px]">
              <Image
                src="/images/new/pitch-winner.jpg"
                alt="Pitch Competition Winner"
                fill
                className="object-cover object-top transition-transform duration-700 group-hover:scale-105"
              />
              {/* Corner accent top-right */}
              <div className="absolute top-0 end-0 w-8 h-8 border-t-2 border-e-2 border-white/30 rounded-tr-2xl pointer-events-none" />
            </div>

            {/* ── Glass morphism stat badge ── */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.8, ease: "easeOut" }}
              className="absolute bottom-[38%] -start-4 z-30 bg-white/[0.12] backdrop-blur-xl border border-white/[0.15] rounded-2xl px-5 py-4 shadow-2xl animate-[float-slow_8s_ease-in-out_infinite]"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-blue/25 flex items-center justify-center">
                  <svg className="w-5 h-5 text-brand-blue" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5a17.92 17.92 0 01-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
                  </svg>
                </div>
                <div>
                  <div className="text-text-primary font-serif text-xl font-bold leading-none">10+</div>
                  <div className="text-text-secondary text-[10px] font-medium uppercase tracking-[0.12em] mt-0.5">
                    {isAr ? "دول" : "Countries"}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* ── Glass morphism stat badge 2 ── */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, delay: 1.0, ease: "easeOut" }}
              className="absolute top-[5%] end-[38%] z-30 bg-white/[0.12] backdrop-blur-xl border border-white/[0.15] rounded-2xl px-5 py-4 shadow-2xl animate-[float-slow_9s_ease-in-out_infinite_1s]"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-400/25 flex items-center justify-center">
                  <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                  </svg>
                </div>
                <div>
                  <div className="text-text-primary font-serif text-xl font-bold leading-none">38K+</div>
                  <div className="text-text-secondary text-[10px] font-medium uppercase tracking-[0.12em] mt-0.5">
                    {isAr ? "مستفيد" : "Lives Touched"}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Floating decorative blurs on image side */}
            <div className="absolute -top-4 end-[40%] w-16 h-16 bg-brand-gold/20 rounded-full blur-xl z-0" />
            <div className="absolute bottom-[20%] -start-4 w-20 h-20 bg-brand-blue/10 rounded-full blur-xl z-0" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
