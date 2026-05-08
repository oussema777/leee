import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { buildPageMetadata } from "@/lib/metadata";
import { PageHeader } from "@/components/layout/PageHeader";
import { Container } from "@/components/ui/Container";
import { partnerOptions } from "@/components/sections/get-involved/getInvolvedData";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return buildPageMetadata({
    title: locale === "ar"
      ? "موثوق من قبل — تجربة LEE"
      : "Trusted By — The LEE Experience",
    description: locale === "ar"
      ? "شارك في إنشاء برامج خضراء ومستجيبة للنوع الاجتماعي."
      : "Co-create green, gender-responsive programs. Invest in women-led climate innovation.",
    path: "get-involved/partner",
    locale,
  });
}

export default async function PartnerPage({
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
            ? "تريد أثراً يدوم؟ صمّمه معنا."
            : "Want impact that lasts? Co-create with us."
        }
        subtitle={
          isAr
            ? "استثمر في الابتكار الأخضر بقيادة النساء عبر الشرق الأوسط وأفريقيا."
            : "Invest in women-led green innovation across MENA and Africa."
        }
        breadcrumbs={[
          { label: tNav("home"), href: "/" },
          { label: tNav("getInvolved"), href: "/get-involved" },
          { label: isAr ? "للشركاء" : "For Partners" },
        ]}
      />

      {/* Intro */}
      <section className="py-16 md:py-20">
        <Container size="md">
          <div className="text-center mb-14">
            <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-4">
              {isAr ? "كيف يمكنك المشاركة؟" : "How Can You Partner With Us?"}
            </h2>
            <p className="text-text-secondary max-w-2xl mx-auto leading-relaxed">
              {isAr
                ? "نقدم نماذج شراكة مرنة تناسب مختلف أهداف الأثر والميزانيات. اختر النموذج الذي يتوافق مع رؤيتك."
                : "We offer flexible partnership models suited to different impact goals and budgets. Choose the model that aligns with your vision."}
            </p>
          </div>

          {/* Option Cards */}
          <div className="space-y-6">
            {partnerOptions.map((option, index) => {
              const title = isAr ? option.titleAr : option.titleEn;
              const description = isAr ? option.descriptionAr : option.descriptionEn;
              const example = isAr ? option.exampleAr : option.exampleEn;

              return (
                <div
                  key={option.id}
                  className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row md:items-start gap-6"
                >
                  {/* Number badge */}
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-brand-blue text-white flex items-center justify-center font-bold text-sm">
                    {index + 1}
                  </div>

                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-text-primary mb-2">
                      {title}
                    </h3>
                    <p className="text-text-secondary leading-relaxed mb-3">
                      {description}
                    </p>
                    <p className="text-sm italic text-brand-blue">
                      {isAr ? "مثال:" : "Example:"} {example}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </Container>
      </section>

      {/* Trust signals */}
      <section className="py-12 bg-surface-secondary">
        <Container>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
            {[
              {
                stat: "10",
                labelEn: "Countries of operation",
                labelAr: "دول عمليات",
              },
              {
                stat: "38,790+",
                labelEn: "Direct beneficiaries",
                labelAr: "مستفيد مباشر",
              },
              {
                stat: "$1M+",
                labelEn: "Seed funding facilitated",
                labelAr: "تمويل أولي تم تيسيره",
              },
            ].map((item) => (
              <div key={item.stat}>
                <p className="text-4xl font-bold text-brand-blue mb-2">
                  {item.stat}
                </p>
                <p className="text-text-secondary">
                  {isAr ? item.labelAr : item.labelEn}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-20">
        <Container>
          <div className="text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-6">
              {isAr ? "هل أنت مستعد لصنع الأثر؟" : "Ready to make an impact?"}
            </h2>
            <Link
              href={`/${locale}/get-involved`}
              className="inline-flex items-center gap-2 bg-brand-blue text-white font-semibold px-8 py-4 rounded-xl hover:bg-brand-blue/90 transition-colors shadow-md hover:shadow-lg"
            >
              {isAr
                ? "استكشف نماذج الشراكة ←"
                : "Explore Partnership Models →"}
            </Link>
          </div>
        </Container>
      </section>
    </>
  );
}
