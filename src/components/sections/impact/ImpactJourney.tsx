"use client";

import { useRef, useState, useEffect } from "react";
import { useLocale } from "next-intl";
import { Container } from "@/components/ui/Container";
import { cn } from "@/lib/utils";
import { journeyMilestones } from "./impactData";

const yearColors = [
  { bg: "bg-brand-blue", ring: "border-brand-blue/20", text: "text-brand-blue", glow: "bg-brand-blue/10" },
  { bg: "bg-emerald-500", ring: "border-emerald-400/20", text: "text-emerald-600", glow: "bg-emerald-50" },
  { bg: "bg-amber-500", ring: "border-amber-400/20", text: "text-amber-600", glow: "bg-amber-50" },
  { bg: "bg-pink-500", ring: "border-pink-400/20", text: "text-pink-600", glow: "bg-pink-50" },
  { bg: "bg-violet-500", ring: "border-violet-400/20", text: "text-violet-600", glow: "bg-violet-50" },
  { bg: "bg-cyan-500", ring: "border-cyan-400/20", text: "text-cyan-600", glow: "bg-cyan-50" },
];

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

export function ImpactJourney() {
  const locale = useLocale();
  const isAr = locale === "ar";
  const sectionAnim = useInView(0.08);

  return (
    <section ref={sectionAnim.ref} className="py-20 md:py-28 bg-surface-secondary relative overflow-hidden">
      {/* ═══ ABSTRACT SHAPES ═══ */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-16 end-[10%] w-[280px] h-[280px] bg-brand-blue/[0.03] animate-[morph-blob_13s_ease-in-out_infinite]" style={{ borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%" }} />
        <div className="absolute bottom-[5%] -start-10 w-[220px] h-[220px] bg-emerald-400/[0.03] animate-[morph-blob_10s_ease-in-out_infinite_2s]" style={{ borderRadius: "40% 60% 70% 30% / 50% 60% 30% 60%" }} />
        <div className="absolute top-[8%] start-[5%] w-14 h-14 rounded-full border-2 border-brand-blue/[0.07] animate-[drift-horizontal_8s_ease-in-out_infinite]" />
        <div className="absolute bottom-[12%] end-[6%] w-5 h-5 rounded-full bg-amber-400/12 animate-[float-medium_5s_ease-in-out_infinite_0.6s]" />
        <div className="absolute top-[45%] start-[3%] w-4 h-4 bg-pink-400/10 rotate-45 animate-[float-slow_6s_ease-in-out_infinite_1s]" />
        <div className="absolute top-[20%] end-[4%] w-3 h-3 rounded-full bg-violet-400/12 animate-[float-medium_4s_ease-in-out_infinite_0.3s]" />
        <svg className="absolute bottom-[8%] start-[20%] w-24 h-24 text-brand-blue/[0.04] animate-[float-slow_10s_ease-in-out_infinite]" viewBox="0 0 96 96" fill="none">
          <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="1" strokeDasharray="4 6" />
        </svg>
      </div>

      <Container>
        {/* Header */}
        <div className={cn("text-center mb-16 transition-all duration-700", sectionAnim.visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-8")}>
          <span className="inline-flex items-center gap-3 text-brand-blue text-[11px] font-bold uppercase tracking-[0.3em] mb-4">
            <span className="w-6 h-[1.5px] bg-brand-blue" />
            {isAr ? "رحلتنا" : "Our Journey"}
            <span className="w-6 h-[1.5px] bg-brand-blue" />
          </span>
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-text-primary tracking-tight mb-3">
            {isAr ? "٦ سنوات من الأثر" : "6 Years of Impact"}
          </h2>
          <p className="text-text-secondary text-[15px] max-w-2xl mx-auto leading-relaxed">
            {isAr ? "محطات بارزة في رحلتنا" : "Key milestones in our journey"}
          </p>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Center line */}
          <div className={cn("hidden md:block absolute top-0 bottom-0 start-1/2 w-px bg-gradient-to-b from-transparent via-brand-blue/20 to-transparent transition-all duration-1000", sectionAnim.visible ? "opacity-100 scale-y-100" : "opacity-0 scale-y-0")} style={{ transformOrigin: "top" }} />

          <div className="space-y-8 md:space-y-0">
            {journeyMilestones.map((milestone, i) => {
              const colors = yearColors[i % yearColors.length];
              const isLeft = i % 2 === 0;

              return (
                <div key={milestone.year} className="relative md:flex md:items-center md:min-h-[140px]">
                  {/* Desktop: alternating sides */}
                  <div className={cn(
                    "md:w-1/2 transition-all duration-700 ease-out",
                    isLeft ? "md:pe-12 md:text-end" : "md:ps-12 md:ms-auto",
                    sectionAnim.visible
                      ? "opacity-100 translate-x-0"
                      : isLeft ? "opacity-0 -translate-x-12" : "opacity-0 translate-x-12"
                  )} style={{ transitionDelay: `${300 + i * 150}ms` }}>
                    <div className={cn(
                      "group relative bg-white rounded-2xl p-6 border border-surface-tertiary transition-all duration-500 hover:shadow-xl hover:-translate-y-1 overflow-hidden",
                    )}>
                      {/* Decorative ring */}
                      <div className={cn("absolute -top-4 w-14 h-14 rounded-full border-2 transition-transform duration-500 group-hover:scale-110", colors.ring, isLeft ? "-end-4" : "-start-4")} />

                      <div className="flex items-center gap-4" style={{ flexDirection: isLeft ? "row-reverse" : "row" }}>
                        {/* Year badge */}
                        <div className={cn("w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0 transition-transform duration-500 group-hover:scale-110", colors.bg)}>
                          {milestone.year}
                        </div>
                        <div className={cn(isLeft ? "text-end" : "text-start")}>
                          <p className={cn("font-serif text-2xl md:text-3xl text-text-primary mb-0.5 tabular-nums", colors.text)}>
                            {milestone.metricValue}
                          </p>
                          <p className="text-text-muted text-xs font-medium uppercase tracking-[0.12em]">
                            {isAr ? milestone.labelAr : milestone.labelEn}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Center dot (desktop) */}
                  <div className={cn(
                    "hidden md:flex absolute start-1/2 -translate-x-1/2 w-5 h-5 rounded-full border-[3px] border-white transition-all duration-500 z-10",
                    colors.bg,
                    sectionAnim.visible ? "opacity-100 scale-100" : "opacity-0 scale-0"
                  )} style={{ transitionDelay: `${350 + i * 150}ms` }} />
                </div>
              );
            })}
          </div>
        </div>
      </Container>
    </section>
  );
}
