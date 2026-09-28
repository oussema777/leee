import { expireWhishPayments } from "@/lib/book-orders/whish-server";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { BooksCatalogue, type CatalogueBook } from "@/components/sections/books/BooksCatalogue";
import { BOOK_CATEGORIES } from "@/lib/book-inventory/categories";
import { BookLanguage, type Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const isArabic = locale === "ar";
  return {
    title: isArabic ? "مكتبة الكتب | تجربة LEE" : "Book Library | The LEE Experience",
    description: isArabic
      ? "تصفّح الكتب المتاحة التي تبرّع بها مجتمع تجربة LEE."
      : "Browse books donated by The LEE Experience community and available for a new reader.",
    alternates: {
      canonical: `https://theleeexperience.com/${locale}/books`,
      languages: {
        en: "https://theleeexperience.com/en/books",
        ar: "https://theleeexperience.com/ar/books",
      },
    },
  };
}

const PAGE_SIZE = 12;

export default async function BooksPage({ params, searchParams }: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ page?: string; search?: string; category?: string; language?: string }>;
}) {
  const { locale } = await params;
  const filters = await searchParams;
  const search = (filters.search || "").trim().slice(0, 120);
  const category = (filters.category || "").trim().slice(0, 100);
  const rawLanguage = (filters.language || "").trim().slice(0, 50);
  const language = Object.values(BookLanguage).includes(rawLanguage as BookLanguage) ? rawLanguage : "";
  const requestedPage = Number(filters.page);
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  await expireWhishPayments().catch(() => console.error("Book payment cleanup unavailable"));
  let books: CatalogueBook[] = [];
  let total = 0;
  let totalPublished = 0;
  let totalPages = 1;
  let currentPage = page;
  let categories: string[] = [];
  let languages: string[] = [];
  let loadError = false;

  try {
    const where: Prisma.BookInventoryItemWhereInput = {
      isPublished: true,
      ...(search ? { OR: [
        { title: { contains: search, mode: "insensitive" } },
        { titleAr: { contains: search, mode: "insensitive" } },
        { author: { contains: search, mode: "insensitive" } },
        { authorAr: { contains: search, mode: "insensitive" } },
        { publisher: { contains: search, mode: "insensitive" } },
        { isbn: { contains: search, mode: "insensitive" } },
        { editions: { some: { label: { contains: search, mode: "insensitive" } } } },
      ] } : {}),
      ...(category ? { AND: [{ OR: [
        { categories: { has: category } },
        { categories: { isEmpty: true }, customCategory: category },
        ...(BOOK_CATEGORIES.includes(category as (typeof BOOK_CATEGORIES)[number])
          ? [{ categories: { isEmpty: true }, category: category as (typeof BOOK_CATEGORIES)[number] }]
          : []),
      ] }] } : {}),
      ...(language ? { language: language as Prisma.EnumBookLanguageFilter["equals"] } : {}),
    };

    const [matchingCount, publishedCount, categoryRows, languageRows] = await Promise.all([
      db.bookInventoryItem.count({ where }),
      db.bookInventoryItem.count({ where: { isPublished: true } }),
      db.$queryRaw<{ category: string }[]>`
        SELECT DISTINCT value AS category FROM (
          SELECT unnest("categories") AS value FROM "BookInventoryItem" WHERE "isPublished" = true
          UNION ALL
          SELECT COALESCE("customCategory", "category"::text) AS value
          FROM "BookInventoryItem" WHERE "isPublished" = true AND cardinality("categories") = 0
        ) AS values WHERE value IS NOT NULL AND value <> '' ORDER BY value
      `,
      db.bookInventoryItem.findMany({ where: { isPublished: true }, distinct: ["language"], select: { language: true } }),
    ]);
    total = matchingCount;
    totalPublished = publishedCount;
    totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    currentPage = Math.min(page, totalPages);
    categories = categoryRows.map((row) => row.category);
    languages = languageRows.map((row) => row.language);

    books = await db.bookInventoryItem.findMany({
      where,
      orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }, { id: "desc" }],
      skip: (currentPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true, slug: true, title: true, titleAr: true, author: true, authorAr: true,
        descriptionEn: true, descriptionAr: true, isbn: true, publisher: true,
        publicationYear: true, category: true, customCategory: true, categories: true, language: true, condition: true,
        priceCents: true, currency: true, stockQuantity: true, coverImageUrl: true, status: true,
        donor: { select: { displayName: true, type: true, logoUrl: true, logoApproved: true, publicRecognition: true } },
        donorAllocations: { orderBy: { createdAt: "asc" }, select: { donor: { select: { displayName: true, type: true, logoUrl: true, logoApproved: true, publicRecognition: true } } } },
        editions: { where: { active: true, stockQuantity: { gt: 0 } }, orderBy: { createdAt: "asc" }, select: { id: true, label: true, publicationYear: true, stockQuantity: true, coverImageUrl: true } },
      },
    });
  } catch (error) {
    console.error("Public book catalogue failed to load", error);
    loadError = true;
  }

  return <BooksCatalogue books={books} locale={locale} loadError={loadError} total={total} totalPublished={totalPublished} page={currentPage} totalPages={totalPages} categories={categories} languages={languages} filters={{ search, category, language }} />;
}
