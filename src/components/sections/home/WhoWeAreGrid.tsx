"use client";

import { useLocale } from "next-intl";
import { Container } from "@/components/ui/Container";
import { SectionLabel } from "./SectionLabel";
import { cn } from "@/lib/utils";
import { Building2, Lightbulb, Users, MapPin } from "lucide-react";
import { useInView } from "@/hooks/useInView";

const quadrants = {
  en: [
    {
      icon: Building2,
      title: "Who We Are",
      description:
        "A dual-structure ecosystem \u2014 a non-profit foundation and a for-profit incubator \u2014 united by a single mission to drive sustainable community impact across MENA & Africa.",
      color: "bg-brand-blue",
    },
    {
      icon: Lightbulb,
      title: "What We Do",
      description:
        "We incubate startups, deliver technical assistance and capacity building, run academies, provide business clinics, and lead humanitarian aid programs \u2014 turning ideas into lasting change.",
      color: "bg-emerald-500",
    },
    {
      icon: Users,
      title: "Who We Serve",
      description:
        "Women entrepreneurs, youth, MSMEs, cooperatives, NGOs, and vulnerable communities in post-conflict and developing regions seeking economic empowerment and decent work.",
      color: "bg-brand-gold",
    },
    {
      icon: MapPin,
      title: "Where We Work",
      description:
        "Active across 10 countries including Lebanon, Egypt, Jordan, Iraq, Tunisia, and expanding across the MENA region and Africa.",
      color: "bg-rose-500",
    },
  ],
  ar: [
    {
      icon: Building2,
      title: "\u0645\u0646 \u0646\u062d\u0646",
      description:
        "\u0645\u0646\u0638\u0648\u0645\u0629 \u0645\u0632\u062f\u0648\u062c\u0629 \u2014 \u0645\u0624\u0633\u0633\u0629 \u063a\u064a\u0631 \u0631\u0628\u062d\u064a\u0629 \u0648\u062d\u0627\u0636\u0646\u0629 \u0623\u0639\u0645\u0627\u0644 \u0631\u0628\u062d\u064a\u0629 \u2014 \u0645\u062a\u062d\u062f\u062a\u0627\u0646 \u0628\u0631\u0633\u0627\u0644\u0629 \u0648\u0627\u062d\u062f\u0629 \u0644\u062f\u0641\u0639 \u0627\u0644\u062a\u0623\u062b\u064a\u0631 \u0627\u0644\u0645\u062c\u062a\u0645\u0639\u064a \u0627\u0644\u0645\u0633\u062a\u062f\u0627\u0645 \u0639\u0628\u0631 \u0645\u0646\u0637\u0642\u0629 \u0627\u0644\u0634\u0631\u0642 \u0627\u0644\u0623\u0648\u0633\u0637 \u0648\u0634\u0645\u0627\u0644 \u0623\u0641\u0631\u064a\u0642\u064a\u0627.",
      color: "bg-brand-blue",
    },
    {
      icon: Lightbulb,
      title: "\u0645\u0627\u0630\u0627 \u0646\u0641\u0639\u0644",
      description:
        "\u0646\u062d\u062a\u0636\u0646 \u0627\u0644\u0634\u0631\u0643\u0627\u062a \u0627\u0644\u0646\u0627\u0634\u0626\u0629\u060c \u0648\u0646\u0642\u062f\u0645 \u0627\u0644\u0645\u0633\u0627\u0639\u062f\u0629 \u0627\u0644\u062a\u0642\u0646\u064a\u0629 \u0648\u0628\u0646\u0627\u0621 \u0627\u0644\u0642\u062f\u0631\u0627\u062a\u060c \u0648\u0646\u062f\u064a\u0631 \u0627\u0644\u0623\u0643\u0627\u062f\u064a\u0645\u064a\u0627\u062a\u060c \u0648\u0646\u0648\u0641\u0631 \u0639\u064a\u0627\u062f\u0627\u062a \u0627\u0644\u0623\u0639\u0645\u0627\u0644\u060c \u0648\u0646\u0642\u0648\u062f \u0628\u0631\u0627\u0645\u062c \u0627\u0644\u0645\u0633\u0627\u0639\u062f\u0627\u062a \u0627\u0644\u0625\u0646\u0633\u0627\u0646\u064a\u0629.",
      color: "bg-emerald-500",
    },
    {
      icon: Users,
      title: "\u0645\u0646 \u0646\u062e\u062f\u0645",
      description:
        "\u0631\u0627\u0626\u062f\u0627\u062a \u0627\u0644\u0623\u0639\u0645\u0627\u0644\u060c \u0627\u0644\u0634\u0628\u0627\u0628\u060c \u0627\u0644\u0645\u0634\u0627\u0631\u064a\u0639 \u0627\u0644\u0635\u063a\u064a\u0631\u0629 \u0648\u0627\u0644\u0645\u062a\u0648\u0633\u0637\u0629\u060c \u0627\u0644\u062a\u0639\u0627\u0648\u0646\u064a\u0627\u062a\u060c \u0627\u0644\u0645\u0646\u0638\u0645\u0627\u062a \u063a\u064a\u0631 \u0627\u0644\u062d\u0643\u0648\u0645\u064a\u0629\u060c \u0648\u0627\u0644\u0645\u062c\u062a\u0645\u0639\u0627\u062a \u0627\u0644\u0636\u0639\u064a\u0641\u0629 \u0627\u0644\u0633\u0627\u0639\u064a\u0629 \u0644\u0644\u062a\u0645\u0643\u064a\u0646 \u0627\u0644\u0627\u0642\u062a\u0635\u0627\u062f\u064a.",
      color: "bg-brand-gold",
    },
    {
      icon: MapPin,
      title: "\u0623\u064a\u0646 \u0646\u0639\u0645\u0644",
      description:
        "\u0646\u0646\u0634\u0637 \u0641\u064a \u0623\u0643\u062b\u0631 \u0645\u0646 10 \u062f\u0648\u0644 \u0628\u0645\u0627 \u0641\u064a \u0630\u0644\u0643 \u0644\u0628\u0646\u0627\u0646 \u0648\u0645\u0635\u0631 \u0648\u0627\u0644\u0623\u0631\u062f\u0646 \u0648\u0627\u0644\u0639\u0631\u0627\u0642 \u0648\u062a\u0648\u0646\u0633\u060c \u0648\u0646\u062a\u0648\u0633\u0639 \u0639\u0628\u0631 \u0645\u0646\u0637\u0642\u0629 \u0627\u0644\u0634\u0631\u0642 \u0627\u0644\u0623\u0648\u0633\u0637 \u0648\u0634\u0645\u0627\u0644 \u0623\u0641\u0631\u064a\u0642\u064a\u0627 \u0648\u0623\u0641\u0631\u064a\u0642\u064a\u0627.",
      color: "bg-rose-500",
    },
  ],
};

