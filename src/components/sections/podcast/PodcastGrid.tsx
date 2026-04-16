"use client";

import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { Link, useRouter as useI18nRouter } from "@/i18n/navigation";
import { Play, Clock, Mic, Headphones, ArrowRight } from "lucide-react";
import { podcastSeasons, demoEpisodes } from "./podcastData";
import type { PodcastEpisode } from "./podcastData";
import { PodcastFilters } from "./PodcastFilters";
import { SdgBadge } from "./SdgBadge";
import { relatedPrograms } from "./relatedPrograms";
import { pillarColors, defaultPillarAccent } from "@/lib/pillarColors";

function FeaturedEpisode({ ep, isAr }: { ep: PodcastEpisode; isAr: boolean }) {
  const date = new Date(ep.publishedAt);
  const dateStr = date.toLocaleDateString(isAr ? "ar-LB" : "en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const season = podcastSeasons.find((s) => s.slug === ep.seasonSlug);

  return (
    <Link href={`/media/podcast/${ep.slug}`} className="block group mb-12">
      <div className="relative overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[360px]">
          {/* Image */}
          <div className="relative h-64 lg:h-auto">
            <img
              src={ep.coverImageUrl}
              alt={isAr ? ep.titleAr : ep.titleEn}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-brand-blue-deeper/70 to-transparent lg:bg-none" />
            {/* Play button overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-20 h-20 bg-brand-blue/80 group-hover:bg-brand-blue rounded-full flex items-center justify-center transition-all group-hover:scale-110">
                <Play className="w-8 h-8 text-white ms-1" fill="white" />
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="bg-gradient-to-br from-brand-blue-deeper via-brand-blue-dark to-brand-blue p-8 lg:p-10 flex flex-col justify-center relative">
            <Headphones className="absolute top-6 end-6 w-20 h-20 text-white/5" />

            <div className="flex items-center gap-3 mb-3">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">
                {isAr ? "حلقة مميزة" : "Featured Episode"}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-brand-blue-light bg-white/10 px-2 py-0.5">
                {isAr ? season?.nameAr : season?.nameEn}
              </span>
            </div>

            <p className="text-white/50 text-xs font-medium mb-2">
              {isAr ? `الحلقة ${ep.episodeNumber}` : `Episode ${ep.episodeNumber}`} · {dateStr}
            </p>

            <h2 className="text-2xl lg:text-3xl font-bold text-white mb-4 leading-tight">
              {isAr ? ep.titleAr : ep.titleEn}
            </h2>

            {ep.guestNameEn && (
              <p className="text-white/70 text-sm mb-3 flex items-center gap-1.5">
                <Mic className="w-3.5 h-3.5" />
                {isAr ? ep.guestNameAr : ep.guestNameEn}
              </p>
            )}

            <div className="flex items-center gap-3 text-white/50 text-xs mb-6">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {ep.durationMin} {isAr ? "دقيقة" : "min"}
              </span>
              {ep.sdgTags && ep.sdgTags.length > 0 && (
                <span className="flex items-center gap-1">
                  {ep.sdgTags.slice(0, 3).map((n) => (
                    <SdgBadge key={n} sdgNumber={n} size="sm" />
                  ))}
                  {ep.sdgTags.length > 3 && (
                    <span className="inline-flex items-center justify-center w-7 h-7 bg-white/20 text-white text-[11px] font-bold rounded">
                      +{ep.sdgTags.length - 3}
                    </span>
                  )}
                </span>
              )}
            </div>

            <div className="flex items-center text-sm font-semibold text-white group-hover:gap-2.5 gap-1.5 transition-all">
              <span>{isAr ? "استمع الآن" : "Listen Now"}</span>
              <ArrowRight className="w-4 h-4 rtl:rotate-180" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

export function PodcastGrid() {
  const locale = useLocale();
  const t = useTranslations("podcast.filters");
  const isAr = locale === "ar";
  const router = useRouter();
  const i18nRouter = useI18nRouter();
  const searchParams = useSearchParams();

  const currentSearch = searchParams.get("search") || "";
  const currentSeason = searchParams.get("season") || "";
  const currentGuest = searchParams.get("guest") || "";
  const currentCountry = searchParams.get("country") || "";
  const currentSdgParam = searchParams.get("sdg") || "";
  const currentSdg = currentSdgParam ? Number(currentSdgParam) : null;

  const hasActiveFilters =
    currentSearch !== "" ||
    currentSeason !== "" ||
    currentGuest !== "" ||
    currentCountry !== "" ||
    currentSdgParam !== "";

  const filteredEpisodes = useMemo(() => {
    const searchLower = currentSearch.trim().toLowerCase();
    return demoEpisodes.filter((ep) => {
      if (currentSeason && ep.seasonSlug !== currentSeason) return false;
      if (currentGuest && ep.guestType !== currentGuest) return false;
      if (currentCountry && !ep.countries?.includes(currentCountry)) return false;
      if (currentSdg !== null && !ep.sdgTags?.includes(currentSdg)) return false;
      if (searchLower) {
        const haystack = [
          ep.titleEn,
          ep.titleAr,
          ep.descriptionEn,
          ep.descriptionAr,
          ep.guestNameEn,
          ep.guestNameAr,
          ep.guestRoleEn,
          ep.guestRoleAr,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(searchLower)) return false;
      }
      return true;
    });
  }, [currentSearch, currentSeason, currentGuest, currentCountry, currentSdg]);

  const featured = !hasActiveFilters ? filteredEpisodes.find((e) => e.isFeatured) : null;
  const rest = featured ? filteredEpisodes.filter((e) => e.id !== featured.id) : filteredEpisodes;

  return (
    <>
      <PodcastFilters />

      {filteredEpisodes.length > 0 ? (
        <>
          {featured && <FeaturedEpisode ep={featured} isAr={isAr} />}

          <p className="text-sm text-text-muted mb-6">
            {rest.length} {isAr ? "حلقات" : "episodes"}
          </p>

          {/* Episode list */}
          <div className="space-y-4">
            {rest.map((ep) => {
              const date = new Date(ep.publishedAt);
              const dateStr = date.toLocaleDateString(isAr ? "ar-LB" : "en-US", {
                day: "numeric",
                month: "short",
                year: "numeric",
              });
              const season = podcastSeasons.find((s) => s.slug === ep.seasonSlug);
              const relatedProgram = ep.relatedProgramSlug
                ? relatedPrograms[ep.relatedProgramSlug]
                : null;
              const relatedAccent = relatedProgram
                ? pillarColors[relatedProgram.pillarSlug] || defaultPillarAccent
                : null;

              return (
                <Link
                  key={ep.id}
                  href={`/media/podcast/${ep.slug}`}
                  className="group flex gap-4 bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-4"
                >
                  {/* Thumbnail */}
                  <div className="relative w-24 h-24 md:w-32 md:h-32 shrink-0 overflow-hidden bg-gray-100">
                    <img
                      src={ep.coverImageUrl}
                      alt={isAr ? ep.titleAr : ep.titleEn}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play className="w-8 h-8 text-white" fill="white" />
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex items-center gap-2 text-[10px] text-text-muted font-medium uppercase tracking-wider mb-1">
                      <span>{isAr ? season?.nameAr : season?.nameEn}</span>
                      <span>·</span>
                      <span>{isAr ? `الحلقة ${ep.episodeNumber}` : `EP ${ep.episodeNumber}`}</span>
                    </div>

                    <h3 className="text-sm md:text-base font-semibold text-text-primary line-clamp-1 group-hover:text-brand-blue transition-colors mb-1">
                      {isAr ? ep.titleAr : ep.titleEn}
                    </h3>

                    {ep.guestNameEn && (
                      <p className="text-xs text-text-muted mb-1.5 flex items-center gap-1 truncate">
                        <Mic className="w-3 h-3 shrink-0" />
                        {isAr ? ep.guestNameAr : ep.guestNameEn}
                      </p>
                    )}

                    <div className="flex items-center gap-3 text-xs text-text-muted mb-2">
                      <span>{dateStr}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {ep.durationMin} {isAr ? "د" : "min"}
                      </span>
                    </div>

                    {/* SDG badges + related program tag */}
                    {(ep.sdgTags?.length || relatedProgram) && (
                      <div className="flex items-center gap-2 flex-wrap">
                        {ep.sdgTags?.slice(0, 3).map((n) => (
                          <SdgBadge key={n} sdgNumber={n} size="sm" />
                        ))}
                        {ep.sdgTags && ep.sdgTags.length > 3 && (
                          <span className="inline-flex items-center justify-center w-7 h-7 bg-gray-200 text-text-muted text-[11px] font-bold rounded">
                            +{ep.sdgTags.length - 3}
                          </span>
                        )}
                        {relatedProgram && relatedAccent && (
                          <span
                            role="link"
                            tabIndex={0}
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              i18nRouter.push(`/programs/${relatedProgram.slug}`);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.stopPropagation();
                                e.preventDefault();
                                i18nRouter.push(`/programs/${relatedProgram.slug}`);
                              }
                            }}
                            className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-white px-2.5 py-1 rounded-full hover:opacity-90 cursor-pointer transition-opacity line-clamp-1"
                            style={{ backgroundColor: relatedAccent.tagBg }}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />
                            <span className="truncate max-w-[140px]">
                              {isAr ? relatedProgram.titleAr : relatedProgram.titleEn}
                            </span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      ) : (
        <div className="text-center py-16">
          <Headphones className="w-16 h-16 mx-auto text-text-muted mb-4" />
          <p className="text-text-secondary text-lg mb-4">{t("noResults")}</p>
          <button
            onClick={() => router.push("?", { scroll: false })}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-brand-blue rounded-full hover:bg-brand-blue-dark transition-colors"
          >
            {t("clearAll")}
          </button>
        </div>
      )}
    </>
  );
}
