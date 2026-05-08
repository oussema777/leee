"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { Clock, ArrowRight, FileX2, Search, X, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { blogCategories, demoPosts } from "./blogData";
import type { BlogPost } from "./blogData";

const PAGE_SIZE = 9;

function FeaturedPost({ post, isAr }: { post: BlogPost; isAr: boolean }) {
  const date = new Date(post.publishedAt);
  const dateStr = date.toLocaleDateString(isAr ? "ar-LB" : "en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const catLabel = blogCategories.find((c) => c.slug === post.categorySlug);

  return (
    <Link href={`/media/blog/${post.slug}`} className="block group mb-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 overflow-hidden bg-white border border-gray-100 shadow-sm hover:shadow-lg transition-shadow">
        {/* Image */}
        <div className="relative h-64 lg:h-auto min-h-[320px] overflow-hidden">
          <Image
            src={post.coverImageUrl}
            alt={isAr ? post.titleAr : post.titleEn}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent lg:hidden" />
        </div>

        {/* Content */}
        <div className="p-8 lg:p-10 flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-blue">
              {isAr ? "مقال مميز" : "Featured"}
            </span>
            <span className="text-xs font-medium text-white bg-brand-blue px-2.5 py-0.5">
              {isAr ? catLabel?.nameAr : catLabel?.nameEn}
            </span>
          </div>

          <h2 className="text-2xl lg:text-3xl font-bold text-text-primary mb-3 leading-tight group-hover:text-brand-blue transition-colors">
            {isAr ? post.titleAr : post.titleEn}
          </h2>

          <p className="text-text-secondary text-sm leading-relaxed mb-6 line-clamp-3">
            {isAr ? post.excerptAr : post.excerptEn}
          </p>

          <div className="flex items-center gap-4 text-xs text-text-muted mb-5">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-100 relative">
                <Image src={post.authorImageUrl} alt="" fill sizes="24px" className="object-cover" />
              </div>
              <span className="font-medium">{isAr ? post.authorNameAr : post.authorNameEn}</span>
            </div>
            <span>{dateStr}</span>
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{post.readTimeMin} {isAr ? "دقائق" : "min read"}</span>
            </div>
          </div>

          <div className="flex items-center text-sm font-semibold text-brand-blue group-hover:gap-2.5 gap-1.5 transition-all">
            <span>{isAr ? "اقرأ المقال" : "Read Article"}</span>
            <ArrowRight className="w-4 h-4 rtl:rotate-180" />
          </div>
        </div>
      </div>
    </Link>
  );
}

function paginationRange(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "…")[] = [1];
  if (current - 1 > 2) pages.push("…");
  for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) pages.push(p);
  if (current + 1 < total - 1) pages.push("…");
  pages.push(total);
  return pages;
}

