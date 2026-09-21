"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { ArrowUpRight, BookOpen, Check, HeartHandshake, Languages, RotateCcw, Search, SlidersHorizontal, Tag } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/Container";
import { bookCategoryLabel, bookHasCategory, getBookCategories, normalizeBookCategories } from "@/lib/book-inventory/categories";

export interface CatalogueBook {
  id: string;
  slug: string;
  title: string;
  titleAr: string | null;
  author: string;
  authorAr: string | null;
  descriptionEn: string | null;
  descriptionAr: string | null;
  isbn: string | null;
  publisher: string | null;
  editions: { id: string; label: string | null; publicationYear: number | null; stockQuantity: number; coverImageUrl: string | null }[];
  publicationYear: number | null;
  category: string;
  customCategory: string | null;
  categories: string[];
  language: string;
  condition: string;
  priceCents: number;
  currency: string;
  stockQuantity: number;
  coverImageUrl: string | null;
  status: string;
  donor: { displayName: string; type: string; logoUrl: string | null; logoApproved: boolean; publicRecognition: boolean } | null;
  donorAllocations: { donor: { displayName: string; type: string; logoUrl: string | null; logoApproved: boolean; publicRecognition: boolean } }[];
}


const languageLabels = {
  ARABIC: ["Arabic", "العربية"],
  ENGLISH: ["English", "الإنجليزية"],
  FRENCH: ["French", "الفرنسية"],
  OTHER: ["Other", "أخرى"],
} as const;

const conditionLabels = {
  EXCELLENT: ["Excellent", "ممتازة"],
  GOOD: ["Good", "جيدة"],
  ACCEPTABLE: ["Well read", "مقروءة"],
} as const;

function localizedLabel(labels: Record<string, readonly [string, string]>, key: string, isArabic: boolean) {
  const label = labels[key];
  return label ? label[isArabic ? 1 : 0] : key.toLowerCase().replaceAll("_", " ");
}

function formatPrice(priceCents: number, currency: string, isArabic: boolean) {
  return new Intl.NumberFormat(isArabic ? "ar-LB" : "en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: currency === "LBP" ? 0 : 2,
    maximumFractionDigits: currency === "LBP" ? 0 : 2,
  }).format(priceCents / 100);
}

function displayedCategory(book: CatalogueBook, isArabic: boolean) {
  return getBookCategories(book).map((category) => bookCategoryLabel(category, isArabic)).join(isArabic ? "، " : ", ");
}

