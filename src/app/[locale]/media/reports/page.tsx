import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { buildPageMetadata } from "@/lib/metadata";
import { PageHeader } from "@/components/layout/PageHeader";
import { Container } from "@/components/ui/Container";
import { ReportsGrid } from "@/components/sections/reports/ReportsGrid";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "reports" });
  return buildPageMetadata({
    title: t("pageTitle"),
    description: t("pageSubtitle"),
    path: "media/reports",
    locale,
  });
}

export default async function ReportsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "reports" });
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-surface-secondary animate-pulse h-96" />
                ))}
              </div>
            }
          >
            <ReportsGrid />
          </Suspense>
        </Container>
      </section>
    </>
  );
}