export function BlogGrid() {
  const locale = useLocale();
  const t = useTranslations("blog");
  const isAr = locale === "ar";
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentCategory = searchParams.get("category") ?? "";
  const currentSearch = searchParams.get("search") ?? "";
  const currentPageRaw = Number(searchParams.get("page") ?? "1");
  const currentPage = Number.isFinite(currentPageRaw) && currentPageRaw > 0 ? currentPageRaw : 1;

  // Local search input state (debounced URL sync)
  const [searchInput, setSearchInput] = useState(currentSearch);

  const updateParams = useCallback(
    (patch: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(patch)) {
        if (v === null || v === "") params.delete(k);
        else params.set(k, v);
      }
      router.push(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  useEffect(() => {
    // Sync if URL changes from outside (back/forward)
    setSearchInput(currentSearch);
  }, [currentSearch]);

  useEffect(() => {
    if (searchInput === currentSearch) return;
    const handle = setTimeout(() => {
      updateParams({ search: searchInput || null, page: null });
    }, 250);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const filtered = useMemo(() => {
    const q = currentSearch.trim().toLowerCase();
    return demoPosts.filter((p) => {
      if (currentCategory && p.categorySlug !== currentCategory) return false;
      if (q) {
        const hay = [p.titleEn, p.titleAr, p.excerptEn, p.excerptAr, p.authorNameEn, p.authorNameAr]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [currentCategory, currentSearch]);

  const noFilters = !currentCategory && !currentSearch;
  const featured = noFilters ? filtered.find((p) => p.isFeatured) ?? null : null;
  const rest = featured ? filtered.filter((p) => p.id !== featured.id) : filtered;

  const totalPages = Math.max(1, Math.ceil(rest.length / PAGE_SIZE));
  const page = Math.min(Math.max(1, currentPage), totalPages);
  const pageItems = rest.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <>
      {/* Search + Category row */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div className="relative w-full md:max-w-sm">
          <Search className="absolute top-1/2 start-3 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="w-full ps-10 pe-10 py-2.5 border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => {
                setSearchInput("");
                updateParams({ search: null, page: null });
              }}
              className="absolute top-1/2 end-3 -translate-y-1/2 text-text-muted hover:text-text-primary"
              aria-label={t("clearFilters")}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1 flex-wrap overflow-x-auto pb-2">
          <button
            onClick={() => updateParams({ category: null, page: null })}
            className={cn(
              "px-5 py-2.5 text-sm font-semibold transition-all border-b-2 whitespace-nowrap",
              !currentCategory
                ? "border-brand-blue text-brand-blue bg-brand-blue-light/50"
                : "border-transparent text-text-secondary hover:text-brand-blue hover:border-brand-blue/30"
            )}
          >
            {isAr ? "الكل" : "All"}
          </button>
          {blogCategories.map((cat) => (
            <button
              key={cat.slug}
              onClick={() => updateParams({ category: cat.slug, page: null })}
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
      </div>

      {filtered.length > 0 ? (
        <>
          {featured && page === 1 && <FeaturedPost post={featured} isAr={isAr} />}

          <p className="text-sm text-text-muted mb-6">
            {rest.length} {isAr ? "مقالات" : "articles"}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pageItems.map((post) => {
              const date = new Date(post.publishedAt);
              const dateStr = date.toLocaleDateString(isAr ? "ar-LB" : "en-US", {
                day: "numeric",
                month: "short",
                year: "numeric",
              });
              const catLabel = blogCategories.find((c) => c.slug === post.categorySlug);

              return (
                <Link
                  key={post.id}
                  href={`/media/blog/${post.slug}`}
                  className="group bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col"
                >
                  {/* Cover */}
                  <div className="relative aspect-[16/9] overflow-hidden">
                    <Image
                      src={post.coverImageUrl}
                      alt={isAr ? post.titleAr : post.titleEn}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute top-3 start-3">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-white bg-brand-blue/90 px-2 py-1">
                        {isAr ? catLabel?.nameAr : catLabel?.nameEn}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex items-center gap-3 text-xs text-text-muted mb-2">
                      <span>{dateStr}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {post.readTimeMin} {isAr ? "د" : "min"}
                      </span>
                    </div>
                    <h3 className="text-base font-semibold text-text-primary mb-2 line-clamp-2 group-hover:text-brand-blue transition-colors">
                      {isAr ? post.titleAr : post.titleEn}
                    </h3>
                    <p className="text-xs text-text-muted line-clamp-2 mb-4 flex-1">
                      {isAr ? post.excerptAr : post.excerptEn}
                    </p>
                    <div className="flex items-center gap-2 pt-3 border-t border-gray-50">
                      <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-100 shrink-0 relative">
                        <Image src={post.authorImageUrl} alt="" fill sizes="24px" className="object-cover" />
                      </div>
                      <span className="text-xs text-text-muted font-medium truncate">
                        {isAr ? post.authorNameAr : post.authorNameEn}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Pagination controls */}
          {totalPages > 1 && (
            <nav
              aria-label="Blog pagination"
              className="flex items-center justify-center gap-1 mt-10"
            >
              <button
                type="button"
                onClick={() => updateParams({ page: page - 1 === 1 ? null : String(page - 1) })}
                disabled={page === 1}
                aria-label={t("previousPage")}
                className="p-2 text-text-secondary hover:text-brand-blue disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
              </button>

              {paginationRange(page, totalPages).map((p, idx) =>
                p === "…" ? (
                  <span key={`e${idx}`} className="px-2 text-text-muted">…</span>
                ) : (
                  <button
                    key={p}
                    type="button"
                    onClick={() => updateParams({ page: p === 1 ? null : String(p) })}
                    aria-current={p === page ? "page" : undefined}
                    aria-label={`${t("pageLabel", { page: p })} ${t("pageOf", { total: totalPages })}`}
                    className={cn(
                      "min-w-[36px] h-9 text-sm font-semibold transition-colors",
                      p === page
                        ? "bg-brand-blue text-white"
                        : "text-text-secondary hover:text-brand-blue hover:bg-brand-blue-light/30"
                    )}
                  >
                    {p}
                  </button>
                )
              )}

              <button
                type="button"
                onClick={() => updateParams({ page: String(page + 1) })}
                disabled={page === totalPages}
                aria-label={t("nextPage")}
                className="p-2 text-text-secondary hover:text-brand-blue disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4 rtl:rotate-180" />
              </button>
            </nav>
          )}
        </>
      ) : (
        <div className="text-center py-16">
          <FileX2 className="w-16 h-16 mx-auto text-text-muted mb-4" />
          <p className="text-text-secondary text-lg mb-4">{t("noResults")}</p>
          <button
            type="button"
            onClick={() => {
              setSearchInput("");
              router.push("?", { scroll: false });
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-brand-blue rounded-full hover:bg-brand-blue-dark transition-colors"
          >
            {t("clearFilters")}
          </button>
        </div>
      )}
    </>
  );
}
