"use client";

import { useState, useEffect, useCallback } from "react";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { ArrowRight, ChevronRight } from "lucide-react";
import Image from "next/image";

const demoSlides = [
  {
    id: "1",
    tagEn: "Leadership & Impact",
    tagAr: "القيادة والأثر",
    titleEn: "Mindset is the first investment.",
    titleAr: "العقلية هي الاستثمار الأول.",
    subtitleLines: [
      { textEn: "Resilient businesses.", textAr: "أعمال مرنة.", highlight: false },
      { textEn: "Green economies.", textAr: "اقتصادات خضراء.", highlight: false },
      { textEn: "The future starts here.", textAr: "المستقبل يبدأ هنا.", highlight: true },
    ],
    ctaLabelEn: "Explore Our Pathways",
    ctaLabelAr: "استكشف مساراتنا",
    ctaUrl: "/programs",
    images: [
      "/images/new/stage-group.jpg",
      "/images/new/pitch-winner.jpg",
      "/images/new/coaching-session.jpg",
    ],
  },
  {
    id: "2",
    tagEn: "Global Reach",
    tagAr: "الوصول العالمي",
    titleEn: "Where mindset becomes movement.",
    titleAr: "حيث تصبح العقلية حركة.",
    subtitleLines: [
      { textEn: "10 countries.", textAr: "10 دول.", highlight: false },
      { textEn: "38,790+ lives.", textAr: "+38,790 حياة.", highlight: false },
      { textEn: "One mission.", textAr: "مهمة واحدة.", highlight: true },
    ],
    ctaLabelEn: "See Impact in Numbers",
    ctaLabelAr: "شاهد الأثر بالأرقام",
    ctaUrl: "/impact",
    images: [
      "/images/new/women-thumbsup.jpg",
      "/images/new/intl-professionals.jpg",
      "/images/new/conference-room.jpg",
    ],
  },
  {
    id: "3",
    tagEn: "Innovation",
    tagAr: "الابتكار",
    titleEn: "Your green business. In your pocket.",
    titleAr: "مشروعك الأخضر. في جيبك.",
    subtitleLines: [
      { textEn: "Marketplace & classroom.", textAr: "سوق وفصل دراسي.", highlight: false },
      { textEn: "Mentor network.", textAr: "شبكة مرشدين.", highlight: false },
      { textEn: "Funding portal.", textAr: "بوابة تمويل.", highlight: true },
    ],
    ctaLabelEn: "Discover Zowada",
    ctaLabelAr: "اكتشف زوادة",
    ctaUrl: "/zowada",
    images: [
      "/images/new/greenhouse-visit.jpg",
      "/images/new/market-booth.jpg",
      "/images/new/hands-on-work.jpg",
    ],
  },
];

const SLIDE_DURATION = 7000;

