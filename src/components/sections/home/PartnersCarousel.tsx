"use client";

import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/Container";
import { SectionHeader } from "@/components/ui/SectionHeader";
import Image from "next/image";

const demoPartners = [
  { id: "ilo", name: "ILO", logoUrl: "https://placehold.co/200x80/f8f9fa/9ca3af?text=ILO" },
  { id: "eu", name: "European Union", logoUrl: "https://placehold.co/200x80/f8f9fa/9ca3af?text=EU" },
  { id: "unifil", name: "UNIFIL", logoUrl: "https://placehold.co/200x80/f8f9fa/9ca3af?text=UNIFIL" },
  { id: "wfp", name: "World Food Programme", logoUrl: "https://placehold.co/200x80/f8f9fa/9ca3af?text=WFP" },
  { id: "undp", name: "UNDP", logoUrl: "https://placehold.co/200x80/f8f9fa/9ca3af?text=UNDP" },
  { id: "irc", name: "International Rescue Committee", logoUrl: "https://placehold.co/200x80/f8f9fa/9ca3af?text=IRC" },
  { id: "canada", name: "Government of Canada", logoUrl: "https://placehold.co/200x80/f8f9fa/9ca3af?text=Canada" },
  { id: "netherlands", name: "Government of Netherlands", logoUrl: "https://placehold.co/200x80/f8f9fa/9ca3af?text=Netherlands" },
  { id: "norway", name: "Government of Norway", logoUrl: "https://placehold.co/200x80/f8f9fa/9ca3af?text=Norway" },
  { id: "bmz", name: "BMZ Germany", logoUrl: "https://placehold.co/200x80/f8f9fa/9ca3af?text=BMZ" },
  { id: "usaid", name: "USAID", logoUrl: "https://placehold.co/200x80/f8f9fa/9ca3af?text=USAID" },
  { id: "cawtar", name: "CAWTAR", logoUrl: "https://placehold.co/200x80/f8f9fa/9ca3af?text=CAWTAR" },
  { id: "kvinna", name: "Kvinna till Kvinna", logoUrl: "https://placehold.co/200x80/f8f9fa/9ca3af?text=Kvinna" },
  { id: "solidarites", name: "Solidarités International", logoUrl: "https://placehold.co/200x80/f8f9fa/9ca3af?text=Solidarit%C3%A9s" },
  { id: "ri", name: "Relief International", logoUrl: "https://placehold.co/200x80/f8f9fa/9ca3af?text=Relief+Intl" },
  { id: "oxfam", name: "Oxfam", logoUrl: "https://placehold.co/200x80/f8f9fa/9ca3af?text=Oxfam" },
  { id: "aah", name: "Action Against Hunger", logoUrl: "https://placehold.co/200x80/f8f9fa/9ca3af?text=AAH" },
  { id: "berytech", name: "Berytech", logoUrl: "https://placehold.co/200x80/f8f9fa/9ca3af?text=Berytech" },
  { id: "worldbank", name: "World Bank", logoUrl: "https://placehold.co/200x80/f8f9fa/9ca3af?text=World+Bank" },
];

export function PartnersCarousel() {
  const t = useTranslations("home");

  return (
    <section className="py-20 bg-white">
      <Container>
        <SectionHeader
          title={t("partnersTitle")}
          subtitle={t("partnersSubtitle")}
        />
        <div className="relative overflow-hidden">
          <div className="flex animate-scroll gap-12 items-center">
            {[...demoPartners, ...demoPartners].map((partner, i) => (
              <div
                key={`${partner.id}-${i}`}
                className="flex-shrink-0 grayscale hover:grayscale-0 opacity-60 hover:opacity-100 transition-all duration-300"
              >
                <Image
                  src={partner.logoUrl}
                  alt={partner.name}
                  width={200}
                  height={48}
                  className="h-12 w-auto object-contain"
                />
              </div>
            ))}
          </div>
        </div>

        <style jsx>{`
          @keyframes scroll {
            from {
              transform: translateX(0);
            }
            to {
              transform: translateX(-50%);
            }
          }
          .animate-scroll {
            animation: scroll 30s linear infinite;
          }
          .animate-scroll:hover {
            animation-play-state: paused;
          }
        `}</style>
      </Container>
    </section>
  );
}
