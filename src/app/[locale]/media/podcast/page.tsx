import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { buildPageMetadata } from "@/lib/metadata";
import { PageHeader } from "@/components/layout/PageHeader";
import { Container } from "@/components/ui/Container";
import { PodcastGrid } from "@/components/sections/podcast/PodcastGrid";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "podcast" });
  return buildPageMetadata({
    title: t("pageTitle"),
    description: t("pageSubtitle"),
    path: "media/podcast",
    locale,
  });
}

export default async function PodcastPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "podcast" });
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
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="bg-surface-secondary animate-pulse h-32" />
                ))}
              </div>
            }
          >
            <PodcastGrid />
          </Suspense>
        </Container>
      </section>
    </>
  );
}
