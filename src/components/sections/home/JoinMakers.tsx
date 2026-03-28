"use client";

import { useLocale } from "next-intl";
import { Container } from "@/components/ui/Container";
import { SectionLabel } from "./SectionLabel";
import { ArrowLink } from "./ArrowLink";
import { AnimatedSection } from "@/components/shared/AnimatedSection";
import { slideInLeft, slideInRight } from "@/lib/animations";
import Image from "next/image";

export function JoinMakers() {
  const locale = useLocale();

  return (
    <section className="py-16 md:py-24 bg-surface-secondary">
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Image Side (Left) */}
          <AnimatedSection variants={slideInLeft}>
            <div className="overflow-hidden">
              <Image
                src="/images/mentoring-session.jpg"
                alt="Programs"
                width={800}
                height={384}
                className="w-full h-72 md:h-96 object-cover rounded-sm"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          </AnimatedSection>

          {/* Text Side (Right) */}
          <AnimatedSection variants={slideInRight} delay={0.15}>
            <div>
              <SectionLabel color="purple" className="mb-4 block">
                {locale === "ar" ? "برامجنا" : "Our Programs"}
              </SectionLabel>
              <h2 className="text-3xl md:text-4xl lg:text-[2.75rem] font-bold text-text-primary leading-tight mb-6">
                {locale === "ar"
                  ? "اكتشف برامجنا المجتمعية المؤثرة"
                  : "Discover Our Impactful Programs"}
              </h2>
              <p className="text-text-secondary leading-relaxed mb-8 text-base">
                {locale === "ar"
                  ? "من بناء القدرات إلى إطلاق مبادرات مجتمعية، استكشف برامجنا التي تحدث فرقاً حقيقياً في لبنان والمنطقة. نعمل مع المجتمعات المحلية لبناء مستقبل أفضل."
                  : "From capacity building to launching community initiatives, explore our programs that create real impact in Lebanon and the region. We work with local communities to build a better future."}
              </p>
              <ArrowLink href="/programs">
                {locale === "ar" ? "استكشف البرامج" : "Explore programs"}
              </ArrowLink>
            </div>
          </AnimatedSection>
        </div>
      </Container>
    </section>
  );
}
