"use client";

import { useLocale } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { cn } from "@/lib/utils";
import { Filter, ChevronDown } from "lucide-react";

interface ProgramFiltersProps {
  years: number[];
  statuses: string[];
  pillarSlugs: string[];
}

const statusLabels: Record<string, { en: string; ar: string }> = {
  ALL: { en: "All Programs", ar: "جميع البرامج" },
  ACTIVE: { en: "Active", ar: "نشط" },
  COMPLETED: { en: "Completed", ar: "مكتمل" },
  UPCOMING: { en: "Upcoming", ar: "قادم" },
};

const statusColors: Record<string, string> = {
  ALL: "bg-brand-blue text-white shadow-md shadow-brand-blue/20",
  ACTIVE: "bg-emerald-500 text-white shadow-md shadow-emerald-500/20",
  COMPLETED: "bg-accent-steel text-white shadow-md shadow-accent-steel/20",
  UPCOMING: "bg-amber-500 text-white shadow-md shadow-amber-500/20",
};

const pillarData: Record<
  string,
  { en: string; ar: string; descEn: string; descAr: string }
> = {
  incubators: {
    en: "Incubators",
    ar: "الحاضنات",
    descEn: "Supporting startups and social enterprises through comprehensive incubation programs, seed funding, and market access.",
    descAr: "دعم الشركات الناشئة والمؤسسات الاجتماعية من خلال برامج حاضنات شاملة والتمويل الأولي والوصول إلى الأسواق.",
  },
  "technical-assistance": {
    en: "Technical Assistance",
    ar: "المساعدة الفنية",
    descEn: "Building organizational capacity through tailored training, technical support, and capacity building programs.",
    descAr: "بناء القدرات المؤسسية من خلال التدريب المخصص والدعم الفني وبرامج بناء القدرات.",
  },
  coaching: {
    en: "Coaching & Mentoring",
    ar: "التوجيه والإرشاد",
    descEn: "Expert guidance, one-on-one mentorship, and business clinic sessions to develop skills and leadership.",
    descAr: "توجيه الخبراء والإرشاد الفردي وجلسات عيادة الأعمال لتطوير المهارات والقيادة.",
  },
  research: {
    en: "Research & Data",
    ar: "البحث والبيانات",
    descEn: "Evidence-based research and data analysis to drive informed decisions and policy making.",
    descAr: "بحث قائم على الأدلة وتحليل البيانات لدفع القرارات المستنيرة وصنع السياسات.",
  },
  marketing: {
    en: "Marketing & Comm.",
    ar: "التسويق والتواصل",
    descEn: "Strategic marketing and communication solutions for impactful outreach and brand building.",
    descAr: "حلول تسويق وتواصل استراتيجية للوصول المؤثر وبناء العلامة التجارية.",
  },
  academy: {
    en: "LEE Academy",
    ar: "أكاديمية LEE",
    descEn: "Comprehensive learning programs including ILO-certified training for professional and personal development.",
    descAr: "برامج تعلم شاملة بما في ذلك التدريب المعتمد من منظمة العمل الدولية.",
  },
  "digital-media-hub": {
    en: "Digital Media Hub",
    ar: "مركز الوسائط الرقمية",
    descEn: "Digital campaigns, content creation, and media solutions amplifying impact stories across the region.",
    descAr: "حملات رقمية وإنشاء محتوى وحلول إعلامية تعزز قصص الأثر عبر المنطقة.",
  },
  "humanitarian-aid": {
    en: "Humanitarian Aid",
    ar: "المساعدات الإنسانية",
    descEn: "Emergency response, food security, and livelihood support for vulnerable communities and displaced families.",
    descAr: "الاستجابة الطارئة والأمن الغذائي ودعم سبل العيش للمجتمعات الضعيفة.",
  },
};

export function ProgramFilters({ years, statuses, pillarSlugs }: ProgramFiltersProps) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentStatus = searchParams.get("status") || "ALL";
  const currentYear = searchParams.get("year") || "";
  const currentPillar = searchParams.get("pillar") || "";

  const updateFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      if (key === "pillar") {
        params.delete("status");
        params.delete("year");
      }
      router.push(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  const allStatuses = ["ALL", ...statuses];
  const activePillar = currentPillar ? pillarData[currentPillar] : null;

  return (
    <div className="mb-10 space-y-6">
      {/* Pillar pills — scrollable */}
      <div>
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2">
          <button
            onClick={() => updateFilter("pillar", "")}
            className={cn(
              "px-5 py-2.5 text-sm font-semibold rounded-full whitespace-nowrap transition-all duration-300 border",
              !currentPillar
                ? "bg-brand-blue text-white border-brand-blue shadow-md shadow-brand-blue/20"
                : "bg-white text-text-secondary border-surface-tertiary hover:border-brand-blue/30 hover:text-brand-blue"
            )}
          >
            {isAr ? "جميع الركائز" : "All Pillars"}
          </button>
          {pillarSlugs.map((slug) => {
            const data = pillarData[slug];
            if (!data) return null;
            return (
              <button
                key={slug}
                onClick={() => updateFilter("pillar", slug)}
                className={cn(
                  "px-5 py-2.5 text-sm font-semibold rounded-full whitespace-nowrap transition-all duration-300 border",
                  currentPillar === slug
                    ? "bg-brand-blue text-white border-brand-blue shadow-md shadow-brand-blue/20"
                    : "bg-white text-text-secondary border-surface-tertiary hover:border-brand-blue/30 hover:text-brand-blue"
                )}
              >
                {isAr ? data.ar : data.en}
              </button>
            );
          })}
        </div>

        {/* Pillar description */}
        {activePillar && (
          <div className="mt-4 bg-accent-sky/50 border border-brand-blue/10 rounded-xl p-4">
            <p className="text-sm text-text-secondary leading-relaxed">
              {isAr ? activePillar.descAr : activePillar.descEn}
            </p>
          </div>
        )}
      </div>

      {/* Secondary filters: status pills + year dropdown */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          {allStatuses.map((status) => (
            <button
              key={status}
              onClick={() => {
                const params = new URLSearchParams(searchParams.toString());
                if (status === "ALL") {
                  params.delete("status");
                } else {
                  params.set("status", status);
                }
                router.push(`?${params.toString()}`, { scroll: false });
              }}
              className={cn(
                "px-4 py-2 text-xs font-semibold rounded-full transition-all duration-300",
                currentStatus === status
                  ? statusColors[status]
                  : "bg-surface-secondary text-text-muted hover:bg-surface-tertiary"
              )}
            >
              {isAr ? statusLabels[status]?.ar : statusLabels[status]?.en}
            </button>
          ))}
        </div>

        {years.length > 0 && (
          <div className="relative">
            <Filter className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
            <select
              value={currentYear}
              onChange={(e) => {
                const params = new URLSearchParams(searchParams.toString());
                if (e.target.value) {
                  params.set("year", e.target.value);
                } else {
                  params.delete("year");
                }
                router.push(`?${params.toString()}`, { scroll: false });
              }}
              className="appearance-none bg-white border border-surface-tertiary rounded-full text-sm ps-9 pe-9 py-2.5 text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue transition-all"
            >
              <option value="">{isAr ? "جميع السنوات" : "All Years"}</option>
              {years.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            <ChevronDown className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
          </div>
        )}
      </div>
    </div>
  );
}
