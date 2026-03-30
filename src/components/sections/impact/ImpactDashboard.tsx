"use client";

import { useLocale } from "next-intl";
import { useRef, useState, useEffect } from "react";
import { Container } from "@/components/ui/Container";
import { cn } from "@/lib/utils";
import { impactStats, ImpactStat } from "./impactData";
import { Rocket, TrendingUp, Coins, FileText, Users, Heart, UserCheck, Globe, Leaf, Briefcase } from "lucide-react";
import Image from "next/image";

const iconMap: Record<string, React.ElementType> = {
  rocket: Rocket, "trending-up": TrendingUp, coins: Coins, "file-text": FileText,
  users: Users, "hand-helping": Heart, "user-check": UserCheck, globe: Globe, leaf: Leaf, briefcase: Briefcase,
};

const categoryConfig: Record<string, { en: string; ar: string; color: string; iconBg: string; ring: string }> = {
  economic: { en: "Economic Impact", ar: "الأثر الاقتصادي", color: "text-brand-blue", iconBg: "bg-brand-blue/10", ring: "border-brand-blue/15" },
  social: { en: "Social Impact", ar: "الأثر الاجتماعي", color: "text-emerald-500", iconBg: "bg-emerald-50", ring: "border-emerald-400/15" },
  environmental: { en: "Environmental Impact", ar: "الأثر البيئي", color: "text-amber-500", iconBg: "bg-amber-50", ring: "border-amber-400/15" },
};

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

