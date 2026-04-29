import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { Container } from "@/components/ui/Container";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return {
    title:
      locale === "ar"
        ? "للمناصرين — تجربة LEE"
        : "For Advocates — The LEE Experience",
    description:
      locale === "ar"
        ? "ضخّم قصص نجاحنا وادعم الابتكار الأخضر بقيادة النساء في شبكتك."
        : "Amplify our success stories and champion women-led green innovation in your network.",
  };
}

export default async function AdvocatePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isAr = locale === "ar";
  const tNav = await getTranslations({ locale, namespace: "nav" });

  const advocacyItems = [
    {
      icon: "📢",
      titleEn: "Share Our Stories",
      titleAr: "شارك قصصنا",
      descriptionEn:
        "Download our media kit and amplify the voices of women-led green entrepreneurs across MENA and Africa. Share on your platforms, in your newsletters, and with your networks.",
      descriptionAr:
        "نزّل مجموعة وسائط الإعلام الخاصة بنا وضخّم أصوات رواد الأعمال الخضر بقيادة النساء عبر الشرق الأوسط وأفريقيا. شارك على منصاتك وفي نشراتك الإخبارية وشبكاتك.",
      actionLabelEn: "Download Media Kit",
      actionLabelAr: "تنزيل مجموعة وسائط الإعلام",
      href: "#",
    },
    {
      icon: "🎬",
      titleEn: "Host a Screening",
      titleAr: "نظّم عرضاً",
      descriptionEn:
        "Organize a community screening of our impact stories in your city, campus, or workplace. Spark conversations about green entrepreneurship, climate action, and women's economic empowerment.",
      descriptionAr:
        "نظّم عرضاً مجتمعياً لقصص أثرنا في مدينتك أو حرمك الجامعي أو مكان عملك. أشعل محادثات حول ريادة الأعمال الخضراء والعمل المناخي وتمكين المرأة اقتصادياً.",
      actionLabelEn: "Request Screening Materials",
      actionLabelAr: "طلب مواد العرض",
      href: "#",
    },
    {
      icon: "🌿",
      titleEn: "Champion Women-Led Green Innovation",
      titleAr: "ادعم الابتكار الأخضر بقيادة النساء",
      descriptionEn:
        "Use your platform, influence, and voice to advocate for policies and investments that support women-led green enterprises in crisis-affected and emerging markets.",
      descriptionAr:
        "استخدم منصتك وتأثيرك وصوتك للدفاع عن السياسات والاستثمارات التي تدعم المؤسسات الخضراء التي تقودها النساء في الأسواق المتأثرة بالأزمات والناشئة.",
      actionLabelEn: "Get Advocacy Toolkit",
      actionLabelAr: "احصل على أدوات المناصرة",
      href: "#",
    },
  ];

  return (
    <>
      <PageHeader
        title={isAr ? "ضخّم ما ينجح." : "Amplify what works."}
        subtitle={
          isAr
            ? "الكلمة الصحيحة في المكان الصحيح تُحدث تحولاً. انضم إلى مجتمع المناصرين."
            : "The right word in the right place creates change. Join our community of advocates."
        }
        breadcrumbs={[
          { label: tNav("home"), href: "/" },
          { label: tNav("getInvolved"), href: "/get-involved" },
          { label: isAr ? "للمناصرين" : "For Advocates" },
        ]}
      />

      {/* Intro */}
      <section className="py-16 md:py-20">
        <Container size="md">
          <div className="text-center mb-14">
            <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-4">
              {isAr ? "كيف يمكنك المناصرة؟" : "How Can You Advocate?"}
            </h2>
            <p className="text-text-secondary max-w-2xl mx-auto leading-relaxed">
              {isAr
                ? "لا يتطلب التغيير دائماً وقتاً أو أموالاً. أحياناً يتطلب فقط صوتاً جريئاً وشبكة مستعدة للاستماع."
                : "Change doesn't always require time or money. Sometimes it just takes a bold voice and a network ready to listen."}
            </p>
          </div>

          {/* Advocacy Items */}
          <div className="space-y-8">
            {advocacyItems.map((item, index) => (
              <div
                key={index}
                className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col sm:flex-row gap-6 items-start">
                  {/* Icon */}
                  <div className="flex-shrink-0 w-14 h-14 rounded-full bg-brand-blue/10 flex items-center justify-center text-2xl">
                    {item.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-text-primary mb-3">
                      {isAr ? item.titleAr : item.titleEn}
                    </h3>
                    <p className="text-text-secondary leading-relaxed mb-4">
                      {isAr ? item.descriptionAr : item.descriptionEn}
                    </p>
                    <Link
                      href={item.href}
                      className="inline-flex items-center gap-2 text-brand-blue font-semibold text-sm hover:underline"
                    >
                      {isAr ? item.actionLabelAr : item.actionLabelEn}{" "}
                      <span className={isAr ? "rotate-180 inline-block" : ""}>→</span>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Why it matters */}
      <section className="py-16 bg-surface-secondary">
        <Container size="md">
          <div className="text-center">
            <blockquote className="text-2xl md:text-3xl font-bold text-text-primary italic leading-relaxed mb-6">
              {isAr
                ? '"كل قصة تُروى تُلهم امرأة أخرى بأن تبني."'
                : '"Every story told inspires another woman to build."'}
            </blockquote>
            <p className="text-text-secondary">
              {isAr ? "— فريق تجربة LEE" : "— The LEE Experience Team"}
            </p>
          </div>
        </Container>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-20">
        <Container>
          <div className="text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-6">
              {isAr ? "جاهز للانطلاق؟" : "Ready to amplify?"}
            </h2>
            <Link
              href="#"
              className="inline-flex items-center gap-2 bg-brand-blue text-white font-semibold px-8 py-4 rounded-xl hover:bg-brand-blue/90 transition-colors shadow-md hover:shadow-lg"
            >
              {isAr ? "احصل على أدوات المناصرة ←" : "Get Advocacy Tools →"}
            </Link>
          </div>
        </Container>
      </section>
    </>
  );
}
