"use client";

import React from "react";
import { useLocale } from "next-intl";
import { WifiOff, Minimize, Globe, Eye } from "lucide-react";
import { AnimatedSection } from "@/components/shared/AnimatedSection";
import { Container } from "@/components/ui/Container";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { capabilities } from "./zowadaData";

// Note: 'Languages' and 'Accessibility' are not available in this version of lucide-react.
// Globe is used as a fallback for 'languages', Eye for 'accessibility'.
const iconMap: Record<string, React.ElementType> = {
  "wifi-off": WifiOff,
  minimize: Minimize,
  languages: Globe,
  accessibility: Eye,
};

export function ZowadaConditions() {
  const locale = useLocale();
  const isAr = locale === "ar";

  return (
    <section className="py-20 bg-white">
      <Container>
        <SectionHeader
          title={
            isAr
              ? "مبني للبنان. جاهز لأفريقيا."
              : "Built for Lebanon. Ready for Africa."
          }
          align="center"
        />

        <AnimatedSection>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {capabilities.map((cap, index) => {
              const IconComponent = iconMap[cap.icon] ?? Globe;

              return (
                <div
                  key={cap.id}
                  className="text-center p-6 bg-brand-blue/5 rounded-xl"
                >
                  <IconComponent className="w-8 h-8 text-brand-blue mx-auto mb-3" />
                  <h3 className="font-semibold text-text-primary mb-2">
                    {isAr ? cap.titleAr : cap.titleEn}
                  </h3>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    {isAr ? cap.descriptionAr : cap.descriptionEn}
                  </p>
                </div>
              );
            })}
          </div>
        </AnimatedSection>
      </Container>
    </section>
  );
}
