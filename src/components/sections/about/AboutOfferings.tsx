"use client";

import React, { useRef, useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { Container } from "@/components/ui/Container";
import { cn } from "@/lib/utils";
import { Rocket, GraduationCap, Leaf, Globe, Coins, Users } from "lucide-react";
import { offerings } from "./aboutData";
import Image from "next/image";

const iconMap: Record<string, React.ElementType> = {
  rocket: Rocket,
  "graduation-cap": GraduationCap,
  leaf: Leaf,
  globe: Globe,
  coins: Coins,
  users: Users,
};

const cardColors = [
  { iconBg: "bg-brand-blue/10", iconText: "text-brand-blue", ring: "border-brand-blue/15" },
  { iconBg: "bg-emerald-50", iconText: "text-emerald-500", ring: "border-emerald-400/15" },
  { iconBg: "bg-amber-50", iconText: "text-amber-500", ring: "border-amber-400/15" },
  { iconBg: "bg-pink-50", iconText: "text-pink-500", ring: "border-pink-400/15" },
  { iconBg: "bg-violet-50", iconText: "text-violet-500", ring: "border-violet-400/15" },
  { iconBg: "bg-cyan-50", iconText: "text-cyan-500", ring: "border-cyan-400/15" },
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

export function AboutOfferings() {
  const locale = useLocale();
  const isAr = locale === "ar";
  const sectionAnim = useInView(0.08);

  return (
    <section ref={sectionAnim.ref} className="py-20 md:py-28 bg-white relative overflow-hidden">
      {/* ═══ ABSTRACT SHAPES ═══ */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-16 end-[10%] w-[240px] h-[240px] bg-emerald-400/[0.03] animate-[morph-blob_13s_ease-in-out_infinite]"
          style={{ borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%" }}
        />
        <div
          className="absolute bottom-[5%] -start-10 w-[200px] h-[200px] bg-pink-400/[0.03] animate-[morph-blob_11s_ease-in-out_infinite_2s]"
          style={{ borderRadius: "40% 60% 70% 30% / 50% 60% 30% 60%" }}
        />
        <div className="absolute top-[5%] end-[3%] w-20 h-20 rounded-full bg-emerald-400/[0.06] animate-[drift-horizontal_8s_ease-in-out_infinite]" />
        <div className="absolute top-[50%] start-[2%] w-14 h-14 rounded-full border-2 border-brand-blue/10 animate-[float-medium_6s_ease-in-out_infinite_0.4s]" />
        <div className="absolute top-[12%] start-[15%] w-4 h-4 rounded-full bg-amber-400/15 animate-[float-slow_5s_ease-in-out_infinite_1s]" />
        <div className="absolute bottom-[8%] end-[10%] w-5 h-5 bg-pink-400/10 rotate-45 rounded-sm animate-[float-medium_5.5s_ease-in-out_infinite_0.7s]" />
        <div className="absolute top-[35%] end-[25%] w-3 h-3 rounded-full bg-violet-400/12 animate-[float-slow_4.5s_ease-in-out_infinite_1.2s]" />
        <div className="absolute bottom-[15%] start-[8%] text-brand-blue/[0.06] animate-[float-medium_7s_ease-in-out_infinite_0.2s]">
          <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L22 20H2L12 2Z" /></svg>
        </div>
        <div className="absolute top-[70%] end-[5%] text-amber-400/12 animate-[float-slow_6s_ease-in-out_infinite_0.5s]">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" /></svg>
        </div>
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
            {isAr ? "ما نقدمه" : "What We Offer"}
            <span className="w-6 h-[1.5px] bg-brand-blue" />
          </span>
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-text-primary tracking-tight">
            {isAr ? "خدماتنا ومساراتنا" : "Our Services & Pathways"}
          </h2>
        </div>

        {/* Image banner */}
        <div
          className={cn(
            "grid grid-cols-4 gap-2 mb-12 transition-all duration-700 ease-out",
            sectionAnim.visible ? "opacity-100 scale-100" : "opacity-0 scale-95"
          )}
          style={{ transitionDelay: "150ms" }}
        >
          {["/images/new/classroom.jpg", "/images/new/lee-vest.jpg", "/images/new/photo-booth.jpg", "/images/new/pitch-winner.jpg"].map((src, i) => (
            <div key={i} className="relative aspect-[3/2] rounded-xl overflow-hidden group">
              <Image src={src} alt="" fill className="object-cover group-hover:scale-110 transition-transform duration-700" sizes="25vw" />
              <div className="absolute inset-0 bg-accent-navy/10 group-hover:bg-accent-navy/0 transition-colors duration-500" />
            </div>
          ))}
        </div>

        {/* Cards — alternate slide left / right */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-5 md:gap-6">
          {offerings.map((item, i) => {
            const Icon = iconMap[item.icon] ?? Rocket;
            const colors = cardColors[i % cardColors.length];
            const fromLeft = i % 2 === 0;

            return (
              <div
                key={item.id}
                className={cn(
                  "group bg-surface-secondary rounded-2xl p-6 md:p-8 border border-surface-tertiary text-center transition-all duration-700 ease-out hover:bg-white hover:shadow-xl hover:border-brand-blue/15 hover:-translate-y-1.5 relative overflow-hidden",
                  sectionAnim.visible
                    ? "opacity-100 translate-x-0 translate-y-0"
                    : fromLeft
                      ? "opacity-0 -translate-x-10 translate-y-4"
                      : "opacity-0 translate-x-10 translate-y-4"
                )}
                style={{ transitionDelay: `${300 + i * 100}ms` }}
              >
                {/* Abstract ring per card */}
                <div className={cn("absolute -top-6 -end-6 w-20 h-20 rounded-full border-2 transition-transform duration-500 group-hover:scale-110", colors.ring)} />
                <div className={cn("absolute -bottom-4 -start-4 w-14 h-14 rounded-full border opacity-50 transition-transform duration-500 group-hover:scale-110", colors.ring)} />

                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5 transition-all duration-500 group-hover:scale-110", colors.iconBg, colors.iconText)}>
                  <Icon className="w-7 h-7" />
                </div>
                <h3 className="font-semibold text-text-primary text-[15px] mb-2">
                  {isAr ? item.titleAr : item.titleEn}
                </h3>
                <p className="text-text-muted text-xs leading-relaxed">
                  {isAr ? item.descriptionAr : item.descriptionEn}
                </p>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
