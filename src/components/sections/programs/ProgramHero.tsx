"use client";

import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useEffect, useState } from "react";

interface ProgramHeroProps {
  titleEn: string;
  titleAr: string;
  summaryEn?: string;
  summaryAr?: string;
  coverImageUrl: string;
  status: "ACTIVE" | "COMPLETED" | "UPCOMING";
  pillar?: { titleEn: string; titleAr: string } | null;
}

const statusConfig: Record<string, { en: string; ar: string; color: string }> = {
  ACTIVE: { en: "Active Program", ar: "برنامج نشط", color: "bg-emerald-500" },
  COMPLETED: { en: "Completed", ar: "مكتمل", color: "bg-accent-steel" },
  UPCOMING: { en: "Upcoming", ar: "قادم", color: "bg-amber-500" },
};

export function ProgramHero({
  titleEn,
  titleAr,
  summaryEn,
  summaryAr,
  coverImageUrl,
  status,
  pillar,
}: ProgramHeroProps) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="relative min-h-[520px] md:min-h-[600px] lg:min-h-[660px] overflow-hidden">
      {/* Background */}
      <Image
        src={coverImageUrl}
        alt={isAr ? titleAr : titleEn}
        fill
        className="object-cover"
        sizes="100vw"
        priority
      />
      <div className="absolute inset-0 bg-gradient-to-b from-accent-navy/80 via-accent-navy/65 to-accent-navy/90" />
      <div className="absolute inset-0 grain-overlay pointer-events-none" />

      {/* Floating shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[12%] end-[8%] w-20 h-20 rounded-full bg-brand-blue/15 animate-[float-slow_6s_ease-in-out_infinite]" />
        <div className="absolute top-[40%] start-[5%] w-4 h-4 rounded-full bg-emerald-400/25 animate-[float-medium_5s_ease-in-out_infinite_0.5s]" />
        <div className="absolute bottom-[30%] end-[20%] w-10 h-10 rounded-full border-2 border-white/10 animate-[float-slow_7s_ease-in-out_infinite_1s]" />
        <div className="absolute top-[25%] end-[35%] w-3 h-3 rounded-full bg-pink-400/20 animate-[float-medium_4s_ease-in-out_infinite_0.8s]" />
        <div className="absolute bottom-[40%] start-[15%] text-amber-400/20 animate-[float-slow_5.5s_ease-in-out_infinite_1.2s]">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
          </svg>
        </div>
        <div className="absolute top-[55%] end-[6%] text-white/[0.06] rotate-45 animate-[float-medium_6.5s_ease-in-out_infinite_0.3s]">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <rect x="10" y="2" width="4" height="20" rx="2" />
            <rect x="2" y="10" width="20" height="4" rx="2" />
          </svg>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex items-end min-h-[520px] md:min-h-[600px] lg:min-h-[660px] pb-16 md:pb-20">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10 w-full">
          {/* Back link */}
          <div
            className={cn(
              "mb-6 transition-all duration-600 ease-out",
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
            )}
          >
            <Link
              href="/programs"
              className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
              {isAr ? "جميع البرامج" : "All Programs"}
            </Link>
          </div>

          {/* Badges */}
          <div
            className={cn(
              "flex items-center gap-3 mb-5 transition-all duration-700 ease-out",
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )}
            style={{ transitionDelay: "0.1s" }}
          >
            <span className={cn("text-[10px] font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full text-white", statusConfig[status].color)}>
              {isAr ? statusConfig[status].ar : statusConfig[status].en}
            </span>
            {pillar && (
              <span className="bg-white/10 backdrop-blur-sm text-white/80 text-[10px] font-semibold uppercase tracking-wider px-3.5 py-1.5 rounded-full border border-white/10">
                {isAr ? pillar.titleAr : pillar.titleEn}
              </span>
            )}
          </div>

          {/* Title */}
          <h1
            className={cn(
              "font-serif text-3xl md:text-5xl lg:text-6xl text-white leading-[1.05] tracking-tight max-w-4xl transition-all duration-800 ease-out",
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            )}
            style={{ transitionDelay: "0.2s" }}
          >
            {isAr ? titleAr : titleEn}
          </h1>

          {/* Summary */}
          {(summaryEn || summaryAr) && (
            <p
              className={cn(
                "mt-5 text-lg text-white/55 max-w-2xl leading-relaxed transition-all duration-800 ease-out",
                visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
              )}
              style={{ transitionDelay: "0.35s" }}
            >
              {isAr ? summaryAr : summaryEn}
            </p>
          )}

          {/* Accent line */}
          <div
            className={cn(
              "mt-8 w-16 h-[3px] bg-brand-blue rounded-full transition-all duration-800 ease-out",
              visible ? "opacity-100 scale-x-100" : "opacity-0 scale-x-0"
            )}
            style={{ transitionDelay: "0.5s", transformOrigin: "left" }}
          />
        </div>
      </div>

      {/* Wave divider */}
      <div className="absolute bottom-0 left-0 right-0 z-20">
        <svg viewBox="0 0 1440 100" fill="none" className="w-full h-auto block" preserveAspectRatio="none">
          <path d="M0 60L60 55C120 50 240 40 360 38C480 36 600 42 720 52C840 62 960 76 1080 78C1200 80 1320 70 1380 65L1440 60V100H0V60Z" fill="white" fillOpacity="0.15" />
          <path d="M0 75L60 72C120 69 240 63 360 60C480 57 600 57 720 62C840 67 960 77 1080 80C1200 83 1320 79 1380 77L1440 75V100H0V75Z" fill="white" fillOpacity="0.4" />
          <path d="M0 88L60 86C120 84 240 80 360 78C480 76 600 76 720 78C840 80 960 84 1080 86C1200 88 1320 86 1380 85L1440 84V100H0V88Z" fill="white" />
        </svg>
      </div>
    </section>
  );
}
