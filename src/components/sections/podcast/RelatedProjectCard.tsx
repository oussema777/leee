"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ArrowRight } from "lucide-react";
import { relatedPrograms } from "./relatedPrograms";
import { pillarColors, defaultPillarAccent } from "@/lib/pillarColors";

interface RelatedProjectCardProps {
  slug: string;
}

const pillarLabels: Record<string, { en: string; ar: string }> = {
  "humanitarian-aid": { en: "Humanitarian Aid", ar: "المساعدات الإنسانية" },
  incubators: { en: "Incubators", ar: "الحاضنات" },
  academy: { en: "Academy", ar: "الأكاديمية" },
  "business-clinic": { en: "Business Clinic", ar: "عيادة الأعمال" },
  "digital-media-hub": { en: "Digital Media Hub", ar: "مركز الإعلام الرقمي" },
};

export function RelatedProjectCard({ slug }: RelatedProjectCardProps) {
  const locale = useLocale();
  const t = useTranslations("podcast.relatedProject");
  const isAr = locale === "ar";
  const program = relatedPrograms[slug];
  if (!program) return null;

  const accent = pillarColors[program.pillarSlug] || defaultPillarAccent;
  const pillarLabel = pillarLabels[program.pillarSlug];
  const title = isAr ? program.titleAr : program.titleEn;

  return (
    <section className="mb-10">
      <h2 className="text-lg font-bold text-text-primary mb-4">
        {t("heading")}
      </h2>
      <Link
        href={`/programs/${program.slug}`}
        className="group flex bg-white border border-surface-tertiary hover:shadow-md transition-shadow overflow-hidden"
      >
        {/* Cover image */}
        <div className="relative w-24 h-24 md:w-28 md:h-28 shrink-0 overflow-hidden bg-gray-100">
          <Image
            src={program.coverImageUrl}
            alt={title}
            fill
            sizes="(max-width: 768px) 96px, 112px"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>

        {/* Pillar-color accent bar */}
        <div
          className="w-1 shrink-0"
          style={{ backgroundColor: accent.tagBg }}
          aria-hidden
        />

        {/* Content */}
        <div className="flex-1 min-w-0 p-4 md:p-5 flex flex-col justify-center">
          {pillarLabel && (
            <span
              className="inline-flex self-start text-white text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full mb-2"
              style={{ backgroundColor: accent.tagBg }}
            >
              {isAr ? pillarLabel.ar : pillarLabel.en}
            </span>
          )}
          <h3 className="text-sm md:text-base font-semibold text-text-primary line-clamp-2 mb-1.5 group-hover:text-brand-blue transition-colors">
            {title}
          </h3>
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-semibold ${accent.text} group-hover:gap-2.5 transition-all`}
          >
            <span>{t("cta")}</span>
            <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
          </span>
        </div>
      </Link>
    </section>
  );
}
