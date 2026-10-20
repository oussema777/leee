"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowUpRight, Expand, MessageSquareQuote, Quote, X } from "lucide-react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { testimonialCategories } from "./testimonialsData";
import type { TestimonialListItem } from "@/lib/data/testimonials";

function localized(en: string, ar: string, isAr: boolean) {
  return (isAr ? ar.trim() : en.trim()) || (isAr ? en.trim() : ar.trim());
}

function TestimonialCard({
  item,
  isAr,
  eager,
  onOpen,
}: {
  item: TestimonialListItem;
  isAr: boolean;
  eager: boolean;
  onOpen: () => void;
}) {
  const t = useTranslations("testimonials");
  const [imageFailed, setImageFailed] = useState(false);
  const name = localized(item.nameEn, item.nameAr, isAr);
  const quote = localized(item.quoteEn, item.quoteAr, isAr);
  const program = localized(item.programEn, item.programAr, isAr);
  const role = localized(item.roleEn, item.roleAr, isAr);
  const showArtwork = item.isOriginalCard && item.imageUrl && !imageFailed;

  return (
    <article className="min-w-0">
      <button
        type="button"
        onClick={onOpen}
        aria-label={t("openStory", { name })}
        aria-haspopup="dialog"
        className="group block w-full overflow-hidden rounded-xl border border-accent-navy/10 bg-white text-start transition-[border-color,box-shadow] hover:border-brand-blue/50 hover:shadow-lg focus-visible:outline-offset-4"
      >
        {/* Every story has the same canvas, including the first and image-only uploads. */}
        <div className="relative aspect-video overflow-hidden">
          {showArtwork ? (
            <Image
              src={item.imageUrl}
              alt={t("artworkAlt", { name })}
              fill
              loading={eager ? "eager" : "lazy"}
              sizes="(max-width: 767px) calc(100vw - 32px), (max-width: 1280px) 50vw, 608px"
              className="object-contain"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <div className="flex h-full flex-col justify-center p-5 sm:p-6 lg:p-8">
              <Quote aria-hidden="true" className="mb-3 size-6 shrink-0 text-brand-blue rtl:-scale-x-100 lg:mb-4 lg:size-8" />
              <blockquote dir="auto" className="line-clamp-3 text-[15px] leading-relaxed text-accent-navy sm:line-clamp-4 sm:text-base lg:text-lg">
                {quote || t("imageUnavailable")}
              </blockquote>
            </div>
          )}
        </div>
        <div className="flex h-24 items-center gap-3 border-t border-accent-navy/10 px-5 sm:px-6">
          <div className="min-w-0 flex-1">
            <h3 dir="auto" className="line-clamp-1 text-sm font-semibold text-accent-navy sm:text-base">
              {name}
            </h3>
            <p dir="auto" className="mt-1 line-clamp-2 text-xs text-text-secondary sm:text-sm">
              {program || role || t("communityStory")}
            </p>
          </div>
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-accent-navy/15 text-brand-blue-deeper transition-colors group-hover:bg-accent-ice">
            <Expand aria-hidden="true" className="size-4" />
          </span>
        </div>
      </button>
    </article>
  );
}

function StoryDialog({
  item,
  isAr,
  onClose,
}: {
  item: TestimonialListItem;
  isAr: boolean;
  onClose: () => void;
}) {
  const t = useTranslations("testimonials");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const name = localized(item.nameEn, item.nameAr, isAr);
  const quote = localized(item.quoteEn, item.quoteAr, isAr);
  const role = localized(item.roleEn, item.roleAr, isAr);
  const program = localized(item.programEn, item.programAr, isAr);

  useEffect(() => {
    const dialog = dialogRef.current;
    const previousOverflow = document.body.style.overflow;
    dialog?.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="testimonial-dialog-title"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) dialogRef.current?.close();
      }}
      className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-6xl overflow-y-auto rounded-xl bg-white p-0 text-text-primary shadow-2xl backdrop:bg-accent-navy/75"
    >
      <div className="relative">
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-accent-navy/10 bg-white px-5 py-4 sm:px-8">
          <div className="min-w-0">
            <h2 id="testimonial-dialog-title" dir="auto" className="text-lg font-semibold text-accent-navy">
              {name}
            </h2>
            {program && <p dir="auto" className="mt-1 text-sm text-text-secondary">{program}</p>}
          </div>
          <button
            type="button"
            autoFocus
            onClick={() => dialogRef.current?.close()}
            aria-label={t("closeStory")}
            className="flex size-11 shrink-0 items-center justify-center rounded-full border border-accent-navy/15 text-accent-navy hover:bg-accent-ice"
          >
            <X aria-hidden="true" className="size-5" />
          </button>
        </div>
        {item.isOriginalCard && item.imageUrl && (
          <div className="border-b border-accent-navy/10">
            <Image
              src={item.imageUrl}
              alt={t("artworkAlt", { name })}
              width={1600}
              height={900}
              loading="eager"
              sizes="(max-width: 1152px) 100vw, 1152px"
              className="max-h-[70dvh] w-full object-contain"
            />
            <div className="px-5 pb-4 text-end sm:px-8">
              <a
                href={item.imageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-brand-blue-deeper underline underline-offset-4"
              >
                {t("fullSizeImage")}
                <ArrowUpRight aria-hidden="true" className="size-4 rtl:-scale-x-100" />
              </a>
            </div>
          </div>
        )}
        {(quote || role) && (
          <div className="mx-auto max-w-3xl px-6 py-8 sm:px-10 sm:py-10">
            {quote && (
              <>
                <Quote aria-hidden="true" className="mb-4 size-8 text-brand-blue rtl:-scale-x-100" />
                <blockquote dir="auto" className="whitespace-pre-line break-words text-lg leading-relaxed text-accent-navy sm:text-xl">
                  {quote}
                </blockquote>
              </>
            )}
            {role && <p dir="auto" className="mt-5 text-sm text-text-secondary">{role}</p>}
          </div>
        )}
      </div>
    </dialog>
  );
}

