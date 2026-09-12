"use client";

import { useRef } from "react";
import Image from "next/image";
import { ArrowRight, BookOpen, ChevronLeft, ChevronRight, ShoppingBag } from "lucide-react";
import { Link } from "@/i18n/navigation";

export type PhoenixFeaturedBook = {
  id: string;
  slug: string;
  title: string;
  titleAr: string | null;
  author: string;
  authorAr: string | null;
  priceCents: number;
  currency: string;
  coverImageUrl: string | null;
  condition: string;
};

const conditionLabels: Record<string, [string, string]> = {
  EXCELLENT: ["Excellent", "ممتازة"],
  GOOD: ["Good", "جيدة"],
  ACCEPTABLE: ["Well read", "مقروءة"],
};

function formatPrice(priceCents: number, currency: string, isArabic: boolean) {
  return new Intl.NumberFormat(isArabic ? "ar-LB" : "en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: currency === "LBP" ? 0 : 2,
    maximumFractionDigits: currency === "LBP" ? 0 : 2,
  }).format(priceCents / 100);
}

export function PhoenixBookCarousel({ books, locale }: { books: PhoenixFeaturedBook[]; locale: string }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const isArabic = locale === "ar";
  if (!books.length) return null;

  const move = (direction: -1 | 1) => {
    const track = trackRef.current;
    if (track) track.scrollBy({ left: direction * track.clientWidth * 0.75 * (isArabic ? -1 : 1), behavior: "smooth" });
  };

  return (
    <section className="bg-[#FAF9F6] py-20 lg:py-24" aria-labelledby="phoenix-shop-title">
      <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-12">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em] text-[#5D95CD]">
              <ShoppingBag className="h-4 w-4" aria-hidden="true" />
              {isArabic ? "تسوّق من فينيكس" : "Shop Phoenix"}
            </p>
            <h2 id="phoenix-shop-title" className="mt-3 text-3xl font-extrabold leading-tight tracking-tight text-[#0D2B66] sm:text-5xl">
              {isArabic ? "كتب جاهزة لفصلها التالي" : "Books ready for their next chapter"}
            </h2>
            <p className="mt-4 text-base font-medium leading-7 text-[#0D2B66]/65">
              {isArabic ? "اكتشف أحدث الكتب المتاحة واختر ما تريد قراءته." : "Discover recently added pre-loved books and choose your next read."}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => move(-1)} aria-label={isArabic ? "الكتب السابقة" : "Previous books"} className="grid h-12 w-12 place-items-center rounded-full border border-[#0D2B66]/15 bg-white text-[#0D2B66] transition hover:border-[#0D2B66] hover:bg-[#0D2B66] hover:text-white">
              <ChevronLeft className="h-5 w-5 rtl:rotate-180" />
            </button>
            <button type="button" onClick={() => move(1)} aria-label={isArabic ? "الكتب التالية" : "Next books"} className="grid h-12 w-12 place-items-center rounded-full border border-[#0D2B66]/15 bg-white text-[#0D2B66] transition hover:border-[#0D2B66] hover:bg-[#0D2B66] hover:text-white">
              <ChevronRight className="h-5 w-5 rtl:rotate-180" />
            </button>
          </div>
        </div>

        <div ref={trackRef} className="mt-10 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {books.map((book) => {
            const title = isArabic && book.titleAr ? book.titleAr : book.title;
            const author = isArabic && book.authorAr ? book.authorAr : book.author;
            const condition = conditionLabels[book.condition]?.[isArabic ? 1 : 0] ?? book.condition.toLowerCase();
            return (
              <article key={book.id} className="group w-[74vw] max-w-[260px] shrink-0 snap-start overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-[#0D2B66]/[0.07] transition hover:-translate-y-1 hover:shadow-xl sm:w-[240px]">
                <Link href={"/books/" + book.slug} className="block">
                  <div className="relative aspect-[4/5] overflow-hidden bg-[#EAF1F8]">
                    {book.coverImageUrl ? (
                      <Image src={book.coverImageUrl} alt={isArabic ? "غلاف كتاب " + title : "Cover of " + title} fill unoptimized sizes="260px" className="object-cover transition duration-500 group-hover:scale-[1.03]" />
                    ) : (
                      <div className="flex h-full items-center justify-center px-7 text-center text-[#0D2B66]/45"><div><BookOpen className="mx-auto h-9 w-9" /><p className="mt-3 font-bold">{title}</p></div></div>
                    )}
                    <span className="absolute start-3 top-3 rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold text-[#0D2B66] shadow-sm">{condition}</span>
                  </div>
                  <div className="p-5">
                    <h3 className="line-clamp-2 min-h-12 text-lg font-extrabold leading-6 text-[#0D2B66]">{title}</h3>
                    <p className="mt-2 line-clamp-1 text-sm font-medium text-[#0D2B66]/55">{isArabic ? "بقلم" : "by"} {author}</p>
                    <div className="mt-5 flex items-center justify-between border-t border-[#0D2B66]/10 pt-4">
                      <span className="font-extrabold text-[#0D2B66]">{formatPrice(book.priceCents, book.currency, isArabic)}</span>
                      <span className="grid h-9 w-9 place-items-center rounded-full bg-[#F2A65A] text-[#0D2B66]"><ArrowRight className="h-4 w-4 rtl:rotate-180" /></span>
                    </div>
                  </div>
                </Link>
              </article>
            );
          })}
        </div>
        <Link href="/books" className="mt-3 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 border-[#0D2B66] px-6 py-3 text-sm font-bold text-[#0D2B66] transition hover:bg-[#0D2B66] hover:text-white">
          {isArabic ? "استعرض كل الكتب" : "Browse all books"}<ArrowRight className="h-4 w-4 rtl:rotate-180" />
        </Link>
      </div>
    </section>
  );
}
