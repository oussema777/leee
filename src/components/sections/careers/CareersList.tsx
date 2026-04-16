"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { MapPin, CalendarClock, Briefcase } from "lucide-react";
import { CareerApplyModal } from "./CareerApplyModal";

type JobType = "FULL_TIME" | "PART_TIME" | "CONTRACT" | "VOLUNTEER" | "INTERNSHIP";

export interface CareerListItem {
  id: string;
  slug: string;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  locationEn: string | null;
  locationAr: string | null;
  type: JobType;
  deadline: string | null; // ISO string or null
}

const typeKeyMap: Record<JobType, string> = {
  FULL_TIME: "fullTime",
  PART_TIME: "partTime",
  CONTRACT: "contract",
  VOLUNTEER: "volunteer",
  INTERNSHIP: "internship",
};

export function CareersList({ careers }: { careers: CareerListItem[] }) {
  const locale = useLocale();
  const t = useTranslations("careers");
  const isAr = locale === "ar";
  const [applyFor, setApplyFor] = useState<CareerListItem | null>(null);

  if (careers.length === 0) {
    return (
      <div className="text-center py-16">
        <Briefcase className="w-16 h-16 mx-auto text-text-muted mb-4" />
        <p className="text-text-secondary text-lg mb-4">{t("noPositions")}</p>
        <Link
          href="/get-involved/join-us"
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-brand-blue rounded-full hover:bg-brand-blue-dark transition-colors"
        >
          {t("noPositionsCta")}
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {careers.map((c) => {
          const title = isAr ? c.titleAr : c.titleEn;
          const description = isAr ? c.descriptionAr : c.descriptionEn;
          const location = isAr ? c.locationAr : c.locationEn;
          const deadline = c.deadline
            ? new Date(c.deadline).toLocaleDateString(isAr ? "ar-LB" : "en-US", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })
            : null;
          const typeLabel = t(`jobType.${typeKeyMap[c.type]}`);

          return (
            <div
              key={c.id}
              className="bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-6 md:p-8"
            >
              <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-xl font-semibold text-text-primary">{title}</h2>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-brand-blue bg-brand-blue-light/40 px-2.5 py-1">
                    {typeLabel}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs text-text-muted mb-3 flex-wrap">
                {location && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" />
                    {location}
                  </span>
                )}
                {deadline && (
                  <span className="flex items-center gap-1.5">
                    <CalendarClock className="w-4 h-4" />
                    {t("applyBy")}: {deadline}
                  </span>
                )}
              </div>

              <p className="text-sm text-text-secondary line-clamp-3 mb-5">{description}</p>

              <button
                type="button"
                onClick={() => setApplyFor(c)}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-brand-blue hover:bg-brand-blue-dark transition-colors rounded-full"
              >
                {t("applyNow")}
              </button>
            </div>
          );
        })}
      </div>

      <CareerApplyModal
        isOpen={applyFor !== null}
        onClose={() => setApplyFor(null)}
        careerSlug={applyFor?.slug ?? ""}
        careerTitleEn={applyFor?.titleEn ?? ""}
        careerTitleAr={applyFor?.titleAr ?? ""}
      />
    </>
  );
}
