"use client";

import React from "react";
import { useLocale } from "next-intl";
import { Building, Briefcase, BarChart } from "lucide-react";
import { AnimatedSection } from "@/components/shared/AnimatedSection";
import { Container } from "@/components/ui/Container";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { partnerPathways } from "./zowadaData";

const iconMap: Record<string, React.ElementType> = {
  building: Building,
  briefcase: Briefcase,
  "bar-chart": BarChart,
};

export function ZowadaPartners() {
  const locale = useLocale();
  const isAr = locale === "ar";

  return (
    <section className="py-20 bg-surface-primary">
      <Container>
        <SectionHeader
          title={isAr ? "شارك مع زوادة" : "Partner with Zowada"}
          align="center"
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {partnerPathways.map((pathway, index) => {
            const IconComponent = iconMap[pathway.icon] ?? Building;

            return (
              <AnimatedSection key={pathway.id} delay={index * 0.1}>
                <div className="bg-white rounded-lg p-8 shadow-md text-center hover:shadow-lg transition h-full flex flex-col">
                  <IconComponent className="w-12 h-12 text-brand-blue mx-auto mb-4" />

                  <p className="text-xs uppercase tracking-wide text-brand-blue font-semibold mb-2">
                    {isAr ? pathway.audienceAr : pathway.audienceEn}
                  </p>

                  <h3 className="font-bold text-xl mb-3 text-text-primary">
                    {isAr ? pathway.titleAr : pathway.titleEn}
                  </h3>

                  <p className="text-text-secondary mb-6 flex-1 leading-relaxed">
                    {isAr ? pathway.descriptionAr : pathway.descriptionEn}
                  </p>

                  <a
                    href="/get-involved/partner"
                    className="inline-block bg-brand-blue text-white px-6 py-2 rounded-lg hover:bg-brand-blue/90 transition"
                  >
                    {isAr ? "لنتحدث" : "Let's Talk"}
                  </a>
                </div>
              </AnimatedSection>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
