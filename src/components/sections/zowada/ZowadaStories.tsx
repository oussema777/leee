"use client";

import { useLocale } from "next-intl";
import { AnimatedSection } from "@/components/shared/AnimatedSection";
import { Container } from "@/components/ui/Container";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { zowadaStories } from "./zowadaData";

export function ZowadaStories() {
  const locale = useLocale();
  const isAr = locale === "ar";

  return (
    <section className="py-20 bg-gray-50">
      <Container>
        <SectionHeader
          title={isAr ? "نجاح على زوادة" : "Success on Zowada"}
          align="center"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {zowadaStories.map((story, index) => (
            <AnimatedSection key={story.id} delay={index * 0.15}>
              <div className="bg-white rounded-lg overflow-hidden shadow-md">
                {/* Image placeholder */}
                <div className="aspect-video bg-gray-200" />

                <div className="p-6">
                  <div className="mb-2">
                    <span className="font-bold text-text-primary">
                      {isAr ? story.nameAr : story.nameEn}
                    </span>
                    <span className="mx-2 text-text-secondary">·</span>
                    <span className="text-sm text-text-secondary">
                      {isAr ? story.locationAr : story.locationEn}
                    </span>
                  </div>

                  <p className="italic text-text-secondary mt-2 leading-relaxed">
                    &ldquo;{isAr ? story.quoteAr : story.quoteEn}&rdquo;
                  </p>
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </Container>
    </section>
  );
}
