"use client";

import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import {
  ChevronRight,
  Play,
  Clock,
  Calendar,
  Mic,
  Headphones,
  ArrowLeft,
  Share2,
  Link2,
} from "lucide-react";
import { podcastSeasons, demoEpisodes } from "./podcastData";
import type { PodcastEpisode } from "./podcastData";

export function PodcastEpisodePage({ episode }: { episode: PodcastEpisode }) {
  const locale = useLocale();
  const isAr = locale === "ar";

  const date = new Date(episode.publishedAt);
  const dateStr = date.toLocaleDateString(isAr ? "ar-LB" : "en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const season = podcastSeasons.find((s) => s.slug === episode.seasonSlug);
  const description = isAr ? episode.descriptionAr : episode.descriptionEn;

  // Related episodes from same season, excluding current
  const related = demoEpisodes
    .filter((e) => e.id !== episode.id && e.seasonSlug === episode.seasonSlug)
    .slice(0, 3);
  const moreEpisodes = related.length > 0
    ? related
    : demoEpisodes.filter((e) => e.id !== episode.id).slice(0, 3);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
  };

  return (
    <>
      {/* Hero */}
      <section className="relative min-h-[400px] md:min-h-[460px] flex items-end">
        <img
          src={episode.coverImageUrl}
          alt={isAr ? episode.titleAr : episode.titleEn}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-blue-deeper/95 via-brand-blue-deeper/70 to-black/40" />

        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10 pt-32">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-1.5 text-xs text-white/60 mb-5">
            <Link href="/" className="hover:text-white transition-colors">
              {isAr ? "الرئيسية" : "Home"}
            </Link>
            <ChevronRight className="w-3 h-3 rtl:rotate-180" />
            <Link href="/media/podcast" className="hover:text-white transition-colors">
              {isAr ? "البودكاست" : "Podcast"}
            </Link>
            <ChevronRight className="w-3 h-3 rtl:rotate-180" />
            <span className="text-white/90 truncate max-w-[200px]">
              {isAr ? episode.titleAr : episode.titleEn}
            </span>
          </nav>

          <div className="flex items-center gap-3 mb-3">
            <Badge variant="yellow">
              {isAr ? season?.nameAr : season?.nameEn}
            </Badge>
            <span className="text-xs font-medium text-white/50">
              {isAr ? `الحلقة ${episode.episodeNumber}` : `Episode ${episode.episodeNumber}`}
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-5 max-w-4xl leading-tight">
            {isAr ? episode.titleAr : episode.titleEn}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-white/70 text-sm mb-6">
            {episode.guestNameEn && (
              <div className="flex items-center gap-1.5">
                <Mic className="w-3.5 h-3.5" />
                <span>{isAr ? episode.guestNameAr : episode.guestNameEn}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>{dateStr}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>{episode.durationMin} {isAr ? "دقيقة" : "min"}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-10 md:py-14">
        <Container>
          <div className="max-w-3xl mx-auto">
            {/* Audio Player Placeholder */}
            <div className="bg-gradient-to-r from-brand-blue-deeper to-brand-blue p-6 mb-10 flex items-center gap-4">
              <button className="w-14 h-14 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors shrink-0">
                <Play className="w-6 h-6 text-white ms-0.5" fill="white" />
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm truncate">
                  {isAr ? episode.titleAr : episode.titleEn}
                </p>
                <p className="text-white/50 text-xs">
                  {episode.durationMin} {isAr ? "دقيقة" : "min"} · {isAr ? season?.nameAr : season?.nameEn}
                </p>
                {/* Progress bar placeholder */}
                <div className="mt-2 h-1 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full w-0 bg-white rounded-full" />
                </div>
              </div>
            </div>

            {/* Guest info */}
            {episode.guestNameEn && (
              <div className="bg-brand-blue-light/30 p-5 mb-8 flex items-center gap-4">
                <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-100 shrink-0 border-2 border-brand-blue/20">
                  <img src={episode.coverImageUrl} alt="" className="w-full h-full object-cover" />
                </div>
                <div>
                  <p className="text-xs text-text-muted uppercase tracking-wider font-semibold mb-0.5">
                    {isAr ? "ضيف الحلقة" : "Episode Guest"}
                  </p>
                  <p className="text-sm font-semibold text-text-primary">
                    {isAr ? episode.guestNameAr : episode.guestNameEn}
                  </p>
                  <p className="text-xs text-text-muted">
                    {isAr ? episode.guestRoleAr : episode.guestRoleEn}
                  </p>
                </div>
              </div>
            )}

            {/* Description */}
            <article className="mb-10">
              <h2 className="text-lg font-bold text-text-primary mb-4">
                {isAr ? "عن هذه الحلقة" : "About This Episode"}
              </h2>
              {description.split("\n").map((line, i) => {
                const trimmed = line.trim();
                if (!trimmed) return null;
                if (trimmed.startsWith("- ")) {
                  return (
                    <li key={i} className="flex gap-2 mb-2 text-text-secondary text-[15px] leading-relaxed">
                      <span className="text-brand-blue mt-1 shrink-0">•</span>
                      <span>{trimmed.replace("- ", "")}</span>
                    </li>
                  );
                }
                return (
                  <p key={i} className="text-text-secondary text-[15px] leading-relaxed mb-4">
                    {trimmed}
                  </p>
                );
              })}
            </article>

            {/* Share + Back */}
            <div className="flex items-center justify-between border-t border-gray-100 pt-6">
              <Link
                href="/media/podcast"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-blue hover:gap-2.5 transition-all"
              >
                <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
                {isAr ? "جميع الحلقات" : "All Episodes"}
              </Link>
              <div className="flex items-center gap-2">
                <span className="text-xs text-text-muted flex items-center gap-1">
                  <Share2 className="w-3.5 h-3.5" />
                  {isAr ? "مشاركة" : "Share"}
                </span>
                <button
                  onClick={handleCopyLink}
                  className="text-xs text-text-secondary hover:text-brand-blue transition-colors bg-gray-50 hover:bg-brand-blue-light px-3 py-1.5 flex items-center gap-1"
                >
                  <Link2 className="w-3 h-3" />
                  {isAr ? "نسخ" : "Copy"}
                </button>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* More Episodes */}
      {moreEpisodes.length > 0 && (
        <section className="border-t border-gray-100 py-12">
          <Container>
            <h2 className="text-xl font-bold text-text-primary mb-6">
              {isAr ? "حلقات أخرى" : "More Episodes"}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {moreEpisodes.map((ep) => {
                const epDate = new Date(ep.publishedAt);
                const epDateStr = epDate.toLocaleDateString(isAr ? "ar-LB" : "en-US", {
                  day: "numeric",
                  month: "short",
                });

                return (
                  <Link
                    key={ep.id}
                    href={`/media/podcast/${ep.slug}`}
                    className="group flex gap-3 items-start"
                  >
                    <div className="w-20 h-20 shrink-0 overflow-hidden bg-gray-100 relative">
                      <img
                        src={ep.coverImageUrl}
                        alt={isAr ? ep.titleAr : ep.titleEn}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Play className="w-5 h-5 text-white" fill="white" />
                      </div>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] text-text-muted uppercase tracking-wider mb-0.5">
                        EP {ep.episodeNumber} · {epDateStr}
                      </p>
                      <h3 className="text-sm font-semibold text-text-primary line-clamp-2 group-hover:text-brand-blue transition-colors">
                        {isAr ? ep.titleAr : ep.titleEn}
                      </h3>
                      <p className="text-xs text-text-muted mt-0.5 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {ep.durationMin} {isAr ? "د" : "min"}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </Container>
        </section>
      )}
    </>
  );
}
