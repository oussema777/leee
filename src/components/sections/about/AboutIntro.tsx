"use client";

import { useRef, useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { Container } from "@/components/ui/Container";
import { cn } from "@/lib/utils";
import { Globe, Users, FolderKanban, MapPin } from "lucide-react";
import Image from "next/image";

const highlights = [
  { icon: Globe, valueEn: "10", labelEn: "Countries", labelAr: "دول", valueAr: "١٠", color: "bg-brand-blue/10 text-brand-blue" },
  { icon: Users, valueEn: "38,790+", labelEn: "Lives Touched", labelAr: "حياة تأثرت", valueAr: "+٣٨,٧٩٠", color: "bg-emerald-50 text-emerald-500" },
  { icon: FolderKanban, valueEn: "32", labelEn: "Projects", labelAr: "مشروعاً", valueAr: "٣٢", color: "bg-amber-50 text-amber-500" },
  { icon: MapPin, valueEn: "9", labelEn: "Branches", labelAr: "فروع", valueAr: "٩", color: "bg-pink-50 text-pink-500" },
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

export function AboutIntro() {
  const locale = useLocale();
  const isAr = locale === "ar";
  const sectionAnim = useInView(0.1);
  const imagesAnim = useInView(0.15);

  return (
    <section ref={sectionAnim.ref} className="py-20 md:py-28 bg-surface-primary relative overflow-hidden">
      {/* ═══ ABSTRACT SHAPES ═══ */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Morphing blobs */}
        <div
          className="absolute -top-20 -end-20 w-[350px] h-[350px] bg-brand-blue/[0.03] animate-[morph-blob_14s_ease-in-out_infinite]"
          style={{ borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%" }}
        />
        <div
          className="absolute -bottom-16 -start-16 w-[280px] h-[280px] bg-emerald-400/[0.03] animate-[morph-blob_11s_ease-in-out_infinite_3s]"
          style={{ borderRadius: "40% 60% 70% 30% / 50% 60% 30% 60%" }}
        />

        {/* Circles & rings */}
        <div className="absolute top-[8%] end-[6%] w-16 h-16 rounded-full border-2 border-brand-blue/10 animate-[drift-horizontal_8s_ease-in-out_infinite]" />
        <div className="absolute bottom-[12%] start-[4%] w-5 h-5 rounded-full bg-emerald-400/20 animate-[float-medium_5s_ease-in-out_infinite_0.6s]" />
        <div className="absolute top-[45%] end-[3%] w-4 h-4 bg-amber-400/15 rotate-45 animate-[float-slow_6s_ease-in-out_infinite_1s]" />
        <div className="absolute top-[15%] start-[10%] w-3 h-3 rounded-full bg-pink-400/15 animate-[float-medium_4.5s_ease-in-out_infinite_0.3s]" />
        <div className="absolute top-[60%] end-[18%] w-3 h-3 rounded-full bg-violet-400/15 animate-[float-slow_5.5s_ease-in-out_infinite_1.5s]" />
        <div className="absolute bottom-[30%] start-[20%] w-12 h-12 rounded-full border border-pink-400/[0.08] animate-[float-slow_7s_ease-in-out_infinite_0.5s]" />

        {/* Stars */}
        <div className="absolute top-[25%] start-[3%] text-amber-400/15 animate-[float-slow_6s_ease-in-out_infinite_0.8s]">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" /></svg>
        </div>
        <div className="absolute bottom-[8%] end-[30%] text-brand-blue/10 animate-[float-medium_5s_ease-in-out_infinite_1.2s]">
          <svg className="w-5 h-5" viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth={2}><path d="M12 4v16M4 12h16" /></svg>
        </div>

        {/* Dotted circle arc */}
        <svg className="absolute bottom-[15%] end-[5%] w-28 h-28 text-brand-blue/[0.05] animate-[float-slow_10s_ease-in-out_infinite]" viewBox="0 0 112 112" fill="none">
          <circle cx="56" cy="56" r="48" stroke="currentColor" strokeWidth="1.5" strokeDasharray="5 7" />
        </svg>
      </div>

      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-14 lg:gap-16 items-start">
          {/* LEFT — About text (slide from left) */}
          <div
            className={cn(
              "lg:col-span-5 transition-all duration-800 ease-out",
              sectionAnim.visible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-14"
            )}
          >
            <span className="inline-flex items-center gap-3 text-brand-blue text-[11px] font-bold uppercase tracking-[0.3em] mb-5">
              <span className="w-8 h-[2px] bg-brand-blue rounded-full" />
              {isAr ? "من نحن" : "About LEEE Experience"}
            </span>

            <h2 className="font-serif text-3xl md:text-4xl lg:text-[2.75rem] text-text-primary leading-[1.08] tracking-tight mb-6">
              {isAr
                ? "نحوّل الأفكار المبتكرة إلى أثر مجتمعي مستدام."
                : "We turn innovative ideas into sustainable community impact."}
            </h2>

            <div className="space-y-4 text-text-secondary text-[15px] leading-relaxed">
              <p>
                {isAr
                  ? "منذ عام 2020، تقف تجربة LEEE عند تقاطع القيادة وريادة الأعمال وتنمية التوظيف، لإعادة تعريف معنى بناء اقتصادات عادلة وخضراء وشاملة في الأسواق الناشئة."
                  : "Since 2020, The LEE Experience has stood at the intersection of Leadership, Entrepreneurship, and Employment Development, redefining what it means to build equitable, green, and inclusive economies in post-crisis and emerging markets across the MENA region and Africa."}
              </p>
              <p>
                {isAr
                  ? "نعمل عبر 10 دول، حيث سرنا إلى جانب أكثر من 38,790 فرداً—ليس كمستفيدين، بل كشركاء في صنع اقتصادات مرنة وخضراء وشاملة."
                  : "Today, we operate across 10 countries, having walked alongside 38,790+ individuals—not as beneficiaries, but as co-creators of resilient, green, inclusive economies."}
              </p>
            </div>

            {/* Image strip below text */}
            <div className="grid grid-cols-3 gap-2 mt-8">
              {["/images/new/hands-on-work.jpg", "/images/new/market-booth.jpg", "/images/new/greenhouse-visit.jpg"].map((src, i) => (
                <div
                  key={i}
                  className={cn(
                    "relative aspect-[4/3] rounded-xl overflow-hidden transition-all duration-700 ease-out group",
                    sectionAnim.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
                  )}
                  style={{ transitionDelay: `${500 + i * 120}ms` }}
                >
                  <Image src={src} alt="" fill className="object-cover group-hover:scale-110 transition-transform duration-700" sizes="20vw" />
                  <div className="absolute inset-0 bg-gradient-to-t from-accent-navy/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))}
            </div>
          </div>

          {/* CENTER — Image mosaic (scale in + rotate) */}
          <div ref={imagesAnim.ref} className="lg:col-span-4">
            <div className="grid grid-cols-2 gap-3">
              <div
                className={cn(
                  "col-span-2 relative aspect-[16/11] rounded-2xl overflow-hidden shadow-lg transition-all duration-700 ease-out",
                  imagesAnim.visible ? "opacity-100 scale-100" : "opacity-0 scale-90"
                )}
                style={{ transitionDelay: "200ms" }}
              >
                <Image src="/images/new/stage-group.jpg" alt="" fill className="object-cover" sizes="35vw" />
                <div className="absolute inset-0 bg-gradient-to-t from-accent-navy/30 to-transparent" />
                <div className="absolute top-3 end-3 w-8 h-8 border-2 border-white/30 rounded-full" />
              </div>
              <div
                className={cn(
                  "relative aspect-square rounded-xl overflow-hidden shadow-md transition-all duration-700 ease-out",
                  imagesAnim.visible ? "opacity-100 translate-y-0 rotate-0" : "opacity-0 translate-y-8 -rotate-3"
                )}
                style={{ transitionDelay: "400ms" }}
              >
                <Image src="/images/new/coaching-session.jpg" alt="" fill className="object-cover hover:scale-110 transition-transform duration-700" sizes="18vw" />
              </div>
              <div
                className={cn(
                  "relative aspect-square rounded-xl overflow-hidden shadow-md transition-all duration-700 ease-out",
                  imagesAnim.visible ? "opacity-100 translate-y-0 rotate-0" : "opacity-0 translate-y-8 rotate-3"
                )}
                style={{ transitionDelay: "550ms" }}
              >
                <Image src="/images/new/women-thumbsup.jpg" alt="" fill className="object-cover hover:scale-110 transition-transform duration-700" sizes="18vw" />
                <div className="absolute bottom-2 start-2 w-5 h-5 rounded-full bg-emerald-400/40 backdrop-blur-sm" />
              </div>
            </div>
          </div>

          {/* RIGHT — Highlight numbers (slide from right, staggered) */}
          <div className="lg:col-span-3">
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
              {highlights.map((item, i) => {
                const Icon = item.icon;
                const fromRight = i % 2 === 1;
                return (
                  <div
                    key={item.labelEn}
                    className={cn(
                      "bg-surface-secondary rounded-2xl p-5 border border-surface-tertiary transition-all duration-700 ease-out hover:shadow-md hover:-translate-y-1 hover:border-brand-blue/15 relative overflow-hidden",
                      sectionAnim.visible ? "opacity-100 translate-x-0" : fromRight ? "opacity-0 translate-x-10" : "opacity-0 translate-x-10"
                    )}
                    style={{ transitionDelay: `${300 + i * 120}ms` }}
                  >
                    {/* Per-card abstract ring */}
                    <div className={cn("absolute -top-4 -end-4 w-16 h-16 rounded-full border border-current opacity-10", item.color.split(" ")[1])} />

                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3", item.color)}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="font-serif text-2xl md:text-3xl text-text-primary mb-1 tabular-nums">
                      {isAr ? item.valueAr : item.valueEn}
                    </div>
                    <div className="text-text-muted text-xs font-medium uppercase tracking-[0.15em]">
                      {isAr ? item.labelAr : item.labelEn}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
