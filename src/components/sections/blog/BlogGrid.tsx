"use client";

import { useCallback } from "react";
import { useLocale } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { Clock, ArrowRight, User, FileX2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { blogCategories, demoPosts } from "./blogData";
import type { BlogPost } from "./blogData";

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
          <img
            src={post.coverImageUrl}
            alt={isAr ? post.titleAr : post.titleEn}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
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
              <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-100">
                <img src={post.authorImageUrl} alt="" className="w-full h-full object-cover" />
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

export function BlogGrid() {
  const locale = useLocale();
  const isAr = locale === "ar";
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentCategory = searchParams.get("category") || "";

  const filteredPosts = currentCategory
    ? demoPosts.filter((p) => p.categorySlug === currentCategory)
    : demoPosts;

  const featured = !currentCategory ? filteredPosts.find((p) => p.isFeatured) : null;
  const rest = featured ? filteredPosts.filter((p) => p.id !== featured.id) : filteredPosts;

  const updateCategory = useCallback(
    (slug: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (slug) {
        params.set("category", slug);
      } else {
        params.delete("category");
      }
      router.push(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  return (
    <>
      {/* Category Tabs */}
      <div className="flex items-center gap-1 flex-wrap mb-8 overflow-x-auto pb-2">
        <button
          onClick={() => updateCategory("")}
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
            onClick={() => updateCategory(cat.slug)}
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

      {filteredPosts.length > 0 ? (
        <>
          {/* Featured Post */}
          {featured && <FeaturedPost post={featured} isAr={isAr} />}

          {/* Post Count */}
          <p className="text-sm text-text-muted mb-6">
            {rest.length} {isAr ? "مقالات" : "articles"}
          </p>

          {/* Posts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rest.map((post) => {
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
                    <img
                      src={post.coverImageUrl}
                      alt={isAr ? post.titleAr : post.titleEn}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
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

                    {/* Author */}
                    <div className="flex items-center gap-2 pt-3 border-t border-gray-50">
                      <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-100 shrink-0">
                        <img src={post.authorImageUrl} alt="" className="w-full h-full object-cover" />
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
        </>
      ) : (
        <div className="text-center py-16">
          <FileX2 className="w-16 h-16 mx-auto text-text-muted mb-4" />
          <p className="text-text-secondary text-lg">
            {isAr
              ? "لم يتم العثور على مقالات في هذه الفئة."
              : "No articles found in this category."}
          </p>
        </div>
      )}
    </>
  );
}
