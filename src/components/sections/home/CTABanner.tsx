"use client";

import { useRef, useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

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

export function CTABanner() {
  const locale = useLocale();
  const isAr = locale === "ar";
  const { ref, visible } = useInView(0.15);

  return (
    <section className="relative overflow-hidden">
      {/* Wave divider */}
      <div className="relative -mb-px">
        <svg
          viewBox="0 0 1440 60"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-auto block"
          preserveAspectRatio="none"
        >
          <path
            d="M0 60V30C360 60 720 0 1080 20C1260 30 1380 50 1440 30V60H0Z"
            fill="#1B3A5C"
          />
        </svg>
      </div>

      <div ref={ref} className="bg-gradient-to-br from-accent-navy via-brand-blue-deeper to-accent-steel relative py-20 md:py-24">
        <div className="absolute inset-0 grain-overlay pointer-events-none" />

        {/* ═══ ABSTRACT SHAPES ═══ */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Giant rings */}
          <div className="absolute -top-16 -start-16 w-[300px] h-[300px] rounded-full border border-white/[0.04] animate-[drift-horizontal_16s_ease-in-out_infinite]" />
          <div className="absolute -bottom-12 -end-12 w-[250px] h-[250px] rounded-full border border-white/[0.03] animate-[drift-horizontal_18s_ease-in-out_infinite_2s]" />
          {/* Morphing blobs */}
          <div className="absolute top-[5%] end-[12%] w-[180px] h-[180px] bg-brand-blue/[0.05] animate-[morph-blob_12s_ease-in-out_infinite]" style={{ borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%" }} />
          <div className="absolute bottom-[8%] start-[8%] w-[140px] h-[140px] bg-emerald-400/[0.03] animate-[morph-blob_10s_ease-in-out_infinite_2.5s]" style={{ borderRadius: "40% 60% 70% 30% / 50% 60% 30% 60%" }} />
          {/* Colored shapes */}
          <div className="absolute top-6 start-[10%] w-20 h-20 rounded-full border border-white/10 animate-[float-slow_8s_ease-in-out_infinite]" />
          <div className="absolute bottom-8 end-[15%] w-32 h-32 rounded-full border border-white/[0.06] animate-[float-slow_10s_ease-in-out_infinite_1s]" />
          <div className="absolute top-1/2 end-[8%] w-3 h-3 rounded-full bg-white/20 animate-[float-medium_5s_ease-in-out_infinite_0.5s]" />
          <div className="absolute top-4 start-[40%] w-2 h-2 rounded-full bg-white/15 animate-[float-slow_4s_ease-in-out_infinite_1.2s]" />
          <div className="absolute bottom-[20%] start-[30%] text-amber-400/15 animate-[float-slow_6s_ease-in-out_infinite_0.8s]">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" /></svg>
          </div>
          <div className="absolute top-[15%] end-[25%] w-4 h-4 rounded-full bg-emerald-400/15 animate-[drift-horizontal_7s_ease-in-out_infinite_0.6s]" />
          <div className="absolute bottom-[15%] end-[5%] w-3 h-3 bg-pink-400/15 rotate-45 animate-[float-medium_5s_ease-in-out_infinite_1s]" />
          {/* Dotted arc */}
          <svg className="absolute top-[10%] start-[25%] w-20 h-20 text-white/[0.04] animate-[float-slow_12s_ease-in-out_infinite]" viewBox="0 0 80 80" fill="none">
            <circle cx="40" cy="40" r="32" stroke="currentColor" strokeWidth="1" strokeDasharray="3 5" />
          </svg>
          {/* Particles */}
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white/15 animate-float-particle"
              style={{
                width: `${2 + (i % 3)}px`,
                height: `${2 + (i % 3)}px`,
                left: `${10 + (i * 11) % 80}%`,
                top: `${15 + (i * 9.5) % 70}%`,
                animationDelay: `${(i * 0.8) % 5}s`,
                animationDuration: `${5 + (i % 3) * 1.5}s`,
              }}
            />
          ))}
        </div>

        <Container>
          <div
            className={cn(
              "flex flex-col items-center text-center transition-all duration-700 ease-out",
              visible ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-6"
            )}
          >
            <span className="w-12 h-[2px] bg-brand-blue mb-8 rounded-full" />

            <h2 className={cn(
              "font-serif text-2xl md:text-3xl lg:text-[2.75rem] text-white leading-tight mb-5 max-w-2xl tracking-tight transition-all duration-700",
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )} style={{ transitionDelay: "150ms" }}>
              {isAr
                ? "هل تبدأ رحلتك نحو الأثر الاجتماعي؟"
                : "Starting your journey towards social impact?"}
            </h2>
            <p className={cn(
              "text-white/50 text-base md:text-lg mb-10 max-w-lg transition-all duration-700",
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )} style={{ transitionDelay: "250ms" }}>
              {isAr
                ? "لا تفعل ذلك وحدك. نحن هنا للمساعدة."
                : "Don\u2019t do it alone. We\u2019re here to help."}
            </p>

            <Link
              href="/contact"
              className={cn(
                "group inline-flex items-center gap-3 bg-white text-brand-blue-deeper font-bold text-sm uppercase tracking-[0.15em] px-10 py-4 rounded-full shadow-[0_4px_20px_rgba(255,255,255,0.2)] hover:shadow-[0_6px_30px_rgba(255,255,255,0.3)] hover:scale-105 transition-all duration-500",
                visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              )}
              style={{ transitionDelay: "350ms" }}
            >
              {isAr ? "تواصل معنا" : "Get in Touch"}
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
            </Link>
          </div>
        </Container>
      </div>
    </section>
  );
}
