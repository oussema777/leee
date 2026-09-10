import type { Metadata } from "next";
import { db } from "@/lib/db";
import { BooksCatalogue, type CatalogueBook } from "@/components/sections/books/BooksCatalogue";

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

export default async function BooksPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  let books: CatalogueBook[] = [];
  let loadError = false;

  try {
    books = await db.bookInventoryItem.findMany({
      where: { isPublished: true },
      orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
      select: {
        id: true, slug: true, title: true, titleAr: true, author: true, authorAr: true,
        descriptionEn: true, descriptionAr: true, isbn: true, publisher: true,
        publicationYear: true, category: true, customCategory: true, language: true, condition: true,
        priceCents: true, currency: true, stockQuantity: true, coverImageUrl: true, status: true,
      },
    });
  } catch (error) {
    console.error("Public book catalogue failed to load", error);
    loadError = true;
  }

  return <BooksCatalogue books={books} locale={locale} loadError={loadError} />;
}
