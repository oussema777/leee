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
      className="relative py-14 md:py-20 overflow-hidden bg-gradient-to-b from-white via-surface-primary to-white"
    >
      {/* Soft accent blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-20 -start-20 w-[400px] h-[400px] bg-brand-blue/[0.04] rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -end-20 w-[350px] h-[350px] bg-brand-gold/[0.05] rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-5 sm:px-8 lg:px-10 relative z-10">
        <div
          className={cn(
            "flex flex-col items-center text-center transition-all duration-700",
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          )}
        >
          {/* Icon badge */}
          <div className="w-14 h-14 rounded-2xl bg-brand-blue/10 flex items-center justify-center mb-6">
            <Target className="w-6 h-6 text-brand-blue" />
          </div>

          {/* Label */}
          <span className="inline-flex items-center gap-2 text-brand-blue text-sm font-semibold uppercase tracking-[0.2em] mb-4">
            {c.label}
          </span>

          {/* Decorative lines */}
          <div className="flex items-center gap-3 mb-6">
            <span
              className={cn(
                "w-10 h-[2px] bg-brand-gold/50 rounded-full transition-all duration-700 delay-200",
                visible ? "opacity-100 scale-x-100" : "opacity-0 scale-x-0"
              )}
            />
            <span className="w-2 h-2 rounded-full bg-brand-gold/40" />
            <span
              className={cn(
                "w-10 h-[2px] bg-brand-gold/50 rounded-full transition-all duration-700 delay-200",
                visible ? "opacity-100 scale-x-100" : "opacity-0 scale-x-0"
              )}
            />
          </div>

          {/* Vision text */}
          <p className="font-serif text-xl md:text-2xl lg:text-[1.75rem] text-text-primary leading-relaxed max-w-3xl">
            &ldquo;{c.text}&rdquo;
          </p>

          {/* Bottom accent */}
          <div className="mt-8 w-16 h-1 rounded-full bg-gradient-to-r from-brand-blue via-brand-gold to-brand-blue opacity-40" />
        </div>
      </div>
    </section>
  );
}
