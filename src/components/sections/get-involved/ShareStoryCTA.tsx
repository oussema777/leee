"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import { Quote, ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { AnimatedSection } from "@/components/shared/AnimatedSection";

export function ShareStoryCTA() {
  const locale = useLocale();
  const isAr = locale === "ar";

  return (
    <section className="pb-16 md:pb-24">
      <Container>
        <AnimatedSection>
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0f2741] to-[#1B3A5C] px-8 py-12 md:px-14 md:py-14">
            <Quote className="absolute -top-4 -end-4 w-40 h-40 text-brand-blue/10 rotate-12" />
            <div className="relative flex flex-col md:flex-row md:items-center gap-8">
              <div className="flex-1">
                <p className="text-brand-blue font-semibold text-sm uppercase tracking-wider mb-2">
                  {isAr ? "لخريجي برامجنا" : "For our program alumni"}
                </p>
                <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">
                  {isAr ? "كنت جزءاً من برنامج LEEE؟ شارك قصتك." : "Were you part of a LEEE program? Share your story."}
                </h3>
                <p className="text-gray-300 leading-relaxed max-w-2xl">
                  {isAr
                    ? "أخبرنا كيف غيّر البرنامج حياتك — قد تلهم تجربتك الشخص التالي ليبدأ رحلته."
                    : "Tell us how the program changed things for you — your experience might inspire the next person to start their journey."}
                </p>
              </div>
              <Link
                href={`/${locale}/get-involved/share-your-story`}
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-brand-blue text-white font-semibold rounded-full hover:bg-brand-blue/90 transition-all hover:gap-3 shrink-0"
              >
                {isAr ? "شارك شهادتك" : "Share your testimonial"}
                <ArrowRight className="w-4 h-4 rtl:rotate-180" />
              </Link>
            </div>
          </div>
        </AnimatedSection>
      </Container>
    </section>
  );
}
