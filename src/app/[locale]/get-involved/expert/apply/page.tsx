import { buildPageMetadata } from "@/lib/metadata";
import { PageHeader } from "@/components/layout/PageHeader";
import { Container } from "@/components/ui/Container";
import { ExpertApplyForm } from "@/components/sections/expert-apply/ExpertApplyForm";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return buildPageMetadata({
    title:
      locale === "ar"
        ? "تقدّم للانضمام إلى مجموعة خبرائنا — تجربة LEE"
        : "Apply to Join Our Expert Pool — The LEE Experience",
    description:
      locale === "ar"
        ? "انضم إلى فريق مدربينا ومرشدينا. شارك خبرتك وافتح أبواباً جديدة."
        : "Apply to join our pool of trainers, coaches, and mentors. Share your expertise and open new doors.",
    path: "get-involved/expert/apply",
    locale,
  });
}

export default async function ExpertApplyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isAr = locale === "ar";
  const tNav = await getTranslations({ locale, namespace: "nav" });

  return (
    <>
      <PageHeader
        title={
          isAr
            ? "تقدّم للانضمام إلى مجموعة خبرائنا"
            : "Apply to Join Our Expert Pool"
        }
        subtitle={
          isAr
            ? "شارك مهاراتك وخبرتك مع رواد الأعمال في الشرق الأوسط وأفريقيا."
            : "Share your skills and expertise with entrepreneurs across MENA and Africa."
        }
        breadcrumbs={[
          { label: tNav("home"), href: "/" },
          { label: tNav("getInvolved"), href: "/get-involved" },
          {
            label: isAr ? "للخبراء والمرشدين" : "For Experts & Mentors",
            href: `/${locale}/get-involved/expert`,
          },
          { label: isAr ? "تقدّم الآن" : "Apply" },
        ]}
      />

      <section className="py-16 md:py-24">
        <Container size="sm">
          <ExpertApplyForm locale={locale} />
        </Container>
      </section>
    </>
  );
}
