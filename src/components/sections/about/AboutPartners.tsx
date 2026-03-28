"use client";

import { useRef, useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { Container } from "@/components/ui/Container";
import { cn } from "@/lib/utils";
import Image from "next/image";

const partners = [
  { id: "ilo", name: "ILO" },
  { id: "eu", name: "European Union" },
  { id: "unifil", name: "UNIFIL" },
  { id: "wfp", name: "World Food Programme" },
  { id: "undp", name: "UNDP" },
  { id: "irc", name: "Int'l Rescue Committee" },
  { id: "canada", name: "Gov. of Canada" },
  { id: "netherlands", name: "Gov. of Netherlands" },
  { id: "norway", name: "Gov. of Norway" },
  { id: "bmz", name: "BMZ Germany" },
  { id: "usaid", name: "USAID" },
  { id: "cawtar", name: "CAWTAR" },
  { id: "kvinna", name: "Kvinna till Kvinna" },
  { id: "solidarites", name: "Solidarités Int'l" },
  { id: "ri", name: "Relief International" },
  { id: "oxfam", name: "Oxfam" },
  { id: "aah", name: "Action Against Hunger" },
  { id: "berytech", name: "Berytech" },
  { id: "worldbank", name: "World Bank" },
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

export function AboutPartners() {
  const locale = useLocale();
  const isAr = locale === "ar";
  const sectionAnim = useInView(0.08);

  return (
    <section ref={sectionAnim.ref} className="py-20 md:py-28 bg-surface-secondary relative overflow-hidden">
      {/* ═══ ABSTRACT SHAPES ═══ */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-10 start-[15%] w-[200px] h-[200px] bg-brand-blue/[0.03] animate-[morph-blob_12s_ease-in-out_infinite]"
          style={{ borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%" }}
        />
        <div
          className="absolute bottom-[5%] end-[10%] w-[160px] h-[160px] bg-emerald-400/[0.03] animate-[morph-blob_10s_ease-in-out_infinite_2s]"
          style={{ borderRadius: "40% 60% 70% 30% / 50% 60% 30% 60%" }}
        />
        <div className="absolute top-[6%] start-[4%] w-14 h-14 rounded-full border-2 border-brand-blue/[0.07] animate-[drift-horizontal_8s_ease-in-out_infinite]" />
        <div className="absolute top-[8%] end-[8%] w-5 h-5 rounded-full bg-emerald-400/12 animate-[float-medium_5s_ease-in-out_infinite_0.5s]" />
        <div className="absolute bottom-[8%] start-[10%] text-amber-400/12 animate-[float-slow_6s_ease-in-out_infinite_0.9s]">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" /></svg>
        </div>
        <div className="absolute bottom-[20%] end-[15%] w-3 h-3 rounded-full bg-pink-400/10 animate-[float-medium_4.5s_ease-in-out_infinite_1.2s]" />
        <div className="absolute top-[35%] end-[3%] w-4 h-4 bg-violet-400/10 rotate-45 animate-[float-slow_5s_ease-in-out_infinite_0.7s]" />
        <svg className="absolute bottom-[12%] start-[25%] w-20 h-20 text-brand-blue/[0.04] animate-[float-slow_10s_ease-in-out_infinite]" viewBox="0 0 80 80" fill="none">
          <circle cx="40" cy="40" r="32" stroke="currentColor" strokeWidth="1" strokeDasharray="3 5" />
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
            {isAr ? "شركاؤنا" : "Our Partners"}
            <span className="w-6 h-[1.5px] bg-brand-blue" />
          </span>
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-text-primary tracking-tight mb-4">
            {isAr ? "شبكة الشراكات" : "Partner Network"}
          </h2>
          <p className="text-text-secondary text-[15px] max-w-2xl mx-auto leading-relaxed">
            {isAr
              ? "نتعاون مع مؤسسات دولية رائدة لتعظيم أثرنا في منطقة الشرق الأوسط وأفريقيا."
              : "We collaborate with leading international organizations to maximize our impact across MENA and Africa."}
          </p>
        </div>

        {/* Image banner */}
        <div
          className={cn(
            "grid grid-cols-3 gap-2 mb-12 transition-all duration-700",
            sectionAnim.visible ? "opacity-100 scale-100" : "opacity-0 scale-95"
          )}
          style={{ transitionDelay: "100ms" }}
        >
          {["/images/new/group-photo.jpg", "/images/new/intl-professionals.jpg", "/images/new/award-winner.jpg"].map((src, i) => (
            <div key={i} className="relative aspect-[3/1] rounded-xl overflow-hidden group">
              <Image src={src} alt="" fill className="object-cover group-hover:scale-110 transition-transform duration-700" sizes="33vw" />
              <div className="absolute inset-0 bg-accent-navy/10 group-hover:bg-transparent transition-colors" />
            </div>
          ))}
        </div>

        {/* Partner logo grid — staggered scale in */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
          {partners.map((partner, i) => {
            const fromLeft = i % 3 === 0;
            const fromRight = i % 3 === 2;
            return (
              <div
                key={partner.id}
                className={cn(
                  "bg-white rounded-xl border border-surface-tertiary p-4 md:p-5 flex items-center justify-center h-20 transition-all duration-600 ease-out hover:shadow-md hover:border-brand-blue/20 hover:-translate-y-0.5",
                  sectionAnim.visible
                    ? "opacity-100 translate-x-0 scale-100"
                    : fromLeft
                      ? "opacity-0 -translate-x-6 scale-95"
                      : fromRight
                        ? "opacity-0 translate-x-6 scale-95"
                        : "opacity-0 scale-90"
                )}
                style={{ transitionDelay: `${200 + i * 35}ms` }}
              >
                <span className="text-text-muted text-xs font-semibold text-center leading-tight">
                  {partner.name}
                </span>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
