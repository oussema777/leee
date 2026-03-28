import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/layout/PageHeader";
import { Container } from "@/components/ui/Container";
import { GalleryGrid } from "@/components/sections/gallery/GalleryGrid";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "gallery" });
  return {
    title: t("pageTitle"),
    description: t("pageSubtitle"),
  };
}

export default async function GalleryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "gallery" });
  const tNav = await getTranslations({ locale, namespace: "nav" });

  return (
    <>
      <PageHeader
        title={t("pageTitle")}
        subtitle={t("pageSubtitle")}
        breadcrumbs={[
          { label: tNav("home"), href: "/" },
          { label: tNav("media"), href: "/media" },
          { label: t("pageTitle") },
        ]}
      />
      <section className="py-12 md:py-16">
        <Container>
          <Suspense
            fallback={
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="bg-surface-secondary animate-pulse aspect-[4/3]" />
                ))}
              </div>
            }
          >
            <GalleryGrid />
          </Suspense>
        </Container>
      </section>
    </>
  );
}
