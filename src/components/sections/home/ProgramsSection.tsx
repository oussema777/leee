"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useLocale } from "next-intl";
import { Container } from "@/components/ui/Container";
import { SectionLabel } from "./SectionLabel";
import { ArrowLink } from "./ArrowLink";
import { Link } from "@/i18n/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  Building2,
  ArrowRight,
  Lightbulb,
  Wrench,
  GraduationCap,
  Megaphone,
  BookOpen,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

const pillars = [
  { slug: "all", nameEn: "All Programs", nameAr: "جميع البرامج", color: "bg-brand-blue-deeper", textColor: "text-brand-blue-deeper", icon: Layers },
  { slug: "incubators", nameEn: "LEEE Incubators", nameAr: "حاضنات LEEE", color: "bg-brand-blue", textColor: "text-brand-blue", icon: Lightbulb },
  { slug: "academy", nameEn: "LEEE Academy", nameAr: "أكاديمية LEEE", color: "bg-emerald-500", textColor: "text-emerald-600", icon: GraduationCap },
  { slug: "business-clinic", nameEn: "LEEE Business Clinic", nameAr: "عيادة أعمال LEEE", color: "bg-amber-500", textColor: "text-amber-600", icon: Wrench },
  { slug: "humanitarian-aid", nameEn: "LEEE Humanitarian Aid", nameAr: "مساعدات LEEE الإنسانية", color: "bg-rose-500", textColor: "text-rose-600", icon: BookOpen },
  { slug: "digital-media-hub", nameEn: "LEEE Digital Media Hub", nameAr: "مركز LEEE للإعلام الرقمي", color: "bg-purple-500", textColor: "text-purple-600", icon: Megaphone },
];

const statusConfig: Record<string, { label: string; labelAr: string; color: string }> = {
  ACTIVE: { label: "Active", labelAr: "نشط", color: "bg-emerald-500" },
  COMPLETED: { label: "Completed", labelAr: "مكتمل", color: "bg-brand-blue" },
  UPCOMING: { label: "Upcoming", labelAr: "قادم", color: "bg-amber-500" },
};

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
  pillar: { titleEn: string; titleAr: string } | null;
}

interface ProgramsSectionProps {
  programs?: SliderProgram[];
}

