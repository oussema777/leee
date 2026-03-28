"use client";

import { useLocale } from "next-intl";
import { cn } from "@/lib/utils";
import { Activity, Layers, Building2, MapPin, DollarSign, Calendar, Users } from "lucide-react";

interface ProgramMetaStripProps {
  status: "ACTIVE" | "COMPLETED" | "UPCOMING";
  pillar?: { titleEn: string; titleAr: string } | null;
  donorEn?: string | null;
  donorAr?: string | null;
  locationEn?: string | null;
  locationAr?: string | null;
  budget?: string | null;
  year?: number | null;
  beneficiaries?: number | null;
}

const statusConfig: Record<string, { en: string; ar: string; color: string }> = {
  ACTIVE: { en: "Active", ar: "نشط", color: "text-emerald-600 bg-emerald-50" },
  COMPLETED: { en: "Completed", ar: "مكتمل", color: "text-accent-steel bg-accent-sky" },
  UPCOMING: { en: "Upcoming", ar: "قادم", color: "text-amber-600 bg-amber-50" },
};

export function ProgramMetaStrip({
  status,
  pillar,
  donorEn,
  donorAr,
  locationEn,
  locationAr,
  budget,
  year,
  beneficiaries,
}: ProgramMetaStripProps) {
  const locale = useLocale();
  const isAr = locale === "ar";

  const items = [
    {
      icon: <Activity className="w-4 h-4" />,
      label: isAr ? "الحالة" : "Status",
      value: (
        <span className={cn("text-xs font-bold px-2.5 py-1 rounded-full", statusConfig[status].color)}>
          {isAr ? statusConfig[status].ar : statusConfig[status].en}
        </span>
      ),
      show: true,
    },
    {
      icon: <Layers className="w-4 h-4" />,
      label: isAr ? "الركيزة" : "Pillar",
      value: pillar ? (isAr ? pillar.titleAr : pillar.titleEn) : null,
      show: !!pillar,
    },
    {
      icon: <Building2 className="w-4 h-4" />,
      label: isAr ? "الجهة المانحة" : "Donor",
      value: isAr ? donorAr || donorEn : donorEn,
      show: !!(donorEn || donorAr),
    },
    {
      icon: <MapPin className="w-4 h-4" />,
      label: isAr ? "الموقع" : "Location",
      value: isAr ? locationAr || locationEn : locationEn,
      show: !!(locationEn || locationAr),
    },
    {
      icon: <DollarSign className="w-4 h-4" />,
      label: isAr ? "الميزانية" : "Budget",
      value: budget,
      show: !!budget,
    },
    {
      icon: <Calendar className="w-4 h-4" />,
      label: isAr ? "السنة" : "Year",
      value: year,
      show: !!year,
    },
    {
      icon: <Users className="w-4 h-4" />,
      label: isAr ? "المستفيدون" : "Beneficiaries",
      value: beneficiaries ? beneficiaries.toLocaleString() : null,
      show: !!beneficiaries,
    },
  ].filter((item) => item.show);

  return (
    <div className="bg-surface-secondary border-b border-surface-tertiary">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10 py-5">
        <div className="flex items-center gap-6 overflow-x-auto scrollbar-hide">
          {items.map((item, index) => (
            <div key={index} className="flex items-center gap-3 flex-shrink-0">
              <div className="w-8 h-8 rounded-lg bg-brand-blue/10 flex items-center justify-center text-brand-blue">
                {item.icon}
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-text-muted">
                  {item.label}
                </div>
                <div className="text-sm font-medium text-text-primary">
                  {item.value}
                </div>
              </div>
              {index < items.length - 1 && (
                <div className="w-[1px] h-8 bg-surface-tertiary ms-3" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