function BookCard({ book, isArabic }: { book: CatalogueBook; isArabic: boolean }) {
  const title = isArabic && book.titleAr ? book.titleAr : book.title;
  const author = isArabic && book.authorAr ? book.authorAr : book.author;
  const isAvailable = book.status === "AVAILABLE" && book.stockQuantity > 0;
  const conditionTone = book.condition === "EXCELLENT"
    ? "bg-emerald-50 text-emerald-800"
    : book.condition === "GOOD"
      ? "bg-sky-50 text-sky-800"
      : "bg-amber-50 text-amber-900";

  return (
    <article className="group h-full overflow-hidden rounded-2xl bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="flex h-full flex-col">
        <div className="relative aspect-[4/5] overflow-hidden bg-surface-secondary">
          {book.coverImageUrl ? (
            <Image
              src={book.coverImageUrl}
        unoptimized
              alt={isArabic ? `غلاف كتاب ${title}` : `Cover of ${title}`}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center px-8 text-center text-accent-navy/45">
              <div>
                <BookOpen className="mx-auto mb-4 h-10 w-10" aria-hidden="true" />
                <span className="font-serif text-xl leading-snug">{title}</span>
              </div>
            </div>
          )}
          <span className={`absolute start-4 top-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${isAvailable ? "bg-emerald-600 text-white" : "bg-accent-slate text-white"}`}>
            {isAvailable && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
            {isAvailable ? (isArabic ? "متاح" : "Available") : (isArabic ? "غير متاح" : "Unavailable")}
          </span>
        </div>

        <div className="flex flex-1 flex-col p-5">
          <div className="mb-4 flex h-7 min-w-0 gap-2 overflow-hidden">
            <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${conditionTone}`}>
              {localizedLabel(conditionLabels, book.condition, isArabic)}
            </span>
            <span title={displayedCategory(book, isArabic)} className="min-w-0 truncate whitespace-nowrap rounded-full bg-brand-blue-light px-3 py-1 text-xs font-semibold text-accent-navy">
              {displayedCategory(book, isArabic)}
            </span>
          </div>
          <h2 className="line-clamp-2 min-h-[3.25rem] font-serif text-xl leading-tight text-text-primary">
            <Link href={`/books/${book.slug}`} className="transition-colors hover:text-brand-blue-deeper">{title}</Link>
          </h2>
          <p className="mt-2 line-clamp-1 min-h-5 text-sm font-medium text-text-secondary">{isArabic ? "بقلم" : "by"} {author}</p>
          {book.editions.length > 1 && <p className="mt-1 text-xs font-semibold text-brand-blue-deeper">{book.editions.length} {isArabic ? "طبعات متاحة" : "editions available"}</p>}

          <dl className="mt-auto grid grid-cols-2 gap-x-4 gap-y-3 border-t border-surface-tertiary pt-5">
            <div>
              <dt className="flex items-center gap-1.5 text-xs font-medium text-text-muted">
                <Languages className="h-3.5 w-3.5" aria-hidden="true" />
                {isArabic ? "اللغة" : "Language"}
              </dt>
              <dd className="mt-1 text-sm font-semibold text-text-primary">{localizedLabel(languageLabels, book.language, isArabic)}</dd>
            </div>
            <div>
              <dt className="flex items-center gap-1.5 text-xs font-medium text-text-muted">
                <Tag className="h-3.5 w-3.5" aria-hidden="true" />
                {isArabic ? "السعر" : "Price"}
              </dt>
              <dd className="mt-1 text-sm font-bold tabular-nums text-brand-blue-deeper">{formatPrice(book.priceCents, book.currency, isArabic)}</dd>
            </div>
          </dl>
          <Link href={`/books/${book.slug}`} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent-navy px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-blue-deeper focus-visible:ring-2 focus-visible:ring-brand-blue">
            {isArabic ? "عرض الكتاب وطلبه" : "View & order this book"}
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 rtl:rotate-[-90deg]" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}

export function BooksCatalogue({ books, locale, loadError = false }: { books: CatalogueBook[]; locale: string; loadError?: boolean }) {
  const isArabic = locale === "ar";
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("ALL");
  const [language, setLanguage] = useState("ALL");
  const availableCategories = useMemo(() => normalizeBookCategories(books.flatMap(getBookCategories)), [books]);
  const availableLanguages = useMemo(() => Array.from(new Set(books.map((book) => book.language))), [books]);

  const filteredBooks = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase(locale);
    return books.filter((book) => {
      const searchable = [book.title, book.titleAr, book.author, book.authorAr, book.publisher, book.isbn, ...book.editions.map((edition) => edition.label)]
        .filter(Boolean).join(" ").toLocaleLowerCase(locale);
      return (!normalizedQuery || searchable.includes(normalizedQuery))
        && (category === "ALL" || bookHasCategory(book, category))
        && (language === "ALL" || book.language === language);
    });
  }, [books, category, language, locale, query]);

  const hasFilters = Boolean(query || category !== "ALL" || language !== "ALL");
  const resetFilters = () => { setQuery(""); setCategory("ALL"); setLanguage("ALL"); };

  return (
    <div className="min-h-screen bg-surface-primary selection:bg-brand-blue selection:text-white">
      <section className="overflow-hidden bg-accent-navy text-white">
        <Container className="py-12 md:py-16 lg:py-20">
          <div className="grid items-end gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(300px,0.48fr)]">
            <div>
              <h1 className="max-w-3xl text-balance font-serif text-4xl leading-[1.06] sm:text-5xl lg:text-6xl">
                {isArabic ? "كتبٌ تبدأ رحلة جديدة." : "Books beginning a new chapter."}
              </h1>
              <div className="mt-6 h-0.5 w-12 bg-brand-blue" />
              <p className="mt-6 max-w-2xl text-base leading-7 text-white/75 sm:text-lg">
                {isArabic
                  ? "تبرّع مجتمعنا بهذه الكتب لتنتقل المعرفة من قارئ إلى آخر. تصفّح الرف واختر ما يرافقك في رحلتك القادمة."
                  : "Our community donated these books so knowledge can move from one reader to the next. Browse the shelf and find what belongs in your next chapter."}
              </p>
            </div>

            <div className="border-y border-white/15 py-6 lg:border-y-0 lg:border-s lg:py-2 lg:ps-8">
              <p className="font-serif text-2xl leading-snug text-white">
                {books.length === 0
                  ? (isArabic ? "الرف ينتظر كتابه الأول." : "The shelf is waiting for its first book.")
                  : isArabic
                    ? `${books.length} ${books.length === 1 ? "كتاب متاح الآن" : "كتب متاحة الآن"}`
                    : `${books.length} ${books.length === 1 ? "book is" : "books are"} ready for a new reader.`}
              </p>
              <Link href="/book-restore" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-brand-blue-light underline decoration-brand-blue/60 underline-offset-4 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue-light">
                <HeartHandshake className="h-4 w-4" aria-hidden="true" />
                {isArabic ? "أضف كتابًا إلى الرحلة" : "Donate books to the journey"}
              </Link>
            </div>
          </div>

          <div className="mt-10 grid gap-3 border-t border-white/15 pt-6 md:grid-cols-[minmax(0,1fr)_220px_220px]">
            <label className="relative block">
              <span className="sr-only">{isArabic ? "البحث في الكتب" : "Search books"}</span>
              <Search className="pointer-events-none absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/55" aria-hidden="true" />
              <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={isArabic ? "ابحث بالعنوان أو اسم المؤلف" : "Search by title or author"} className="h-12 w-full rounded-sm border border-white/20 bg-white/10 ps-11 pe-4 text-sm text-white caret-brand-blue-light outline-none placeholder:text-white/45 transition-colors focus:border-brand-blue-light" />
            </label>
            <label className="relative block">
              <span className="sr-only">{isArabic ? "التصنيف" : "Category"}</span>
              <SlidersHorizontal className="pointer-events-none absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/55" aria-hidden="true" />
              <select value={category} onChange={(event) => setCategory(event.target.value)} className="h-12 w-full appearance-none rounded-sm border border-white/20 bg-accent-navy ps-11 pe-9 text-sm text-white outline-none transition-colors focus:border-brand-blue-light">
                <option value="ALL">{isArabic ? "جميع التصنيفات" : "All categories"}</option>
                {availableCategories.map((value) => <option key={value} value={value}>{bookCategoryLabel(value, isArabic)}</option>)}
              </select>
            </label>
            <label className="relative block">
              <span className="sr-only">{isArabic ? "اللغة" : "Language"}</span>
              <Languages className="pointer-events-none absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/55" aria-hidden="true" />
              <select value={language} onChange={(event) => setLanguage(event.target.value)} className="h-12 w-full appearance-none rounded-sm border border-white/20 bg-accent-navy ps-11 pe-9 text-sm text-white outline-none transition-colors focus:border-brand-blue-light">
                <option value="ALL">{isArabic ? "جميع اللغات" : "All languages"}</option>
                {availableLanguages.map((value) => <option key={value} value={value}>{localizedLabel(languageLabels, value, isArabic)}</option>)}
              </select>
            </label>
          </div>
        </Container>
      </section>

      <section className="py-12 md:py-16">
        <Container>
          <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm font-semibold text-accent-navy" aria-live="polite">
              {isArabic ? `${filteredBooks.length} ${filteredBooks.length === 1 ? "نتيجة" : "نتائج"}` : `${filteredBooks.length} ${filteredBooks.length === 1 ? "result" : "results"}`}
            </p>
            {hasFilters && (
              <button type="button" onClick={resetFilters} className="inline-flex items-center gap-2 rounded-sm px-3 py-2 text-sm font-semibold text-brand-blue-deeper transition-colors hover:bg-surface-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue">
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                {isArabic ? "إعادة ضبط البحث" : "Reset filters"}
              </button>
            )}
          </div>

          {loadError ? (
            <div className="rounded-2xl bg-white px-6 py-16 text-center md:px-12">
              <BookOpen className="mx-auto h-10 w-10 text-brand-blue" aria-hidden="true" />
              <h2 className="mt-5 font-serif text-2xl text-text-primary">{isArabic ? "تعذّر تحميل رف الكتب" : "The book shelf could not load"}</h2>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-text-secondary">
                {isArabic ? "حدّث الصفحة بعد قليل. إذا استمرت المشكلة، تواصل معنا وسنساعدك." : "Refresh the page in a moment. If the problem continues, contact us and we will help."}
              </p>
              <button type="button" onClick={() => window.location.reload()} className="mt-6 rounded-sm bg-brand-blue px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-blue-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2">
                {isArabic ? "تحديث الصفحة" : "Refresh page"}
              </button>
            </div>
          ) : filteredBooks.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {filteredBooks.map((book) => <BookCard key={book.id} book={book} isArabic={isArabic} />)}
            </div>
          ) : (
            <div className="rounded-2xl bg-white px-6 py-16 text-center md:px-12">
              <BookOpen className="mx-auto h-10 w-10 text-brand-blue" aria-hidden="true" />
              <h2 className="mt-5 font-serif text-2xl text-text-primary">
                {hasFilters ? (isArabic ? "لا توجد كتب تطابق بحثك" : "No books match your search") : (isArabic ? "لا توجد كتب منشورة بعد" : "No books have been published yet")}
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-text-secondary">
                {hasFilters
                  ? (isArabic ? "جرّب كلمة بحث مختلفة أو أزل أحد عوامل التصفية." : "Try a different search or clear one of the filters.")
                  : (isArabic ? "سيظهر أول كتاب هنا بمجرد نشره من لوحة الإدارة." : "The first book will appear here as soon as it is published from the admin inventory.")}
              </p>
              {hasFilters && (
                <button type="button" onClick={resetFilters} className="mt-6 rounded-sm bg-brand-blue px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-blue-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue focus-visible:ring-offset-2">
                  {isArabic ? "عرض جميع الكتب" : "Show all books"}
                </button>
              )}
            </div>
          )}
        </Container>
      </section>
    </div>
  );
}
