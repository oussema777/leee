"use client";

import { useCallback, useState } from "react";
import { useLocale } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { Quote, UserX, Star, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { testimonialCategories, demoTestimonials } from "./testimonialsData";
import type { TestimonialItem } from "./testimonialsData";

function FeaturedTestimonial({ item, isAr }: { item: TestimonialItem; isAr: boolean }) {
  // If it's an original designed card, show the image as-is
  if (item.isOriginalCard) {
    return (
      <div className="relative mb-14 overflow-hidden rounded-xl shadow-lg">
        <img
          src={item.imageUrl}
          alt={isAr ? item.nameAr : item.nameEn}
          className="w-full h-auto"
        />
      </div>
    );
  }

  return (
    <div className="relative mb-14 overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-5 min-h-[400px]">
        {/* Image side */}
        <div className="relative lg:col-span-2 h-72 lg:h-auto">
          <img
            src={item.imageUrl}
            alt={isAr ? item.nameAr : item.nameEn}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-brand-blue-deeper/80 to-transparent" />
        </div>

        {/* Quote side */}
        <div className="lg:col-span-3 bg-gradient-to-br from-brand-blue-deeper via-brand-blue-dark to-brand-blue p-8 lg:p-12 flex flex-col justify-center relative">
          {/* Large decorative quote */}
          <Quote className="absolute top-6 end-6 w-24 h-24 text-white/5 scale-x-[-1]" />

          <div className="flex gap-1 mb-4">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-4 h-4 text-yellow-400" fill="currentColor" />
            ))}
          </div>

          <blockquote className="text-white text-lg lg:text-xl leading-relaxed mb-8 font-light italic">
            &ldquo;{isAr ? item.quoteAr : item.quoteEn}&rdquo;
          </blockquote>

          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white/30 shrink-0">
              <img
                src={item.imageUrl}
                alt={isAr ? item.nameAr : item.nameEn}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <p className="text-white font-semibold text-base">
                {isAr ? item.nameAr : item.nameEn}
              </p>
              <p className="text-white/60 text-sm">
                {isAr ? item.roleAr : item.roleEn}
              </p>
              <p className="text-white/40 text-xs mt-0.5">
                {isAr ? item.programAr : item.programEn}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TestimonialsGrid() {
  const locale = useLocale();
  const isAr = locale === "ar";
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentCategory = searchParams.get("category") || "";

  const filteredTestimonials = currentCategory
    ? demoTestimonials.filter((t) => t.categorySlug === currentCategory)
    : demoTestimonials;

  // Featured: first testimonial from filtered, rest in grid
  const featured = filteredTestimonials[0] || null;
  const rest = filteredTestimonials.slice(1);

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

  // Alternating card colors
  const cardStyles = [
    "bg-white border border-gray-100",
    "bg-brand-blue-light/30 border border-brand-blue/10",
    "bg-gradient-to-br from-brand-blue-deeper to-brand-blue-dark text-white",
  ];

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
        {testimonialCategories.map((cat) => (
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

      {filteredTestimonials.length > 0 ? (
        <>
          {/* Featured hero testimonial */}
          {featured && <FeaturedTestimonial item={featured} isAr={isAr} />}

          {/* Remaining testimonials — masonry-style mixed layout */}
          {rest.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rest.map((item, index) => {
                const styleIdx = index % 3;
                const isDark = styleIdx === 2;

                // Original designed card — render as full image
                if (item.isOriginalCard) {
                  return (
                    <div
                      key={item.id}
                      className="group rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow"
                    >
                      <img
                        src={item.imageUrl}
                        alt={isAr ? item.nameAr : item.nameEn}
                        className="w-full h-auto"
                      />
                    </div>
                  );
                }

                return (
                  <div
                    key={item.id}
                    className={cn(
                      "group p-6 transition-all hover:shadow-lg relative overflow-hidden",
                      cardStyles[styleIdx],
                      // Make every 4th card span 2 columns for visual variety
                      index % 4 === 3 && "md:col-span-2 lg:col-span-1"
                    )}
                  >
                    {/* Decorative quote watermark */}
                    <Quote
                      className={cn(
                        "absolute -top-2 -end-2 w-20 h-20 scale-x-[-1]",
                        isDark ? "text-white/5" : "text-brand-blue/5"
                      )}
                    />

                    {/* Stars */}
                    <div className="flex gap-0.5 mb-3">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            "w-3.5 h-3.5",
                            isDark ? "text-yellow-400" : "text-yellow-500"
                          )}
                          fill="currentColor"
                        />
                      ))}
                    </div>

                    {/* Quote */}
                    <blockquote
                      className={cn(
                        "text-sm leading-relaxed mb-5",
                        isDark
                          ? "text-white/90 italic"
                          : "text-text-secondary"
                      )}
                    >
                      &ldquo;{isAr ? item.quoteAr : item.quoteEn}&rdquo;
                    </blockquote>

                    {/* Person */}
                    <div
                      className={cn(
                        "border-t pt-4 mt-auto",
                        isDark ? "border-white/10" : "border-gray-100"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "w-11 h-11 rounded-full overflow-hidden shrink-0 border-2",
                            isDark ? "border-white/20" : "border-brand-blue/20"
                          )}
                        >
                          <img
                            src={item.imageUrl}
                            alt={isAr ? item.nameAr : item.nameEn}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <p
                            className={cn(
                              "text-sm font-semibold truncate",
                              isDark ? "text-white" : "text-text-primary"
                            )}
                          >
                            {isAr ? item.nameAr : item.nameEn}
                          </p>
                          <p
                            className={cn(
                              "text-xs truncate",
                              isDark ? "text-white/50" : "text-text-muted"
                            )}
                          >
                            {isAr ? item.roleAr : item.roleEn}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2.5">
                        <span
                          className={cn(
                            "inline-block text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1",
                            isDark
                              ? "text-white/70 bg-white/10"
                              : "text-brand-blue bg-brand-blue-light/60"
                          )}
                        >
                          {isAr ? item.programAr : item.programEn}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Emotional pull quote section */}
          <div className="mt-16 text-center py-12 bg-brand-blue-light/20 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
            <Quote className="w-10 h-10 text-brand-blue/30 mx-auto mb-4 scale-x-[-1]" />
            <p className="text-2xl md:text-3xl font-light text-brand-blue-deeper italic max-w-3xl mx-auto leading-relaxed">
              {isAr
                ? "كل قصة هنا هي شهادة على قوة المجتمع والإرادة والأمل. نحن لا نبني مشاريع فحسب — نحن نبني مستقبلاً."
                : "Every story here is a testament to the power of community, resilience, and hope. We don't just build businesses — we build futures."}
            </p>
            <p className="text-sm text-text-muted mt-4 font-medium">
              — LEE Experience
            </p>
          </div>
        </>
      ) : (
        <div className="text-center py-16">
          <UserX className="w-16 h-16 mx-auto text-text-muted mb-4" />
          <p className="text-text-secondary text-lg">
            {isAr
              ? "لم يتم العثور على شهادات في هذه الفئة."
              : "No testimonials found in this category."}
          </p>
        </div>
      )}
    </>
  );
}
