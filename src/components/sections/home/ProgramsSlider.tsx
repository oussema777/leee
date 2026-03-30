"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useLocale } from "next-intl";
import { Container } from "@/components/ui/Container";
import { SectionLabel } from "./SectionLabel";
import { ArrowLink } from "./ArrowLink";
import { Link } from "@/i18n/navigation";
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  Building2,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SliderProgram {
  id: string;
  slug: string;
  titleEn: string;
  titleAr: string;
  summaryEn: string;
  summaryAr: string;
  coverImageUrl: string | null;
  status: "ACTIVE" | "COMPLETED" | "UPCOMING";
  year: number | null;
  donorEn: string | null;
  donorAr: string | null;
  locationEn: string | null;
  locationAr: string | null;
  pillar: {
    titleEn: string;
    titleAr: string;
  } | null;
}

interface ProgramsSliderProps {
  programs: SliderProgram[];
}

const statusConfig: Record<
  string,
  { label: string; labelAr: string; color: string }
> = {
  ACTIVE: { label: "Active", labelAr: "نشط", color: "bg-emerald-500" },
  COMPLETED: { label: "Completed", labelAr: "مكتمل", color: "bg-brand-blue" },
  UPCOMING: { label: "Upcoming", labelAr: "قادم", color: "bg-amber-500" },
};

