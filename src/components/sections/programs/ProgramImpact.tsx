"use client";

import { useLocale } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { Container } from "@/components/ui/Container";
import { cn } from "@/lib/utils";
import { Users, Briefcase, TrendingUp, Target, DollarSign, Sprout } from "lucide-react";

interface Stat {
  labelEn: string;
  labelAr: string;
  value: number;
  suffix?: string | null;
  icon?: string | null;
}

interface ProgramImpactProps {
  stats: Stat[];
}

const iconMap: Record<string, React.ReactNode> = {
  users: <Users className="w-6 h-6" />,
  briefcase: <Briefcase className="w-6 h-6" />,
  trending: <TrendingUp className="w-6 h-6" />,
  target: <Target className="w-6 h-6" />,
  dollar: <DollarSign className="w-6 h-6" />,
  sprout: <Sprout className="w-6 h-6" />,
};

// Unique circle accent colors per card position
const circleAccents = [
  { ring: "border-brand-blue/20", glow: "bg-brand-blue/[0.07]", dot: "bg-brand-blue/25", iconBg: "bg-brand-blue/10", iconText: "text-brand-blue" },
  { ring: "border-emerald-400/20", glow: "bg-emerald-400/[0.07]", dot: "bg-emerald-400/25", iconBg: "bg-emerald-50", iconText: "text-emerald-500" },
  { ring: "border-amber-400/20", glow: "bg-amber-400/[0.07]", dot: "bg-amber-400/25", iconBg: "bg-amber-50", iconText: "text-amber-500" },
  { ring: "border-pink-400/20", glow: "bg-pink-400/[0.07]", dot: "bg-pink-400/25", iconBg: "bg-pink-50", iconText: "text-pink-500" },
  { ring: "border-cyan-500/20", glow: "bg-cyan-500/[0.07]", dot: "bg-cyan-500/25", iconBg: "bg-cyan-50", iconText: "text-cyan-500" },
  { ring: "border-violet-400/20", glow: "bg-violet-400/[0.07]", dot: "bg-violet-400/25", iconBg: "bg-violet-50", iconText: "text-violet-500" },
  { ring: "border-rose-400/20", glow: "bg-rose-400/[0.07]", dot: "bg-rose-400/25", iconBg: "bg-rose-50", iconText: "text-rose-500" },
  { ring: "border-teal-400/20", glow: "bg-teal-400/[0.07]", dot: "bg-teal-400/25", iconBg: "bg-teal-50", iconText: "text-teal-500" },
];

function AnimatedCounter({ target, duration = 2000 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const startTime = Date.now();
          const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.round(target * eased));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  return <span ref={ref}>{count.toLocaleString()}</span>;
}

