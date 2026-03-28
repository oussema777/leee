"use client";

import { useRef, useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { Container } from "@/components/ui/Container";
import { cn } from "@/lib/utils";
import { Eye, Target, Heart } from "lucide-react";
import Image from "next/image";

const pillars = [
  {
    icon: Eye,
    labelEn: "Vision",
    labelAr: "الرؤية",
    textEn: "A world where every crisis-affected community has the tools, networks, and mindset to build resilient, green, and inclusive economies.",
    textAr: "عالم تمتلك فيه كل مجتمعات الأزمات الأدوات والشبكات والعقلية لبناء اقتصادات مرنة وخضراء وشاملة.",
    accent: "bg-brand-blue",
    iconColor: "bg-brand-blue/10 text-brand-blue",
    image: "/images/new/intl-professionals.jpg",
  },
  {
    icon: Target,
    labelEn: "Mission",
    labelAr: "المهمة",
    textEn: "We offer the right ecosystem for innovative entrepreneurs to create and develop startups and SMEs, fostering leadership, entrepreneurship, and employment across MENA and Africa.",
    textAr: "نقدم المنظومة المناسبة لرواد الأعمال المبتكرين لإنشاء وتطوير الشركات الناشئة والصغيرة.",
    accent: "bg-emerald-500",
    iconColor: "bg-emerald-50 text-emerald-500",
    image: "/images/new/community-table.jpg",
  },
  {
    icon: Heart,
    labelEn: "Values",
    labelAr: "القيم",
    textEn: "Integrity, inclusion, resilience, sustainability, equity, human-centered growth, and ecosystem thinking guide everything we do.",
    textAr: "النزاهة والشمولية والمرونة والاستدامة والعدالة والنمو المتمحور حول الإنسان والتفكير المنظومي توجه كل ما نقوم به.",
    accent: "bg-amber-500",
    iconColor: "bg-amber-50 text-amber-500",
    image: "/images/new/award-winner.jpg",
  },
];

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

export function AboutVMV() {
  const locale = useLocale();
  const isAr = locale === "ar";
  const sectionAnim = useInView(0.1);

  return (
    <section ref={sectionAnim.ref} className="py-20 md:py-28 bg-surface-secondary relative overflow-hidden">
      {/* ═══ ABSTRACT SHAPES ═══ */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-6 -start-6 w-24 h-24 rounded-full bg-brand-blue/[0.05] animate-[float-slow_8s_ease-in-out_infinite]" />
        <div
          className="absolute top-[10%] end-[5%] w-[200px] h-[200px] bg-emerald-400/[0.03] animate-[morph-blob_12s_ease-in-out_infinite]"
          style={{ borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%" }}
        />
        <div
          className="absolute bottom-[5%] start-[10%] w-[160px] h-[160px] bg-amber-400/[0.03] animate-[morph-blob_10s_ease-in-out_infinite_2s]"
          style={{ borderRadius: "40% 60% 70% 30% / 50% 60% 30% 60%" }}
        />
        <div className="absolute top-[30%] end-[5%] w-10 h-10 rounded-full border-2 border-emerald-400/15 animate-[drift-horizontal_9s_ease-in-out_infinite_0.5s]" />
        <div className="absolute bottom-[10%] start-[8%] text-amber-400/15 animate-[float-slow_5s_ease-in-out_infinite_1s]">
          <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor"><path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" /></svg>
        </div>
        <div className="absolute top-[15%] end-[30%] w-3 h-3 rounded-full bg-pink-400/15 animate-[float-medium_4s_ease-in-out_infinite_0.8s]" />
        <div className="absolute bottom-[20%] end-[12%] w-4 h-4 bg-brand-blue/[0.08] rotate-45 animate-[drift-horizontal_7s_ease-in-out_infinite_1.5s]" />
        <div className="absolute top-[50%] start-[2%] w-3 h-3 rounded-full bg-violet-400/12 animate-[float-slow_5s_ease-in-out_infinite_0.7s]" />

        {/* Dotted arcs */}
        <svg className="absolute top-[40%] end-[2%] w-24 h-24 text-emerald-400/[0.06] animate-[float-slow_10s_ease-in-out_infinite]" viewBox="0 0 96 96" fill="none">
          <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="1" strokeDasharray="4 6" />
        </svg>
      </div>

      <Container>
        <div
          className={cn(
            "text-center mb-14 transition-all duration-700 ease-out",
            sectionAnim.visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-8"
          )}
        >
          <span className="inline-flex items-center gap-3 text-brand-blue text-[11px] font-bold uppercase tracking-[0.3em] mb-4">
            <span className="w-6 h-[1.5px] bg-brand-blue" />
            {isAr ? "ما يوجهنا" : "What Guides Us"}
            <span className="w-6 h-[1.5px] bg-brand-blue" />
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {pillars.map((pillar, i) => {
            const Icon = pillar.icon;
            // Alternate: 0 from left, 1 scale up, 2 from right
            const entrance = i === 0
              ? (sectionAnim.visible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-12")
              : i === 1
                ? (sectionAnim.visible ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-90 translate-y-8")
                : (sectionAnim.visible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-12");

            return (
              <div
                key={pillar.labelEn}
                className={cn(
                  "relative bg-white rounded-2xl overflow-hidden border border-surface-tertiary transition-all duration-700 ease-out hover:shadow-xl hover:-translate-y-1.5 group",
                  entrance
                )}
                style={{ transitionDelay: `${200 + i * 150}ms` }}
              >
                {/* Top accent bar */}
                <div className={cn("absolute top-0 inset-x-0 h-[3px]", pillar.accent)} />

                {/* Image header */}
                <div className="relative h-36 overflow-hidden">
                  <Image
                    src={pillar.image}
                    alt=""
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                    sizes="33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-white via-white/40 to-transparent" />
                  {/* Abstract overlay circle */}
                  <div className="absolute top-3 end-3 w-8 h-8 rounded-full border-2 border-white/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>

                <div className="p-7 md:p-8 pt-2">
                  <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-5", pillar.iconColor)}>
                    <Icon className="w-6 h-6" />
                  </div>

                  <h3 className="font-serif text-2xl md:text-[1.75rem] text-text-primary mb-4 tracking-tight">
                    {isAr ? pillar.labelAr : pillar.labelEn}
                  </h3>

                  <p className="text-text-secondary text-[15px] leading-relaxed">
                    {isAr ? pillar.textAr : pillar.textEn}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
