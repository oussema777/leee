"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { MapPin, Calendar, Building2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { RegisterModal } from "./RegisterModal";

interface ProgramCardProps {
  slug: string;
  titleEn: string;
  titleAr: string;
  summaryEn: string;
  summaryAr: string;
  coverImageUrl?: string | null;
  status: "ACTIVE" | "COMPLETED" | "UPCOMING";
  category?: string | null;
  year?: number | null;
  donorEn?: string | null;
  donorAr?: string | null;
  locationEn?: string | null;
  locationAr?: string | null;
  pillar?: {
    slug?: string;
    titleEn: string;
    titleAr: string;
  } | null;
  themes?: string[];
}

const themeConfig: Record<string, { en: string; ar: string; color: string }> = {
  women: { en: "Women", ar: "نساء", color: "bg-pink-100 text-pink-700" },
  youth: { en: "Youth", ar: "شباب", color: "bg-violet-100 text-violet-700" },
  green: { en: "Green", ar: "أخضر", color: "bg-emerald-100 text-emerald-700" },
  msme: { en: "MSMEs", ar: "مشاريع", color: "bg-sky-100 text-sky-700" },
};

const statusConfig: Record<string, { en: string; ar: string; color: string }> = {
  ACTIVE: { en: "Active", ar: "نشط", color: "bg-emerald-500 text-white" },
  COMPLETED: { en: "Completed", ar: "مكتمل", color: "bg-accent-steel text-white" },
  UPCOMING: { en: "Upcoming", ar: "قادم", color: "bg-amber-500 text-white" },
};

/* Pillar-based accent colors */
const pillarAccents: Record<string, { bg: string; text: string; tagBg: string; iconColor: string; btnBg: string; btnHover: string }> = {
  "humanitarian-aid": {
    bg: "rgba(237, 110, 40, 0.85)",   // #ED6E28
    text: "text-orange-600",
    tagBg: "rgba(237, 110, 40, 0.85)",
    iconColor: "text-orange-400",
    btnBg: "bg-orange-500",
    btnHover: "hover:bg-orange-600",
  },
  incubators: {
    bg: "rgba(20, 125, 187, 0.85)",   // #147DBB
    text: "text-sky-600",
    tagBg: "rgba(20, 125, 187, 0.85)",
    iconColor: "text-sky-400",
    btnBg: "bg-sky-600",
    btnHover: "hover:bg-sky-700",
  },
  academy: {
    bg: "rgba(63, 172, 73, 0.85)",    // #3FAC49
    text: "text-emerald-600",
    tagBg: "rgba(63, 172, 73, 0.85)",
    iconColor: "text-emerald-400",
    btnBg: "bg-emerald-500",
    btnHover: "hover:bg-emerald-600",
  },
  "business-clinic": {
    bg: "rgba(27, 55, 101, 0.85)",    // #1B3765
    text: "text-indigo-600",
    tagBg: "rgba(27, 55, 101, 0.85)",
    iconColor: "text-indigo-400",
    btnBg: "bg-indigo-600",
    btnHover: "hover:bg-indigo-700",
  },
  "digital-media-hub": {
    bg: "rgba(222, 24, 129, 0.85)",   // #DE1881
    text: "text-pink-600",
    tagBg: "rgba(222, 24, 129, 0.85)",
    iconColor: "text-pink-400",
    btnBg: "bg-pink-500",
    btnHover: "hover:bg-pink-600",
  },
};

const defaultAccent = {
  bg: "rgba(20, 125, 187, 0.8)",
  text: "text-brand-blue",
  tagBg: "rgba(20, 125, 187, 0.8)",
  iconColor: "text-brand-blue/50",
  btnBg: "bg-brand-blue",
  btnHover: "hover:bg-brand-blue-dark",
};

