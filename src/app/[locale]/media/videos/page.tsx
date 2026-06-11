import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { buildPageMetadata } from "@/lib/metadata";
import { PageHeader } from "@/components/layout/PageHeader";
import { Container } from "@/components/ui/Container";
import { VideosGrid } from "@/components/sections/videos/VideosGrid";
import { getVideos } from "@/lib/data/videos";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "videos" });
  return buildPageMetadata({
    title: t("pageTitle"),
    description: t("pageSubtitle"),
    path: "media/videos",
    locale,
  });
}

export default async function VideosPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "videos" });
  const tNav = await getTranslations({ locale, namespace: "nav" });

  const videos = await getVideos();

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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-surface-secondary animate-pulse aspect-video" />
                ))}
              </div>
            }
          >
            <VideosGrid videos={videos} />
          </Suspense>
        </Container>
      </section>
    </>
  );
}
