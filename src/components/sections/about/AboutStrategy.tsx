"use client";

import React, { useRef, useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { Container } from "@/components/ui/Container";
import { cn } from "@/lib/utils";
import { TrendingUp, Sprout, Coins, HandHeart } from "lucide-react";
import { strategyCards } from "./aboutData";
import Image from "next/image";

const iconMap: Record<string, React.ElementType> = {
  "trending-up": TrendingUp,
  sprout: Sprout,
  coins: Coins,
  "hand-heart": HandHeart,
};

const cardColors = [
  { iconBg: "bg-brand-blue/10", iconText: "text-brand-blue", number: "bg-brand-blue/10 text-brand-blue" },
  { iconBg: "bg-emerald-50", iconText: "text-emerald-500", number: "bg-emerald-50 text-emerald-600" },
  { iconBg: "bg-amber-50", iconText: "text-amber-500", number: "bg-amber-50 text-amber-600" },
  { iconBg: "bg-pink-50", iconText: "text-pink-500", number: "bg-pink-50 text-pink-600" },
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

export function AboutStrategy() {
  const locale = useLocale();
  const isAr = locale === "ar";
  const sectionAnim = useInView(0.08);

  return (
    <section ref={sectionAnim.ref} className="py-20 md:py-28 bg-surface-secondary relative overflow-hidden">
      {/* ═══ ABSTRACT SHAPES ═══ */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-[3%] -end-10 w-[220px] h-[220px] bg-brand-blue/[0.03] animate-[morph-blob_14s_ease-in-out_infinite]"
          style={{ borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%" }}
        />
        <div
          className="absolute bottom-[5%] start-[5%] w-[180px] h-[180px] bg-amber-400/[0.03] animate-[morph-blob_11s_ease-in-out_infinite_3s]"
          style={{ borderRadius: "40% 60% 70% 30% / 50% 60% 30% 60%" }}
        />
        <div className="absolute top-[5%] end-[5%] w-16 h-16 rounded-full bg-brand-blue/[0.05] animate-[drift-horizontal_8s_ease-in-out_infinite]" />
        <div className="absolute bottom-[10%] start-[4%] w-12 h-12 rounded-full border-2 border-emerald-400/10 animate-[float-medium_6s_ease-in-out_infinite_0.6s]" />
        <div className="absolute top-[40%] end-[2%] text-amber-400/10 rotate-[20deg] animate-[float-slow_5.5s_ease-in-out_infinite_1s]">
          <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L22 20H2L12 2Z" /></svg>
        </div>
        <div className="absolute top-[12%] start-[12%] w-3 h-3 rounded-full bg-pink-400/12 animate-[float-medium_4s_ease-in-out_infinite_0.4s]" />
        <div className="absolute bottom-[25%] end-[20%] w-6 h-6 rounded-full border border-violet-400/10 animate-[drift-horizontal_6s_ease-in-out_infinite_1.3s]" />
        <div className="absolute top-[60%] start-[3%] w-4 h-4 bg-brand-blue/[0.06] rotate-45 animate-[float-slow_5s_ease-in-out_infinite_0.8s]" />
      </div>

      <Container>
        {/* Header — slide down */}
        <div
          className={cn(
            "text-center mb-14 transition-all duration-700 ease-out",
            sectionAnim.visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-8"
          )}
        >
          <span className="inline-flex items-center gap-3 text-brand-blue text-[11px] font-bold uppercase tracking-[0.3em] mb-4">
            <span className="w-6 h-[1.5px] bg-brand-blue" />
            {isAr ? "الإطار الاستراتيجي" : "Strategic Framework"}
            <span className="w-6 h-[1.5px] bg-brand-blue" />
          </span>
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-text-primary tracking-tight">
            {isAr ? "رؤيتنا 2025–2030" : "Our Vision 2025–2030"}
          </h2>
        </div>

        {/* Image row */}
        <div
          className={cn(
            "grid grid-cols-2 gap-3 mb-12 transition-all duration-700",
            sectionAnim.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          )}
          style={{ transitionDelay: "100ms" }}
        >
          {["/images/new/conference-room.jpg", "/images/new/greenhouse-visit.jpg"].map((src, i) => (
            <div key={i} className="relative aspect-[2.5/1] rounded-xl overflow-hidden group">
              <Image src={src} alt="" fill className="object-cover group-hover:scale-105 transition-transform duration-700" sizes="50vw" />
              <div className="absolute inset-0 bg-accent-navy/10 group-hover:bg-transparent transition-colors" />
            </div>
          ))}
        </div>

        {/* Strategy cards — alternate slide left/right */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {strategyCards.map((card, i) => {
            const Icon = iconMap[card.icon] ?? TrendingUp;
            const colors = cardColors[i % cardColors.length];
            const fromLeft = i % 2 === 0;

            return (
              <div
                key={card.id}
                className={cn(
                  "group relative bg-white rounded-2xl p-7 md:p-8 border border-surface-tertiary transition-all duration-700 ease-out hover:shadow-xl hover:-translate-y-1.5 overflow-hidden",
                  sectionAnim.visible
                    ? "opacity-100 translate-x-0"
                    : fromLeft
                      ? "opacity-0 -translate-x-12"
                      : "opacity-0 translate-x-12"
                )}
                style={{ transitionDelay: `${250 + i * 120}ms` }}
              >
                {/* Abstract ring */}
                <div className={cn("absolute -top-6 -end-6 w-20 h-20 rounded-full border-2 opacity-30 group-hover:scale-110 transition-transform", `border-current ${colors.iconText}`)} />

                {/* Number badge */}
                <div className={cn("absolute top-6 end-6 w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center", colors.number)}>
                  {String(i + 1).padStart(2, "0")}
                </div>

                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-all duration-500 group-hover:scale-110", colors.iconBg, colors.iconText)}>
                  <Icon className="w-6 h-6" />
                </div>

                <h3 className="font-serif text-xl text-text-primary mb-3 tracking-tight pe-10">
                  {isAr ? card.titleAr : card.titleEn}
                </h3>

                <p className="text-text-secondary text-sm leading-relaxed mb-5">
                  {isAr ? card.descriptionAr : card.descriptionEn}
                </p>

                <span className="inline-flex items-center bg-accent-sky text-brand-blue-deeper text-xs font-semibold px-3.5 py-1.5 rounded-full">
                  {card.targetMetric}
                </span>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
