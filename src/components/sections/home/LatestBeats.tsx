"use client";

import { useRef, useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { Container } from "@/components/ui/Container";
import { SectionLabel } from "./SectionLabel";
import { ArrowLink } from "./ArrowLink";
import { cn } from "@/lib/utils";
import { Clock, ArrowUpRight } from "lucide-react";
import Image from "next/image";

const featuredArticle = {
  titleEn: "Key Insights From Our Community Building Workshop With Local Municipalities",
  titleAr: "رؤى رئيسية من ورشة عمل بناء المجتمع مع البلديات المحلية",
  imageUrl: "/images/new/classroom.jpg",
  slug: "community-building-workshop",
  dateEn: "Mar 15, 2026",
  dateAr: "١٥ مارس ٢٠٢٦",
};

const articles = [
  {
    id: "1",
    titleEn: "From Vision To Reality: Why Social Enterprise Matters Now More Than Ever",
    titleAr: "من الرؤية إلى الواقع: لماذا المؤسسات الاجتماعية مهمة أكثر من أي وقت مضى",
    imageUrl: "/images/new/pitch-winner.jpg",
    slug: "social-enterprise-matters",
    dateEn: "Mar 10, 2026",
    dateAr: "١٠ مارس ٢٠٢٦",
  },
  {
    id: "2",
    titleEn: "Bridging The Gap: From Research To Market In Social Innovation",
    titleAr: "سد الفجوة: من البحث إلى السوق في الابتكار الاجتماعي",
    imageUrl: "/images/new/market-booth.jpg",
    slug: "research-to-market",
    dateEn: "Mar 5, 2026",
    dateAr: "٥ مارس ٢٠٢٦",
  },
  {
    id: "3",
    titleEn: "Innovating The Youth Development Ecosystem In Lebanon",
    titleAr: "تطوير منظومة تنمية الشباب في لبنان",
    imageUrl: "/images/new/workshop-notes.jpg",
    slug: "youth-development-ecosystem",
    dateEn: "Feb 28, 2026",
    dateAr: "٢٨ فبراير ٢٠٢٦",
  },
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

export function LatestBeats() {
  const locale = useLocale();
  const isAr = locale === "ar";
  const { ref, visible } = useInView(0.08);

  return (
    <section className="py-16 md:py-24 bg-surface-primary relative overflow-hidden">
      {/* ═══ ABSTRACT SHAPES ═══ */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-14 -end-10 w-[240px] h-[240px] bg-brand-blue/[0.03] animate-[morph-blob_13s_ease-in-out_infinite]" style={{ borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%" }} />
        <div className="absolute -bottom-10 start-[8%] w-[200px] h-[200px] bg-red-400/[0.02] animate-[morph-blob_11s_ease-in-out_infinite_2.5s]" style={{ borderRadius: "40% 60% 70% 30% / 50% 60% 30% 60%" }} />
        <div className="absolute top-[6%] start-[3%] w-12 h-12 rounded-full border-2 border-brand-blue/[0.06] animate-[drift-horizontal_8s_ease-in-out_infinite]" />
        <div className="absolute bottom-[10%] end-[4%] w-4 h-4 rounded-full bg-amber-400/10 animate-[float-medium_5s_ease-in-out_infinite_0.6s]" />
        <div className="absolute top-[40%] end-[2%] w-3 h-3 bg-pink-400/10 rotate-45 animate-[float-slow_6s_ease-in-out_infinite_1s]" />
        <div className="absolute top-[20%] start-[5%] w-3 h-3 rounded-full bg-violet-400/10 animate-[float-medium_4s_ease-in-out_infinite_0.3s]" />
        <div className="absolute bottom-[20%] end-[15%] text-red-400/[0.05] animate-[float-slow_7s_ease-in-out_infinite_1.5s]">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" /></svg>
        </div>
        <svg className="absolute bottom-[6%] start-[20%] w-16 h-16 text-brand-blue/[0.04] animate-[float-slow_10s_ease-in-out_infinite]" viewBox="0 0 64 64" fill="none">
          <circle cx="32" cy="32" r="26" stroke="currentColor" strokeWidth="1" strokeDasharray="3 5" />
        </svg>
      </div>

      <Container>
        <div ref={ref}>
          {/* Section header — slide from left */}
          <div
            className={cn(
              "flex items-end justify-between mb-10 md:mb-14 transition-all duration-700 ease-out",
              visible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-10"
            )}
          >
            <div>
              <SectionLabel color="red" className="mb-4 block">
                {isAr ? "آخر الأخبار" : "Latest News"}
              </SectionLabel>
              <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-text-primary tracking-tight">
                {isAr ? "من مجتمعنا" : "From Our Community"}
              </h2>
            </div>
            <div className="hidden md:block">
              <ArrowLink href="/media/blog">
                {isAr ? "جميع المقالات" : "All Articles"}
              </ArrowLink>
            </div>
          </div>

          {/* Editorial grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
            {/* Featured Article — slide from left */}
            <div
              className={cn(
                "lg:col-span-7 transition-all duration-700 ease-out",
                visible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-12"
              )}
              style={{ transitionDelay: "100ms" }}
            >
              <article className="group relative rounded-2xl overflow-hidden cursor-pointer h-[340px] md:h-[480px]">
                <Image
                  src={featuredArticle.imageUrl}
                  alt=""
                  fill
                  className="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-105"
                  sizes="(max-width: 1024px) 100vw, 58vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-accent-navy/95 via-accent-navy/30 to-transparent" />
                <div className="absolute inset-0 grain-overlay" />

                <div className="absolute top-5 start-5 z-10">
                  <span className="bg-red-500 text-white text-[10px] font-bold uppercase tracking-[0.2em] px-3.5 py-1.5 rounded-full">
                    {isAr ? "مميز" : "Featured"}
                  </span>
                </div>

                <div className="absolute bottom-0 start-0 end-0 p-7 md:p-10 z-10">
                  <div className="flex items-center gap-2 text-white/45 text-xs mb-4">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{isAr ? featuredArticle.dateAr : featuredArticle.dateEn}</span>
                  </div>
                  <h2 className="font-serif text-2xl md:text-3xl lg:text-4xl text-white leading-[1.1] tracking-tight max-w-2xl">
                    {isAr ? featuredArticle.titleAr : featuredArticle.titleEn}
                  </h2>
                </div>

                <div className="absolute top-5 end-5 z-10 w-10 h-10 rounded-full bg-white/0 group-hover:bg-white/10 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-400">
                  <ArrowUpRight className="w-4 h-4 text-white" />
                </div>
              </article>
            </div>

            {/* Article sidebar — slide from right */}
            <div className="lg:col-span-5 flex flex-col gap-0">
              {articles.map((article, i) => (
                <article
                  key={article.id}
                  className={cn(
                    "group cursor-pointer flex gap-5 py-5 border-b border-surface-tertiary last:border-0 transition-all duration-700 ease-out",
                    visible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-10"
                  )}
                  style={{ transitionDelay: `${200 + i * 120}ms` }}
                >
                  <div className="relative w-24 h-24 md:w-28 md:h-28 flex-shrink-0 rounded-xl overflow-hidden">
                    <Image
                      src={article.imageUrl}
                      alt=""
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                      sizes="112px"
                    />
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex items-center gap-1.5 text-text-muted text-[11px] mb-2">
                      <Clock className="w-3 h-3" />
                      <span>{isAr ? article.dateAr : article.dateEn}</span>
                    </div>
                    <h3 className="font-semibold text-text-primary leading-snug text-[15px] line-clamp-2 group-hover:text-brand-blue-deeper transition-colors duration-300">
                      {isAr ? article.titleAr : article.titleEn}
                    </h3>
                  </div>
                </article>
              ))}

              <div className="mt-4 md:hidden">
                <ArrowLink href="/media/blog">
                  {isAr ? "جميع المقالات" : "All Articles"}
                </ArrowLink>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
