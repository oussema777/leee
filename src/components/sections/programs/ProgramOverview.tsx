"use client";

import { useLocale } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { Container } from "@/components/ui/Container";
import { ProgramMetaStrip } from "./ProgramMetaStrip";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface ProgramOverviewProps {
  bodyEn: string;
  bodyAr: string;
  objectivesEn?: string | null;
  objectivesAr?: string | null;
  status: "ACTIVE" | "COMPLETED" | "UPCOMING";
  pillar?: { titleEn: string; titleAr: string } | null;
  donorEn?: string | null;
  donorAr?: string | null;
  locationEn?: string | null;
  locationAr?: string | null;
  year?: number | null;
  beneficiaries?: number | null;
  galleryImages?: { id: string; imageUrl: string; caption?: string | null }[];
}

// Decorative images shown in the overview
const decorativeImages = [
  "/images/new/coaching-session.jpg",
  "/images/new/classroom.jpg",
  "/images/new/community-table.jpg",
  "/images/new/workshop-notes.jpg",
  "/images/new/greenhouse-visit.jpg",
  "/images/new/stage-group.jpg",
];

function useInView(threshold = 0.15) {
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

export function ProgramOverview({
  bodyEn,
  bodyAr,
  objectivesEn,
  objectivesAr,
  status,
  pillar,
  donorEn,
  donorAr,
  locationEn,
  locationAr,
  year,
  beneficiaries,
  galleryImages,
}: ProgramOverviewProps) {
  const locale = useLocale();
  const isAr = locale === "ar";

  const objectives = isAr ? objectivesAr : objectivesEn;
  const objectivesList = objectives
    ? objectives.split("\n").filter((o) => o.trim())
    : [];

  // Pick images: prefer gallery images, no fallback if none
  const displayImages = galleryImages && galleryImages.length > 0
    ? galleryImages.map(img => img.imageUrl)
    : [];

  const headerAnim = useInView(0.2);
  const bodyAnim = useInView(0.1);
  const mosaicAnim = useInView(0.15);
  const objectivesAnim = useInView(0.15);
  const bottomImagesAnim = useInView(0.1);

  return (
    <section id="overview" className="scroll-mt-16 relative overflow-hidden">
      {/* Meta strip */}
      <ProgramMetaStrip
        status={status}
        pillar={pillar}
        donorEn={donorEn}
        donorAr={donorAr}
        locationEn={locationEn}
        locationAr={locationAr}
        year={year}
        beneficiaries={beneficiaries}
      />

      <div className="py-20 md:py-28 relative">
        {/* ═══ ABSTRACT SHAPES LAYER ═══ */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Large morphing blob - top right */}
          <div
            className="absolute -top-20 -end-20 w-[340px] h-[340px] bg-brand-blue/[0.04] animate-[morph-blob_12s_ease-in-out_infinite]"
            style={{ borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%" }}
          />
          {/* Medium morphing blob - bottom left */}
          <div
            className="absolute -bottom-16 -start-16 w-[260px] h-[260px] bg-accent-sky/40 animate-[morph-blob_10s_ease-in-out_infinite_2s]"
            style={{ borderRadius: "40% 60% 70% 30% / 50% 60% 30% 60%" }}
          />

          {/* Floating circles */}
          <div className="absolute top-[8%] end-[12%] w-20 h-20 rounded-full border-2 border-brand-blue/[0.08] animate-[drift-horizontal_8s_ease-in-out_infinite]" />
          <div className="absolute top-[25%] start-[3%] w-6 h-6 rounded-full bg-emerald-400/15 animate-[float-medium_5s_ease-in-out_infinite_0.5s]" />
          <div className="absolute bottom-[15%] end-[6%] w-4 h-4 rounded-full bg-pink-400/15 animate-[float-slow_4.5s_ease-in-out_infinite_1s]" />
          <div className="absolute top-[55%] start-[6%] w-3 h-3 rounded-full bg-amber-400/15 animate-[float-medium_6s_ease-in-out_infinite_0.8s]" />

          {/* Rings */}
          <div className="absolute top-[35%] end-[4%] w-14 h-14 rounded-full border-[3px] border-brand-blue/[0.06] animate-[float-slow_7s_ease-in-out_infinite]" />
          <div className="absolute bottom-[30%] start-[8%] w-10 h-10 rounded-full border-2 border-emerald-400/10 animate-[drift-horizontal_9s_ease-in-out_infinite_1s]" />

          {/* Stars */}
          <div className="absolute top-[12%] start-[15%] text-amber-400/15 animate-[float-slow_6s_ease-in-out_infinite_0.5s]">
            <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
            </svg>
          </div>
          <div className="absolute bottom-[10%] end-[18%] text-brand-blue/10 animate-[float-medium_5s_ease-in-out_infinite_1.5s]">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
            </svg>
          </div>

          {/* Crosses */}
          <div className="absolute top-[60%] end-[22%] text-brand-blue/[0.07] animate-[float-slow_5.5s_ease-in-out_infinite_0.3s]">
            <svg className="w-6 h-6" viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth={2}>
              <path d="M12 4v16M4 12h16" />
            </svg>
          </div>
          <div className="absolute bottom-[40%] start-[2%] text-emerald-400/10 animate-[float-medium_4.5s_ease-in-out_infinite_0.7s]">
            <svg className="w-5 h-5" viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth={2}>
              <path d="M12 4v16M4 12h16" />
            </svg>
          </div>

          {/* Diamonds */}
          <div className="absolute top-[75%] start-[18%] w-4 h-4 bg-pink-400/10 rotate-45 animate-[float-slow_5s_ease-in-out_infinite_1.2s]" />
          <div className="absolute top-[18%] end-[30%] w-3 h-3 bg-brand-blue/[0.08] rotate-45 animate-[drift-horizontal_7s_ease-in-out_infinite_0.5s]" />

          {/* Triangles */}
          <div className="absolute bottom-[22%] end-[35%] text-amber-400/10 animate-[float-medium_6s_ease-in-out_infinite_0.4s]">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L22 20H2L12 2z" />
            </svg>
          </div>

          {/* Dotted line accents */}
          <div className="absolute top-[45%] start-0 w-24 border-t-2 border-dotted border-brand-blue/[0.06]" />
          <div className="absolute bottom-[35%] end-0 w-20 border-t-2 border-dotted border-brand-blue/[0.06]" />
        </div>

        <Container>
          {/* ═══ SECTION HEADER — slide down ═══ */}
          <div
            ref={headerAnim.ref}
            className={cn(
              "text-center mb-16 transition-all duration-700",
              headerAnim.visible
                ? "opacity-100 translate-y-0"
                : "opacity-0 -translate-y-8"
            )}
          >
            <span className="inline-flex items-center gap-3 text-brand-blue text-[11px] font-bold uppercase tracking-[0.3em] mb-4">
              <span className="w-6 h-[1.5px] bg-brand-blue" />
              {isAr ? "عن البرنامج" : "About the Program"}
              <span className="w-6 h-[1.5px] bg-brand-blue" />
            </span>
          </div>

          {/* ═══ MAIN CONTENT: 2-column editorial layout ═══ */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start mb-20">

            {/* LEFT COLUMN: Body text — slide in from left */}
            <div
              ref={bodyAnim.ref}
              className={cn(
                "lg:col-span-7 transition-all duration-800 ease-out",
                bodyAnim.visible
                  ? "opacity-100 translate-x-0"
                  : "opacity-0 -translate-x-16"
              )}
              style={{ transitionDelay: "150ms" }}
            >
              <div
                className="prose prose-lg max-w-none prose-headings:font-serif prose-headings:text-text-primary prose-headings:tracking-tight prose-p:text-text-secondary prose-p:leading-relaxed prose-strong:text-text-primary prose-li:text-text-secondary prose-a:text-brand-blue"
                dangerouslySetInnerHTML={{ __html: isAr ? bodyAr : bodyEn }}
              />

              {/* Accent quote strip */}
              <div
                className={cn(
                  "mt-8 flex items-start gap-4 p-5 rounded-xl bg-accent-sky/50 border border-brand-blue/10 transition-all duration-700",
                  bodyAnim.visible
                    ? "opacity-100 translate-x-0"
                    : "opacity-0 -translate-x-10"
                )}
                style={{ transitionDelay: "400ms" }}
              >
                <div className="w-1 h-14 shrink-0 rounded-full bg-brand-blue" />
                <p className="text-text-secondary text-[15px] leading-relaxed italic font-serif">
                  {isAr
                    ? "نعمل على تمكين المجتمعات من خلال برامج مبتكرة تحقق أثراً حقيقياً ومستداماً."
                    : "We empower communities through innovative programs that create real, sustainable impact."}
                </p>
              </div>
            </div>

            {/* RIGHT COLUMN: Image mosaic — slide in from right with stagger */}
            <div
              ref={mosaicAnim.ref}
              className="lg:col-span-5"
            >
              <div className="grid grid-cols-2 gap-3">
                {/* Large featured image */}
                <div
                  className={cn(
                    "col-span-2 relative aspect-[16/10] rounded-2xl overflow-hidden shadow-lg transition-all duration-700 ease-out",
                    mosaicAnim.visible
                      ? "opacity-100 translate-x-0 scale-100"
                      : "opacity-0 translate-x-16 scale-95"
                  )}
                  style={{ transitionDelay: "200ms" }}
                >
                  <Image
                    src={displayImages[0]}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 40vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-accent-navy/20 to-transparent" />
                  {/* Abstract corner shape */}
                  <div className="absolute top-3 end-3 w-8 h-8 border-2 border-white/30 rounded-full" />
                </div>

                {/* Two smaller images */}
                <div
                  className={cn(
                    "relative aspect-square rounded-xl overflow-hidden shadow-md transition-all duration-700 ease-out",
                    mosaicAnim.visible
                      ? "opacity-100 translate-y-0 rotate-0"
                      : "opacity-0 translate-y-10 -rotate-3"
                  )}
                  style={{ transitionDelay: "400ms" }}
                >
                  <Image
                    src={displayImages[1]}
                    alt=""
                    fill
                    className="object-cover hover:scale-110 transition-transform duration-700"
                    sizes="(max-width: 1024px) 50vw, 20vw"
                  />
                </div>
                <div
                  className={cn(
                    "relative aspect-square rounded-xl overflow-hidden shadow-md transition-all duration-700 ease-out",
                    mosaicAnim.visible
                      ? "opacity-100 translate-y-0 rotate-0"
                      : "opacity-0 translate-y-10 rotate-3"
                  )}
                  style={{ transitionDelay: "550ms" }}
                >
                  <Image
                    src={displayImages[2]}
                    alt=""
                    fill
                    className="object-cover hover:scale-110 transition-transform duration-700"
                    sizes="(max-width: 1024px) 50vw, 20vw"
                  />
                  {/* Abstract overlay dot */}
                  <div className="absolute bottom-2 start-2 w-5 h-5 rounded-full bg-brand-blue/30 backdrop-blur-sm" />
                </div>
              </div>

              {/* Abstract shape below mosaic */}
              <div className="flex justify-center mt-4 gap-2">
                <div className="w-8 h-1 rounded-full bg-brand-blue/20" />
                <div className="w-3 h-1 rounded-full bg-brand-blue/10" />
                <div className="w-1.5 h-1 rounded-full bg-brand-blue/10" />
              </div>
            </div>
          </div>

          {/* ═══ OBJECTIVES — scale in with staggered items ═══ */}
          {objectivesList.length > 0 && (
            <div
              ref={objectivesAnim.ref}
              className={cn(
                "bg-surface-secondary rounded-2xl p-8 md:p-10 border border-surface-tertiary border-s-[3px] border-s-brand-blue relative overflow-hidden transition-all duration-700 ease-out mb-20",
                objectivesAnim.visible
                  ? "opacity-100 scale-100"
                  : "opacity-0 scale-95"
              )}
              style={{ transitionDelay: "100ms" }}
            >
              {/* Abstract shapes inside objectives */}
              <div className="absolute top-4 end-4 w-16 h-16 rounded-full border-2 border-brand-blue/[0.06] animate-[float-slow_6s_ease-in-out_infinite]" />
              <div className="absolute bottom-4 end-20 w-3 h-3 bg-emerald-400/15 rounded-full animate-[float-medium_4s_ease-in-out_infinite_0.5s]" />
              <div className="absolute top-1/2 end-8 w-4 h-4 bg-brand-blue/[0.05] rotate-45 animate-[float-slow_5s_ease-in-out_infinite_1s]" />

              <h3 className="font-serif text-xl md:text-2xl text-text-primary mb-6 tracking-tight">
                {isAr ? "أهداف البرنامج" : "Program Objectives"}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {objectivesList.map((objective, index) => (
                  <div
                    key={index}
                    className={cn(
                      "flex items-start gap-3 bg-white rounded-xl p-4 border border-surface-tertiary hover:border-brand-blue/20 hover:shadow-sm transition-all duration-500",
                      objectivesAnim.visible
                        ? "opacity-100 translate-y-0"
                        : "opacity-0 translate-y-6"
                    )}
                    style={{ transitionDelay: `${200 + index * 100}ms` }}
                  >
                    <div className="w-8 h-8 rounded-lg bg-brand-blue/10 flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 className="w-4 h-4 text-brand-blue" />
                    </div>
                    <span className="text-text-secondary text-[15px] leading-relaxed">{objective}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═══ BOTTOM IMAGE STRIP — alternating slide-left / slide-right ═══ */}
          <div
            ref={bottomImagesAnim.ref}
            className="grid grid-cols-2 md:grid-cols-4 gap-3"
          >
            {displayImages.slice(2, 6).map((img, i) => (
              <div
                key={i}
                className={cn(
                  "relative overflow-hidden rounded-xl group transition-all duration-700 ease-out",
                  i % 2 === 0 ? "aspect-[4/3]" : "aspect-square",
                  bottomImagesAnim.visible
                    ? "opacity-100 translate-x-0 translate-y-0"
                    : i % 2 === 0
                      ? "opacity-0 -translate-x-12"
                      : "opacity-0 translate-x-12"
                )}
                style={{ transitionDelay: `${i * 150}ms` }}
              >
                <Image
                  src={img}
                  alt=""
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-700"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-accent-navy/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                {/* Abstract overlay elements */}
                {i === 0 && (
                  <div className="absolute top-2 start-2 w-6 h-6 rounded-full border-2 border-white/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                )}
                {i === 1 && (
                  <div className="absolute bottom-2 end-2 w-4 h-4 bg-white/30 rotate-45 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                )}
                {i === 2 && (
                  <div className="absolute top-2 end-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <svg className="w-5 h-5 text-white/40" viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth={2}>
                      <path d="M12 4v16M4 12h16" />
                    </svg>
                  </div>
                )}
                {i === 3 && (
                  <div className="absolute bottom-2 start-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <div className="w-1.5 h-1.5 rounded-full bg-white/50" />
                    <div className="w-1.5 h-1.5 rounded-full bg-white/30" />
                    <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Abstract separator */}
          <div className="flex items-center justify-center gap-3 mt-12">
            <div className="w-12 h-[1.5px] bg-brand-blue/15" />
            <div className="w-2 h-2 rounded-full bg-brand-blue/15" />
            <div className="w-20 h-[1.5px] bg-brand-blue/10" />
            <div className="w-1.5 h-1.5 rotate-45 bg-brand-blue/15" />
            <div className="w-12 h-[1.5px] bg-brand-blue/15" />
          </div>
        </Container>
      </div>
    </section>
  );
}
