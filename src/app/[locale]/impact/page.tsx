import { getTranslations } from "next-intl/server";
import { buildPageMetadata } from "@/lib/metadata";
import { PageHeader } from "@/components/layout/PageHeader";
import { ImpactDashboard } from "@/components/sections/impact/ImpactDashboard";
import { CaseStudies } from "@/components/sections/impact/CaseStudies";
import { MenaMap } from "@/components/sections/impact/MenaMap";
import { ImpactJourney } from "@/components/sections/impact/ImpactJourney";
import { ImpactStories } from "@/components/sections/impact/ImpactStories";
import { ImpactLessons } from "@/components/sections/impact/ImpactLessons";
import { ImpactDownloads } from "@/components/sections/impact/ImpactDownloads";
import { getTestimonials } from "@/lib/data/testimonials";

// ISR: keep the (heavy, mostly-static) impact page statically served while
// refreshing the dynamic Impact Stories band at most once a minute.
export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about" });
  return buildPageMetadata({
    title: t("impactTitle"),
    description: "Impact isn't a report. It's a ripple.",
    path: "impact",
    locale,
    keywords: ["LEE impact", "economic empowerment", "livelihoods", "MSMEs", "women innovators", "green economy", "MENA", "humanitarian aid", "case studies"],
  });
}

export default async function ImpactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const tNav = await getTranslations({ locale, namespace: "nav" });

  // Top 3 active testimonials (admin-ordered, deterministic) feed the
  // Impact Stories band. getTestimonials() already filters isActive + orders.
  const stories = (await getTestimonials()).slice(0, 3).map((t) => ({
    id: t.id,
    nameEn: t.nameEn,
    nameAr: t.nameAr,
    roleEn: t.roleEn,
    roleAr: t.roleAr,
    quoteEn: t.quoteEn,
    quoteAr: t.quoteAr,
    imageUrl: t.imageUrl,
  }));

  return (
    <>
      <PageHeader
        title="Impact isn't a report. It's a ripple."
        subtitle="From the ashes of crisis, we've grown a movement. 32 strategic projects. 38,790+ lives touched. Here's how."
        backgroundImage="/images/new/community-table.jpg"
        breadcrumbs={[
          { label: tNav("home"), href: "/" },
          { label: "Impact" },
        ]}
      />

      <ImpactDashboard />
      <CaseStudies />
      <MenaMap />
      <ImpactJourney />
      <ImpactStories stories={stories} />
      <ImpactLessons />
      <ImpactDownloads />
    </>
  );
}
