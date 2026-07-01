import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { buildPageMetadata } from "@/lib/metadata";
import { PageHeader } from "@/components/layout/PageHeader";
import { Container } from "@/components/ui/Container";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return buildPageMetadata({
    title: locale === "ar"
      ? "للخبراء والمرشدين — تجربة LEE"
      : "For Experts & Mentors — The LEE Experience",
    description: locale === "ar"
      ? "انضم إلى فريق المدربين والمرشدين. شارك مهاراتك وغيّر مساراً."
      : "Join our pool of trainers, coaches, and mentors. Share your skills and change a life.",
    path: "get-involved/expert",
    locale,
  });
}

export default async function ExpertPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isAr = locale === "ar";
  const tNav = await getTranslations({ locale, namespace: "nav" });

  const roles = [
    {
      icon: "🎓",
      titleEn: "Trainer",
      titleAr: "مدرّب",
      descriptionEn:
        "Deliver workshops and training sessions for entrepreneurs across MENA and Africa. Use our proven curricula or bring your own.",
      descriptionAr:
        "قدّم ورش عمل وجلسات تدريبية لرواد الأعمال في الشرق الأوسط وأفريقيا. استخدم مناهجنا المجربة أو أحضر منهجك الخاص.",
    },
    {
      icon: "🧭",
      titleEn: "Coach",
      titleAr: "مدرّب تنفيذي",
      descriptionEn:
        "Work 1-on-1 with founders to navigate pivotal moments in their business journey. Flexible commitment, maximum impact.",
      descriptionAr:
        "اعمل فردياً مع المؤسسين للتنقل في اللحظات المحورية في رحلة أعمالهم. التزام مرن وأثر أقصى.",
    },
    {
      icon: "💡",
      titleEn: "Mentor",
      titleAr: "مرشد",
      descriptionEn:
        "Share sector expertise, life experience, and professional networks with emerging green entrepreneurs.",
      descriptionAr:
        "شارك خبرتك القطاعية وتجربتك الحياتية وشبكاتك المهنية مع رواد الأعمال الخضر الناشئين.",
    },
  ];

  return (
    <>
      <PageHeader
        title={isAr ? "مهاراتك يمكنها تغيير حياة." : "Your skills can change a life."}
        subtitle={
          isAr
            ? "لا تحتاج إلى الكثير من الوقت — فقط الخبرة الصحيحة والاستعداد للمشاركة."
            : "You don't need a lot of time — just the right expertise and the willingness to share."
        }
        breadcrumbs={[
          { label: tNav("home"), href: "/" },
          { label: tNav("getInvolved"), href: "/get-involved" },
          { label: isAr ? "للخبراء والمرشدين" : "For Experts & Mentors" },
        ]}
      />

      {/* Roles section */}
      <section className="py-16 md:py-24">
        <Container>
          <div className="text-center mb-14">
            <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-4">
              {isAr ? "انضم إلى فريقنا بأي دور يناسبك" : "Join Our Expert Pool in Any Role"}
            </h2>
            <p className="text-text-secondary max-w-xl mx-auto leading-relaxed">
              {isAr
                ? "نبحث دائماً عن محترفين شغوفين بدعم ريادة الأعمال الخضراء وقيادة المرأة."
                : "We are always looking for passionate professionals who believe in green entrepreneurship and women's leadership."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {roles.map((role) => (
              <div
                key={role.titleEn}
                className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow text-center"
              >
                <div className="text-4xl mb-5">{role.icon}</div>
                <h3 className="text-xl font-bold text-text-primary mb-3">
                  {isAr ? role.titleAr : role.titleEn}
                </h3>
                <p className="text-text-secondary leading-relaxed">
                  {isAr ? role.descriptionAr : role.descriptionEn}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Zowada Time Banking */}
      <section className="py-16 bg-surface-secondary">
        <Container size="md">
          <div className="bg-white rounded-2xl border border-brand-blue/20 p-10 shadow-sm">
            <div className="flex flex-col md:flex-row gap-8 items-center">
              <div className="text-5xl">⏱️</div>
              <div>
                <h3 className="text-xl font-bold text-text-primary mb-3">
                  {isAr ? "بنك الوقت عبر زوادة" : "Time Banking Through Zowada"}
                </h3>
                <p className="text-text-secondary leading-relaxed mb-4">
                  {isAr
                    ? "منصة زوادة الرقمية تتيح لك تقديم خدماتك بنظام بنك الوقت — اربح ساعات مقابل ما تشاركه، وأنفقها على التعلم أو الخدمات التي تحتاجها."
                    : "The Zowada digital platform lets you offer your services through Time Banking — earn hours for what you give, spend them on learning or services you need."}
                </p>
                <p className="text-sm italic text-brand-blue">
                  {isAr
                    ? "المهارات الخضراء، ريادة الأعمال، القانون، التسويق، التكنولوجيا — كل التخصصات مرحب بها."
                    : "Green skills, entrepreneurship, law, marketing, technology — all specialties welcome."}
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* What we offer experts */}
      <section className="py-16 md:py-20">
        <Container>
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-4">
              {isAr ? "ما الذي تحصل عليه؟" : "What You Get in Return"}
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {[
              {
                icon: "🌍",
                titleEn: "Regional network",
                titleAr: "شبكة إقليمية",
              },
              {
                icon: "📜",
                titleEn: "LEE certification",
                titleAr: "شهادة LEE",
              },
              {
                icon: "⏳",
                titleEn: "Time Banking credits",
                titleAr: "أرصدة بنك الوقت",
              },
              {
                icon: "🎤",
                titleEn: "Speaking opportunities",
                titleAr: "فرص التحدث العلني",
              },
            ].map((item) => (
              <div
                key={item.titleEn}
                className="bg-surface-secondary rounded-xl p-6 text-center"
              >
                <div className="text-3xl mb-3">{item.icon}</div>
                <p className="font-semibold text-text-primary">
                  {isAr ? item.titleAr : item.titleEn}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* CTA */}
      <section className="py-12 bg-brand-blue">
        <Container>
          <div className="text-center text-white">
            <h2 className="text-2xl md:text-3xl font-bold mb-6">
              {isAr ? "مستعد للمشاركة؟" : "Ready to contribute?"}
            </h2>
            <Link
              href={`/${locale}/get-involved/expert/apply`}
              className="inline-flex items-center gap-2 bg-white text-brand-blue font-semibold px-8 py-4 rounded-xl hover:bg-gray-50 transition-colors shadow-md hover:shadow-lg"
            >
              {isAr
                ? "قدّم للانضمام لمجموعة خبرائنا ←"
                : "Apply to Join Our Expert Pool →"}
            </Link>
          </div>
        </Container>
      </section>
    </>
  );
}