export function HeroSlider() {
  const locale = useLocale();
  const isAr = locale === "ar";
  const [current, setCurrent] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [progressKey, setProgressKey] = useState(0);

  const slides = demoSlides;

  const goTo = useCallback(
    (index: number) => {
      if (isTransitioning) return;
      setIsTransitioning(true);
      setCurrent(index);
      setProgressKey((k) => k + 1);
      setTimeout(() => setIsTransitioning(false), 800);
    },
    [isTransitioning]
  );

  const next = useCallback(() => {
    goTo((current + 1) % slides.length);
  }, [current, slides.length, goTo]);

  useEffect(() => {
    const timer = setInterval(next, SLIDE_DURATION);
    return () => clearInterval(timer);
  }, [next]);

  const slide = slides[current];

  return (
    <section className="relative bg-gradient-to-br from-surface-primary via-brand-blue-light to-surface-secondary overflow-hidden min-h-[600px] md:min-h-[680px] lg:min-h-[720px]">
      {/* Subtle background pattern */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: "radial-gradient(circle, #5895D0 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* ═══ ABSTRACT SHAPES ═══ */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -start-20 w-[320px] h-[320px] bg-brand-blue/[0.03] animate-[morph-blob_14s_ease-in-out_infinite]" style={{ borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%" }} />
        <div className="absolute -bottom-16 end-[30%] w-[260px] h-[260px] bg-emerald-400/[0.02] animate-[morph-blob_11s_ease-in-out_infinite_3s]" style={{ borderRadius: "40% 60% 70% 30% / 50% 60% 30% 60%" }} />
        <div className="absolute top-[85%] start-[6%] w-14 h-14 rounded-full border-2 border-brand-blue/[0.06] animate-[drift-horizontal_9s_ease-in-out_infinite]" />
        <div className="absolute top-[15%] start-[2%] w-4 h-4 rounded-full bg-amber-400/10 animate-[float-medium_5s_ease-in-out_infinite_0.5s]" />
        <div className="absolute bottom-[20%] start-[8%] w-3 h-3 bg-violet-400/10 rotate-45 animate-[float-slow_5.5s_ease-in-out_infinite_0.8s]" />
        <svg className="absolute bottom-[10%] start-[30%] w-16 h-16 text-brand-blue/[0.04] animate-[float-slow_10s_ease-in-out_infinite]" viewBox="0 0 64 64" fill="none">
          <circle cx="32" cy="32" r="26" stroke="currentColor" strokeWidth="1" strokeDasharray="3 5" />
        </svg>
      </div>

      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center min-h-[600px] md:min-h-[680px] lg:min-h-[720px] py-12 md:py-16">

          {/* Left — Text Content */}
          <div className="order-2 lg:order-1">
            {/* Tag */}
            <div
              key={`tag-${current}`}
              className="animate-[fade-in_0.4s_ease-out] mb-5"
            >
              <span className="text-brand-blue font-bold text-xs uppercase tracking-[0.25em]">
                {isAr ? slide.tagAr : slide.tagEn}
              </span>
            </div>

            {/* Title */}
            <h1
              key={`title-${current}`}
              className="font-serif text-[clamp(2.2rem,5vw,4.2rem)] text-text-primary leading-[1.05] tracking-tight mb-8 animate-[reveal-up_0.7s_cubic-bezier(0.16,1,0.3,1)]"
            >
              {isAr ? slide.titleAr : slide.titleEn}
              {" "}
              <span className="inline-block text-brand-blue animate-[fade-in_0.5s_ease-out_0.4s_both]">
                &raquo;&raquo;
              </span>
            </h1>

            {/* Subtitle lines — stacked */}
            <div
              key={`sub-${current}`}
              className="mb-10 space-y-1"
            >
              {slide.subtitleLines.map((line, i) => (
                <p
                  key={i}
                  className={cn(
                    "text-xl md:text-2xl font-medium animate-[reveal-up_0.6s_cubic-bezier(0.16,1,0.3,1)_both]",
                    line.highlight ? "text-brand-blue" : "text-text-secondary"
                  )}
                  style={{ animationDelay: `${0.15 + i * 0.1}s` }}
                >
                  {isAr ? line.textAr : line.textEn}
                </p>
              ))}
            </div>

            {/* CTA */}
            <div
              key={`cta-${current}`}
              className="animate-[reveal-up_0.6s_cubic-bezier(0.16,1,0.3,1)_0.45s_both]"
            >
              <Link
                href={slide.ctaUrl}
                className="group inline-flex items-center gap-4 bg-brand-blue hover:bg-brand-blue-dark text-white rounded-full font-semibold text-sm px-7 py-4 transition-all duration-300 shadow-lg shadow-brand-blue/20 hover:shadow-xl hover:shadow-brand-blue/30"
              >
                <span>
                  <span className="font-bold block text-[15px]">
                    {isAr ? slide.ctaLabelAr : slide.ctaLabelEn}
                  </span>
                </span>
                <span className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
                  <ChevronRight className="w-4 h-4 rtl:rotate-180" />
                </span>
              </Link>
            </div>

            {/* Slide indicators */}
            <div className="flex items-center gap-3 mt-10">
              <span className="text-text-muted text-xs font-medium tabular-nums tracking-wider">
                {String(current + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
              </span>
              <div className="flex gap-2">
                {slides.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goTo(i)}
                    className="relative w-10 h-[3px] bg-gray-200 overflow-hidden rounded-full"
                  >
                    {i === current && (
                      <span
                        key={progressKey}
                        className="absolute inset-0 bg-brand-blue origin-left animate-[progress-fill_7s_linear] rounded-full"
                      />
                    )}
                    {i < current && (
                      <span className="absolute inset-0 bg-brand-blue/40 rounded-full" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right — Photo Collage */}
          <div className="order-1 lg:order-2 relative h-[360px] sm:h-[420px] md:h-[500px] lg:h-[560px]">
            {/* Main large image — top right */}
            <div
              key={`img1-${current}`}
              className="absolute top-0 start-[8%] w-[55%] h-[58%] rounded-3xl overflow-hidden shadow-2xl shadow-brand-blue/10 animate-[fade-in_0.7s_ease-out]"
            >
              <Image
                src={slide.images[0]}
                alt=""
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 55vw, 30vw"
                priority={current === 0}
              />
            </div>

            {/* Second image — top right, overlapping */}
            <div
              key={`img2-${current}`}
              className="absolute top-[5%] end-0 w-[42%] h-[48%] rounded-2xl overflow-hidden shadow-xl shadow-brand-blue/10 animate-[slide-in-right_0.7s_ease-out_0.15s_both]"
            >
              <Image
                src={slide.images[1]}
                alt=""
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 42vw, 22vw"
              />
            </div>

            {/* Third image — bottom center */}
            <div
              key={`img3-${current}`}
              className="absolute bottom-[2%] start-[15%] w-[50%] h-[42%] rounded-2xl overflow-hidden shadow-xl shadow-brand-blue/10 animate-[reveal-up_0.7s_ease-out_0.25s_both]"
            >
              <Image
                src={slide.images[2]}
                alt=""
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 50vw, 26vw"
              />
            </div>

            {/* Floating decorative elements */}
            {/* Blue circle — top right */}
            <div className="absolute -top-2 end-[10%] w-14 h-14 rounded-full bg-brand-blue flex items-center justify-center shadow-lg animate-[float-slow_4s_ease-in-out_infinite]">
              <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>

            {/* Teal circle — middle left */}
            <div className="absolute top-[42%] -start-2 w-12 h-12 rounded-full bg-emerald-400 flex items-center justify-center shadow-lg animate-[float-medium_5s_ease-in-out_infinite_0.5s]">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
              </svg>
            </div>

            {/* Pink dot — top */}
            <div className="absolute top-[12%] end-[2%] w-4 h-4 rounded-full bg-pink-400 animate-[float-slow_3.5s_ease-in-out_infinite_1s]" />

            {/* Yellow star — bottom right */}
            <div className="absolute bottom-[18%] end-[5%] text-amber-400 animate-[float-medium_4.5s_ease-in-out_infinite_0.8s]">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
              </svg>
            </div>

            {/* Small blue dot — bottom right */}
            <div className="absolute bottom-[8%] end-[15%] w-5 h-5 rounded-full bg-sky-400 animate-[float-slow_5s_ease-in-out_infinite_1.5s]" />

            {/* Blue outline circle — mid right */}
            <div className="absolute top-[30%] end-[-4%] w-10 h-10 rounded-full border-2 border-brand-blue/30 animate-[float-medium_6s_ease-in-out_infinite_0.3s]" />

            {/* Stats badge — floating on collage */}
            <div className="absolute bottom-[5%] end-[20%] bg-white rounded-2xl shadow-xl px-4 py-3 flex items-center gap-3 animate-[reveal-up_0.7s_ease-out_0.5s_both]">
              <div className="w-10 h-10 rounded-full bg-brand-blue/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-brand-blue" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                </svg>
              </div>
              <div>
                <p className="text-[11px] text-text-muted font-medium">{isAr ? "إجمالي المستفيدين" : "Total Impact"}</p>
                <p className="text-lg font-extrabold text-text-primary tabular-nums">38,790+</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
