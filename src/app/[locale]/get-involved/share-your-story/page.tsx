import { getTranslations } from "next-intl/server";
import { buildPageMetadata } from "@/lib/metadata";
import { PageHeader } from "@/components/layout/PageHeader";
import { Container } from "@/components/ui/Container";
import { ShareStoryForm } from "@/components/forms/ShareStoryForm";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return buildPageMetadata({
    title: locale === "ar" ? "شارك قصتك — تجربة LEE" : "Share Your Story — The LEE Experience",
    description: locale === "ar"
      ? "هل شاركت في أحد برامج LEEE؟ شارك شهادتك وألهم الآخرين"
      : "Were you part of a LEEE program? Share your testimonial and inspire others",
    path: "get-involved/share-your-story",
    locale,
  });
}

export default async function ShareYourStoryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const tNav = await getTranslations({ locale, namespace: "nav" });

  return (
    <>
      <PageHeader
        title={locale === "ar" ? "شارك قصتك" : "Share Your Story"}
        subtitle={
          locale === "ar"
            ? "تجربتك قد تكون الشرارة التي تلهم شخصاً آخر ليبدأ"
            : "Your experience could be the spark that inspires someone else to start"
        }
        breadcrumbs={[
          { label: tNav("home"), href: "/" },
          { label: tNav("getInvolved"), href: "/get-involved" },
          { label: locale === "ar" ? "شارك قصتك" : "Share Your Story" },
        ]}
      />

      <section className="py-12 md:py-20">
        <Container>
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-4">
                {locale === "ar" ? "كنت جزءاً من تجربة LEE؟" : "Were You Part of The LEE Experience?"}
              </h2>
              <p className="text-text-secondary max-w-xl mx-auto leading-relaxed">
                {locale === "ar"
                  ? "أخبرنا كيف أثّر البرنامج على حياتك. بعد مراجعة فريقنا وبموافقتك، قد تُنشر شهادتك على موقعنا."
                  : "Tell us how the program changed things for you. After our team reviews it — and with your consent — your testimonial may be published on our website."}
              </p>
            </div>

            <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-6 md:p-10">
              <ShareStoryForm />
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
