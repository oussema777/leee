"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { Container } from "@/components/ui/Container";
import { SectionLabel } from "./SectionLabel";
import { ArrowLink } from "./ArrowLink";
import { cn } from "@/lib/utils";
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

export function AboutSection() {
  const locale = useLocale();
  const isAr = locale === "ar";
  const { ref, visible: isVisible } = useInView(0.1);

  return (
    <section ref={ref} className="py-20 md:py-28 bg-white relative overflow-hidden">
      {/* ═══ ABSTRACT SHAPES ═══ */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 end-0 w-[600px] h-[600px] bg-brand-blue/[0.04] rounded-full blur-[100px] -translate-y-1/2 translate-x-1/4" />
        <div className="absolute -top-16 -start-10 w-[280px] h-[280px] bg-brand-blue/[0.03] animate-[morph-blob_14s_ease-in-out_infinite]" style={{ borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%" }} />
        <div className="absolute -bottom-12 end-[8%] w-[220px] h-[220px] bg-emerald-400/[0.03] animate-[morph-blob_11s_ease-in-out_infinite_3s]" style={{ borderRadius: "40% 60% 70% 30% / 50% 60% 30% 60%" }} />
        <div className="absolute top-[6%] end-[5%] w-16 h-16 rounded-full border-2 border-brand-blue/[0.07] animate-[drift-horizontal_8s_ease-in-out_infinite]" />
        <div className="absolute bottom-[10%] start-[3%] w-5 h-5 rounded-full bg-emerald-400/12 animate-[float-medium_5s_ease-in-out_infinite_0.6s]" />
        <div className="absolute top-[35%] end-[2%] w-4 h-4 bg-amber-400/10 rotate-45 animate-[float-slow_6s_ease-in-out_infinite_1s]" />
        <div className="absolute top-[18%] start-[6%] w-3 h-3 rounded-full bg-pink-400/12 animate-[float-medium_4s_ease-in-out_infinite_0.3s]" />
        <div className="absolute bottom-[25%] end-[20%] text-brand-blue/[0.06] animate-[float-slow_7s_ease-in-out_infinite_1.5s]">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" /></svg>
        </div>
        <svg className="absolute bottom-[8%] start-[15%] w-20 h-20 text-emerald-400/[0.04] animate-[float-slow_10s_ease-in-out_infinite]" viewBox="0 0 80 80" fill="none">
          <circle cx="40" cy="40" r="32" stroke="currentColor" strokeWidth="1" strokeDasharray="3 5" />
        </svg>
      </div>

      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-20 items-center">
          {/* Left Side — slide from left */}
          <div
            className={cn(
              "transition-all duration-700 ease-out",
              isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-12"
            )}
          >
            <SectionLabel color="blue" className="mb-6 block">
              {isAr ? "حول تجربة LEEE" : "About LEEE Experience"}
            </SectionLabel>

            <h2 className="font-serif text-3xl md:text-4xl lg:text-[2.75rem] xl:text-5xl text-text-primary leading-[1.08] tracking-tight mb-6">
              {isAr
                ? "نحوّل الأفكار المبتكرة إلى أثر مجتمعي مستدام."
                : "We turn innovative ideas into sustainable community impact."}
            </h2>
            <p className="text-text-secondary leading-relaxed mb-8 text-[15px]">
              {isAr
                ? "ندعم منذ أكثر من عقد رواد الأعمال الاجتماعيين والمجتمعات المحلية اللبنانية والشباب. انضم إلينا لبناء وتوسيع أثرك بدعم كامل من تجربة LEEE."
                : "We have been supporting innovative and driven Lebanese social entrepreneurs, communities and youth for over a decade now. Join us to build and scale your impact with the full support of The LEEE Experience."}
            </p>

            <div className={cn(
              "transition-all duration-700 ease-out",
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )} style={{ transitionDelay: "300ms" }}>
              <ArrowLink href="/about/overview">
                {isAr ? "اعرف المزيد عنا" : "Learn more about us"}
              </ArrowLink>
            </div>
          </div>

          {/* Right Side — 3 Image Collage — slide from right */}
          <div
            className={cn(
              "relative h-[380px] md:h-[480px] transition-all duration-700 ease-out",
              isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-12"
            )}
            style={{ transitionDelay: "150ms" }}
          >
            {/* Main large image — top left */}
            <div className={cn(
              "absolute top-0 start-0 w-[60%] h-[62%] rounded-2xl overflow-hidden shadow-2xl shadow-brand-blue/10 transition-all duration-700 ease-out",
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-6"
            )} style={{ transitionDelay: "200ms" }}>
              <Image
                src="/images/new/lee-vest.jpg"
                alt=""
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 60vw, 30vw"
              />
            </div>

            {/* Second image — top right, overlapping */}
            <div className={cn(
              "absolute top-[5%] end-0 w-[45%] h-[50%] rounded-2xl overflow-hidden shadow-xl shadow-brand-blue/10 border-4 border-white transition-all duration-700 ease-out",
              isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
            )} style={{ transitionDelay: "350ms" }}>
              <Image
                src="/images/new/award-winner.jpg"
                alt=""
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 45vw, 22vw"
              />
            </div>

            {/* Third image — bottom center */}
            <div className={cn(
              "absolute bottom-0 start-[18%] w-[55%] h-[42%] rounded-2xl overflow-hidden shadow-xl shadow-brand-blue/10 border-4 border-white transition-all duration-700 ease-out",
              isVisible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-6 scale-95"
            )} style={{ transitionDelay: "500ms" }}>
              <Image
                src="/images/new/coaching-session.jpg"
                alt=""
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 55vw, 28vw"
              />
            </div>

            {/* Floating decorative elements */}
            <div className="absolute -top-2 end-[12%] w-12 h-12 rounded-full bg-brand-blue flex items-center justify-center shadow-lg animate-[float-slow_4s_ease-in-out_infinite]">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
            <div className="absolute top-[45%] -start-2 w-10 h-10 rounded-full bg-emerald-400 flex items-center justify-center shadow-lg animate-[float-medium_5s_ease-in-out_infinite_0.5s]">
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
              </svg>
            </div>
            <div className="absolute bottom-[15%] end-[5%] w-4 h-4 rounded-full bg-pink-400 animate-[float-slow_3.5s_ease-in-out_infinite_1s]" />
            <div className="absolute bottom-[5%] end-[20%] text-amber-400 animate-[float-medium_4.5s_ease-in-out_infinite_0.8s]">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
              </svg>
            </div>
            <div className="absolute top-[30%] end-[-3%] w-8 h-8 rounded-full border-2 border-brand-blue/30 animate-[float-medium_6s_ease-in-out_infinite_0.3s]" />

            {/* Decorative accent line */}
            <div className="absolute -bottom-3 start-[30%] w-20 h-1 bg-brand-blue rounded-full" />
          </div>
        </div>
      </Container>
    </section>
  );
}
