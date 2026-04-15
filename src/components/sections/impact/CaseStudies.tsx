"use client";

import { useLocale } from "next-intl";
import { useRef, useState, useEffect } from "react";
import { Container } from "@/components/ui/Container";
import { cn } from "@/lib/utils";
import { caseStudies } from "./impactData";
import { CheckCircle2 } from "lucide-react";
import Image from "next/image";

function useInView(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

const cardColors = [
  { accent: "border-t-brand-blue", statBg: "bg-brand-blue/10", statText: "text-brand-blue" },
  { accent: "border-t-emerald-500", statBg: "bg-emerald-50", statText: "text-emerald-600" },
];

export function CaseStudies() {
  const locale = useLocale();
  const isAr = locale === "ar";
  const sectionAnim = useInView(0.08);

  return (
    <section ref={sectionAnim.ref} className="py-20 md:py-28 bg-white relative overflow-hidden">
      {/* Decorative */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[5%] end-[3%] w-20 h-20 rounded-full bg-amber-400/[0.05] animate-[float-slow_7s_ease-in-out_infinite]" />
        <div className="absolute bottom-[10%] start-[5%] w-12 h-12 rounded-full border-2 border-emerald-400/10 animate-[float-medium_6s_ease-in-out_infinite_0.5s]" />
      </div>

      <Container>
        {/* Header */}
        <div className={cn("text-center mb-16 transition-all duration-700", sectionAnim.visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-8")}>
          <span className="inline-flex items-center gap-3 text-amber-600 text-[11px] font-bold uppercase tracking-[0.3em] mb-4">
            <span className="w-6 h-[1.5px] bg-amber-500" />
            {isAr ? "قصص من الميدان" : "Stories from the Field"}
            <span className="w-6 h-[1.5px] bg-amber-500" />
          </span>
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-text-primary tracking-tight mb-4">
            {isAr ? "دراسات حالة حقيقية" : "Real Case Studies"}
          </h2>
          <p className="text-text-secondary max-w-2xl mx-auto leading-relaxed">
            {isAr
              ? "أثر ملموس في حياة المجتمعات — من خلال مشاريع حقيقية غيّرت حياة الآلاف."
              : "Tangible impact in communities' lives — through real projects that changed thousands of lives."}
          </p>
        </div>

        {/* Case study cards */}
        <div className="space-y-16">
          {caseStudies.map((study, idx) => {
            const colors = cardColors[idx % cardColors.length];
            const isReversed = idx % 2 !== 0;

            return (
              <div
                key={study.id}
                className={cn(
                  "grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center transition-all duration-700",
                  sectionAnim.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
                )}
                style={{ transitionDelay: `${200 + idx * 200}ms` }}
              >
                {/* Image */}
                <div className={cn("relative", isReversed && "lg:order-2")}>
                  <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-lg">
                    <Image
                      src={study.imageUrl}
                      alt={isAr ? study.titleAr : study.titleEn}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                  </div>

                  {/* Floating stat cards */}
                  <div className="absolute -bottom-6 start-4 end-4 flex gap-3 justify-center">
                    {study.stats.map((stat, si) => (
                      <div
                        key={si}
                        className={cn(
                          "bg-white rounded-xl px-4 py-3 shadow-lg border border-surface-tertiary/50 text-center min-w-[90px]",
                        )}
                      >
                        <p className={cn("font-serif text-lg font-bold", colors.statText)}>{stat.value}</p>
                        <p className="text-text-muted text-[10px] uppercase tracking-wider font-medium">
                          {isAr ? stat.labelAr : stat.labelEn}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Content */}
                <div className={cn(isReversed && "lg:order-1", "pt-8 lg:pt-0")}>
                  <span className={cn("text-xs font-bold uppercase tracking-wider mb-2 block", colors.statText)}>
                    {isAr ? study.subtitleAr : study.subtitleEn}
                  </span>
                  <h3 className="font-serif text-2xl md:text-3xl text-text-primary mb-4">
                    {isAr ? study.titleAr : study.titleEn}
                  </h3>
                  <p className="text-text-secondary leading-relaxed mb-6">
                    {isAr ? study.descriptionAr : study.descriptionEn}
                  </p>

                  {/* Outcomes */}
                  <div className="space-y-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-text-muted mb-2">
                      {isAr ? "النتائج الرئيسية" : "Key Outcomes"}
                    </p>
                    {study.outcomes.map((outcome, oi) => (
                      <div key={oi} className="flex items-start gap-3">
                        <CheckCircle2 className={cn("w-5 h-5 shrink-0 mt-0.5", colors.statText)} />
                        <p className="text-sm text-text-secondary leading-relaxed">
                          {isAr ? outcome.ar : outcome.en}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
