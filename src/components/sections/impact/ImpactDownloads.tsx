"use client";

import { useRef, useState, useEffect } from "react";
import { useLocale } from "next-intl";
import { Container } from "@/components/ui/Container";
import { cn } from "@/lib/utils";
import { downloads } from "./impactData";
import { Download, FileText, BarChart3, ClipboardList } from "lucide-react";
import Image from "next/image";

const cardConfig = [
  { iconBg: "bg-brand-blue/10", iconText: "text-brand-blue", ring: "border-brand-blue/15", accent: "bg-brand-blue", Icon: FileText },
  { iconBg: "bg-emerald-50", iconText: "text-emerald-500", ring: "border-emerald-400/15", accent: "bg-emerald-500", Icon: BarChart3 },
  { iconBg: "bg-amber-50", iconText: "text-amber-500", ring: "border-amber-400/15", accent: "bg-amber-500", Icon: ClipboardList },
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

export function ImpactDownloads() {
  const locale = useLocale();
  const isAr = locale === "ar";
  const sectionAnim = useInView(0.08);

  return (
    <section ref={sectionAnim.ref} className="py-20 md:py-28 bg-white relative overflow-hidden">
      {/* ═══ ABSTRACT SHAPES ═══ */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-16 -end-16 w-[260px] h-[260px] bg-brand-blue/[0.03] animate-[morph-blob_13s_ease-in-out_infinite]" style={{ borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%" }} />
        <div className="absolute bottom-[5%] -start-12 w-[200px] h-[200px] bg-amber-400/[0.03] animate-[morph-blob_11s_ease-in-out_infinite_2.5s]" style={{ borderRadius: "40% 60% 70% 30% / 50% 60% 30% 60%" }} />
        <div className="absolute top-[10%] start-[6%] w-12 h-12 rounded-full border-2 border-emerald-400/[0.07] animate-[drift-horizontal_7s_ease-in-out_infinite]" />
        <div className="absolute bottom-[15%] end-[5%] w-5 h-5 rounded-full bg-pink-400/10 animate-[float-medium_5s_ease-in-out_infinite_0.5s]" />
        <div className="absolute top-[50%] start-[3%] w-4 h-4 bg-violet-400/10 rotate-45 animate-[float-slow_5.5s_ease-in-out_infinite_0.8s]" />
        <div className="absolute top-[25%] end-[4%] w-3 h-3 rounded-full bg-cyan-400/12 animate-[float-medium_4s_ease-in-out_infinite_0.3s]" />
        <svg className="absolute bottom-[10%] end-[15%] w-20 h-20 text-brand-blue/[0.04] animate-[float-slow_9s_ease-in-out_infinite]" viewBox="0 0 80 80" fill="none">
          <circle cx="40" cy="40" r="32" stroke="currentColor" strokeWidth="1" strokeDasharray="3 5" />
        </svg>
      </div>

      <Container>
        {/* Header */}
        <div className={cn("text-center mb-16 transition-all duration-700", sectionAnim.visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-8")}>
          <span className="inline-flex items-center gap-3 text-brand-blue text-[11px] font-bold uppercase tracking-[0.3em] mb-4">
            <span className="w-6 h-[1.5px] bg-brand-blue" />
            {isAr ? "مواردنا" : "Our Resources"}
            <span className="w-6 h-[1.5px] bg-brand-blue" />
          </span>
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-text-primary tracking-tight mb-3">
            {isAr ? "الموارد والتنزيلات" : "Resources & Downloads"}
          </h2>
          <p className="text-text-secondary text-[15px] max-w-2xl mx-auto leading-relaxed">
            {isAr ? "تقارير وملفات حقائق ومنهجيات بحثية" : "Reports, factsheets, and research methodologies"}
          </p>
        </div>

        {/* Full-width image */}
        <div className={cn("relative aspect-[4/1] rounded-xl overflow-hidden mb-14 transition-all duration-700", sectionAnim.visible ? "opacity-100 scale-100" : "opacity-0 scale-95")} style={{ transitionDelay: "100ms" }}>
          <Image src="/images/new/intl-professionals.jpg" alt="" fill className="object-cover" sizes="100vw" />
          <div className="absolute inset-0 bg-accent-navy/10" />
        </div>

        {/* Download cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {downloads.map((item, i) => {
            const config = cardConfig[i % cardConfig.length];
            const CardIcon = config.Icon;
            const entranceClass = i === 0
              ? "opacity-0 -translate-x-10 translate-y-4"
              : i === 2
                ? "opacity-0 translate-x-10 translate-y-4"
                : "opacity-0 scale-95 translate-y-4";

            return (
              <div
                key={item.id}
                className={cn(
                  "group relative bg-surface-secondary rounded-2xl border border-surface-tertiary overflow-hidden transition-all duration-700 ease-out hover:shadow-xl hover:-translate-y-1.5",
                  sectionAnim.visible ? "opacity-100 translate-x-0 translate-y-0 scale-100" : entranceClass
                )}
                style={{ transitionDelay: `${300 + i * 120}ms` }}
              >
                {/* Cover area with icon instead of gray placeholder */}
                <div className={cn("relative aspect-[4/3] flex items-center justify-center", config.iconBg)}>
                  <div className={cn("absolute -top-4 -end-4 w-20 h-20 rounded-full border-2 opacity-20 group-hover:scale-110 transition-transform duration-500", config.ring)} />
                  <div className={cn("absolute bottom-4 start-4 w-8 h-8 rounded-full border opacity-15", config.ring)} />
                  <CardIcon className={cn("w-16 h-16 transition-transform duration-500 group-hover:scale-110", config.iconText)} />
                  {/* Accent bar */}
                  <div className={cn("absolute bottom-0 inset-x-0 h-1", config.accent)} />
                </div>

                <div className="p-6">
                  <h3 className="font-serif text-lg text-text-primary mb-2 tracking-tight">
                    {isAr ? item.titleAr : item.titleEn}
                  </h3>
                  <p className="text-text-secondary text-sm leading-relaxed mb-5">
                    {isAr ? item.descriptionAr : item.descriptionEn}
                  </p>
                  <a
                    href={item.fileUrl}
                    className={cn(
                      "inline-flex items-center gap-2 text-white text-sm font-semibold px-5 py-2.5 rounded-full transition-all duration-300 hover:shadow-lg hover:scale-[1.02]",
                      config.accent
                    )}
                    download
                  >
                    <Download className="w-4 h-4" />
                    {isAr ? "تحميل PDF" : "Download PDF"}
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
