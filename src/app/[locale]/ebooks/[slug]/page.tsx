import { EbookStore } from "@/components/ebooks/EbookStore";
import type { Metadata } from "next";
import { EBOOK_PUBLIC_ORIGIN, publicEbook } from "@/lib/ebooks/public-product";

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const book = await publicEbook(slug);
  if (!book) return { title: "Ebook unavailable", robots: { index: false, follow: false } };
  const ar = locale === "ar";
  const title = ar ? book.titleAr || book.titleEn : book.titleEn;
  const description = ((ar ? book.descriptionAr || book.descriptionEn : book.descriptionEn || book.descriptionAr)
    || `${title} · ${book.author}`).replace(/\s+/g, " ").trim().slice(0, 200);
  const path = `/ebooks/${encodeURIComponent(book.slug)}`;
  const url = `${EBOOK_PUBLIC_ORIGIN}/${locale}${path}`;
  const image = `${url}/share-cover?v=${book.updatedAt.getTime()}`;
  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: { en: `${EBOOK_PUBLIC_ORIGIN}/en${path}`, ar: `${EBOOK_PUBLIC_ORIGIN}/ar${path}` },
    },
    openGraph: {
      type: "website", siteName: "The LEE Experience", title, description, url,
      locale: ar ? "ar_LB" : "en_US",
      images: book.coverUrl ? [{ url: image, secureUrl: image, type: "image/jpeg", alt: title }] : [],
    },
    twitter: { card: "summary_large_image", title, description, images: book.coverUrl ? [image] : [] },
  };
}

export default async function Page({ params }: { params: Promise<{ locale: string; slug: string }> }) { return <EbookStore {...await params} />; }
