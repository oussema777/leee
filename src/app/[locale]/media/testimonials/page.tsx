import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { buildPageMetadata } from "@/lib/metadata";
import { PageHeader } from "@/components/layout/PageHeader";
import { Container } from "@/components/ui/Container";
import { TestimonialsGrid } from "@/components/sections/testimonials/TestimonialsGrid";
import { getTestimonials } from "@/lib/data/testimonials";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "testimonials" });
  return buildPageMetadata({
    title: t("pageTitle"),
    description: t("pageSubtitle"),
    path: "media/testimonials",
    locale,
  });
}

export default async function TestimonialsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "testimonials" });
  const tNav = await getTranslations({ locale, namespace: "nav" });

  const testimonials = await getTestimonials();

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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="bg-surface-secondary animate-pulse h-64" />
                ))}
              </div>
            }
          >
            <TestimonialsGrid testimonials={testimonials} />
          </Suspense>
        </Container>
      </section>
    </>
  );
}
