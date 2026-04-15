"use client";

import { useLocale } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { cn } from "@/lib/utils";
import { Filter, ChevronDown, X } from "lucide-react";

interface ProgramFiltersProps {
  years: number[];
  statuses: string[];
  pillarSlugs: string[];
  donors: string[];
  themes: string[];
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

const themeLabels: Record<string, { en: string; ar: string }> = {
  women: { en: "Women", ar: "نساء" },
  youth: { en: "Youth", ar: "شباب" },
  green: { en: "Green Economy", ar: "اقتصاد أخضر" },
  msme: { en: "MSMEs", ar: "مشاريع صغيرة" },
};

const pillarData: Record<
  string,
  { en: string; ar: string; descEn: string; descAr: string }
> = {
  incubators: {
    en: "LEEE Incubators",
    ar: "حاضنات LEEE",
    descEn: "Supporting startups and social enterprises through comprehensive incubation programs, seed funding, and market access.",
    descAr: "دعم الشركات الناشئة والمؤسسات الاجتماعية من خلال برامج حاضنات شاملة والتمويل الأولي والوصول إلى الأسواق.",
  },
  "business-clinic": {
    en: "LEEE Business Clinic",
    ar: "عيادة أعمال LEEE",
    descEn: "Expert guidance, one-on-one mentorship, and business clinic sessions to develop skills and leadership.",
    descAr: "توجيه الخبراء والإرشاد الفردي وجلسات عيادة الأعمال لتطوير المهارات والقيادة.",
  },
  academy: {
    en: "LEEE Academy",
    ar: "أكاديمية LEEE",
    descEn: "Comprehensive learning programs including ILO-certified training for professional and personal development.",
    descAr: "برامج تعلم شاملة بما في ذلك التدريب المعتمد من منظمة العمل الدولية.",
  },
  "humanitarian-aid": {
    en: "LEEE Humanitarian Aid",
    ar: "مساعدات LEEE الإنسانية",
    descEn: "Emergency response, food security, and livelihood support for vulnerable communities and displaced families.",
    descAr: "الاستجابة الطارئة والأمن الغذائي ودعم سبل العيش للمجتمعات الضعيفة.",
  },
  "digital-media-hub": {
    en: "LEEE Digital Media Hub",
    ar: "مركز LEEE للإعلام الرقمي",
    descEn: "Supporting visibility, communication, and digital solutions for impact-driven initiatives.",
    descAr: "دعم الظهور والتواصل والحلول الرقمية للمبادرات المؤثرة.",
  },
};

export function ProgramFilters({ years, statuses, pillarSlugs, donors, themes }: ProgramFiltersProps) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentStatus = searchParams.get("status") || "ALL";
  const currentYear = searchParams.get("year") || "";
  const currentPillar = searchParams.get("pillar") || "";
  const currentTheme = searchParams.get("theme") || "";
  const currentDonor = searchParams.get("donor") || "";

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
        params.delete("theme");
        params.delete("donor");
      }
      router.push(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  const clearAllFilters = useCallback(() => {
    router.push("?", { scroll: false });
  }, [router]);

  const allStatuses = ["ALL", ...statuses];
  const activePillar = currentPillar ? pillarData[currentPillar] : null;

  // Determine if any filter is active
  const hasActiveFilters =
    currentStatus !== "ALL" ||
    currentYear !== "" ||
    currentPillar !== "" ||
    currentTheme !== "" ||
    currentDonor !== "";

  // Build active filter chips
  const activeChips: { label: string; key: string }[] = [];
  if (currentPillar && pillarData[currentPillar]) {
    activeChips.push({
      label: isAr ? pillarData[currentPillar].ar : pillarData[currentPillar].en,
      key: "pillar",
    });
  }
  if (currentStatus !== "ALL") {
    const sl = statusLabels[currentStatus];
    activeChips.push({ label: isAr ? sl?.ar || currentStatus : sl?.en || currentStatus, key: "status" });
  }
  if (currentYear) {
    activeChips.push({ label: currentYear, key: "year" });
  }
  if (currentTheme && themeLabels[currentTheme]) {
    activeChips.push({
      label: isAr ? themeLabels[currentTheme].ar : themeLabels[currentTheme].en,
      key: "theme",
    });
  }
  if (currentDonor) {
    activeChips.push({ label: currentDonor, key: "donor" });
  }

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

      {/* Secondary filters row: status pills + theme + donor + year */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* Status pills */}
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

          {/* Dropdowns row */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Theme dropdown */}
            {themes.length > 0 && (
              <div className="relative">
                <select
                  value={currentTheme}
                  onChange={(e) => updateFilter("theme", e.target.value)}
                  className="appearance-none bg-white border border-surface-tertiary rounded-full text-sm ps-4 pe-9 py-2.5 text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue transition-all"
                >
                  <option value="">{isAr ? "جميع المواضيع" : "All Themes"}</option>
                  {themes.map((theme) => (
                    <option key={theme} value={theme}>
                      {isAr ? themeLabels[theme]?.ar || theme : themeLabels[theme]?.en || theme}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
              </div>
            )}

            {/* Donor dropdown */}
            {donors.length > 0 && (
              <div className="relative">
                <select
                  value={currentDonor}
                  onChange={(e) => updateFilter("donor", e.target.value)}
                  className="appearance-none bg-white border border-surface-tertiary rounded-full text-sm ps-4 pe-9 py-2.5 text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue transition-all"
                >
                  <option value="">{isAr ? "جميع الممولين" : "All Donors"}</option>
                  {donors.map((donor) => (
                    <option key={donor} value={donor}>{donor}</option>
                  ))}
                </select>
                <ChevronDown className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
              </div>
            )}

            {/* Year dropdown */}
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

        {/* Active filter chips */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-text-muted font-medium">
              {isAr ? "الفلاتر النشطة:" : "Active filters:"}
            </span>
            {activeChips.map((chip) => (
              <button
                key={chip.key}
                onClick={() => updateFilter(chip.key, chip.key === "status" ? "ALL" : "")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-blue/10 text-brand-blue text-xs font-semibold rounded-full hover:bg-brand-blue/20 transition-colors"
              >
                <span>{chip.label}</span>
                <X className="w-3 h-3" />
              </button>
            ))}
            <button
              onClick={clearAllFilters}
              className="px-3 py-1.5 text-xs font-semibold text-red-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
            >
              {isAr ? "مسح الكل" : "Clear All"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
