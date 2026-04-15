"use client";

import { useLocale } from "next-intl";
import { cn } from "@/lib/utils";
import { Target } from "lucide-react";
import { useInView } from "@/hooks/useInView";

const content = {
  en: {
    label: "Our 2030 Vision",
    text: "To be the leading catalyst for a resilient, green economy across MENA & Africa, powered by women innovators",
  },
  ar: {
    label: "رؤيتنا 2030",
    text: "أن نكون المحفز الرائد لاقتصاد أخضر ومرن عبر منطقة الشرق الأوسط وشمال أفريقيا، بقيادة النساء المبتكرات",
  },
};

export function VisionRibbon() {
  const locale = useLocale();
  const isAr = locale === "ar";
  const c = isAr ? content.ar : content.en;
  const { ref, visible } = useInView(0.3);

  return (
    <section
      ref={ref}
      className="relative bg-gradient-to-r from-brand-blue-deeper via-brand-blue-dark to-brand-blue py-16 md:py-24 overflow-hidden"
    >
      {/* Grain texture overlay */}
      <div className="absolute inset-0 grain-overlay pointer-events-none" />

      {/* Subtle radial glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 start-0 w-full h-full bg-[radial-gradient(circle_at_20%_50%,rgba(255,255,255,0.05),transparent_50%)]" />
        <div className="absolute top-0 end-0 w-full h-full bg-[radial-gradient(circle_at_80%_50%,rgba(255,255,255,0.03),transparent_50%)]" />
      </div>

      {/* Morphing blob shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-16 -start-16 w-[280px] h-[280px] bg-brand-blue/[0.06] animate-[morph-blob_10s_ease-in-out_infinite]"
          style={{ borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%" }}
        />
        <div
          className="absolute -bottom-12 -end-12 w-[220px] h-[220px] bg-emerald-400/[0.04] animate-[morph-blob_10s_ease-in-out_infinite_3s]"
          style={{ borderRadius: "40% 60% 70% 30% / 50% 60% 30% 60%" }}
        />
      </div>

      {/* Floating rings */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] start-[5%] w-[200px] h-[200px] rounded-full border border-white/[0.04] animate-[drift-horizontal_16s_ease-in-out_infinite]" />
        <div className="absolute bottom-[5%] end-[8%] w-[160px] h-[160px] rounded-full border border-white/[0.04] animate-[drift-horizontal_20s_ease-in-out_infinite_4s]" />
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white/15 animate-float-particle"
            style={{
              width: `${2 + (i % 2)}px`,
              height: `${2 + (i % 2)}px`,
              left: `${10 + (i * 16) % 80}%`,
              top: `${15 + (i * 13) % 70}%`,
              animationDelay: `${(i * 0.9) % 5}s`,
              animationDuration: `${4 + (i % 3) * 1.5}s`,
            }}
          />
        ))}
      </div>

      {/* Dotted arc SVG */}
      <svg
        className="absolute bottom-[10%] start-[6%] w-24 h-24 text-white/[0.04] animate-[float-slow_12s_ease-in-out_infinite]"
        viewBox="0 0 96 96"
        fill="none"
      >
        <circle
          cx="48"
          cy="48"
          r="40"
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="4 6"
        />
      </svg>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-5 sm:px-8 lg:px-10 relative z-10">
        <div
          className={cn(
            "flex flex-col items-center text-center transition-all duration-700",
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          )}
        >
          {/* Label with Target icon */}
          <span className="inline-flex items-center gap-2 text-brand-gold text-sm font-semibold uppercase tracking-[0.2em] mb-6">
            <Target className="w-4 h-4" />
            {c.label}
          </span>

          {/* Quote block with decorative marks and flanking lines */}
          <div className="relative max-w-4xl">
            {/* Decorative opening quote mark */}
            <span
              className={cn(
                "absolute -top-6 font-serif text-7xl md:text-8xl text-white/[0.08] leading-none select-none pointer-events-none",
                isAr ? "-end-2 md:-end-6" : "-start-2 md:-start-6"
              )}
            >
              &ldquo;
            </span>

            {/* Decorative closing quote mark */}
            <span
              className={cn(
                "absolute -bottom-10 font-serif text-7xl md:text-8xl text-white/[0.08] leading-none select-none pointer-events-none",
                isAr ? "-start-2 md:-start-6" : "-end-2 md:-end-6"
              )}
            >
              &rdquo;
            </span>

            {/* Flanking line accents */}
            <div className="flex items-center justify-center gap-4 mb-5">
              <span
                className={cn(
                  "w-8 h-[1.5px] bg-brand-gold/40 transition-all duration-700 delay-200",
                  visible ? "opacity-100 scale-x-100" : "opacity-0 scale-x-0"
                )}
              />
              <span className="w-1.5 h-1.5 rounded-full bg-brand-gold/30" />
              <span
                className={cn(
                  "w-8 h-[1.5px] bg-brand-gold/40 transition-all duration-700 delay-200",
                  visible ? "opacity-100 scale-x-100" : "opacity-0 scale-x-0"
                )}
              />
            </div>

            <p className="font-serif text-xl md:text-2xl lg:text-3xl text-white leading-relaxed">
              &ldquo;{c.text}&rdquo;
            </p>

            {/* Bottom flanking line accents */}
            <div className="flex items-center justify-center gap-4 mt-5">
              <span
                className={cn(
                  "w-8 h-[1.5px] bg-brand-gold/40 transition-all duration-700 delay-300",
                  visible ? "opacity-100 scale-x-100" : "opacity-0 scale-x-0"
                )}
              />
              <span className="w-1.5 h-1.5 rounded-full bg-brand-gold/30" />
              <span
                className={cn(
                  "w-8 h-[1.5px] bg-brand-gold/40 transition-all duration-700 delay-300",
                  visible ? "opacity-100 scale-x-100" : "opacity-0 scale-x-0"
                )}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
