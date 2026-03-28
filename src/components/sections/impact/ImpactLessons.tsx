"use client";

import { useRef, useState, useEffect } from "react";
import { useLocale } from "next-intl";
import { Container } from "@/components/ui/Container";
import { cn } from "@/lib/utils";
import { lessonsLearned } from "./impactData";
import { RefreshCw, MapPin, Eye } from "lucide-react";
import Image from "next/image";

const lessonIconMap: Record<string, React.ElementType> = {
  "refresh-cw": RefreshCw,
  "map-pin": MapPin,
  eye: Eye,
};

const cardColors = [
  { iconBg: "bg-brand-blue/10", iconText: "text-brand-blue", ring: "border-brand-blue/15", accent: "bg-brand-blue" },
  { iconBg: "bg-emerald-50", iconText: "text-emerald-500", ring: "border-emerald-400/15", accent: "bg-emerald-500" },
  { iconBg: "bg-amber-50", iconText: "text-amber-500", ring: "border-amber-400/15", accent: "bg-amber-500" },
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

export function ImpactLessons() {
  const locale = useLocale();
  const isAr = locale === "ar";
  const sectionAnim = useInView(0.08);

  return (
    <section ref={sectionAnim.ref} className="py-20 md:py-28 bg-surface-secondary relative overflow-hidden">
      {/* ═══ ABSTRACT SHAPES ═══ */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-12 start-[12%] w-[250px] h-[250px] bg-emerald-400/[0.03] animate-[morph-blob_12s_ease-in-out_infinite]" style={{ borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%" }} />
        <div className="absolute -bottom-10 end-[8%] w-[200px] h-[200px] bg-brand-blue/[0.03] animate-[morph-blob_10s_ease-in-out_infinite_2s]" style={{ borderRadius: "40% 60% 70% 30% / 50% 60% 30% 60%" }} />
        <div className="absolute top-[8%] end-[6%] w-14 h-14 rounded-full border-2 border-amber-400/[0.07] animate-[drift-horizontal_8s_ease-in-out_infinite]" />
        <div className="absolute bottom-[12%] start-[5%] w-5 h-5 rounded-full bg-pink-400/12 animate-[float-medium_5s_ease-in-out_infinite_0.6s]" />
        <div className="absolute top-[40%] end-[3%] w-4 h-4 bg-brand-blue/[0.08] rotate-45 animate-[float-slow_6s_ease-in-out_infinite_1s]" />
        <div className="absolute top-[22%] start-[4%] w-3 h-3 rounded-full bg-violet-400/10 animate-[float-medium_4s_ease-in-out_infinite_0.3s]" />
        <div className="absolute bottom-[20%] end-[15%] text-emerald-400/[0.06] animate-[float-slow_7s_ease-in-out_infinite_1.5s]">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" /></svg>
        </div>
        <svg className="absolute bottom-[8%] start-[18%] w-20 h-20 text-brand-blue/[0.04] animate-[float-slow_10s_ease-in-out_infinite]" viewBox="0 0 80 80" fill="none">
          <circle cx="40" cy="40" r="32" stroke="currentColor" strokeWidth="1" strokeDasharray="3 5" />
        </svg>
      </div>

      <Container>
        {/* Header */}
        <div className={cn("text-center mb-16 transition-all duration-700", sectionAnim.visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-8")}>
          <span className="inline-flex items-center gap-3 text-brand-blue text-[11px] font-bold uppercase tracking-[0.3em] mb-4">
            <span className="w-6 h-[1.5px] bg-brand-blue" />
            {isAr ? "ما تعلمناه" : "What We Learned"}
            <span className="w-6 h-[1.5px] bg-brand-blue" />
          </span>
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-text-primary tracking-tight mb-3">
            {isAr ? "دروس، ليس مجرد انتصارات" : "Lessons, Not Just Wins"}
          </h2>
          <p className="text-text-secondary text-[15px] max-w-2xl mx-auto leading-relaxed">
            {isAr ? "ما تعلمناه (لكي لا تضطر أنت)" : "What we've learned (so you don't have to)"}
          </p>
        </div>

        {/* Image banner */}
        <div className={cn("grid grid-cols-2 gap-2 mb-14 transition-all duration-700", sectionAnim.visible ? "opacity-100 scale-100" : "opacity-0 scale-95")} style={{ transitionDelay: "100ms" }}>
          {["/images/new/conference-room.jpg", "/images/new/group-photo.jpg"].map((src, i) => (
            <div key={i} className="relative aspect-[3/1] rounded-xl overflow-hidden group">
              <Image src={src} alt="" fill className="object-cover group-hover:scale-110 transition-transform duration-700" sizes="50vw" />
              <div className="absolute inset-0 bg-accent-navy/10 group-hover:bg-transparent transition-colors" />
            </div>
          ))}
        </div>

        {/* Lesson cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {lessonsLearned.map((lesson, i) => {
            const Icon = lessonIconMap[lesson.icon] ?? RefreshCw;
            const colors = cardColors[i % cardColors.length];
            const entranceClass = i === 0
              ? "opacity-0 -translate-x-10 translate-y-4"
              : i === 2
                ? "opacity-0 translate-x-10 translate-y-4"
                : "opacity-0 scale-95 translate-y-4";

            return (
              <div
                key={lesson.id}
                className={cn(
                  "group relative bg-white rounded-2xl p-7 border border-surface-tertiary transition-all duration-700 ease-out hover:shadow-xl hover:-translate-y-1.5 overflow-hidden",
                  sectionAnim.visible ? "opacity-100 translate-x-0 translate-y-0 scale-100" : entranceClass
                )}
                style={{ transitionDelay: `${300 + i * 120}ms` }}
              >
                {/* Decorative ring */}
                <div className={cn("absolute -top-5 -end-5 w-16 h-16 rounded-full border-2 transition-transform duration-500 group-hover:scale-110", colors.ring)} />
                {/* Top accent bar */}
                <div className={cn("absolute top-0 inset-x-0 h-1 rounded-t-2xl", colors.accent)} />

                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-all duration-500 group-hover:scale-110", colors.iconBg, colors.iconText)}>
                  <Icon className="w-6 h-6" />
                </div>

                <h3 className="font-serif text-lg text-text-primary mb-3 tracking-tight pe-6">
                  {isAr ? lesson.titleAr : lesson.titleEn}
                </h3>
                <p className="text-text-secondary text-sm leading-relaxed">
                  {isAr ? lesson.descriptionAr : lesson.descriptionEn}
                </p>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
