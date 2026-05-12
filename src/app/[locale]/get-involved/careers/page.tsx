import { getTranslations } from "next-intl/server";
import { buildPageMetadata } from "@/lib/metadata";
import { PageHeader } from "@/components/layout/PageHeader";
import { CareersList } from "@/components/sections/careers/CareersList";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "careers" });
  return buildPageMetadata({
    title: t("pageTitle"),
    description: t("pageSubtitle"),
    path: "get-involved/careers",
    locale,
  });
}

export default async function CareersPage() {
  const now = new Date();
  const careers = await db.career.findMany({
    where: {
      isActive: true,
      OR: [{ deadline: null }, { deadline: { gte: now } }],
    },
    orderBy: { createdAt: "desc" },
  });

  const t = await getTranslations("careers");

  return (
    <>
      <PageHeader title={t("pageTitle")} subtitle={t("pageSubtitle")} />
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4 max-w-4xl">
          <CareersList
            careers={careers.map((c) => ({
              id: c.id,
              slug: c.slug,
              titleEn: c.titleEn,
              titleAr: c.titleAr,
              descriptionEn: c.descriptionEn,
              descriptionAr: c.descriptionAr,
              locationEn: c.locationEn,
              locationAr: c.locationAr,
              type: c.type,
              deadline: c.deadline ? c.deadline.toISOString() : null,
            }))}
          />
        </div>
      </section>
    </>
  );
}
