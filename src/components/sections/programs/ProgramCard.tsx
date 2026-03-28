"use client";

import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { MapPin, Calendar, Building2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface ProgramCardProps {
  slug: string;
  titleEn: string;
  titleAr: string;
  summaryEn: string;
  summaryAr: string;
  coverImageUrl?: string | null;
  status: "ACTIVE" | "COMPLETED" | "UPCOMING";
  year?: number | null;
  donorEn?: string | null;
  donorAr?: string | null;
  locationEn?: string | null;
  locationAr?: string | null;
  pillar?: {
    titleEn: string;
    titleAr: string;
  } | null;
}

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
}: ProgramCardProps) {
  const locale = useLocale();
  const isAr = locale === "ar";

  return (
    <Link href={`/programs/${slug}`} className="group block">
      <div className="bg-white rounded-2xl overflow-hidden border border-surface-tertiary hover:shadow-xl hover:-translate-y-1 transition-all duration-500 h-full flex flex-col">
        {/* Image */}
        <div className="relative h-52 overflow-hidden">
          <Image
            src={coverImageUrl || "/images/new/community-table.jpg"}
            alt={isAr ? titleAr : titleEn}
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
              <span className="bg-brand-blue/80 backdrop-blur-sm text-white text-[10px] font-semibold px-3 py-1.5 rounded-full">
                {isAr ? pillar.titleAr : pillar.titleEn}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5 md:p-6 flex-1 flex flex-col">
          <h3 className="font-serif text-lg text-text-primary mb-2 line-clamp-2 group-hover:text-brand-blue transition-colors tracking-tight">
            {isAr ? titleAr : titleEn}
          </h3>
          <p className="text-sm text-text-secondary line-clamp-3 mb-5 flex-1 leading-relaxed">
            {isAr ? summaryAr : summaryEn}
          </p>

          {/* Meta row */}
          <div className="space-y-1.5 text-xs text-text-muted mb-5">
            {(donorEn || donorAr) && (
              <div className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 shrink-0 text-brand-blue/50" />
                <span className="truncate">{isAr ? donorAr || donorEn : donorEn}</span>
              </div>
            )}
            {(locationEn || locationAr) && (
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 shrink-0 text-brand-blue/50" />
                <span className="truncate">{isAr ? locationAr || locationEn : locationEn}</span>
              </div>
            )}
            {year && (
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 shrink-0 text-brand-blue/50" />
                <span>{year}</span>
              </div>
            )}
          </div>

          {/* CTA */}
          <div className="flex items-center text-sm font-semibold text-brand-blue group-hover:gap-2.5 gap-1.5 transition-all">
            <span>{isAr ? "عرض البرنامج" : "View Program"}</span>
            <ArrowRight className="w-4 h-4 rtl:rotate-180 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
          </div>
        </div>
      </div>
    </Link>
  );
}
