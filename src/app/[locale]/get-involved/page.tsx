import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/layout/PageHeader";
import { GetInvolvedHub } from "@/components/sections/get-involved/GetInvolvedHub";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return {
    title:
      locale === "ar"
        ? "شارك معنا — تجربة LEEE"
        : "Get Involved — The LEEE Experience",
    description:
      locale === "ar"
        ? "التغيير ليس رياضة مشاهدة. اعثر على دورك في الحركة."
        : "Change isn't a spectator sport. Find your role in the movement.",
  };
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
    </>
  );
}
