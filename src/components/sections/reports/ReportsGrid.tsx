"use client";

import { useCallback } from "react";
import { useLocale } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { FileText, Download, Calendar, FileX2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { reportCategories, demoReports } from "./reportsData";

export function ReportsGrid() {
  const locale = useLocale();
  const isAr = locale === "ar";
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentCategory = searchParams.get("category") || "";
  const currentYear = searchParams.get("year") || "";

  const years = [...new Set(demoReports.map((r) => r.year))].sort((a, b) => b - a);

  const filteredReports = demoReports.filter((report) => {
    if (currentCategory && report.categorySlug !== currentCategory) return false;
    if (currentYear && report.year !== Number(currentYear)) return false;
    return true;
  });

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
    <>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        {/* Category Tabs */}
        <div className="flex items-center gap-1 flex-wrap overflow-x-auto pb-2">
          <button
            onClick={() => updateFilter("category", "")}
            className={cn(
              "px-5 py-2.5 text-sm font-semibold transition-all border-b-2 whitespace-nowrap",
              !currentCategory
                ? "border-brand-blue text-brand-blue bg-brand-blue-light/50"
                : "border-transparent text-text-secondary hover:text-brand-blue hover:border-brand-blue/30"
            )}
          >
            {isAr ? "الكل" : "All"}
          </button>
          {reportCategories.map((cat) => (
            <button
              key={cat.slug}
              onClick={() => updateFilter("category", cat.slug)}
              className={cn(
                "px-5 py-2.5 text-sm font-semibold transition-all border-b-2 whitespace-nowrap",
                currentCategory === cat.slug
                  ? "border-brand-blue text-brand-blue bg-brand-blue-light/50"
                  : "border-transparent text-text-secondary hover:text-brand-blue hover:border-brand-blue/30"
              )}
            >
              {isAr ? cat.nameAr : cat.nameEn}
            </button>
          ))}
        </div>

        {/* Year Dropdown */}
        <select
          value={currentYear}
          onChange={(e) => updateFilter("year", e.target.value)}
          className="bg-surface-secondary border border-gray-200 text-sm px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-blue"
        >
          <option value="">{isAr ? "جميع السنوات" : "All Years"}</option>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      {/* Count */}
      <p className="text-sm text-text-muted mb-6">
        {filteredReports.length}{" "}
        {isAr ? "تقارير ومنشورات" : "reports & publications"}
      </p>

      {/* Reports Grid */}
      {filteredReports.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReports.map((report) => (
            <div
              key={report.id}
              className="group bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col"
            >
              {/* Cover Image */}
              <div className="relative aspect-[3/2] overflow-hidden bg-gray-100">
                <img
                  src={report.coverImageUrl}
                  alt={isAr ? report.titleAr : report.titleEn}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                {/* Year badge */}
                <div className="absolute top-3 start-3 bg-brand-blue text-white text-xs font-bold px-2.5 py-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {report.year}
                </div>
                {/* Category badge */}
                <div className="absolute top-3 end-3 bg-white/90 text-text-primary text-[10px] font-semibold uppercase tracking-wider px-2 py-1">
                  {isAr
                    ? reportCategories.find((c) => c.slug === report.categorySlug)?.nameAr
                    : reportCategories.find((c) => c.slug === report.categorySlug)?.nameEn}
                </div>
              </div>

              {/* Content */}
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex items-start gap-2 mb-2">
                  <FileText className="w-4 h-4 text-brand-blue shrink-0 mt-0.5" />
                  <h3 className="text-sm font-semibold text-text-primary line-clamp-2 group-hover:text-brand-blue transition-colors">
                    {isAr ? report.titleAr : report.titleEn}
                  </h3>
                </div>
                <p className="text-xs text-text-muted line-clamp-3 mb-4 flex-1">
                  {isAr ? report.descriptionAr : report.descriptionEn}
                </p>

                {/* Download Button */}
                <a
                  href={report.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 text-sm font-medium text-white bg-brand-blue hover:bg-brand-blue-dark transition-colors px-4 py-2.5 w-full"
                >
                  <Download className="w-4 h-4" />
                  {isAr ? "تحميل التقرير" : "Download Report"}
                </a>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <FileX2 className="w-16 h-16 mx-auto text-text-muted mb-4" />
          <p className="text-text-secondary text-lg">
            {isAr
              ? "لم يتم العثور على تقارير تطابق معايير البحث."
              : "No reports found matching your filters."}
          </p>
        </div>
      )}
    </>
  );
}
