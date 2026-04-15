"use client";

import { useLocale } from "next-intl";
import { useRef, useState, useEffect } from "react";
import { Container } from "@/components/ui/Container";
import { cn } from "@/lib/utils";
import { impactStats } from "./impactData";
import {
  Rocket, TrendingUp, Coins, FileText, Users, Heart,
  UserCheck, Globe, Leaf, Briefcase, Building2, HandCoins,
} from "lucide-react";

const iconMap: Record<string, React.ElementType> = {
  rocket: Rocket, "trending-up": TrendingUp, coins: Coins, "file-text": FileText,
  users: Users, "hand-helping": Heart, "user-check": UserCheck, globe: Globe,
  leaf: Leaf, briefcase: Briefcase, building: Building2, "hand-coins": HandCoins,
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

const tabs = [
  {
    id: "for-profit" as const,
    en: "For-Profit Impact",
    ar: "الأثر الربحي",
    subtitleEn: "Startups incubated, MSMEs accelerated, and green ventures launched",
    subtitleAr: "شركات ناشئة محتضنة، مشاريع صغيرة مُسَرَّعة، ومشاريع خضراء أُطلقت",
    accent: "brand-blue",
    activeBg: "bg-brand-blue",
    activeText: "text-white",
    cardBorder: "border-brand-blue/15",
    iconBg: "bg-brand-blue/10",
    iconColor: "text-brand-blue",
  },
  {
    id: "non-profit" as const,
    en: "Non-Profit Impact",
    ar: "الأثر غير الربحي",
    subtitleEn: "Meals distributed, PSS sessions delivered, and communities supported",
    subtitleAr: "وجبات موزعة، جلسات دعم نفسي، ومجتمعات مدعومة",
    accent: "emerald-500",
    activeBg: "bg-emerald-500",
    activeText: "text-white",
    cardBorder: "border-emerald-400/15",
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-500",
  },
];

export function ImpactDashboard() {
  const locale = useLocale();
  const isAr = locale === "ar";
  const sectionAnim = useInView(0.08);
  const [activeTab, setActiveTab] = useState<"for-profit" | "non-profit">("for-profit");

  const currentTabConfig = tabs.find((t) => t.id === activeTab)!;
  const filteredStats = impactStats.filter((s) => s.tab === activeTab);

  return (
    <section ref={sectionAnim.ref} className="py-20 md:py-28 bg-surface-primary relative overflow-hidden">
      {/* Abstract shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -end-20 w-[350px] h-[350px] bg-brand-blue/[0.03] animate-[morph-blob_14s_ease-in-out_infinite]" style={{ borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%" }} />
        <div className="absolute -bottom-16 -start-16 w-[280px] h-[280px] bg-emerald-400/[0.03] animate-[morph-blob_11s_ease-in-out_infinite_3s]" style={{ borderRadius: "40% 60% 70% 30% / 50% 60% 30% 60%" }} />
        <div className="absolute top-[10%] end-[6%] w-16 h-16 rounded-full border-2 border-brand-blue/[0.07] animate-[drift-horizontal_8s_ease-in-out_infinite]" />
        <div className="absolute bottom-[15%] start-[4%] w-5 h-5 rounded-full bg-emerald-400/15 animate-[float-medium_5s_ease-in-out_infinite_0.6s]" />
      </div>

      <Container>
        {/* Header */}
        <div className={cn("text-center mb-12 transition-all duration-700", sectionAnim.visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-8")}>
          <span className="inline-flex items-center gap-3 text-brand-blue text-[11px] font-bold uppercase tracking-[0.3em] mb-4">
            <span className="w-6 h-[1.5px] bg-brand-blue" />
            {isAr ? "أرقامنا تتحدث" : "Our Numbers Speak"}
            <span className="w-6 h-[1.5px] bg-brand-blue" />
          </span>
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-text-primary tracking-tight mb-3">
            {isAr ? "أثر حقيقي، قابل للقياس" : "Real, Measurable Impact"}
          </h2>
        </div>

        {/* Tab switcher */}
        <div className={cn("flex justify-center mb-10 transition-all duration-700", sectionAnim.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6")} style={{ transitionDelay: "100ms" }}>
          <div className="inline-flex bg-surface-secondary rounded-full p-1.5 border border-surface-tertiary">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "px-6 py-3 text-sm font-semibold rounded-full transition-all duration-300 whitespace-nowrap",
                  activeTab === tab.id
                    ? cn(tab.activeBg, tab.activeText, "shadow-lg")
                    : "text-text-muted hover:text-text-primary"
                )}
              >
                {isAr ? tab.ar : tab.en}
              </button>
            ))}
          </div>
        </div>

        {/* Tab subtitle */}
        <p className={cn("text-center text-text-secondary text-sm mb-10 transition-all duration-500", sectionAnim.visible ? "opacity-100" : "opacity-0")} style={{ transitionDelay: "200ms" }}>
          {isAr ? currentTabConfig.subtitleAr : currentTabConfig.subtitleEn}
        </p>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-5 max-w-4xl mx-auto">
          {filteredStats.map((stat, si) => {
            const Icon = iconMap[stat.icon] ?? Rocket;
            return (
              <div
                key={stat.id}
                className={cn(
                  "group relative bg-white rounded-2xl p-6 border text-center transition-all duration-500 ease-out hover:shadow-xl hover:-translate-y-1.5 overflow-hidden",
                  currentTabConfig.cardBorder,
                  sectionAnim.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                )}
                style={{ transitionDelay: `${300 + si * 80}ms` }}
              >
                {/* Decorative ring */}
                <div className={cn("absolute -top-5 -end-5 w-16 h-16 rounded-full border-2 transition-transform duration-500 group-hover:scale-110", currentTabConfig.cardBorder)} />

                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 transition-all duration-500 group-hover:scale-110", currentTabConfig.iconBg, currentTabConfig.iconColor)}>
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
      </Container>
    </section>
  );
}
