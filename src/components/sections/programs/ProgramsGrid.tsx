"use client";

import { useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";
import { ProgramCard } from "./ProgramCard";
import { ProgramFilters } from "./ProgramFilters";
import { FolderOpen } from "lucide-react";

/* ── Theme detection ── */
const themeKeywords: Record<string, { en: string; ar: string; keywords: string[] }> = {
  women: {
    en: "Women",
    ar: "نساء",
    keywords: ["women", "woman", "female", "gender", "نساء", "مرأة", "نسائي"],
  },
  youth: {
    en: "Youth",
    ar: "شباب",
    keywords: ["youth", "young", "شباب", "شابات"],
  },
  green: {
    en: "Green Economy",
    ar: "اقتصاد أخضر",
    keywords: ["green", "climate", "environment", "أخضر", "مناخ", "بيئة"],
  },
  msme: {
    en: "MSMEs",
    ar: "مشاريع صغيرة",
    keywords: ["msme", "startup", "enterprise", "business", "مشاريع", "ريادة"],
  },
};

function detectThemes(program: Program): string[] {
  const text = `${program.titleEn} ${program.summaryEn} ${program.titleAr} ${program.summaryAr} ${program.category || ""}`.toLowerCase();
  const themes: string[] = [];
  for (const [key, config] of Object.entries(themeKeywords)) {
    if (config.keywords.some((kw) => text.includes(kw))) {
      themes.push(key);
    }
  }
  return themes;
}

interface Program {
  id: string;
  slug: string;
  titleEn: string;
  titleAr: string;
  summaryEn: string;
  summaryAr: string;
  coverImageUrl: string | null;
  status: "ACTIVE" | "COMPLETED" | "UPCOMING";
  category: string | null;
  year: number | null;
  endYear: number | null;
  donorEn: string | null;
  donorAr: string | null;
  locationEn: string | null;
  locationAr: string | null;
  pillar: {
    slug: string;
    titleEn: string;
    titleAr: string;
  } | null;
}

interface ProgramsGridProps {
  programs: Program[];
}

export function ProgramsGrid({ programs }: ProgramsGridProps) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const searchParams = useSearchParams();

  const currentStatus = searchParams.get("status") || "ALL";
  const currentYear = searchParams.get("year") || "";
  const currentPillar = searchParams.get("pillar") || "";
  const currentTheme = searchParams.get("theme") || "";
  const currentDonor = searchParams.get("donor") || "";

  // Precompute themes for each program
  const programsWithThemes = programs.map((p) => ({
    ...p,
    themes: detectThemes(p),
  }));

  const filteredPrograms = programsWithThemes.filter((program) => {
    if (currentPillar && program.pillar?.slug !== currentPillar) return false;
    if (currentStatus !== "ALL" && program.status !== currentStatus) return false;
    if (currentYear && program.year !== parseInt(currentYear)) return false;
    if (currentTheme && !program.themes.includes(currentTheme)) return false;
    if (currentDonor && program.donorEn !== currentDonor) return false;
    return true;
  });

  const years = [...new Set(programs.map((p) => p.year).filter(Boolean))] as number[];
  years.sort((a, b) => b - a);

  const statuses = [...new Set(programs.map((p) => p.status))];
  const pillarSlugs = [...new Set(programs.map((p) => p.pillar?.slug).filter(Boolean))] as string[];

  // Extract unique donors
  const donors = [...new Set(programs.map((p) => p.donorEn).filter(Boolean))] as string[];
  donors.sort();

  // Extract available themes
  const allThemes = [...new Set(programsWithThemes.flatMap((p) => p.themes))];

  return (
    <>
      <ProgramFilters
        years={years}
        statuses={statuses}
        pillarSlugs={pillarSlugs}
        donors={donors}
        themes={allThemes}
      />

      {/* Results count */}
      <div className="flex items-center gap-3 mb-8">
        <span className="text-sm text-text-muted">
          {filteredPrograms.length} {isAr ? "برنامج" : "programs found"}
        </span>
        <div className="flex-1 h-[1px] bg-surface-tertiary" />
      </div>

      {filteredPrograms.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPrograms.map((program) => (
            <ProgramCard key={program.id} {...program} themes={program.themes} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-surface-secondary flex items-center justify-center mx-auto mb-5">
            <FolderOpen className="w-8 h-8 text-text-muted" />
          </div>
          <p className="text-text-secondary text-lg font-serif">
            {isAr
              ? "لم يتم العثور على برامج تطابق معايير البحث."
              : "No programs found matching your filters."}
          </p>
          <p className="text-text-muted text-sm mt-2">
            {isAr ? "جرب تعديل الفلاتر" : "Try adjusting your filter criteria"}
          </p>
        </div>
      )}
    </>
  );
}
