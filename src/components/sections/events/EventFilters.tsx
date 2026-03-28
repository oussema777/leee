"use client";

import { useLocale } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { cn } from "@/lib/utils";
import { Filter } from "lucide-react";

interface EventFiltersProps {
  categories: string[];
}

const statusLabels: Record<string, { en: string; ar: string }> = {
  ALL: { en: "All Events", ar: "جميع الفعاليات" },
  UPCOMING: { en: "Upcoming", ar: "القادمة" },
  PAST: { en: "Past", ar: "السابقة" },
};

const categoryLabels: Record<string, { en: string; ar: string }> = {
  workshop: { en: "Workshop", ar: "ورشة عمل" },
  webinar: { en: "Webinar", ar: "ندوة عبر الإنترنت" },
  conference: { en: "Conference", ar: "مؤتمر" },
  community: { en: "Community", ar: "مجتمعية" },
  training: { en: "Training", ar: "تدريب" },
};

export function EventFilters({ categories }: EventFiltersProps) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentStatus = searchParams.get("status") || "ALL";
  const currentCategory = searchParams.get("category") || "";

  const updateFilter = useCallback(
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

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
      {/* Status Tabs */}
      <div className="flex items-center gap-1 flex-wrap">
        {(["ALL", "UPCOMING", "PAST"] as const).map((status) => (
          <button
            key={status}
            onClick={() => updateFilter("status", status === "ALL" ? "" : status)}
            className={cn(
              "px-5 py-2.5 text-sm font-semibold transition-all border-b-2",
              (currentStatus === status || (!currentStatus && status === "ALL"))
                ? "border-brand-blue text-brand-blue bg-brand-blue-light/50"
                : "border-transparent text-text-secondary hover:text-brand-blue hover:border-brand-blue/30"
            )}
          >
            {isAr ? statusLabels[status].ar : statusLabels[status].en}
          </button>
        ))}
      </div>

      {/* Category Dropdown */}
      {categories.length > 0 && (
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-text-muted" />
          <select
            value={currentCategory}
            onChange={(e) => updateFilter("category", e.target.value)}
            className="bg-surface-secondary border border-gray-200 text-sm px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-blue"
          >
            <option value="">
              {isAr ? "جميع الفئات" : "All Categories"}
            </option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {isAr ? categoryLabels[cat]?.ar : categoryLabels[cat]?.en}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
