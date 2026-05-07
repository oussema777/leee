"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { MapPin, Calendar, Building2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { pillarColors, defaultPillarAccent } from "@/lib/pillarColors";
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
  const accent = (pillar?.slug && pillarColors[pillar.slug]) || defaultPillarAccent;

  return (
    <>
      <div className="group block">
        <div className="bg-white rounded-2xl overflow-hidden border border-surface-tertiary hover:shadow-xl hover:-translate-y-1 transition-all duration-500 h-full flex flex-col" style={{ borderTopWidth: "3px", borderTopColor: accent.tagBg }}>
          {/* Image */}
          <Link href={`/programs/${slug}`}>
            <div className="relative h-52 overflow-hidden">
              {coverImageUrl ? (
                <Image
                  src={coverImageUrl}
                  alt={title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center" style={{ backgroundColor: accent.tagBg + "20" }}>
                      <Building2 className="w-6 h-6" style={{ color: accent.tagBg }} />
                    </div>
                    <span className="text-xs text-text-muted font-medium">{isAr ? pillar?.titleAr : pillar?.titleEn}</span>
                  </div>
                </div>
              )}
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
