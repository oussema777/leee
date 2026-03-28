"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import { Lightbulb, Handshake, Brain, Megaphone, ArrowRight } from "lucide-react";
import { pathways } from "./getInvolvedData";
import { Container } from "@/components/ui/Container";
import { AnimatedSection } from "@/components/shared/AnimatedSection";

const iconMap: Record<string, React.ElementType> = {
  lightbulb: Lightbulb,
  handshake: Handshake,
  brain: Brain,
  megaphone: Megaphone,
};

export function GetInvolvedHub() {
  const locale = useLocale();
  const isAr = locale === "ar";

  return (
    <section className="py-16 md:py-24">
      <Container>
        {/* Section intro */}
        <AnimatedSection className="text-center mb-14">
          <p className="text-text-secondary text-lg max-w-2xl mx-auto leading-relaxed">
            {isAr
              ? "سواء كنت رائد أعمال أو شريكاً أو خبيراً أو مناصراً — هناك دور ينتظرك هنا."
              : "Whether you're an entrepreneur, a partner, an expert, or an advocate — there is a role waiting for you here."}
          </p>
        </AnimatedSection>

        {/* 2x2 card grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          {pathways.map((pathway, index) => {
            const Icon = iconMap[pathway.icon] ?? Lightbulb;
            const title = isAr ? pathway.titleAr : pathway.titleEn;
            const prompt = isAr ? pathway.promptAr : pathway.promptEn;
            const description = isAr ? pathway.descriptionAr : pathway.descriptionEn;

            return (
              <AnimatedSection key={pathway.id} delay={index * 0.1}>
                <Link
                  href={`/${locale}${pathway.href}`}
                  className="group flex flex-col h-full bg-white border border-gray-100 rounded-2xl p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                >
                  {/* Icon circle */}
                  <div className="flex items-center justify-center w-16 h-16 rounded-full bg-brand-blue/10 mb-6 group-hover:bg-brand-blue/20 transition-colors">
                    <Icon className="w-8 h-8 text-brand-blue" />
                  </div>

                  {/* Prompt (italic) */}
                  <p className="text-sm italic text-text-secondary mb-2">
                    &ldquo;{prompt}&rdquo;
                  </p>

                  {/* Title */}
                  <h3 className="text-xl font-bold text-text-primary mb-3 group-hover:text-brand-blue transition-colors">
                    {title}
                  </h3>

                  {/* Description */}
                  <p className="text-text-secondary leading-relaxed flex-1 mb-6">
                    {description}
                  </p>

                  {/* Arrow link */}
                  <span className="inline-flex items-center gap-2 text-brand-blue font-semibold text-sm group-hover:gap-3 transition-all">
                    {isAr ? "اكتشف المسار" : "Explore pathway"}
                    <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                  </span>
                </Link>
              </AnimatedSection>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
