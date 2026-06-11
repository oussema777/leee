"use client";

import React, { useRef, useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { Container } from "@/components/ui/Container";
import { cn } from "@/lib/utils";
import { Users, Shield, Target, Heart, Scale, Leaf, Network } from "lucide-react";
import type { CoreValueItem } from "@/lib/data/about";
import Image from "next/image";

const iconMap: Record<string, React.ElementType> = {
  users: Users,
  shield: Shield,
  target: Target,
  heart: Heart,
  scale: Scale,
  leaf: Leaf,
  network: Network,
};

const valueColors = [
  { iconBg: "bg-brand-blue/10", iconText: "text-brand-blue" },
  { iconBg: "bg-emerald-50", iconText: "text-emerald-500" },
  { iconBg: "bg-amber-50", iconText: "text-amber-500" },
  { iconBg: "bg-pink-50", iconText: "text-pink-500" },
  { iconBg: "bg-violet-50", iconText: "text-violet-500" },
  { iconBg: "bg-cyan-50", iconText: "text-cyan-500" },
  { iconBg: "bg-rose-50", iconText: "text-rose-500" },
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

export function AboutValues({ values }: { values: CoreValueItem[] }) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const sectionAnim = useInView(0.08);

  if (values.length === 0) return null;

  return (
    <section ref={sectionAnim.ref} className="py-20 md:py-28 bg-surface-primary relative overflow-hidden">
      {/* ═══ ABSTRACT SHAPES ═══ */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-10 end-[8%] w-[240px] h-[240px] bg-violet-400/[0.03] animate-[morph-blob_12s_ease-in-out_infinite]"
          style={{ borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%" }}
        />
        <div
          className="absolute bottom-[3%] -start-10 w-[200px] h-[200px] bg-emerald-400/[0.03] animate-[morph-blob_10s_ease-in-out_infinite_2s]"
          style={{ borderRadius: "40% 60% 70% 30% / 50% 60% 30% 60%" }}
        />
        <div className="absolute top-[8%] end-[4%] w-20 h-20 rounded-full border-2 border-brand-blue/[0.06] animate-[drift-horizontal_8s_ease-in-out_infinite]" />
        <div className="absolute top-[5%] start-[8%] w-4 h-4 rounded-full bg-emerald-400/15 animate-[float-medium_5s_ease-in-out_infinite_0.5s]" />
        <div className="absolute top-[45%] end-[2%] w-6 h-6 bg-amber-400/10 rotate-45 rounded-sm animate-[float-slow_6s_ease-in-out_infinite_1s]" />
        <div className="absolute bottom-[10%] start-[6%] w-4 h-4 rounded-full bg-pink-400/12 animate-[float-medium_4.5s_ease-in-out_infinite_0.8s]" />
        <div className="absolute bottom-[15%] end-[15%] text-brand-blue/[0.05] rotate-[15deg] animate-[float-slow_7s_ease-in-out_infinite_1.3s]">
          <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L22 20H2L12 2Z" /></svg>
        </div>
        <div className="absolute top-[18%] start-[40%] w-3 h-3 rounded-full bg-violet-400/12 animate-[drift-horizontal_5.5s_ease-in-out_infinite_0.3s]" />
        <div className="absolute top-[65%] start-[3%] text-amber-400/10 animate-[float-slow_6s_ease-in-out_infinite_0.7s]">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" /></svg>
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
            {isAr ? "قيمنا" : "Our Values"}
            <span className="w-6 h-[1.5px] bg-brand-blue" />
          </span>
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-text-primary tracking-tight">
            {isAr ? "قيمنا في العمل" : "Our Values in Action"}
          </h2>
        </div>

        {/* Image strip */}
        <div
          className={cn(
            "grid grid-cols-3 gap-2 mb-12 transition-all duration-700",
            sectionAnim.visible ? "opacity-100 scale-100" : "opacity-0 scale-95"
          )}
          style={{ transitionDelay: "100ms" }}
        >
          {["/images/new/team-signs.jpg", "/images/new/mena-women.jpg", "/images/new/hands-on-work.jpg"].map((src, i) => (
            <div key={i} className="relative aspect-[3/1] rounded-xl overflow-hidden group">
              <Image src={src} alt="" fill className="object-cover group-hover:scale-110 transition-transform duration-700" sizes="33vw" />
              <div className="absolute inset-0 bg-accent-navy/10 group-hover:bg-transparent transition-colors" />
            </div>
          ))}
        </div>

        {/* Value cards — alternating slide left/right */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 xl:grid-cols-4">
          {values.map((value, i) => {
            const Icon = iconMap[value.icon] ?? Users;
            const colors = valueColors[i % valueColors.length];
            const fromLeft = i % 2 === 0;

            return (
              <div
                key={value.id}
                className={cn(
                  "group bg-surface-secondary rounded-2xl p-6 md:p-7 border border-surface-tertiary transition-all duration-700 ease-out hover:bg-white hover:shadow-xl hover:border-brand-blue/15 hover:-translate-y-1.5 relative overflow-hidden",
                  sectionAnim.visible
                    ? "opacity-100 translate-x-0 translate-y-0"
                    : fromLeft
                      ? "opacity-0 -translate-x-10 translate-y-4"
                      : "opacity-0 translate-x-10 translate-y-4"
                )}
                style={{ transitionDelay: `${250 + i * 80}ms` }}
              >
                {/* Abstract ring */}
                <div className={cn("absolute -top-5 -end-5 w-16 h-16 rounded-full border-2 opacity-20 transition-transform duration-500 group-hover:scale-110", `border-current ${colors.iconText}`)} />

                <div className="flex items-center gap-3 mb-4">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-500 group-hover:scale-110", colors.iconBg, colors.iconText)}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="bg-accent-sky text-brand-blue-deeper text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
                    SDG {value.sdgNumber}
                  </span>
                </div>

                <h3 className="font-serif text-lg text-text-primary mb-2 tracking-tight">
                  {isAr ? value.nameAr : value.nameEn}
                </h3>

                <p className="text-text-secondary text-sm leading-relaxed mb-3">
                  {isAr ? value.descriptionAr : value.descriptionEn}
                </p>

                <blockquote className="text-text-muted text-xs leading-relaxed italic border-s-2 border-brand-blue/30 ps-3">
                  {isAr ? value.storyAr : value.storyEn}
                </blockquote>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
