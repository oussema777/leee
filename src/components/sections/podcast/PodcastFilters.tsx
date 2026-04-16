"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { podcastSeasons, demoEpisodes } from "./podcastData";
import { menaCountries } from "@/components/sections/impact/impactData";
import { sdgs } from "./sdgData";

export function PodcastFilters() {
  const locale = useLocale();
  const t = useTranslations("podcast.filters");
  const isAr = locale === "ar";
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentSearch = searchParams.get("search") || "";
  const currentSeason = searchParams.get("season") || "";
  const currentGuest = searchParams.get("guest") || "";
  const currentCountry = searchParams.get("country") || "";
  const currentSdg = searchParams.get("sdg") || "";

  // Debounced search input: local state mirrors URL but commits after 250ms
  const [searchDraft, setSearchDraft] = useState(currentSearch);
  useEffect(() => {
    setSearchDraft(currentSearch);
  }, [currentSearch]);

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  // Debounce search
  useEffect(() => {
    if (searchDraft === currentSearch) return;
    const timer = setTimeout(() => {
      updateParam("search", searchDraft);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchDraft, currentSearch, updateParam]);

  // SDG options auto-derived: only those present in at least one episode's sdgTags
  const availableSdgs = useMemo(() => {
    const set = new Set<number>();
    demoEpisodes.forEach((e) => e.sdgTags?.forEach((n) => set.add(n)));
    return Array.from(set).sort((a, b) => a - b);
  }, []);

  const clearAll = useCallback(() => {
    router.push("?", { scroll: false });
  }, [router]);

  const hasActiveFilters =
    currentSearch !== "" ||
    currentSeason !== "" ||
    currentGuest !== "" ||
    currentCountry !== "" ||
    currentSdg !== "";

  // Active chip definitions
  const activeChips: { key: string; label: string; clearValue: string }[] = [];
  if (currentSeason) {
    const s = podcastSeasons.find((x) => x.slug === currentSeason);
    activeChips.push({
      key: "season",
      label: isAr ? s?.nameAr || currentSeason : s?.nameEn || currentSeason,
      clearValue: "",
    });
  }
  if (currentGuest) {
    activeChips.push({
      key: "guest",
      label: t(`guestTypes.${currentGuest}` as "guestTypes.entrepreneur" | "guestTypes.expert"),
      clearValue: "",
    });
  }
  if (currentCountry) {
    const c = menaCountries.find((x) => x.id === currentCountry);
    activeChips.push({
      key: "country",
      label: isAr ? c?.nameAr || currentCountry : c?.nameEn || currentCountry,
      clearValue: "",
    });
  }
  if (currentSdg) {
    const num = Number(currentSdg);
    const sdg = sdgs[num];
    activeChips.push({
      key: "sdg",
      label: sdg ? `${t("sdg")} ${num}` : `${t("sdg")} ${currentSdg}`,
      clearValue: "",
    });
  }

  return (
    <div className="mb-8 space-y-5">
      {/* Search input */}
      <div className="relative">
        <Search className="absolute start-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
        <input
          type="search"
          value={searchDraft}
          onChange={(e) => setSearchDraft(e.target.value)}
          placeholder={t("search")}
          className="w-full bg-white border border-surface-tertiary rounded-full text-sm ps-11 pe-4 py-3 text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue transition-all"
        />
      </div>

      {/* Season pills + dropdowns row */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Season pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => updateParam("season", "")}
            className={cn(
              "px-4 py-2 text-xs font-semibold rounded-full transition-all duration-300",
              !currentSeason
                ? "bg-brand-blue text-white shadow-md shadow-brand-blue/20"
                : "bg-surface-secondary text-text-muted hover:bg-surface-tertiary"
            )}
          >
            {t("allSeasons")}
          </button>
          {podcastSeasons.map((s) => (
            <button
              key={s.slug}
              onClick={() => updateParam("season", s.slug)}
              className={cn(
                "px-4 py-2 text-xs font-semibold rounded-full transition-all duration-300",
                currentSeason === s.slug
                  ? "bg-brand-blue text-white shadow-md shadow-brand-blue/20"
                  : "bg-surface-secondary text-text-muted hover:bg-surface-tertiary"
              )}
            >
              {isAr ? s.nameAr : s.nameEn}
            </button>
          ))}
        </div>

        {/* Dropdowns */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Guest type */}
          <div className="relative">
            <select
              value={currentGuest}
              onChange={(e) => updateParam("guest", e.target.value)}
              className="appearance-none bg-white border border-surface-tertiary rounded-full text-sm ps-4 pe-9 py-2.5 text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue transition-all"
            >
              <option value="">{t("guestType")}</option>
              <option value="entrepreneur">{t("guestTypes.entrepreneur")}</option>
              <option value="expert">{t("guestTypes.expert")}</option>
            </select>
            <ChevronDown className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
          </div>

          {/* Country */}
          <div className="relative">
            <select
              value={currentCountry}
              onChange={(e) => updateParam("country", e.target.value)}
              className="appearance-none bg-white border border-surface-tertiary rounded-full text-sm ps-4 pe-9 py-2.5 text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue transition-all"
            >
              <option value="">{t("country")}</option>
              {menaCountries.map((c) => (
                <option key={c.id} value={c.id}>
                  {isAr ? c.nameAr : c.nameEn}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
          </div>

          {/* SDG */}
          {availableSdgs.length > 0 && (
            <div className="relative">
              <select
                value={currentSdg}
                onChange={(e) => updateParam("sdg", e.target.value)}
                className="appearance-none bg-white border border-surface-tertiary rounded-full text-sm ps-4 pe-9 py-2.5 text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue transition-all"
              >
                <option value="">{t("sdg")}</option>
                {availableSdgs.map((num) => {
                  const sdg = sdgs[num];
                  if (!sdg) return null;
                  return (
                    <option key={num} value={String(num)}>
                      {num} — {isAr ? sdg.titleAr : sdg.titleEn}
                    </option>
                  );
                })}
              </select>
              <ChevronDown className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
            </div>
          )}
        </div>
      </div>

      {/* Active filter chips */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-text-muted font-medium">{t("active")}:</span>
          {currentSearch && (
            <button
              onClick={() => {
                setSearchDraft("");
                updateParam("search", "");
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-blue/10 text-brand-blue text-xs font-semibold rounded-full hover:bg-brand-blue/20 transition-colors"
            >
              <span>“{currentSearch}”</span>
              <X className="w-3 h-3" />
            </button>
          )}
          {activeChips.map((chip) => (
            <button
              key={chip.key}
              onClick={() => updateParam(chip.key, chip.clearValue)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-blue/10 text-brand-blue text-xs font-semibold rounded-full hover:bg-brand-blue/20 transition-colors"
            >
              <span>{chip.label}</span>
              <X className="w-3 h-3" />
            </button>
          ))}
          <button
            onClick={clearAll}
            className="px-3 py-1.5 text-xs font-semibold text-red-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
          >
            {t("clearAll")}
          </button>
        </div>
      )}
    </div>
  );
}
