"use client";

import { useRef, useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { Container } from "@/components/ui/Container";
import { cn } from "@/lib/utils";
import { timelineData } from "./aboutData";
import Image from "next/image";

const yearColors = [
  "bg-brand-blue shadow-brand-blue/20",
  "bg-emerald-500 shadow-emerald-500/20",
  "bg-amber-500 shadow-amber-500/20",
  "bg-pink-500 shadow-pink-500/20",
  "bg-violet-500 shadow-violet-500/20",
  "bg-cyan-500 shadow-cyan-500/20",
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

export function AboutTimeline() {
  const locale = useLocale();
  const isAr = locale === "ar";
  const sectionAnim = useInView(0.08);

  return (
    <section ref={sectionAnim.ref} className="py-20 md:py-28 bg-surface-secondary relative overflow-hidden">
      {/* ═══ ABSTRACT SHAPES ═══ */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-[3%] end-[8%] w-[220px] h-[220px] bg-brand-blue/[0.03] animate-[morph-blob_14s_ease-in-out_infinite]"
          style={{ borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%" }}
        />
        <div
          className="absolute bottom-[5%] start-[5%] w-[180px] h-[180px] bg-emerald-400/[0.03] animate-[morph-blob_11s_ease-in-out_infinite_3s]"
          style={{ borderRadius: "40% 60% 70% 30% / 50% 60% 30% 60%" }}
        />
        <div className="absolute top-[4%] end-[6%] w-16 h-16 rounded-full bg-brand-blue/[0.06] animate-[drift-horizontal_8s_ease-in-out_infinite]" />
        <div className="absolute top-[40%] start-[3%] w-12 h-12 rounded-full border-2 border-emerald-400/12 animate-[float-medium_7s_ease-in-out_infinite_0.6s]" />
        <div className="absolute bottom-[6%] end-[8%] text-amber-400/15 animate-[float-slow_5.5s_ease-in-out_infinite_1s]">
          <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor"><path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" /></svg>
        </div>
        <div className="absolute top-[20%] start-[18%] w-3 h-3 rounded-full bg-pink-400/12 animate-[float-medium_4s_ease-in-out_infinite_0.3s]" />
        <div className="absolute bottom-[30%] end-[20%] w-4 h-4 rounded-full bg-violet-400/10 animate-[float-slow_5s_ease-in-out_infinite_1.5s]" />
        <div className="absolute top-[65%] end-[4%] w-4 h-4 bg-brand-blue/[0.07] rotate-45 animate-[drift-horizontal_6s_ease-in-out_infinite_0.9s]" />
        <svg className="absolute top-[50%] start-[8%] w-24 h-24 text-pink-400/[0.05] animate-[float-slow_10s_ease-in-out_infinite_1s]" viewBox="0 0 96 96" fill="none">
          <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="1" strokeDasharray="4 6" />
        </svg>
      </div>

      <Container>
        {/* Header — reveal down */}
        <div
          className={cn(
            "text-center mb-14 transition-all duration-700 ease-out",
            sectionAnim.visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-8"
          )}
        >
          <span className="inline-flex items-center gap-3 text-brand-blue text-[11px] font-bold uppercase tracking-[0.3em] mb-4">
            <span className="w-6 h-[1.5px] bg-brand-blue" />
            {isAr ? "مسيرتنا" : "Our Journey"}
            <span className="w-6 h-[1.5px] bg-brand-blue" />
          </span>
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-text-primary tracking-tight">
            {isAr ? "خمس سنوات من الأثر" : "Five Years of Impact"}
          </h2>
        </div>

        {/* Vertical timeline */}
        <div className="relative">
          <div className="absolute start-6 md:start-1/2 top-0 bottom-0 w-[2px] bg-surface-tertiary md:-translate-x-[1px]" />

          <div className="space-y-12 md:space-y-16">
            {timelineData.map((item, i) => {
              const isLeft = i % 2 === 0;
              const color = yearColors[i % yearColors.length];
              return (
                <div
                  key={item.year}
                  className={cn(
                    "relative flex items-start transition-all duration-700 ease-out",
                    sectionAnim.visible
                      ? "opacity-100 translate-x-0"
                      : isLeft
                        ? "opacity-0 -translate-x-12"
                        : "opacity-0 translate-x-12"
                  )}
                  style={{ transitionDelay: `${200 + i * 130}ms` }}
                >
                  {/* Year badge */}
                  <div className="absolute start-6 md:start-1/2 -translate-x-1/2 z-10">
                    <div className={cn("w-12 h-12 rounded-full text-white flex items-center justify-center font-bold text-xs shadow-lg", color)}>
                      {item.year}
                    </div>
                  </div>

                  {/* Content card */}
                  <div
                    className={cn(
                      "ms-20 md:ms-0 md:w-[calc(50%-40px)]",
                      isLeft ? "md:me-auto md:pe-0" : "md:ms-auto md:ps-0"
                    )}
                  >
                    <div className="bg-white rounded-2xl overflow-hidden border border-surface-tertiary shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-500 group">
                      <div className="relative h-40 md:h-48 overflow-hidden">
                        <Image
                          src={item.imageUrl}
                          alt=""
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-700"
                          sizes="(max-width: 768px) 80vw, 40vw"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-accent-navy/30 to-transparent" />
                        <div className="absolute top-3 end-3 w-6 h-6 rounded-full border-2 border-white/30 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>

                      <div className="p-5 md:p-6">
                        <h3 className="font-serif text-xl text-text-primary mb-2 tracking-tight">
                          {isAr ? item.titleAr : item.titleEn}
                        </h3>
                        <p className="text-text-secondary text-sm leading-relaxed">
                          {isAr ? item.descriptionAr : item.descriptionEn}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Container>
    </section>
  );
}
