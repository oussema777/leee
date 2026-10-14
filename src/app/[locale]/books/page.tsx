import { expireWhishPayments } from "@/lib/book-orders/whish-server";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { BooksCatalogue, type CatalogueBook } from "@/components/sections/books/BooksCatalogue";
import { catalogueCategoryWhere, parseCatalogueCategories } from "@/lib/book-inventory/catalogue-filters";
import { BookLanguage, type Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const isArabic = locale === "ar";
  return {
    title: isArabic ? "مكتبة الكتب | تجربة LEE" : "Book Library | The LEE Experience",
    description: isArabic
      ? "تصفّح كتب مجتمع تجربة LEE والكتب الإلكترونية للقراءة على الموقع."
      : "Browse community books and ebooks to read online from The LEE Experience.",
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
  searchParams: Promise<{ page?: string; search?: string; category?: string | string[]; match?: string; language?: string; format?: string }>;
}) {
  const { locale } = await params;
  const filters = await searchParams;
  const search = (filters.search || "").trim().slice(0, 120);
  const selectedCategories = parseCatalogueCategories(filters.category);
  const match = filters.match === "all" ? "all" : "any";
  const rawLanguage = (filters.language || "").trim().slice(0, 50);
  const language = Object.values(BookLanguage).includes(rawLanguage as BookLanguage) ? rawLanguage : "";
  const requestedPage = Number(filters.page);
  const format = filters.format === "ebook" || filters.format === "physical" ? filters.format : "";
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
      ...(format === "ebook" ? { id: { in: [] } } : {}),
      ...(search ? { OR: [
        { title: { contains: search, mode: "insensitive" } },
        { titleAr: { contains: search, mode: "insensitive" } },
        { author: { contains: search, mode: "insensitive" } },
        { authorAr: { contains: search, mode: "insensitive" } },
        { publisher: { contains: search, mode: "insensitive" } },
        { isbn: { contains: search, mode: "insensitive" } },
        { editions: { some: { label: { contains: search, mode: "insensitive" } } } },
      ] } : {}),
      AND: [catalogueCategoryWhere(selectedCategories, match)],
      ...(language ? { language: language as Prisma.EnumBookLanguageFilter["equals"] } : {}),
    };

    const ebookWhere: Prisma.EbookWhereInput = {
      published: true, activeVersion: { ready: true },
      ...(format === "physical" ? { id: { in: [] } } : {}),
      ...(search ? { OR: ["titleEn", "titleAr", "author"].map(field => ({ [field]: { contains: search, mode: "insensitive" } })) } : {}),
      ...(language ? { language: language as BookLanguage } : {}),
      ...(selectedCategories.length ? { categories: match === "all" ? { hasEvery: selectedCategories } : { hasSome: selectedCategories } } : {}),
    };
    const [matchingCount, publishedCount, categoryRows, languageRows, ebookCount, publishedEbooks] = await Promise.all([
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
      db.ebook.count({ where: ebookWhere }),
      db.ebook.findMany({ where: { published: true, activeVersion: { ready: true } }, select: { categories: true, language: true } }),
    ]);
    total = matchingCount + ebookCount;
    totalPublished = publishedCount + publishedEbooks.length;
    totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    currentPage = Math.min(page, totalPages);
    categories = [...new Set([...categoryRows.map(row => row.category), ...publishedEbooks.flatMap(b => b.categories)])].sort();
    languages = [...new Set([...languageRows.map(row => row.language), ...publishedEbooks.map(b => b.language)])].sort();

    // Merge lightweight keys before pagination, then load only this page's records.
    const take = currentPage * PAGE_SIZE;
    const [physicalKeys, ebookKeys] = await Promise.all([
      db.bookInventoryItem.findMany({ where, take, orderBy: [{ publishedAt: { sort: "desc", nulls: "last" } }, { updatedAt: "desc" }, { id: "desc" }], select: { id: true, publishedAt: true, updatedAt: true } }),
      db.ebook.findMany({ where: ebookWhere, take, orderBy: [{ createdAt: "desc" }, { updatedAt: "desc" }, { id: "desc" }], select: { id: true, createdAt: true, updatedAt: true } }),
    ]);
    const keys = [
      ...physicalKeys.map(b => ({ id: b.id, format: "physical", date: b.publishedAt?.getTime() ?? 0, updated: b.updatedAt.getTime() })),
      ...ebookKeys.map(b => ({ id: b.id, format: "ebook", date: b.createdAt.getTime(), updated: b.updatedAt.getTime() })),
    ].sort((a, b) => b.date - a.date || b.updated - a.updated || b.id.localeCompare(a.id))
      .slice((currentPage - 1) * PAGE_SIZE, take);
    const physicalBooks = await db.bookInventoryItem.findMany({
      where: { id: { in: keys.filter(k => k.format === "physical").map(k => k.id) } },
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
    const ebooks = await db.ebook.findMany({ where: { id: { in: keys.filter(k => k.format === "ebook").map(k => k.id) } } });
    const mappedEbooks: CatalogueBook[] = ebooks.map(b => ({
      id: b.id, slug: b.slug, format: "ebook", title: b.titleEn, titleAr: b.titleAr, author: b.author, authorAr: null,
      descriptionEn: b.descriptionEn, descriptionAr: b.descriptionAr, isbn: null, publisher: null,
      publicationYear: null, editions: [], category: "OTHER", customCategory: null, categories: b.categories,
      language: b.language, condition: "", priceCents: b.priceCents, currency: "USD", stockQuantity: 0,
      coverImageUrl: b.coverUrl, status: "AVAILABLE", donor: null, donorAllocations: [],
    }));
    const records = new Map<string, CatalogueBook>([...physicalBooks, ...mappedEbooks].map(b => [b.id, b]));
    books = keys.map(k => records.get(k.id)).filter((b): b is CatalogueBook => !!b);
  } catch (error) {
    console.error("Public book catalogue failed to load", error);
    loadError = true;
  }

  return <BooksCatalogue books={books} locale={locale} loadError={loadError} total={total} totalPublished={totalPublished} page={currentPage} totalPages={totalPages} categories={categories} languages={languages} filters={{ search, categories: selectedCategories, match, language, format }} />;
}