export function TestimonialsGrid({ testimonials }: { testimonials: TestimonialListItem[] }) {
  const isAr = useLocale() === "ar";
  const t = useTranslations("testimonials");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selected, setSelected] = useState<TestimonialListItem | null>(null);
  const [isPending, startTransition] = useTransition();
  const currentCategory = searchParams.get("category") || "";
  const filteredTestimonials = currentCategory
    ? testimonials.filter((item) => item.categorySlug === currentCategory)
    : testimonials;
  const filters = [
    { slug: "", name: t("allStories"), count: testimonials.length },
    ...testimonialCategories.map((category) => ({
      slug: category.slug,
      name: isAr ? category.nameAr : category.nameEn,
      count: testimonials.filter((item) => item.categorySlug === category.slug).length,
    })),
  ];

  const updateCategory = useCallback(
    (slug: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (slug) params.set("category", slug);
      else params.delete("category");
      startTransition(() => router.push(`?${params.toString()}`, { scroll: false }));
    },
    [router, searchParams]
  );

  return (
    <>
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl text-accent-navy sm:text-3xl">{t("galleryTitle")}</h2>
          <p className="mt-2 text-sm leading-relaxed text-text-secondary">{t("galleryHint")}</p>
        </div>
        <p role="status" className="text-sm text-text-secondary">
          {t("storyCount", { count: filteredTestimonials.length })}
        </p>
      </div>

      <div role="group" aria-label={t("filterLabel")} className="mb-8 flex flex-wrap gap-2">
        {filters.map((filter) => (
          <button
            key={filter.slug}
            type="button"
            onClick={() => updateCategory(filter.slug)}
            aria-pressed={currentCategory === filter.slug}
            aria-controls="testimonial-gallery"
            className={cn(
              "inline-flex min-h-11 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
              currentCategory === filter.slug
                ? "border-accent-navy bg-accent-navy text-white"
                : "border-accent-navy/15 bg-transparent text-accent-navy hover:border-brand-blue hover:bg-white/60"
            )}
          >
            {filter.name}
            <span className="text-xs tabular-nums opacity-75">{filter.count}</span>
          </button>
        ))}
      </div>

      <div id="testimonial-gallery" aria-busy={isPending}>
        {filteredTestimonials.length ? (
          <div className={cn("grid grid-cols-1 gap-5 md:grid-cols-2 lg:gap-7", isPending && "opacity-60")}>
            {filteredTestimonials.map((item, index) => (
              <TestimonialCard key={item.id} item={item} isAr={isAr} eager={index < 2} onOpen={() => setSelected(item)} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-accent-navy/10 bg-white px-6 py-16 text-center">
            <MessageSquareQuote aria-hidden="true" className="mx-auto mb-4 size-9 text-brand-blue-deeper" />
            <p className="text-text-secondary">{t("noTestimonials")}</p>
            {currentCategory && (
              <button type="button" onClick={() => updateCategory("")} className="mt-5 min-h-11 text-sm font-semibold text-brand-blue-deeper underline underline-offset-4">
                {t("allStories")}
              </button>
            )}
          </div>
        )}
      </div>

      <div className="mt-12 flex flex-col items-start justify-between gap-5 border-t border-accent-navy/15 pt-8 sm:flex-row sm:items-center">
        <div>
          <h2 className="font-serif text-2xl text-accent-navy">{t("shareTitle")}</h2>
          <p className="mt-2 text-sm text-text-secondary">{t("shareDescription")}</p>
        </div>
        <Link href="/get-involved/share-your-story" className="inline-flex min-h-11 shrink-0 items-center gap-3 rounded-full border border-accent-navy/25 px-5 py-3 text-sm font-semibold text-accent-navy transition-colors hover:bg-white">
          {t("shareAction")}
          <ArrowUpRight aria-hidden="true" className="size-4 rtl:-scale-x-100" />
        </Link>
      </div>

      {selected && <StoryDialog item={selected} isAr={isAr} onClose={() => setSelected(null)} />}
    </>
  );
}
