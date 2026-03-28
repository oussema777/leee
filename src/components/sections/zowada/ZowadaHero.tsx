"use client";

import { useLocale } from "next-intl";
import { AnimatedSection } from "@/components/shared/AnimatedSection";
import { Container } from "@/components/ui/Container";

export function ZowadaHero() {
  const locale = useLocale();
  const isAr = locale === "ar";

  return (
    <section className="bg-gradient-to-b from-black to-[#5895D0] text-white py-20 md:py-32">
      <Container>
        <div className="text-center">
          <AnimatedSection>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              {isAr
                ? "مشروعك الأخضر. في جيبك."
                : "Your green business. In your pocket."}
            </h1>
          </AnimatedSection>

          <AnimatedSection delay={0.1}>
            <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto mb-10">
              {isAr
                ? "زوادة ليست مجرد تطبيق. إنها سوقك وفصلك الدراسي وشبكة مرشديك وبوابة تمويلك — مصممة لرواد الأعمال في الأسواق ذات الإمكانات العالية."
                : "Zowada isn't just an app. It's your marketplace, classroom, mentor network, and funding portal—designed for entrepreneurs in low-connectivity, high-potential markets."}
            </p>
          </AnimatedSection>

          <AnimatedSection delay={0.2}>
            <div className="flex gap-4 justify-center flex-wrap">
              <a
                href="#"
                className="bg-white text-black px-6 py-3 rounded-lg font-semibold hover:bg-white/90 transition"
              >
                {isAr ? "متجر آبل" : "App Store"}
              </a>
              <a
                href="#"
                className="bg-white/20 text-white border border-white/30 px-6 py-3 rounded-lg font-semibold hover:bg-white/30 transition"
              >
                {isAr ? "جوجل بلاي" : "Google Play"}
              </a>
            </div>
          </AnimatedSection>

          <AnimatedSection delay={0.3}>
            {/* Phone mockup placeholder */}
            <div className="mx-auto mt-12 w-64 h-[500px] bg-white/10 rounded-[40px] border-2 border-white/20" />
          </AnimatedSection>

          <AnimatedSection delay={0.4}>
            <a
              href="#features"
              className="inline-block mt-6 text-white/70 hover:text-white transition text-sm"
            >
              {isAr ? "← شاهد كيف تعمل" : "See how it works →"}
            </a>
          </AnimatedSection>
        </div>
      </Container>
    </section>
  );
}
