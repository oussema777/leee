import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { buildPageMetadata } from "@/lib/metadata";
import { PageHeader } from "@/components/layout/PageHeader";
import { Container } from "@/components/ui/Container";
import { entrepreneurSteps } from "@/components/sections/get-involved/getInvolvedData";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return buildPageMetadata({
    title: locale === "ar"
      ? "لرواد الأعمال — تجربة LEE"
      : "For Entrepreneurs — The LEE Experience",
    description: locale === "ar"
      ? "لديك فكرة مشروع أخضر؟ سنساعدك على التحقق منها وبنائها وتمويلها."
      : "Got a green business idea? We'll help you validate, build, and fund it.",
    path: "get-involved/entrepreneur",
    locale,
  });
}

export default async function EntrepreneurPage({
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
        title={isAr ? "لديك فكرة؟ دعنا ننمّيها." : "Got an idea? Let's grow it."}
        subtitle={
          isAr
            ? "من التحقق إلى الاستثمار — نمشي معك في كل خطوة."
            : "From validation to investment-ready — we walk with you every step."
        }
        breadcrumbs={[
          { label: tNav("home"), href: "/" },
          { label: tNav("getInvolved"), href: "/get-involved" },
          { label: isAr ? "لرواد الأعمال" : "For Entrepreneurs" },
        ]}
      />

      {/* 3-Step Process */}
      <section className="py-16 md:py-24">
        <Container>
          <div className="text-center mb-14">
            <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-4">
              {isAr ? "كيف تبدأ رحلتك" : "How Your Journey Begins"}
            </h2>
            <p className="text-text-secondary max-w-xl mx-auto leading-relaxed">
              {isAr
                ? "ثلاث خطوات واضحة تأخذك من الفكرة إلى المشروع الحقيقي."
                : "Three clear steps take you from idea to a real, funded venture."}
            </p>
          </div>

          {/* Steps */}
          <div className="relative max-w-3xl mx-auto">
            {/* Vertical dotted connector (desktop) */}
            <div className="hidden md:block absolute left-7 top-10 bottom-10 w-0.5 border-l-2 border-dashed border-brand-blue/30" />

            <div className="flex flex-col gap-10">
              {entrepreneurSteps.map((step) => {
                const title = isAr ? step.titleAr : step.titleEn;
                const description = isAr ? step.descriptionAr : step.descriptionEn;

                return (
                  <div key={step.stepNumber} className="flex gap-6 items-start">
                    {/* Circle number */}
                    <div className="relative z-10 flex-shrink-0 w-14 h-14 rounded-full bg-brand-blue text-white flex items-center justify-center text-lg font-bold shadow-md">
                      {step.stepNumber}
                    </div>

                    {/* Content */}
                    <div className="pt-2 flex-1">
                      <h3 className="text-lg font-bold text-text-primary mb-1">
                        {title}
                      </h3>
                      <p className="text-text-secondary leading-relaxed">
                        {description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Container>
      </section>

      {/* Program Cards */}
      <section className="py-16 bg-surface-secondary">
        <Container>
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-4">
              {isAr ? "برامجنا لرواد الأعمال" : "Our Entrepreneur Programs"}
            </h2>
            <p className="text-text-secondary max-w-xl mx-auto">
              {isAr
                ? "اختر المسار الذي يناسب مرحلتك الحالية."
                : "Choose the track that matches where you are right now."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Green Seeds Incubator */}
            <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-5">
                <span className="text-2xl">🌱</span>
              </div>
              <h3 className="text-xl font-bold text-text-primary mb-3">
                {isAr ? "حاضنة البذور الخضراء" : "Green Seeds Incubator"}
              </h3>
              <p className="text-text-secondary leading-relaxed">
                {isAr
                  ? "رحلة 18 شهراً من الفكرة إلى مشروع جاهز للاستثمار. دعم شامل في التمويل والإرشاد والشبكة."
                  : "An 18-month journey from idea to investment-ready. Full support in funding, mentorship, and network building."}
              </p>
            </div>

            {/* SIYB Green Pathway */}
            <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-5">
                <span className="text-2xl">📋</span>
              </div>
              <h3 className="text-xl font-bold text-text-primary mb-3">
                {isAr ? "مسار SIYB الأخضر" : "SIYB Green Pathway"}
              </h3>
              <p className="text-text-secondary leading-relaxed">
                {isAr
                  ? "تدريب ابدأ وحسّن مشروعك المعتمد من منظمة العمل الدولية — مُصمَّم للاقتصاد الأخضر."
                  : "ILO-certified Start & Improve Your Business training — redesigned for the green economy."}
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-20">
        <Container>
          <div className="text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-6">
              {isAr ? "هل أنت مستعد؟" : "Ready to start?"}
            </h2>
            <Link
              href={`/${locale}/get-involved/join-us?role=entrepreneur`}
              className="inline-flex items-center gap-2 bg-brand-blue text-white font-semibold px-8 py-4 rounded-xl hover:bg-brand-blue/90 transition-colors shadow-md hover:shadow-lg"
            >
              {isAr ? "ابدأ رحلتك ←" : "Start Your Journey →"}
            </Link>
          </div>
        </Container>
      </section>
    </>
  );
}
