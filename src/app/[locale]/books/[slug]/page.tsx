import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { BookDetailExperience } from "@/components/sections/books/BookDetailExperience";
import type { CatalogueBook } from "@/components/sections/books/BooksCatalogue";

export const dynamic = "force-dynamic";

const bookSelect = {
  id: true,
  slug: true,
  title: true,
  titleAr: true,
  author: true,
  authorAr: true,
  descriptionEn: true,
  descriptionAr: true,
  isbn: true,
  publisher: true,
  publicationYear: true,
  category: true,
  customCategory: true,
  language: true,
  condition: true,
  priceCents: true,
  currency: true,
  stockQuantity: true,
  coverImageUrl: true,
  status: true,
} as const;

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const book = await db.bookInventoryItem.findFirst({
    where: { slug, isPublished: true },
    select: { title: true, titleAr: true, author: true, authorAr: true, descriptionEn: true, descriptionAr: true, coverImageUrl: true },
  }).catch(() => null);
  if (!book) return {};
  const isArabic = locale === "ar";
  const title = isArabic && book.titleAr ? book.titleAr : book.title;
  const author = isArabic && book.authorAr ? book.authorAr : book.author;
  const description = (isArabic ? book.descriptionAr || book.descriptionEn : book.descriptionEn || book.descriptionAr) || `${title} by ${author}`;
  return {
    title: `${title} | The LEE Experience`,
    description: description.slice(0, 160),
    openGraph: { title, description: description.slice(0, 160), images: book.coverImageUrl ? [book.coverImageUrl] : [] },
    alternates: {
      canonical: `https://theleeexperience.com/${locale}/books/${slug}`,
      languages: { en: `https://theleeexperience.com/en/books/${slug}`, ar: `https://theleeexperience.com/ar/books/${slug}` },
    },
  };
}

export default async function BookPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  const [book, availableBooks] = await Promise.all([
    db.bookInventoryItem.findFirst({ where: { slug, isPublished: true }, select: bookSelect }),
    db.bookInventoryItem.findMany({
      where: { isPublished: true, status: "AVAILABLE", stockQuantity: { gt: 0 } },
      orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
      select: bookSelect,
    }),
  ]).catch(() => [null, []] as const);

  if (!book) notFound();
  const books = availableBooks.some((item) => item.id === book.id) ? availableBooks : [book, ...availableBooks];
  return <BookDetailExperience book={book as CatalogueBook} books={books as CatalogueBook[]} locale={locale} />;
}