export function WhoWeAreGrid() {
  const locale = useLocale();
  const isAr = locale === "ar";
  const items = isAr ? quadrants.ar : quadrants.en;
  const { ref, visible } = useInView(0.1);

  return (
    <section className="py-20 md:py-28 bg-surface-primary relative overflow-hidden">
      {/* Background shapes */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 -start-40 w-80 h-80 bg-brand-blue/[0.03] rounded-full blur-3xl" />
        <div className="absolute bottom-20 -end-40 w-80 h-80 bg-brand-gold/[0.03] rounded-full blur-3xl" />
      </div>

      <Container>
        <div ref={ref} className={cn(isAr && "text-right")}>
          {/* Section header */}
          <div
            className={cn(
              "text-center mb-14 transition-all duration-700",
              visible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-6"
            )}
          >
            <SectionLabel color="blue">
              {isAr ? "\u062d\u0648\u0644 \u062a\u062c\u0631\u0628\u0629 LEEE" : "About LEEE Experience"}
            </SectionLabel>
            <h2 className="font-serif text-3xl md:text-4xl lg:text-[2.75rem] text-text-primary leading-tight mt-4">
              {isAr
                ? "\u0646\u0638\u0631\u0629 \u0634\u0627\u0645\u0644\u0629 \u0639\u0644\u0649 \u0645\u0646\u0638\u0648\u0645\u062a\u0646\u0627"
                : "A Snapshot of Our Ecosystem"}
            </h2>
          </div>

          {/* 4-quadrant grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
            {items.map((item, i) => {
              const Icon = item.icon;
              return (
                <div
                  key={i}
                  className={cn(
                    "group relative bg-white rounded-2xl p-8 md:p-10 border border-surface-tertiary/50",
                    "hover:shadow-xl hover:-translate-y-1 transition-all duration-500",
                    visible
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-8"
                  )}
                  style={{
                    transitionDelay: visible ? `${150 * i}ms` : "0ms",
                  }}
                >
                  <div
                    className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center mb-5",
                      item.color
                    )}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-serif text-xl md:text-2xl text-text-primary mb-3">
                    {item.title}
                  </h3>
                  <p className="text-text-secondary text-sm md:text-base leading-relaxed">
                    {item.description}
                  </p>
                  <div
                    className={cn(
                      "absolute top-0 end-0 w-20 h-20 rounded-bl-[40px] opacity-[0.04]",
                      item.color
                    )}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </Container>
    </section>
  );
}
