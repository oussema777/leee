import { getTranslations } from "next-intl/server";
import { buildPageMetadata } from "@/lib/metadata";
import { PageHeader } from "@/components/layout/PageHeader";
import { GetInvolvedHub } from "@/components/sections/get-involved/GetInvolvedHub";
import { ShareStoryCTA } from "@/components/sections/get-involved/ShareStoryCTA";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return buildPageMetadata({
    title: locale === "ar"
      ? "شارك معنا — تجربة LEE"
      : "Get Involved — The LEE Experience",
    description: locale === "ar"
      ? "التغيير ليس رياضة مشاهدة. اعثر على دورك في الحركة."
      : "Change isn't a spectator sport. Find your role in the movement.",
    path: "get-involved",
    locale,
  });
}

export default async function GetInvolvedPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const tNav = await getTranslations({ locale, namespace: "nav" });

  return (
    <>
      <PageHeader
        title={
          locale === "ar"
            ? "التغيير ليس رياضة مشاهدة."
            : "Change isn't a spectator sport."
        }
        subtitle={
          locale === "ar"
            ? "اعثر على دورك في الحركة."
            : "Find your role in the movement."
        }
        breadcrumbs={[
          { label: tNav("home"), href: "/" },
          { label: tNav("getInvolved") },
        ]}
      />

      <GetInvolvedHub />
      <ShareStoryCTA />
    </>
  );
}
