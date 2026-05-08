import { getTranslations } from "next-intl/server";
import { buildPageMetadata } from "@/lib/metadata";
import { PageHeader } from "@/components/layout/PageHeader";
import { Container } from "@/components/ui/Container";
import { JoinUsForm } from "@/components/forms/JoinUsForm";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "getInvolved" });
  return buildPageMetadata({
    title: t("joinUsTitle"),
    description: locale === "ar"
      ? "انضم إلى تجربة LEE وكن جزءاً من مجتمعنا المتنامي"
      : "Join The LEE Experience and become part of our growing community",
    path: "get-involved/join-us",
    locale,
  });
}

export default async function JoinUsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "getInvolved" });
  const tNav = await getTranslations({ locale, namespace: "nav" });

  return (
    <>
      <PageHeader
        title={t("joinUsTitle")}
        subtitle={
          locale === "ar"
            ? "انضم إلى مجتمع مترابط من رواد الأعمال والخبراء والمبتكرين وصناع التغيير"
            : "Join an interconnected community of entrepreneurs, experts, innovators, and changemakers"
        }
        breadcrumbs={[
          { label: tNav("home"), href: "/" },
          { label: tNav("getInvolved") },
          { label: t("joinUsTitle") },
        ]}
      />

      <section className="py-12 md:py-20">
        <Container>
          <div className="max-w-3xl mx-auto">
            {/* Intro text */}
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-4">
                {locale === "ar"
                  ? "كن جزءاً من تجربة LEE"
                  : "Become Part of The LEE Experience"}
              </h2>
              <p className="text-text-secondary max-w-xl mx-auto leading-relaxed">
                {locale === "ar"
                  ? "سواء كنت متطوعاً أو خبيراً أو محترفاً يبحث عن فرصة للتأثير، نرحب بك في فريقنا. أكمل النموذج أدناه وسنتواصل معك قريباً."
                  : "Whether you're a volunteer, expert, or professional looking for an opportunity to make an impact, we welcome you to our team. Complete the form below and we'll get back to you soon."}
              </p>
            </div>

            {/* Form card */}
            <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-6 md:p-10">
              <JoinUsForm />
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