function AnimatedCounter({ target, duration = 2000 }: { target: number; duration?: number }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const done = useRef(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !done.current) {
        done.current = true;
        const start = performance.now();
        const animate = (now: number) => {
          const p = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          setVal(parseFloat((eased * target).toFixed(target % 1 !== 0 ? 2 : 0)));
          if (p < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
      }
    }, { threshold: 0.2 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [target, duration]);
  return <span ref={ref}>{val.toLocaleString()}</span>;
}

export function ImpactDashboard() {
  const locale = useLocale();
  const isAr = locale === "ar";
  const sectionAnim = useInView(0.08);

  const categories = ["economic", "social", "environmental"] as const;
  const grouped = categories.reduce<Record<string, ImpactStat[]>>((acc, cat) => {
    acc[cat] = impactStats.filter((s) => s.category === cat);
    return acc;
  }, {});

  return (
    <section ref={sectionAnim.ref} className="py-20 md:py-28 bg-surface-primary relative overflow-hidden">
      {/* ═══ ABSTRACT SHAPES ═══ */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -end-20 w-[350px] h-[350px] bg-brand-blue/[0.03] animate-[morph-blob_14s_ease-in-out_infinite]" style={{ borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%" }} />
        <div className="absolute -bottom-16 -start-16 w-[280px] h-[280px] bg-emerald-400/[0.03] animate-[morph-blob_11s_ease-in-out_infinite_3s]" style={{ borderRadius: "40% 60% 70% 30% / 50% 60% 30% 60%" }} />
        <div className="absolute top-[10%] end-[6%] w-16 h-16 rounded-full border-2 border-brand-blue/[0.07] animate-[drift-horizontal_8s_ease-in-out_infinite]" />
        <div className="absolute bottom-[15%] start-[4%] w-5 h-5 rounded-full bg-emerald-400/15 animate-[float-medium_5s_ease-in-out_infinite_0.6s]" />
        <div className="absolute top-[40%] end-[3%] w-4 h-4 bg-amber-400/12 rotate-45 animate-[float-slow_6s_ease-in-out_infinite_1s]" />
        <div className="absolute top-[20%] start-[8%] w-3 h-3 rounded-full bg-pink-400/12 animate-[float-medium_4s_ease-in-out_infinite_0.3s]" />
        <div className="absolute bottom-[30%] end-[20%] text-brand-blue/[0.06] animate-[float-slow_7s_ease-in-out_infinite_1.5s]">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" /></svg>
        </div>
        <svg className="absolute bottom-[10%] end-[8%] w-24 h-24 text-emerald-400/[0.05] animate-[float-slow_10s_ease-in-out_infinite]" viewBox="0 0 96 96" fill="none">
          <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="1" strokeDasharray="4 6" />
        </svg>
      </div>

      <Container>
        {/* Header */}
        <div className={cn("text-center mb-16 transition-all duration-700", sectionAnim.visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-8")}>
          <span className="inline-flex items-center gap-3 text-brand-blue text-[11px] font-bold uppercase tracking-[0.3em] mb-4">
            <span className="w-6 h-[1.5px] bg-brand-blue" />
            {isAr ? "أرقامنا تتحدث" : "Our Numbers Speak"}
            <span className="w-6 h-[1.5px] bg-brand-blue" />
          </span>
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-text-primary tracking-tight mb-3">
            {isAr ? "أثر حقيقي، قابل للقياس" : "Real, Measurable Impact"}
          </h2>
        </div>

        {/* Image banner */}
        <div className={cn("grid grid-cols-4 gap-2 mb-14 transition-all duration-700", sectionAnim.visible ? "opacity-100 scale-100" : "opacity-0 scale-95")} style={{ transitionDelay: "100ms" }}>
          {["/images/new/stage-group.jpg", "/images/new/coaching-session.jpg", "/images/new/greenhouse-visit.jpg", "/images/new/award-winner.jpg"].map((src, i) => (
            <div key={i} className="relative aspect-[3/2] rounded-xl overflow-hidden group">
              <Image src={src} alt="" fill className="object-cover group-hover:scale-110 transition-transform duration-700" sizes="25vw" />
              <div className="absolute inset-0 bg-accent-navy/10 group-hover:bg-transparent transition-colors" />
            </div>
          ))}
        </div>

        {/* Category groups */}
        {categories.map((cat, ci) => {
          const config = categoryConfig[cat];
          return (
            <div key={cat} className="mb-12 last:mb-0">
              <h3 className={cn(
                "text-lg font-bold mb-6 text-center transition-all duration-700",
                config.color,
                sectionAnim.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
              )} style={{ transitionDelay: `${200 + ci * 150}ms` }}>
                {isAr ? config.ar : config.en}
              </h3>
              <div className={cn("grid gap-5", grouped[cat].length <= 2 ? "grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto" : "grid-cols-2 md:grid-cols-4")}>
                {grouped[cat].map((stat, si) => {
                  const Icon = iconMap[stat.icon] ?? Rocket;
                  const fromLeft = si % 2 === 0;
                  return (
                    <div
                      key={stat.id}
                      className={cn(
                        "group relative bg-surface-secondary rounded-2xl p-6 border border-surface-tertiary text-center transition-all duration-700 ease-out hover:bg-white hover:shadow-xl hover:-translate-y-1.5 hover:border-brand-blue/15 overflow-hidden",
                        sectionAnim.visible ? "opacity-100 translate-x-0 translate-y-0" : fromLeft ? "opacity-0 -translate-x-10 translate-y-4" : "opacity-0 translate-x-10 translate-y-4"
                      )}
                      style={{ transitionDelay: `${300 + ci * 150 + si * 100}ms` }}
                    >
                      <div className={cn("absolute -top-5 -end-5 w-16 h-16 rounded-full border-2 transition-transform duration-500 group-hover:scale-110", config.ring)} />
                      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 transition-all duration-500 group-hover:scale-110", config.iconBg, config.color)}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <p className="font-serif text-3xl md:text-4xl text-text-primary mb-1 tabular-nums">
                        {stat.prefix || ""}<AnimatedCounter target={stat.value} />{stat.suffix || ""}
                      </p>
                      <p className="text-text-muted text-xs font-medium uppercase tracking-[0.15em]">
                        {isAr ? stat.labelAr : stat.labelEn}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </Container>
    </section>
  );
}
