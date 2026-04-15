"use client";

import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { SectionHeader } from "@/components/ui/SectionHeader";
import Image from "next/image";

const partners = [
  { id: "ilo", name: "ILO", logo: "/images/partners/ILO.png" },
  { id: "eu", name: "European Union", logo: "/images/partners/European Union.png" },
  { id: "undp", name: "UNDP", logo: "/images/partners/UNDP_logo.svg.png" },
  { id: "wfp", name: "World Food Programme", logo: "/images/partners/WFP.png" },
  { id: "usaid", name: "USAID", logo: "/images/partners/USAID.jpg" },
  { id: "worldbank", name: "World Bank", logo: "/images/partners/World Bank.jpg" },
  { id: "irc", name: "IRC", logo: "/images/partners/IRC.png" },
  { id: "unifil", name: "UNIFIL", logo: "/images/partners/UNIFIL.jpg" },
  { id: "canada", name: "Canada Embassy", logo: "/images/partners/Canada Embassy.png" },
  { id: "netherlands", name: "Netherlands Embassy", logo: "/images/partners/logo-netherlands-embassy.png" },
  { id: "norway", name: "Norway Embassy", logo: "/images/partners/Norway Embassy.png" },
  { id: "bmz", name: "BMZ Germany", logo: "/images/partners/BMZ Germany.jpg" },
  { id: "prospects", name: "PROSPECTS", logo: "/images/partners/PROSPECTS.png" },
  { id: "oxfam", name: "Oxfam", logo: "/images/partners/Oxfam.webp" },
  { id: "cawtar", name: "CAWTAR", logo: "/images/partners/CAWTAR.jpg" },
  { id: "kvinna", name: "Kvinna till Kvinna", logo: "/images/partners/Kvinna till Kvinna.jpg" },
  { id: "solidarites", name: "Solidarités International", logo: "/images/partners/Solidarités Int..jpg" },
  { id: "relief", name: "Relief International", logo: "/images/partners/Relief Int..jpg" },
  { id: "aah", name: "Action Against Hunger", logo: "/images/partners/Action Against Hunger.png" },
  { id: "whh", name: "WHH", logo: "/images/partners/WHH.png" },
  { id: "lutheran", name: "Lutheran World Relief", logo: "/images/partners/Lutheran WR.webp" },
  { id: "intalert", name: "International Alert", logo: "/images/partners/Int. Alert.png" },
];

export function PartnersCarousel() {
  const t = useTranslations("home");
  const doubled = [...partners, ...partners];

  return (
    <section className="py-20 bg-surface-primary relative overflow-hidden">
      {/* Background shapes matching page style */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute -top-16 -end-20 w-72 h-72 rounded-full bg-brand-blue/[0.03] blur-3xl"
          style={{ animation: "morph-blob 18s ease-in-out infinite" }}
        />
        <div
          className="absolute -bottom-20 -start-20 w-64 h-64 rounded-full bg-brand-gold/[0.03] blur-3xl"
          style={{ animation: "morph-blob 22s ease-in-out infinite reverse" }}
        />
      </div>

      <Container>
        <SectionHeader
          title={t("partnersTitle")}
          subtitle={t("partnersSubtitle")}
        />
        <div className="relative">
          {/* Fade edges */}
          <div className="absolute inset-y-0 start-0 w-24 bg-gradient-to-r from-surface-primary to-transparent z-10 pointer-events-none" />
          <div className="absolute inset-y-0 end-0 w-24 bg-gradient-to-l from-surface-primary to-transparent z-10 pointer-events-none" />

          <div className="overflow-hidden">
            <div className="flex gap-6 items-center animate-scroll">
              {doubled.map((partner, i) => (
                <div
                  key={`${partner.id}-${i}`}
                  className="flex-shrink-0 bg-white rounded-2xl border border-surface-tertiary/50 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 px-6 py-4 flex items-center justify-center"
                  style={{ minWidth: "160px", height: "80px" }}
                >
                  <Image
                    src={partner.logo}
                    alt={partner.name}
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
        `}</style>
      </Container>
    </section>
  );
}
