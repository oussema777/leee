"use client";

import { useTranslations, useLocale } from "next-intl";
import { Container } from "@/components/ui/Container";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { AnimatedSection } from "@/components/shared/AnimatedSection";
import { Link } from "@/i18n/navigation";
import { HandHeart, UserPlus, Wrench, CircleDollarSign } from "lucide-react";

const ctaItems = [
  { icon: <HandHeart className="w-8 h-8" />, labelKey: "volunteer", href: "/get-involved/join-us" },
  { icon: <UserPlus className="w-8 h-8" />, labelKey: "expertPool", href: "/get-involved/join-us" },
  { icon: <Wrench className="w-8 h-8" />, labelKey: "requestServiceCta", href: "/get-involved/request-service" },
  { icon: <CircleDollarSign className="w-8 h-8" />, labelKey: "crowdfundingCta", href: "/get-involved/crowdfunding" },
];

export function BusinessCTA() {
  const t = useTranslations("home");

  return (
    <section className="py-20 bg-surface-primary">
      <Container>
        <SectionHeader title={t("businessTitle")} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {ctaItems.map((item, i) => (
            <AnimatedSection key={item.labelKey} delay={i * 0.1}>
              <Link href={item.href}>
                <div className="group bg-surface-secondary p-8 text-center hover:bg-brand-blue transition-all duration-300 hover:shadow-lg">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-blue/10 text-brand-blue mb-4 group-hover:bg-white/20 group-hover:text-white transition-colors">
                    {item.icon}
                  </div>
                  <h3 className="font-semibold text-text-primary group-hover:text-white transition-colors">
                    {t(item.labelKey)}
                  </h3>
                </div>
              </Link>
            </AnimatedSection>
          ))}
        </div>
      </Container>
    </section>
  );
}
