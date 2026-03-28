"use client";

import { useLocale } from "next-intl";
import { Container } from "@/components/ui/Container";
import { ProgramCard } from "./ProgramCard";

interface Program {
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

interface RelatedProgramsProps {
  programs: Program[];
}

export function RelatedPrograms({ programs }: RelatedProgramsProps) {
  const locale = useLocale();
  const isAr = locale === "ar";

  if (programs.length === 0) return null;

  return (
    <section className="py-20 md:py-28 bg-surface-secondary relative overflow-hidden">
      {/* Decorative shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[8%] end-[6%] w-14 h-14 rounded-full border-2 border-brand-blue/[0.06] animate-[float-slow_7s_ease-in-out_infinite]" />
        <div className="absolute bottom-[12%] start-[4%] w-4 h-4 rounded-full bg-emerald-400/10 animate-[float-medium_5s_ease-in-out_infinite_0.5s]" />
        <div className="absolute top-[45%] start-[2%] w-3 h-3 rounded-full bg-amber-400/10 animate-[float-slow_4.5s_ease-in-out_infinite_1s]" />
        <div className="absolute bottom-[20%] end-[8%] w-5 h-5 rounded-full bg-pink-400/10 animate-[float-medium_6s_ease-in-out_infinite_0.8s]" />
      </div>

      <Container>
        <div className="text-center mb-14">
          <span className="inline-flex items-center gap-3 text-brand-blue text-[11px] font-bold uppercase tracking-[0.3em] mb-4">
            <span className="w-6 h-[1.5px] bg-brand-blue" />
            {isAr ? "استكشف المزيد" : "Explore More"}
            <span className="w-6 h-[1.5px] bg-brand-blue" />
          </span>
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-text-primary tracking-tight">
            {isAr ? "برامج ذات صلة" : "Related Programs"}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {programs.map((program) => (
            <ProgramCard key={program.id} {...program} />
          ))}
        </div>
      </Container>
    </section>
  );
}
