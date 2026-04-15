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
      className="relative bg-gradient-to-r from-brand-blue-deeper via-brand-blue-dark to-brand-blue py-12 md:py-16 overflow-hidden"
    >
      {/* Subtle background pattern */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 start-0 w-full h-full bg-[radial-gradient(circle_at_20%_50%,rgba(255,255,255,0.05),transparent_50%)]" />
        <div className="absolute top-0 end-0 w-full h-full bg-[radial-gradient(circle_at_80%_50%,rgba(255,255,255,0.03),transparent_50%)]" />
      </div>

      <div className="max-w-5xl mx-auto px-5 sm:px-8 lg:px-10 relative z-10">
        <div
          className={cn(
            "flex flex-col items-center text-center transition-all duration-700",
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          )}
        >
          <span className="inline-flex items-center gap-2 text-brand-gold text-sm font-semibold uppercase tracking-[0.2em] mb-4">
            <Target className="w-4 h-4" />
            {c.label}
          </span>

          <p className="font-serif text-xl md:text-2xl lg:text-3xl text-white leading-relaxed max-w-4xl">
            &ldquo;{c.text}&rdquo;
          </p>
        </div>
      </div>
    </section>
  );
}