export function ProgramCard({
  slug,
  titleEn,
  titleAr,
  summaryEn,
  summaryAr,
  coverImageUrl,
  status,
  year,
  donorEn,
  donorAr,
  locationEn,
  locationAr,
  pillar,
  themes = [],
}: ProgramCardProps) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const [showRegister, setShowRegister] = useState(false);
  const title = isAr ? titleAr : titleEn;
  const accent = (pillar?.slug && pillarAccents[pillar.slug]) || defaultAccent;

  return (
    <>
      <div className="group block">
        <div className="bg-white rounded-2xl overflow-hidden border border-surface-tertiary hover:shadow-xl hover:-translate-y-1 transition-all duration-500 h-full flex flex-col" style={{ borderTopWidth: "3px", borderTopColor: accent.tagBg }}>
          {/* Image */}
          <Link href={`/programs/${slug}`}>
            <div className="relative h-52 overflow-hidden">
              <Image
                src={coverImageUrl || "/images/new/community-table.jpg"}
                alt={title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-700"
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-accent-navy/30 to-transparent" />

              {/* Status badge */}
              <div className="absolute top-3 start-3">
                <span className={cn("text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full", statusConfig[status].color)}>
                  {isAr ? statusConfig[status].ar : statusConfig[status].en}
                </span>
              </div>

              {/* Pillar tag */}
              {pillar && (
                <div className="absolute bottom-3 start-3">
                  <span
                    className="backdrop-blur-sm text-white text-[10px] font-semibold px-3 py-1.5 rounded-full"
                    style={{ backgroundColor: accent.tagBg }}
                  >
                    {isAr ? pillar.titleAr : pillar.titleEn}
                  </span>
                </div>
              )}
            </div>
          </Link>

          {/* Content */}
          <div className="p-5 md:p-6 flex-1 flex flex-col">
            <Link href={`/programs/${slug}`}>
              <h3 className="font-serif text-lg text-text-primary mb-2 line-clamp-2 group-hover:text-brand-blue transition-colors tracking-tight">
                {title}
              </h3>
            </Link>
            <p className="text-sm text-text-secondary line-clamp-3 mb-4 flex-1 leading-relaxed">
              {isAr ? summaryAr : summaryEn}
            </p>

            {/* Theme tags */}
            {themes.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap mb-4">
                {themes.map((theme) => {
                  const cfg = themeConfig[theme];
                  if (!cfg) return null;
                  return (
                    <span
                      key={theme}
                      className={cn("text-[10px] font-semibold px-2.5 py-1 rounded-full", cfg.color)}
                    >
                      {isAr ? cfg.ar : cfg.en}
                    </span>
                  );
                })}
              </div>
            )}

            {/* Meta row */}
            <div className="space-y-1.5 text-xs text-text-muted mb-5">
              {(donorEn || donorAr) && (
                <div className="flex items-center gap-1.5">
                  <Building2 className={cn("w-3.5 h-3.5 shrink-0", accent.iconColor)} />
                  <span className="truncate">{isAr ? donorAr || donorEn : donorEn}</span>
                </div>
              )}
              {(locationEn || locationAr) && (
                <div className="flex items-center gap-1.5">
                  <MapPin className={cn("w-3.5 h-3.5 shrink-0", accent.iconColor)} />
                  <span className="truncate">{isAr ? locationAr || locationEn : locationEn}</span>
                </div>
              )}
              {year && (
                <div className="flex items-center gap-1.5">
                  <Calendar className={cn("w-3.5 h-3.5 shrink-0", accent.iconColor)} />
                  <span>{year}</span>
                </div>
              )}
            </div>

            {/* CTAs */}
            <div className="flex items-center gap-3">
              <Link
                href={`/programs/${slug}`}
                className={cn("flex items-center text-sm font-semibold hover:gap-2.5 gap-1.5 transition-all", accent.text)}
              >
                <span>{isAr ? "عرض البرنامج" : "View Program"}</span>
                <ArrowRight className="w-4 h-4 rtl:rotate-180 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
              </Link>

              {status !== "COMPLETED" && (
                <button
                  onClick={() => setShowRegister(true)}
                  className={cn("ms-auto px-4 py-1.5 text-white text-xs font-semibold rounded-full transition-colors", accent.btnBg, accent.btnHover)}
                >
                  {isAr ? "سجّل" : "Apply"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <RegisterModal
        isOpen={showRegister}
        onClose={() => setShowRegister(false)}
        programTitle={title}
      />
    </>
  );
}