export function ProgramsSlider({ programs }: ProgramsSliderProps) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const trackRef = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollStart, setScrollStart] = useState(0);

  // How many cards visible at once
  const getVisibleCount = () => {
    if (typeof window === "undefined") return 3;
    if (window.innerWidth < 768) return 1;
    if (window.innerWidth < 1024) return 2;
    return 3;
  };

  const [visibleCount, setVisibleCount] = useState(3);

  useEffect(() => {
    const update = () => setVisibleCount(getVisibleCount());
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const maxIndex = Math.max(0, programs.length - visibleCount);

  const next = useCallback(() => {
    setCurrent((prev) => Math.min(prev + 1, maxIndex));
  }, [maxIndex]);

  const prev = useCallback(() => {
    setCurrent((prev) => Math.max(prev - 1, 0));
  }, []);

  // Drag/swipe support
  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    setStartX(e.clientX);
    setScrollStart(current);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    e.preventDefault();
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    const diff = e.clientX - startX;
    const threshold = 80;
    if (diff < -threshold) next();
    else if (diff > threshold) prev();
  };

  const offset = -(current * (100 / visibleCount));

  if (programs.length === 0) return null;

  return (
    <section className="py-16 md:py-24 bg-surface-primary overflow-hidden">
      <Container>
        {/* Header row */}
        <div className="flex items-end justify-between mb-10">
          <div>
            <SectionLabel color="blue" className="mb-3 block">
              {isAr ? "برامجنا" : "Our Programs"}
            </SectionLabel>
            <h2 className="text-3xl md:text-4xl font-bold text-text-primary leading-tight">
              {isAr
                ? "برامج تُحدث فرقاً حقيقياً"
                : "Programs That Create Real Impact"}
            </h2>
          </div>

          {/* Desktop nav arrows */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={prev}
              disabled={current === 0}
              className={cn(
                "w-11 h-11 border-2 border-gray-200 flex items-center justify-center transition-all",
                current === 0
                  ? "opacity-30 cursor-not-allowed"
                  : "hover:border-brand-blue hover:text-brand-blue"
              )}
            >
              <ChevronLeft className="w-5 h-5 rtl:rotate-180" />
            </button>
            <button
              onClick={next}
              disabled={current >= maxIndex}
              className={cn(
                "w-11 h-11 border-2 border-gray-200 flex items-center justify-center transition-all",
                current >= maxIndex
                  ? "opacity-30 cursor-not-allowed"
                  : "hover:border-brand-blue hover:text-brand-blue"
              )}
            >
              <ChevronRight className="w-5 h-5 rtl:rotate-180" />
            </button>
          </div>
        </div>

        {/* Slider track */}
        <div
          ref={trackRef}
          className="relative touch-pan-y"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={() => setIsDragging && setIsDragging(false)}
        >
          <div
            className="flex transition-transform duration-500 ease-out"
            style={{
              transform: `translateX(${isAr ? -offset : offset}%)`,
            }}
          >
            {programs.map((program) => {
              const status = statusConfig[program.status];
              return (
                <div
                  key={program.id}
                  className="flex-shrink-0 px-2.5"
                  style={{ width: `${100 / visibleCount}%` }}
                >
                  <Link
                    href={`/programs/${program.slug}`}
                    className="block group"
                  >
                    <div className="bg-white border border-gray-100 overflow-hidden hover:shadow-xl transition-shadow duration-300 h-full flex flex-col">
                      {/* Image */}
                      <div className="relative h-52 overflow-hidden">
                        <img
                          src={program.coverImageUrl || "/images/group-training-workshop.jpg"}
                          alt={isAr ? program.titleAr : program.titleEn}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                          draggable={false}
                        />
                        {/* Status badge */}
                        <div className="absolute top-3 start-3">
                          <span
                            className={cn(
                              status.color,
                              "text-white text-[11px] font-bold uppercase tracking-wider px-2.5 py-1"
                            )}
                          >
                            {isAr ? status.labelAr : status.label}
                          </span>
                        </div>
                        {/* Year badge */}
                        {program.year && (
                          <div className="absolute top-3 end-3">
                            <span className="bg-black/60 backdrop-blur-sm text-white text-[11px] font-semibold px-2.5 py-1">
                              {program.year}
                            </span>
                          </div>
                        )}
                        {/* Gradient overlay */}
                        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/40 to-transparent" />
                      </div>

                      {/* Content */}
                      <div className="p-5 flex flex-col flex-1">
                        {/* Pillar tag */}
                        {program.pillar && (
                          <span className="text-brand-blue text-[11px] font-bold uppercase tracking-wider mb-2">
                            {isAr ? program.pillar.titleAr : program.pillar.titleEn}
                          </span>
                        )}

                        {/* Title */}
                        <h3 className="font-bold text-text-primary leading-snug mb-2.5 line-clamp-2 group-hover:text-brand-blue transition-colors">
                          {isAr ? program.titleAr : program.titleEn}
                        </h3>

                        {/* Summary */}
                        <p className="text-text-secondary text-sm leading-relaxed line-clamp-2 mb-4 flex-1">
                          {isAr ? program.summaryAr : program.summaryEn}
                        </p>

                        {/* Meta strip */}
                        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[12px] text-text-muted mb-4 pt-4 border-t border-gray-100">
                          {(program.locationEn || program.locationAr) && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {isAr ? program.locationAr : program.locationEn}
                            </span>
                          )}
                          {(program.donorEn || program.donorAr) && (
                            <span className="flex items-center gap-1">
                              <Building2 className="w-3 h-3" />
                              {isAr ? program.donorAr : program.donorEn}
                            </span>
                          )}
                        </div>

                        {/* CTA */}
                        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-text-primary group-hover:text-brand-blue transition-colors">
                          {isAr ? "عرض البرنامج" : "View Program"}
                          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
                        </span>
                      </div>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>

        {/* Progress bar + View All */}
        <div className="mt-8 flex items-center justify-between">
          {/* Progress dots */}
          <div className="flex items-center gap-1.5">
            {Array.from({ length: maxIndex + 1 }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={cn(
                  "h-1 rounded-full transition-all duration-300",
                  i === current
                    ? "w-8 bg-brand-blue"
                    : "w-3 bg-gray-200 hover:bg-gray-300"
                )}
              />
            ))}
          </div>

          <ArrowLink href="/programs">
            {isAr ? "عرض جميع البرامج" : "View all programs"}
          </ArrowLink>
        </div>
      </Container>
    </section>
  );
}
