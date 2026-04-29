"use client";

import { useTranslations, useLocale } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { AnimatedSection } from "@/components/shared/AnimatedSection";
import { Link } from "@/i18n/navigation";
import Image from "next/image";

export function AboutPreview() {
  const t = useTranslations("home");
  const locale = useLocale();

  return (
    <section className="py-20 bg-surface-primary">
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <AnimatedSection>
            <div className="relative">
              <Image
                src="/images/outdoor-certificate-ceremony.jpg"
                alt="About LEE Experience"
                width={800}
                height={600}
                className="shadow-xl w-full"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              <div className="absolute -bottom-6 -end-6 w-32 h-32 bg-brand-blue -z-10" />
            </div>
          </AnimatedSection>

          <AnimatedSection delay={0.2}>
            <div>
              <span className="text-brand-blue font-semibold text-sm uppercase tracking-wider">
                {t("aboutTitle")}
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-text-primary mt-2 mb-6">
                {locale === "ar"
                  ? "الفرق الذي تصنعه LEE"
                  : "The LEE Difference"}
              </h2>
              <p className="text-text-secondary leading-relaxed mb-4">
                {locale === "ar"
                  ? "نحن جسر لا صومعة — نربط بين الحكومات والقطاع الخاص والمجتمع المدني في أسواق ما بعد النزاع لبناء أعمال خضراء مرنة."
                  : "Bridge, not silo — we connect government, private sector, and civil society in post-conflict markets to build resilient, green businesses."}
              </p>
              <p className="text-text-secondary leading-relaxed mb-4">
                {locale === "ar"
                  ? "بقيادة نسائية: 62% من المستفيدين و55% من فريق القيادة من النساء."
                  : "Women-led: 62% of beneficiaries and 55% of leadership are women."}
              </p>
              <p className="text-text-secondary leading-relaxed mb-8">
                {locale === "ar"
                  ? "أخضر بالتصميم: كل برنامج يدمج الاستدامة البيئية، وليس كإضافة بل كأساس."
                  : "Green by design: every program integrates environmental sustainability — not as an add-on, but as a foundation."}
              </p>
              <Link href="/about">
                <Button>{t("aboutTitle")} &rarr;</Button>
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </Container>
    </section>
  );
}
