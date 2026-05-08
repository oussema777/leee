import type { Metadata } from "next";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Outfit, DM_Serif_Display, Cairo } from "next/font/google";
import { PageLoader } from "@/components/shared/PageLoader";
import { NewsTicker } from "@/components/layout/NewsTicker";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { WhatsAppButton } from "@/components/layout/WhatsAppButton";
import { JsonLd } from "@/components/shared/JsonLd";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return {
    alternates: {
      canonical: `https://theleeexperience.com/${locale}`,
      languages: {
        en: "https://theleeexperience.com/en",
        ar: "https://theleeexperience.com/ar",
      },
    },
    openGraph: {
      locale: locale === "ar" ? "ar_SA" : "en_US",
    },
    other: {
      "theme-color": "#5895D0",
    },
  };
}

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-outfit",
  display: "swap",
});

const dmSerif = DM_Serif_Display({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-dm-serif",
  display: "swap",
});

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-cairo",
  display: "swap",
});

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const messages = (await import(`../../../messages/${locale}.json`)).default;
  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <html
      lang={locale}
      dir={dir}
      className={`${outfit.variable} ${dmSerif.variable} ${cairo.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen flex flex-col">
        <JsonLd data={{
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "The LEE Experience",
          url: "https://theleeexperience.com",
          logo: "https://theleeexperience.com/LEEE-LOGO.png",
          description: "Social enterprise ecosystem empowering communities in Lebanon and MENA",
          sameAs: [
            "https://www.facebook.com/theleeexperience/",
            "https://twitter.com/lee_experience",
            "https://www.instagram.com/the_lee_experience/",
            "https://www.linkedin.com/company/the-lee-experience",
          ],
          address: {
            "@type": "PostalAddress",
            addressLocality: "Beirut",
            addressCountry: "LB",
          },
          foundingDate: "2018",
          contactPoint: {
            "@type": "ContactPoint",
            telephone: "+961-3-002-430",
            contactType: "customer service",
            email: "info@theleeexperience.com",
          },
        }} />
        <JsonLd data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "The LEE Experience",
          url: "https://theleeexperience.com",
          inLanguage: ["en", "ar"],
        }} />
        <NextIntlClientProvider locale={locale} messages={messages}>
          <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:top-4 focus:left-4 focus:bg-white focus:text-accent-navy focus:px-4 focus:py-2 focus:rounded-md focus:shadow-lg focus:text-sm focus:font-medium">
            {locale === "ar" ? "تخطي إلى المحتوى" : "Skip to content"}
          </a>
          <PageLoader />
            <NewsTicker />
            <Navbar />
            <main id="main-content" className="flex-1">{children}</main>
            <Footer />
          <WhatsAppButton />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
