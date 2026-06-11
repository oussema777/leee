import { getTranslations } from "next-intl/server";
import { buildPageMetadata } from "@/lib/metadata";
import { PageHeader } from "@/components/layout/PageHeader";
import { AboutIntro } from "@/components/sections/about/AboutIntro";
import { AboutVMV } from "@/components/sections/about/AboutVMV";
import { AboutOfferings } from "@/components/sections/about/AboutOfferings";
import { AboutTimeline } from "@/components/sections/about/AboutTimeline";
import { AboutTeam } from "@/components/sections/about/AboutTeam";
import { AboutExpertsTeaser } from "@/components/sections/about/AboutExpertsTeaser";
import { AboutValues } from "@/components/sections/about/AboutValues";
import { AboutQuoteBanner } from "@/components/sections/about/AboutQuoteBanner";
import { AboutStrategy } from "@/components/sections/about/AboutStrategy";
import { AboutPartners } from "@/components/sections/about/AboutPartners";
import { getTeamMembers } from "@/lib/data/members";
import { getPartners } from "@/lib/data/partners";
import { getCoreValues, getMilestones } from "@/lib/data/about";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about" });
  return buildPageMetadata({
    title: t("pageTitle"),
    description: "Born in crisis. Built for change.",
    path: "about",
    locale,
  });
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about" });
  const tNav = await getTranslations({ locale, namespace: "nav" });

  const [team, partners, values, timeline] = await Promise.all([
    getTeamMembers(),
    getPartners(),
    getCoreValues(),
    getMilestones(),
  ]);

  return (
    <>
      {/* Cinematic Hero with wave divider */}
      <PageHeader
        title="Born in crisis. Built for change."
        subtitle="In 2020, Lebanon collapsed. We didn't wait for permission to act. We built a bridge between survival and ambition."
        backgroundImage="/images/new/group-photo.jpg"
        breadcrumbs={[
          { label: tNav("home"), href: "/" },
          { label: t("pageTitle") },
        ]}
      />

      {/* About intro with key numbers */}
      <AboutIntro />

      {/* Vision / Mission / Values — 3 columns */}
      <AboutVMV />

      {/* What We Offer — icon grid */}
      <AboutOfferings />

      {/* Gradient quote banner */}
      <AboutQuoteBanner />

      {/* Timeline */}
      <AboutTimeline timeline={timeline} />

      {/* Team */}
      <AboutTeam team={team} />

      {/* Experts & Mentors teaser → dedicated page at /about/experts */}
      <AboutExpertsTeaser />

      {/* Values in action */}
      <AboutValues values={values} />

      {/* Strategic framework */}
      <AboutStrategy />

      {/* Partners grid */}
      <AboutPartners partners={partners} />
    </>
  );
}
