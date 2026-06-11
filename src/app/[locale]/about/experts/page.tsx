import { getTranslations } from "next-intl/server";
import { buildPageMetadata } from "@/lib/metadata";
import { PageHeader } from "@/components/layout/PageHeader";
import { ExpertsShowcase } from "@/components/sections/experts/ExpertsShowcase";
import { getExpertsAndMentors } from "@/lib/data/members";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const isAr = locale === "ar";
  return buildPageMetadata({
    title: isAr ? "الخبراء والمرشدون" : "Experts & Mentors",
    description: isAr
      ? "تعرّف على الخبراء والمرشدين الذين يقفون خلف برامج تجربة LEE عبر الشرق الأوسط وأفريقيا."
      : "Meet the experts and mentors behind The LEE Experience programs across MENA and Africa.",
    path: "about/experts",
    locale,
    keywords: ["experts", "mentors", "trainers", "coaches", "advisory network", "entrepreneurship support"],
  });
}

export default async function ExpertsMentorsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isAr = locale === "ar";
  const tNav = await getTranslations({ locale, namespace: "nav" });

  const { experts, mentors } = await getExpertsAndMentors();

  return (
    <>
      <PageHeader
        title={isAr ? "الخبراء والمرشدون" : "Experts & Mentors"}
        subtitle={
          isAr
            ? "الخبرة الإنسانية التي تحوّل برامجنا إلى أثر حقيقي."
            : "The human expertise that turns our programs into real impact."
        }
        backgroundImage="/images/new/coaching-session.jpg"
        breadcrumbs={[
          { label: tNav("home"), href: "/" },
          { label: isAr ? "من نحن" : "About Us", href: "/about" },
          { label: isAr ? "الخبراء والمرشدون" : "Experts & Mentors" },
        ]}
      />

      <ExpertsShowcase experts={experts} mentors={mentors} />
    </>
  );
}
