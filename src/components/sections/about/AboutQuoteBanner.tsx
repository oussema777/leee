"use client";

import { useRef, useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { cn } from "@/lib/utils";
import Image from "next/image";

function useInView(threshold = 0.2) {
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

export function AboutQuoteBanner() {
  const locale = useLocale();
  const isAr = locale === "ar";
  const sectionAnim = useInView(0.15);

  return (
    <section
      ref={sectionAnim.ref}
      className="relative py-24 md:py-32 overflow-hidden"
    >
      {/* Background image */}
      <Image
        src="/images/new/stage-group.jpg"
        alt=""
        fill
        className="object-cover"
        sizes="100vw"
      />
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-accent-navy/90 via-brand-blue-deeper/85 to-accent-slate/90" />
      <div className="absolute inset-0 grain-overlay pointer-events-none" />

      {/* ═══ ABSTRACT SHAPES ═══ */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Giant rings */}
        <div className="absolute -top-20 -start-20 w-[400px] h-[400px] rounded-full border border-white/[0.04] animate-[drift-horizontal_18s_ease-in-out_infinite]" />
        <div className="absolute -bottom-20 -end-20 w-[350px] h-[350px] rounded-full border border-white/[0.03] animate-[drift-horizontal_20s_ease-in-out_infinite_3s]" />

        {/* Colored floating shapes */}
        <div className="absolute top-[8%] end-[10%] w-20 h-20 rounded-full border-2 border-white/[0.08] animate-[float-slow_8s_ease-in-out_infinite]" />
        <div className="absolute top-[30%] start-[5%] w-8 h-8 rounded-full bg-emerald-400/20 animate-[float-medium_6s_ease-in-out_infinite_0.5s]" />
        <div className="absolute bottom-[15%] end-[8%] text-amber-400/20 animate-[float-slow_5s_ease-in-out_infinite_1s]">
          <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor"><path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" /></svg>
        </div>
        <div className="absolute top-[15%] start-[20%] w-4 h-4 rounded-full bg-pink-400/20 animate-[drift-horizontal_7s_ease-in-out_infinite_0.8s]" />
        <div className="absolute bottom-[20%] start-[45%] w-5 h-5 rounded-full bg-cyan-400/15 animate-[float-slow_6.5s_ease-in-out_infinite_1.5s]" />
        <div className="absolute top-[60%] end-[25%] text-white/[0.08] rotate-[25deg] animate-[float-medium_7s_ease-in-out_infinite_0.3s]">
          <svg className="w-5 h-5" viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth={2}><path d="M12 4v16M4 12h16" /></svg>
        </div>
        <div className="absolute bottom-[30%] start-[8%] w-3 h-3 bg-violet-400/20 rotate-45 animate-[float-slow_5s_ease-in-out_infinite_1.2s]" />

        {/* Particles */}
        {[...Array(10)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white/15 animate-float-particle"
            style={{
              width: `${2 + (i % 3)}px`,
              height: `${2 + (i % 3)}px`,
              left: `${8 + (i * 9.2) % 84}%`,
              top: `${10 + (i * 8.1) % 80}%`,
              animationDelay: `${(i * 0.7) % 6}s`,
              animationDuration: `${5 + (i % 4) * 1.5}s`,
            }}
          />
        ))}

        {/* Dotted arc */}
        <svg className="absolute top-[20%] end-[5%] w-32 h-32 text-white/[0.04] animate-[float-slow_12s_ease-in-out_infinite]" viewBox="0 0 128 128" fill="none">
          <circle cx="64" cy="64" r="55" stroke="currentColor" strokeWidth="1" strokeDasharray="4 6" />
        </svg>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 sm:px-10 text-center">
        <div
          className={cn(
            "transition-all duration-800 ease-out",
            sectionAnim.visible ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-8"
          )}
        >
          <div className="text-brand-blue/30 text-[80px] md:text-[120px] font-serif leading-none mb-[-20px] md:mb-[-40px]">
            &ldquo;
          </div>

          <blockquote className="font-serif text-2xl md:text-3xl lg:text-4xl text-white leading-[1.2] tracking-tight">
            {isAr
              ? "ولدنا في الأزمة. بُنينا من أجل التغيير. لا ننتظر الإذن للتحرك—نبني الجسور بين البقاء والطموح."
              : "Born in crisis. Built for change. We don't wait for permission to act—we build bridges between survival and ambition."}
          </blockquote>

          <div className="mt-8 flex items-center justify-center gap-3">
            <div className="w-10 h-[2px] bg-brand-blue rounded-full" />
            <span className="text-white/50 text-sm font-medium tracking-wider uppercase">
              {isAr ? "تجربة LEEE" : "The LEEE Experience"}
            </span>
            <div className="w-10 h-[2px] bg-brand-blue rounded-full" />
          </div>
        </div>
      </div>
    </section>
  );
}
