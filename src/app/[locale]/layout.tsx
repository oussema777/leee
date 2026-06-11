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
import { getContactInfo, contactValue } from "@/lib/data/contact";

// Footer / WhatsApp button / JSON-LD read live contact details from the DB.
export const dynamic = "force-dynamic";

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

  // Live contact details from the ContactInfo table (admin Settings → Contact).
  // Each read falls back to the current hardcoded value if the key is missing.
  const contact = await getContactInfo();
  const phone = contactValue(contact, "phone", locale, "+961 3 002 430");
  const email = contactValue(contact, "email", locale, "info@theleeexperience.com");
  const address = contactValue(
    contact,
    "address",
    locale,
    locale === "ar" ? "بيروت، لبنان | القاهرة، مصر" : "Beirut, Lebanon | Cairo, Egypt"
  );
  const whatsapp = contactValue(contact, "whatsapp", locale, "96103600747");
  // JSON-LD telephone uses E.164-ish digits/plus only.
  const phoneTel = phone.replace(/[^+\d]/g, "");

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
            telephone: phoneTel,
            contactType: "customer service",
            email,
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
            <Footer phone={phone} email={email} address={address} />
          <WhatsAppButton whatsappNumber={whatsapp} />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