function useInView(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

export function ProgramsSection({ programs = [] }: ProgramsSectionProps) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const [activePillar, setActivePillar] = useState("all");
  const [current, setCurrent] = useState(0);
  const pillarsScrollRef = useRef<HTMLDivElement>(null);
  const sectionAnim = useInView(0.08);

  const filteredPrograms =
    activePillar === "all"
      ? programs
      : programs.filter(
          (p) => p.pillar?.titleEn.toLowerCase().includes(activePillar.replace("-", " "))
        );

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

  const maxIndex = Math.max(0, filteredPrograms.length - visibleCount);

  const next = useCallback(() => setCurrent((prev) => Math.min(prev + 1, maxIndex)), [maxIndex]);
  const prev = useCallback(() => setCurrent((prev) => Math.max(prev - 1, 0)), []);

  useEffect(() => {
    setCurrent(0);
  }, [activePillar]);

  const offset = -(current * (100 / visibleCount));

  return (
    <section ref={sectionAnim.ref} className="py-20 md:py-28 bg-surface-secondary overflow-hidden relative">
      {/* ═══ ABSTRACT SHAPES ═══ */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-14 end-[10%] w-[260px] h-[260px] bg-brand-blue/[0.03] animate-[morph-blob_14s_ease-in-out_infinite]" style={{ borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%" }} />
        <div className="absolute -bottom-10 -start-10 w-[220px] h-[220px] bg-emerald-400/[0.03] animate-[morph-blob_11s_ease-in-out_infinite_3s]" style={{ borderRadius: "40% 60% 70% 30% / 50% 60% 30% 60%" }} />
        <div className="absolute top-[5%] start-[4%] w-14 h-14 rounded-full border-2 border-brand-blue/[0.06] animate-[drift-horizontal_8s_ease-in-out_infinite]" />
        <div className="absolute bottom-[8%] end-[5%] w-5 h-5 rounded-full bg-amber-400/12 animate-[float-medium_5s_ease-in-out_infinite_0.6s]" />
        <div className="absolute top-[40%] start-[2%] w-4 h-4 bg-pink-400/10 rotate-45 animate-[float-slow_6s_ease-in-out_infinite_1s]" />
        <div className="absolute top-[15%] end-[3%] w-3 h-3 rounded-full bg-violet-400/10 animate-[float-medium_4s_ease-in-out_infinite_0.3s]" />
        <div className="absolute bottom-[15%] start-[20%] text-emerald-400/[0.05] animate-[float-slow_7s_ease-in-out_infinite_1.5s]">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" /></svg>
        </div>
        <svg className="absolute bottom-[5%] end-[12%] w-20 h-20 text-brand-blue/[0.04] animate-[float-slow_10s_ease-in-out_infinite]" viewBox="0 0 80 80" fill="none">
          <circle cx="40" cy="40" r="32" stroke="currentColor" strokeWidth="1" strokeDasharray="3 5" />
        </svg>
      </div>

      <Container>
        {/* Header — slide down */}
        <div
          className={cn(
            "text-center mb-10 md:mb-14 transition-all duration-700 ease-out",
            sectionAnim.visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-8"
          )}
        >
          <SectionLabel color="green" className="mb-5 block justify-center">
            {isAr ? "برامجنا وركائزنا" : "Our Pillars & Programs"}
          </SectionLabel>
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-text-primary leading-[1.08] tracking-tight mb-5 max-w-2xl mx-auto">
            {isAr
              ? "5 ركائز لإطلاق الأفكار وتنمية المشاريع وتوسيع التأثير"
              : "5 pillars to launch ideas, grow ventures and scale impact"}
          </h2>
          <p className="text-text-secondary leading-relaxed text-[15px] max-w-xl mx-auto">
            {isAr
              ? "تقع أنشطتنا وبرامجنا الرئيسية ضمن عدة ركائز متكاملة"
              : "Our main activities and programs fall under several integrated pillars"}
          </p>
        </div>

        {/* Pillar filter pills — scale in */}
        <div
          className={cn(
            "mb-10 md:mb-12 transition-all duration-700 ease-out",
            sectionAnim.visible ? "opacity-100 scale-100" : "opacity-0 scale-95"
          )}
          style={{ transitionDelay: "150ms" }}
        >
          <div
            ref={pillarsScrollRef}
            className="flex gap-2.5 overflow-x-auto pb-3 px-1 scrollbar-hide justify-start md:justify-center md:flex-wrap"
          >
            {pillars.map((pillar, i) => {
              const Icon = pillar.icon;
              const isActive = activePillar === pillar.slug;
              return (
                <button
                  key={pillar.slug}
                  onClick={() => setActivePillar(pillar.slug)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 rounded-full text-[13px] font-semibold whitespace-nowrap transition-all duration-300 flex-shrink-0 border",
                    isActive
                      ? `${pillar.color} text-white border-transparent shadow-lg`
                      : "bg-white/80 text-text-secondary border-surface-tertiary hover:border-brand-blue/30 hover:text-text-primary hover:shadow-sm"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {isAr ? pillar.nameAr : pillar.nameEn}
                </button>
              );
            })}
          </div>
        </div>

        {/* Programs slider */}
        {filteredPrograms.length > 0 ? (
          <>
            <div className={cn(
              "flex items-center justify-between mb-6 transition-all duration-700",
              sectionAnim.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )} style={{ transitionDelay: "250ms" }}>
              <p className="text-sm text-text-muted">
                {filteredPrograms.length} {isAr ? "برنامج" : "programs"}
              </p>
              <div className="hidden md:flex items-center gap-2">
                <button
                  onClick={prev}
                  disabled={current === 0}
                  className={cn(
                    "w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all",
                    current === 0
                      ? "opacity-30 cursor-not-allowed border-gray-200"
                      : "border-gray-300 hover:border-brand-blue hover:text-brand-blue hover:shadow-md"
                  )}
                >
                  <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
                </button>
                <button
                  onClick={next}
                  disabled={current >= maxIndex}
                  className={cn(
                    "w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all",
                    current >= maxIndex
                      ? "opacity-30 cursor-not-allowed border-gray-200"
                      : "border-gray-300 hover:border-brand-blue hover:text-brand-blue hover:shadow-md"
                  )}
                >
                  <ChevronRight className="w-4 h-4 rtl:rotate-180" />
                </button>
              </div>
            </div>

            <div className="relative touch-pan-y">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activePillar}
                  className="flex transition-transform duration-500 ease-out"
                  style={{ transform: `translateX(${isAr ? -offset : offset}%)` }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {filteredPrograms.map((program, pi) => {
                    const status = statusConfig[program.status];
                    return (
                      <div
                        key={program.id}
                        className="flex-shrink-0 px-2.5"
                        style={{ width: `${100 / visibleCount}%` }}
                      >
                        <Link href={`/programs/${program.slug}`} className="block group">
                          <div className={cn(
                            "bg-white rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-700 h-full flex flex-col border border-gray-100 hover:-translate-y-1.5",
                            sectionAnim.visible
                              ? "opacity-100 translate-y-0"
                              : "opacity-0 translate-y-8"
                          )} style={{ transitionDelay: `${350 + pi * 100}ms` }}>
                            <div className="relative h-52 overflow-hidden">
                              <Image
                                src={program.coverImageUrl || "/images/new/community-table.jpg"}
                                alt={isAr ? program.titleAr : program.titleEn}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-700"
                                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                draggable={false}
                              />
                              <div className="absolute top-3 start-3">
                                <span
                                  className={cn(
                                    status.color,
                                    "text-white text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full"
                                  )}
                                >
                                  {isAr ? status.labelAr : status.label}
                                </span>
                              </div>
                              {program.year && (
                                <div className="absolute top-3 end-3">
                                  <span className="bg-black/50 backdrop-blur-sm text-white text-[11px] font-semibold px-2.5 py-1 rounded-full">
                                    {program.year}
                                  </span>
                                </div>
                              )}
                              <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/30 to-transparent" />
                            </div>

                            <div className="p-5 flex flex-col flex-1">
                              {program.pillar && (
                                <span className="text-brand-blue text-[11px] font-bold uppercase tracking-wider mb-2">
                                  {isAr ? program.pillar.titleAr : program.pillar.titleEn}
                                </span>
                              )}
                              <h3 className="font-bold text-text-primary leading-snug mb-2.5 line-clamp-2 group-hover:text-brand-blue transition-colors">
                                {isAr ? program.titleAr : program.titleEn}
                              </h3>
                              <p className="text-text-secondary text-sm leading-relaxed line-clamp-2 mb-4 flex-1">
                                {isAr ? program.summaryAr : program.summaryEn}
                              </p>
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
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="mt-8 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {Array.from({ length: maxIndex + 1 }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrent(i)}
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-300",
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
          </>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {pillars.slice(1).map((pillar, i) => {
              const Icon = pillar.icon;
              const fromLeft = i % 2 === 0;
              return (
                <Link
                  key={pillar.slug}
                  href={`/programs?pillar=${pillar.slug}`}
                  className={cn(
                    "group bg-white rounded-2xl p-6 flex flex-col items-center text-center hover:shadow-lg transition-all duration-700 border border-gray-100 hover:border-gray-200 hover:-translate-y-1",
                    sectionAnim.visible
                      ? "opacity-100 translate-x-0"
                      : fromLeft ? "opacity-0 -translate-x-8" : "opacity-0 translate-x-8"
                  )}
                  style={{ transitionDelay: `${300 + i * 80}ms` }}
                >
                  <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-3", `${pillar.color}/10`)}>
                    <Icon className={cn("w-5 h-5", pillar.textColor)} />
                  </div>
                  <span className="font-bold text-sm text-text-primary group-hover:text-brand-blue transition-colors">
                    {isAr ? pillar.nameAr : pillar.nameEn}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </Container>
    </section>
  );
}
