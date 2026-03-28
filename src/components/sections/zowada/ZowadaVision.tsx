"use client";

import { useLocale } from "next-intl";
import { AnimatedSection } from "@/components/shared/AnimatedSection";
import { Container } from "@/components/ui/Container";

const visionItems = [
  {
    headlineEn: "Expand to all 10 operating countries",
    headlineAr: "التوسع إلى جميع الدول العشر",
    descriptionEn:
      "Bringing Zowada to every LEE hub across MENA and Africa",
    descriptionAr: "إيصال زوادة إلى كل مركز LEE في منطقة الشرق الأوسط وأفريقيا",
  },
  {
    headlineEn: "AI-driven market insights",
    headlineAr: "رؤى السوق المدعومة بالذكاء الاصطناعي",
    descriptionEn:
      "Smart recommendations for products, courses, and connections",
    descriptionAr: "توصيات ذكية للمنتجات والدورات التدريبية والروابط",
  },
  {
    headlineEn: "Zowada Green Fund",
    headlineAr: "صندوق زوادة الأخضر",
    descriptionEn:
      "A dedicated fund for climate-focused startups on the platform",
    descriptionAr: "صندوق مخصص للشركات الناشئة المعنية بالمناخ على المنصة",
  },
];

export function ZowadaVision() {
  const locale = useLocale();
  const isAr = locale === "ar";

  return (
    <section className="bg-brand-blue text-white py-16">
      <Container>
        <AnimatedSection>
          <h2 className="text-3xl font-bold mb-8 text-center">
            {isAr ? "رؤية 2025+" : "Vision 2025+"}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {visionItems.map((item, index) => (
              <div key={index} className="text-center">
                <p className="font-bold text-lg mb-2">
                  {isAr ? item.headlineAr : item.headlineEn}
                </p>
                <p className="text-white/75 text-sm leading-relaxed">
                  {isAr ? item.descriptionAr : item.descriptionEn}
                </p>
              </div>
            ))}
          </div>
        </AnimatedSection>
      </Container>
    </section>
  );
}
