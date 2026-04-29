import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/layout/PageHeader";
import { ImpactDashboard } from "@/components/sections/impact/ImpactDashboard";
import { CaseStudies } from "@/components/sections/impact/CaseStudies";
import { MenaMap } from "@/components/sections/impact/MenaMap";
import { ImpactJourney } from "@/components/sections/impact/ImpactJourney";
import { ImpactStories } from "@/components/sections/impact/ImpactStories";
import { ImpactLessons } from "@/components/sections/impact/ImpactLessons";
import { ImpactDownloads } from "@/components/sections/impact/ImpactDownloads";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about" });
  return {
    title: t("impactTitle"),
    description: "Impact isn't a report. It's a ripple.",
    keywords: "LEE impact, economic empowerment, livelihoods, MSMEs, women innovators, green economy, MENA, humanitarian aid, case studies",
  };
}

export default async function ImpactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const tNav = await getTranslations({ locale, namespace: "nav" });

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
      <ImpactStories />
      <ImpactLessons />
      <ImpactDownloads />
    </>
  );
}
