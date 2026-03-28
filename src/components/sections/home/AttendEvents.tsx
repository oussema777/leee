"use client";

import { useRef, useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { SectionLabel } from "./SectionLabel";
import { ArrowLink } from "./ArrowLink";
import { cn } from "@/lib/utils";
import { CalendarDays, MapPin } from "lucide-react";
import Image from "next/image";

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

export function AttendEvents() {
  const locale = useLocale();
  const isAr = locale === "ar";
  const { ref: sectionRef, visible } = useInView(0.1);

  return (
    <section ref={sectionRef} className="relative overflow-hidden bg-accent-ice">
      {/* ═══ ABSTRACT SHAPES ═══ */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-14 start-[20%] w-[220px] h-[220px] bg-brand-blue/[0.03] animate-[morph-blob_13s_ease-in-out_infinite]" style={{ borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%" }} />
        <div className="absolute -bottom-10 end-[5%] w-[180px] h-[180px] bg-amber-400/[0.03] animate-[morph-blob_10s_ease-in-out_infinite_2s]" style={{ borderRadius: "40% 60% 70% 30% / 50% 60% 30% 60%" }} />
        <div className="absolute top-[8%] start-[4%] w-12 h-12 rounded-full border-2 border-brand-blue/[0.07] animate-[drift-horizontal_8s_ease-in-out_infinite]" />
        <div className="absolute bottom-[12%] end-[48%] w-4 h-4 rounded-full bg-emerald-400/12 animate-[float-medium_5s_ease-in-out_infinite_0.6s]" />
        <div className="absolute top-[30%] start-[2%] w-3 h-3 bg-pink-400/10 rotate-45 animate-[float-slow_6s_ease-in-out_infinite_1s]" />
        <div className="absolute bottom-[8%] start-[15%] text-amber-400/10 animate-[float-slow_7s_ease-in-out_infinite_1.5s]">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" /></svg>
        </div>
        <svg className="absolute top-[15%] end-[48%] w-16 h-16 text-brand-blue/[0.04] animate-[float-slow_10s_ease-in-out_infinite]" viewBox="0 0 64 64" fill="none">
          <circle cx="32" cy="32" r="26" stroke="currentColor" strokeWidth="1" strokeDasharray="3 5" />
        </svg>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[520px] md:min-h-[580px]">
        {/* Text Side — slide from left */}
        <div className="relative flex items-center px-6 sm:px-10 lg:px-16 xl:px-20 py-16 md:py-20 order-2 lg:order-1">
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: "radial-gradient(circle, #5895D0 1px, transparent 1px)",
              backgroundSize: "28px 28px",
            }}
          />

          <div
            className={cn(
              "relative z-10 max-w-lg transition-all duration-700 ease-out",
              visible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-12"
            )}
          >
            <SectionLabel color="yellow" className="mb-6 block">
              {isAr ? "احضر فعالياتنا" : "Attend Events"}
            </SectionLabel>

            <h2 className="font-serif text-3xl md:text-4xl lg:text-[2.75rem] xl:text-5xl text-text-primary leading-[1.08] tracking-tight mb-6">
              {isAr
                ? "استكشف مشهد الفعاليات نحو التغيير"
                : "Explore the event landscape gearing towards change"}
            </h2>

            <p className="text-text-secondary leading-relaxed mb-10 text-[15px]">
              {isAr
                ? "انضم إلينا في فعاليات تجمع المبتكرين وصناع التغيير والمجتمعات لإحداث أثر حقيقي"
                : "Join us at events that bring together innovators, changemakers, and communities to create real impact"}
            </p>

            {/* Next event card — scale in */}
            <div className={cn(
              "bg-white p-5 rounded-xl mb-10 border-s-[3px] border-brand-blue shadow-sm transition-all duration-700 ease-out",
              visible ? "opacity-100 scale-100" : "opacity-0 scale-90"
            )} style={{ transitionDelay: "200ms" }}>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-brand-blue-light flex items-center justify-center flex-shrink-0">
                  <CalendarDays className="w-5 h-5 text-brand-blue-deeper" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-blue mb-1.5">
                    {isAr ? "الفعالية القادمة" : "Next Event"}
                  </p>
                  <p className="text-sm font-bold text-text-primary mb-1">
                    {isAr ? "ورشة عمل بناء المجتمع" : "Community Building Workshop"}
                  </p>
                  <p className="text-xs text-text-muted flex items-center gap-1.5">
                    <MapPin className="w-3 h-3" />
                    {isAr ? "بيروت، لبنان" : "Beirut, Lebanon"}
                  </p>
                </div>
              </div>
            </div>

            <div className={cn(
              "transition-all duration-700 ease-out",
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )} style={{ transitionDelay: "350ms" }}>
              <ArrowLink href="/media/events">
                {isAr ? "شاهد جميع الفعاليات" : "See all events"}
              </ArrowLink>
            </div>
          </div>
        </div>

        {/* Image Side — slide from right */}
        <div
          className={cn(
            "relative h-[350px] lg:h-auto order-1 lg:order-2 transition-all duration-1000 ease-out",
            visible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-12"
          )}
          style={{ transitionDelay: "150ms" }}
        >
          <Image
            src="/images/new/conference-room.jpg"
            alt="Events"
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-brand-blue-deeper/15 to-transparent" />
          <div className="absolute inset-0 grain-overlay" />

          {/* Diagonal clip */}
          <div
            className="absolute inset-y-0 start-0 w-28 bg-accent-ice hidden lg:block"
            style={{
              clipPath: "polygon(0 0, 100% 5%, 40% 100%, 0% 100%)",
            }}
          />
        </div>
      </div>
    </section>
  );
}
