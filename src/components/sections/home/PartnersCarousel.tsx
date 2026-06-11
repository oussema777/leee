"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Container } from "@/components/ui/Container";
import { SectionHeader } from "@/components/ui/SectionHeader";
import Image from "next/image";
import type { PartnerItem } from "@/lib/data/partners";

export function PartnersCarousel({ partners }: { partners: PartnerItem[] }) {
  const t = useTranslations("home");
  const locale = useLocale();
  const isAr = locale === "ar";
  const doubled = [...partners, ...partners];
  const [paused, setPaused] = useState(false);

  return (
    <section className="py-12 md:py-16 bg-surface-primary relative overflow-hidden">
      <Container>
        <SectionHeader
          title={t("partnersTitle")}
          subtitle={t("partnersSubtitle")}
        />
        <div className="relative">
          {/* Fade edges — narrower on mobile */}
          <div className="absolute inset-y-0 start-0 w-10 md:w-24 bg-gradient-to-r from-surface-primary to-transparent z-10 pointer-events-none" />
          <div className="absolute inset-y-0 end-0 w-10 md:w-24 bg-gradient-to-l from-surface-primary to-transparent z-10 pointer-events-none" />

          <div
            className="overflow-hidden"
            onTouchStart={() => setPaused(true)}
            onTouchEnd={() => setPaused(false)}
          >
            <div
              className="flex gap-6 items-center animate-scroll"
              style={paused ? { animationPlayState: "paused" } : undefined}
            >
              {doubled.map((partner, i) => (
                <div
                  key={`${partner.id}-${i}`}
                  className="flex-shrink-0 bg-white rounded-2xl border border-surface-tertiary/50 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 px-6 py-4 flex items-center justify-center"
                  style={{ minWidth: "160px", height: "80px" }}
                >
                  <Image
                    src={partner.logoUrl}
                    alt={isAr ? partner.nameAr : partner.nameEn}
                    width={200}
                    height={80}
                    className="h-12 w-auto object-contain max-w-[140px]"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <style jsx>{`
          @keyframes scroll {
            from { transform: translateX(0); }
            to { transform: translateX(-50%); }
          }
          .animate-scroll {
            animation: scroll 45s linear infinite;
          }
          .animate-scroll:hover {
            animation-play-state: paused;
          }
          @media (prefers-reduced-motion: reduce) {
            .animate-scroll {
              animation: none;
            }
          }
        `}</style>
      </Container>
    </section>
  );
}
