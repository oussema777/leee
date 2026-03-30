"use client";

import { useRef, useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { Container } from "@/components/ui/Container";
import { cn } from "@/lib/utils";
import { teamMembers } from "./aboutData";
import Image from "next/image";

const cardAccents = [
  "border-t-brand-blue",
  "border-t-emerald-400",
  "border-t-amber-400",
  "border-t-pink-400",
  "border-t-violet-400",
  "border-t-cyan-400",
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

export function AboutTeam() {
  const locale = useLocale();
  const isAr = locale === "ar";
  const sectionAnim = useInView(0.08);

  return (
    <section ref={sectionAnim.ref} className="py-20 md:py-28 bg-surface-primary relative overflow-hidden">
      {/* ═══ ABSTRACT SHAPES ═══ */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-[3%] -end-10 w-[260px] h-[260px] bg-pink-400/[0.03] animate-[morph-blob_13s_ease-in-out_infinite]"
          style={{ borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%" }}
        />
        <div
          className="absolute bottom-[8%] -start-10 w-[200px] h-[200px] bg-brand-blue/[0.03] animate-[morph-blob_11s_ease-in-out_infinite_2s]"
          style={{ borderRadius: "40% 60% 70% 30% / 50% 60% 30% 60%" }}
        />
        <div className="absolute top-[6%] start-[5%] w-14 h-14 rounded-full bg-emerald-400/[0.06] animate-[drift-horizontal_8s_ease-in-out_infinite]" />
        <div className="absolute top-[10%] end-[8%] w-10 h-10 rounded-full border-2 border-brand-blue/10 animate-[float-medium_5.5s_ease-in-out_infinite_0.4s]" />
        <div className="absolute top-[50%] start-[2%] text-pink-400/12 animate-[float-slow_5s_ease-in-out_infinite_0.8s]">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" /></svg>
        </div>
        <div className="absolute bottom-[12%] end-[12%] w-5 h-5 rounded-full bg-amber-400/12 animate-[float-medium_4.5s_ease-in-out_infinite_1.2s]" />
        <div className="absolute top-[30%] end-[22%] w-3 h-3 bg-violet-400/12 rotate-45 animate-[drift-horizontal_6s_ease-in-out_infinite_0.6s]" />
        <svg className="absolute bottom-[20%] start-[10%] w-28 h-28 text-brand-blue/[0.04] animate-[float-slow_12s_ease-in-out_infinite]" viewBox="0 0 112 112" fill="none">
          <circle cx="56" cy="56" r="48" stroke="currentColor" strokeWidth="1.5" strokeDasharray="5 7" />
        </svg>
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
            {isAr ? "فريقنا" : "Meet The Team"}
            <span className="w-6 h-[1.5px] bg-brand-blue" />
          </span>
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-text-primary tracking-tight mb-3">
            {isAr ? "جذور محلية. رؤية عالمية." : "Local Roots. Global Vision."}
          </h2>
        </div>

        {/* Team grid — alternating slide directions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {teamMembers.map((member, i) => {
            // Cycle: left, scale, right
            const entranceType = i % 3;
            const entrance = entranceType === 0
              ? (sectionAnim.visible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-12")
              : entranceType === 1
                ? (sectionAnim.visible ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-90 translate-y-8")
                : (sectionAnim.visible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-12");

            return (
              <div
                key={member.id}
                className={cn(
                  "group transition-all duration-700 ease-out",
                  entrance
                )}
                style={{ transitionDelay: `${200 + i * 100}ms` }}
              >
                <div className={cn(
                  "bg-surface-secondary rounded-2xl overflow-hidden border border-surface-tertiary border-t-[3px] hover:shadow-xl transition-all duration-500 hover:-translate-y-1.5",
                  cardAccents[i % cardAccents.length]
                )}>
                  <div className="relative h-56 md:h-64 overflow-hidden">
                    <Image
                      src={member.imageUrl}
                      alt={isAr ? member.nameAr : member.nameEn}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-accent-navy/40 to-transparent" />
                    <div className="absolute top-3 end-3 w-7 h-7 rounded-full border-2 border-white/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  </div>

                  <div className="p-5 md:p-6">
                    <h3 className="font-serif text-xl text-text-primary tracking-tight">
                      {isAr ? member.nameAr : member.nameEn}
                    </h3>
                    <p className="text-brand-blue text-sm font-medium mt-1">
                      {isAr ? member.roleAr : member.roleEn}
                    </p>
                    <p className="text-text-muted text-sm italic mt-3 leading-relaxed">
                      &ldquo;{isAr ? member.quoteAr : member.quoteEn}&rdquo;
                    </p>
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
