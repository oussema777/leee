"use client";

import React from "react";
import { useLocale } from "next-intl";
import { ShoppingCart, BookOpen, Users, Lightbulb } from "lucide-react";
import { AnimatedSection } from "@/components/shared/AnimatedSection";
import { Container } from "@/components/ui/Container";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { features } from "./zowadaData";

const iconMap: Record<string, React.ElementType> = {
  "shopping-cart": ShoppingCart,
  "book-open": BookOpen,
  users: Users,
  lightbulb: Lightbulb,
};

export function ZowadaFeatures() {
  const locale = useLocale();
  const isAr = locale === "ar";

  return (
    <section id="features" className="py-20 bg-gray-50">
      <Container>
        <SectionHeader
          title={isAr ? "ميزات تناسب واقعك" : "Features That Fit Your Reality"}
          align="center"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => {
            const IconComponent = iconMap[feature.icon] ?? ShoppingCart;

            return (
              <AnimatedSection key={feature.id} delay={index * 0.1}>
                <div className="bg-white rounded-lg p-6 shadow-md border-l-4 border-brand-blue hover:shadow-lg transition h-full">
                  <IconComponent className="w-10 h-10 text-brand-blue mb-4" />
                  <h3 className="font-bold text-lg mb-2 text-text-primary">
                    {isAr ? feature.titleAr : feature.titleEn}
                  </h3>
                  <p className="text-text-secondary text-sm leading-relaxed">
                    {isAr ? feature.descriptionAr : feature.descriptionEn}
                  </p>
                </div>
              </AnimatedSection>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