function useInView(threshold = 0.15) {
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

export function ProgramImpact({ stats }: ProgramImpactProps) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const sectionAnim = useInView(0.1);

  if (stats.length === 0) return null;

  return (
    <section id="impact" className="scroll-mt-16 relative overflow-hidden bg-white">

      {/* ═══ COLORFUL ABSTRACT CIRCLE SHAPES — background layer ═══ */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Giant rings */}
        <div className="absolute -top-32 -start-32 w-[500px] h-[500px] rounded-full border border-brand-blue/[0.06] animate-[drift-horizontal_20s_ease-in-out_infinite]" />
        <div className="absolute -bottom-40 -end-40 w-[600px] h-[600px] rounded-full border border-emerald-400/[0.06] animate-[drift-horizontal_25s_ease-in-out_infinite_3s]" />
        <div className="absolute top-[20%] end-[15%] w-[300px] h-[300px] rounded-full border border-pink-400/[0.06] animate-[float-slow_10s_ease-in-out_infinite]" />

        {/* Morphing blobs */}
        <div
          className="absolute top-[5%] start-[20%] w-[220px] h-[220px] bg-brand-blue/[0.04] animate-[morph-blob_14s_ease-in-out_infinite]"
          style={{ borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%" }}
        />
        <div
          className="absolute bottom-[10%] end-[25%] w-[180px] h-[180px] bg-emerald-400/[0.04] animate-[morph-blob_11s_ease-in-out_infinite_2s]"
          style={{ borderRadius: "40% 60% 70% 30% / 50% 60% 30% 60%" }}
        />
        <div
          className="absolute top-[50%] start-[5%] w-[140px] h-[140px] bg-amber-400/[0.04] animate-[morph-blob_13s_ease-in-out_infinite_4s]"
          style={{ borderRadius: "50% 60% 30% 60% / 30% 40% 70% 60%" }}
        />

        {/* Medium floating circles */}
        <div className="absolute top-[12%] end-[8%] w-20 h-20 rounded-full border-2 border-brand-blue/[0.08] animate-[float-slow_7s_ease-in-out_infinite]" />
        <div className="absolute bottom-[18%] start-[6%] w-14 h-14 rounded-full border-2 border-emerald-400/[0.1] animate-[drift-horizontal_9s_ease-in-out_infinite_1s]" />
        <div className="absolute top-[55%] end-[4%] w-10 h-10 rounded-full border-2 border-amber-400/[0.1] animate-[float-medium_6s_ease-in-out_infinite_0.5s]" />
        <div className="absolute top-[30%] start-[3%] w-8 h-8 rounded-full bg-pink-400/[0.06] animate-[float-slow_5s_ease-in-out_infinite_0.8s]" />

        {/* Small circles & dots */}
        <div className="absolute bottom-[25%] start-[15%] w-5 h-5 rounded-full bg-emerald-400/15 animate-[float-medium_4.5s_ease-in-out_infinite_0.3s]" />
        <div className="absolute top-[70%] end-[12%] w-4 h-4 rounded-full bg-pink-400/15 animate-[float-slow_5.5s_ease-in-out_infinite_1.2s]" />
        <div className="absolute top-[8%] start-[40%] w-3 h-3 rounded-full bg-amber-400/15 animate-[float-medium_4s_ease-in-out_infinite_0.7s]" />
        <div className="absolute bottom-[8%] end-[40%] w-3 h-3 rounded-full bg-cyan-400/15 animate-[drift-horizontal_6s_ease-in-out_infinite_1.5s]" />
        <div className="absolute top-[42%] end-[28%] w-2 h-2 rounded-full bg-violet-400/15 animate-[float-slow_4s_ease-in-out_infinite_0.9s]" />

        {/* Circle cluster - top left */}
        <div className="absolute top-[15%] start-[8%]">
          <div className="w-6 h-6 rounded-full border border-brand-blue/[0.1] animate-[float-slow_6s_ease-in-out_infinite]" />
          <div className="w-3 h-3 rounded-full bg-brand-blue/[0.08] -mt-1 ms-5 animate-[float-medium_4s_ease-in-out_infinite_0.5s]" />
          <div className="w-2 h-2 rounded-full bg-emerald-400/[0.08] mt-1 ms-2 animate-[float-slow_5s_ease-in-out_infinite_1s]" />
        </div>

        {/* Circle cluster - bottom right */}
        <div className="absolute bottom-[12%] end-[10%]">
          <div className="w-8 h-8 rounded-full border border-pink-400/[0.08] animate-[float-medium_7s_ease-in-out_infinite_0.3s]" />
          <div className="w-4 h-4 rounded-full bg-amber-400/[0.06] -mt-2 me-6 animate-[float-slow_5s_ease-in-out_infinite_0.8s]" />
        </div>

        {/* Dotted circle arcs */}
        <svg className="absolute top-[25%] start-[12%] w-40 h-40 text-brand-blue/[0.06] animate-[float-slow_12s_ease-in-out_infinite]" viewBox="0 0 160 160" fill="none">
          <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="1.5" strokeDasharray="6 8" />
        </svg>
        <svg className="absolute bottom-[20%] end-[8%] w-32 h-32 text-emerald-400/[0.07] animate-[drift-horizontal_15s_ease-in-out_infinite_2s]" viewBox="0 0 128 128" fill="none">
          <circle cx="64" cy="64" r="55" stroke="currentColor" strokeWidth="1" strokeDasharray="4 6" />
        </svg>
        <svg className="absolute top-[60%] start-[35%] w-24 h-24 text-pink-400/[0.05] animate-[float-medium_10s_ease-in-out_infinite_1s]" viewBox="0 0 96 96" fill="none">
          <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="1" strokeDasharray="3 5" />
        </svg>
      </div>

      <div ref={sectionAnim.ref} className="relative z-10 py-24 md:py-32">
        <Container>
          {/* ═══ HEADER — reveal down ═══ */}
          <div
            className={cn(
              "text-center mb-16 transition-all duration-700",
              sectionAnim.visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-8"
            )}
          >
            <span className="inline-flex items-center gap-3 text-brand-blue text-[11px] font-bold uppercase tracking-[0.3em] mb-4">
              <span className="w-6 h-[1.5px] bg-brand-blue" />
              {isAr ? "الأثر بالأرقام" : "Impact in Numbers"}
              <span className="w-6 h-[1.5px] bg-brand-blue" />
            </span>
            <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-text-primary tracking-tight mb-4">
              {isAr ? "الأثر والنتائج" : "Impact & Results"}
            </h2>
            <p className="text-text-muted text-sm max-w-lg mx-auto">
              {isAr
                ? "أرقام تعكس التزامنا بإحداث فرق حقيقي في المجتمعات التي نخدمها"
                : "Numbers that reflect our commitment to making a real difference in the communities we serve"}
            </p>
          </div>

          {/* ═══ STAT CARDS — staggered entrance ═══ */}
          <div className={cn(
            "grid gap-6 md:gap-7",
            stats.length <= 3 && "grid-cols-1 sm:grid-cols-3 max-w-4xl mx-auto",
            stats.length === 4 && "grid-cols-2 lg:grid-cols-4",
            stats.length >= 5 && "grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
          )}>
            {stats.map((stat, index) => {
              const accent = circleAccents[index % circleAccents.length];
              const fromLeft = index % 2 === 0;

              return (
                <div
                  key={index}
                  className={cn(
                    "relative group rounded-2xl p-7 md:p-8 text-center transition-all duration-700 ease-out overflow-hidden",
                    "bg-white border border-surface-tertiary shadow-sm",
                    "hover:shadow-xl hover:border-brand-blue/15 hover:-translate-y-2",
                    sectionAnim.visible
                      ? "opacity-100 translate-x-0 translate-y-0 scale-100"
                      : fromLeft
                        ? "opacity-0 -translate-x-10 translate-y-6 scale-95"
                        : "opacity-0 translate-x-10 translate-y-6 scale-95"
                  )}
                  style={{ transitionDelay: `${250 + index * 120}ms` }}
                >
                  {/* ── Abstract circle background per card ── */}
                  {/* Large outer ring */}
                  <div className={cn(
                    "absolute -top-10 -end-10 w-36 h-36 rounded-full border-2 transition-all duration-700 group-hover:scale-110",
                    accent.ring
                  )} />
                  {/* Medium ring */}
                  <div className={cn(
                    "absolute -bottom-6 -start-6 w-24 h-24 rounded-full border transition-all duration-700 group-hover:scale-110",
                    accent.ring, "opacity-60"
                  )} />
                  {/* Glow blob behind number */}
                  <div className={cn(
                    "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 rounded-full blur-2xl transition-all duration-500 group-hover:w-36 group-hover:h-36 group-hover:blur-3xl",
                    accent.glow
                  )} />
                  {/* Small floating dot */}
                  <div className={cn(
                    "absolute top-4 start-4 w-2.5 h-2.5 rounded-full animate-[float-medium_4s_ease-in-out_infinite]",
                    accent.dot
                  )} style={{ animationDelay: `${index * 0.3}s` }} />
                  {/* Tiny orbiting dot */}
                  <div className={cn(
                    "absolute bottom-5 end-5 w-1.5 h-1.5 rounded-full animate-[drift-horizontal_6s_ease-in-out_infinite]",
                    accent.dot, "opacity-60"
                  )} style={{ animationDelay: `${index * 0.5}s` }} />
                  {/* Dashed circle accent */}
                  <svg className="absolute top-3 end-3 w-10 h-10 text-text-muted/10 animate-[float-slow_8s_ease-in-out_infinite]" viewBox="0 0 40 40" fill="none" style={{ animationDelay: `${index * 0.4}s` }}>
                    <circle cx="20" cy="20" r="16" stroke="currentColor" strokeWidth="1" strokeDasharray="3 4" />
                  </svg>

                  {/* ── Card content ── */}
                  <div className="relative z-10">
                    {/* Icon in circle */}
                    <div className={cn(
                      "w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5 border border-surface-tertiary group-hover:scale-110 transition-all duration-500",
                      accent.iconBg, accent.iconText
                    )}>
                      {stat.icon && iconMap[stat.icon] ? iconMap[stat.icon] : <Target className="w-6 h-6" />}
                    </div>

                    {/* Number */}
                    <div className="font-serif text-4xl md:text-5xl text-text-primary mb-3 tabular-nums tracking-tight">
                      <AnimatedCounter target={stat.value} />
                      {stat.suffix && <span className="text-brand-blue ms-0.5">{stat.suffix}</span>}
                    </div>

                    {/* Decorative line under number */}
                    <div className="flex justify-center mb-3">
                      <div className={cn("w-8 h-[2px] rounded-full transition-all duration-500 group-hover:w-14", accent.dot)} />
                    </div>

                    {/* Label */}
                    <div className="text-text-muted text-xs font-semibold uppercase tracking-[0.18em] group-hover:text-text-secondary transition-colors duration-500">
                      {isAr ? stat.labelAr : stat.labelEn}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ═══ Bottom decorative separator ═══ */}
          <div
            className={cn(
              "flex items-center justify-center gap-3 mt-16 transition-all duration-700",
              sectionAnim.visible ? "opacity-100 scale-100" : "opacity-0 scale-90"
            )}
            style={{ transitionDelay: "800ms" }}
          >
            <div className="w-2 h-2 rounded-full bg-brand-blue/15" />
            <div className="w-16 h-[1px] bg-surface-tertiary" />
            <div className="w-3 h-3 rounded-full border border-brand-blue/15" />
            <div className="w-16 h-[1px] bg-surface-tertiary" />
            <div className="w-2 h-2 rounded-full bg-brand-blue/15" />
          </div>
        </Container>
      </div>
    </section>
  );
}
