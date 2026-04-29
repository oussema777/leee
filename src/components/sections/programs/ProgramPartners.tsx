"use client";

import { useLocale } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Building2 } from "lucide-react";

interface Partner {
  nameEn: string;
  nameAr: string;
  logoUrl?: string | null;
  websiteUrl?: string | null;
}

interface ProgramPartnersProps {
  partners: Partner[];
}

export function ProgramPartners({ partners }: ProgramPartnersProps) {
  const locale = useLocale();
  const isAr = locale === "ar";

  if (partners.length === 0) return null;

  return (
    <section id="partners" className="scroll-mt-16 py-20 md:py-28 bg-white relative overflow-hidden">
      {/* Decorative shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[8%] start-[5%] w-12 h-12 rounded-full border-2 border-brand-blue/[0.06] animate-[float-slow_7s_ease-in-out_infinite]" />
        <div className="absolute bottom-[10%] end-[8%] w-4 h-4 rounded-full bg-emerald-400/10 animate-[float-medium_5s_ease-in-out_infinite_0.5s]" />
        <div className="absolute top-[50%] end-[3%] w-3 h-3 rounded-full bg-pink-400/10 animate-[float-slow_4.5s_ease-in-out_infinite_1s]" />
      </div>

      <Container>
        <div className="text-center mb-14">
          <span className="inline-flex items-center gap-3 text-brand-blue text-[11px] font-bold uppercase tracking-[0.3em] mb-4">
            <span className="w-6 h-[1.5px] bg-brand-blue" />
            {isAr ? "موثوق من قبل" : "Trusted By"}
            <span className="w-6 h-[1.5px] bg-brand-blue" />
          </span>
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-text-primary tracking-tight">
            {isAr ? "موثوق من قبل" : "Trusted By"}
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {partners.map((partner, index) => {
            const content = (
              <div className="bg-surface-secondary rounded-xl border border-surface-tertiary p-5 md:p-6 flex flex-col items-center justify-center text-center h-28 transition-all duration-400 hover:shadow-md hover:border-brand-blue/15 hover:-translate-y-0.5">
                {partner.logoUrl ? (
                  <img
                    src={partner.logoUrl}
                    alt={isAr ? partner.nameAr : partner.nameEn}
                    className="max-h-10 max-w-full object-contain mb-2"
                  />
                ) : (
                  <Building2 className="w-7 h-7 text-text-muted mb-2" />
                )}
                <span className="text-xs font-semibold text-text-muted leading-tight">
                  {isAr ? partner.nameAr : partner.nameEn}
                </span>
              </div>
            );

            return partner.websiteUrl ? (
              <a key={index} href={partner.websiteUrl} target="_blank" rel="noopener noreferrer">
                {content}
              </a>
            ) : (
              <div key={index}>{content}</div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
