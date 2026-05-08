import type { Metadata } from "next";

const BASE_URL = "https://theleeexperience.com";

interface BuildPageMetadataOptions {
  title: string;
  description: string;
  path: string;
  locale: string;
  ogImage?: string;
  keywords?: string[];
}

export function buildPageMetadata({
  title,
  description,
  path,
  locale,
  ogImage,
  keywords,
}: BuildPageMetadataOptions): Metadata {
  const url = `${BASE_URL}/${locale}/${path}`;
  const altLocale = locale === "ar" ? "en" : "ar";

  return {
    title,
    description,
    ...(keywords ? { keywords } : {}),
    alternates: {
      canonical: url,
      languages: {
        en: `${BASE_URL}/en/${path}`,
        ar: `${BASE_URL}/ar/${path}`,
      },
    },
    openGraph: {
      title,
      description,
      url,
      locale: locale === "ar" ? "ar_SA" : "en_US",
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
  };
}
