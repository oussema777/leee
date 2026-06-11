"use client";

import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/Container";

export function AboutExpertsTeaser() {
  const locale = useLocale();
  const isAr = locale === "ar";

  return (
    <section className="py-16 md:py-20 bg-surface-primary">
      <Container>
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div className="max-w-xl">
            <span className="block text-brand-blue text-[11px] font-bold uppercase tracking-[0.3em] mb-3">
              {isAr ? "شبكتنا" : "Our Network"}
            </span>
            <span className="block w-12 h-[2px] bg-brand-blue mb-5 origin-start" />
            <h2 className="font-serif text-3xl md:text-4xl text-text-primary tracking-tight">
              {isAr ? "الخبراء والمرشدون" : "Experts & Mentors"}
            </h2>
            <p className="text-text-secondary leading-relaxed mt-4">
              {isAr
                ? "خبراء ومرشدون يجلبون الخبرة القطاعية والتجربة الواقعية إلى رواد الأعمال عبر برامجنا."
                : "The specialists and mentors who bring sector expertise and real-world experience to entrepreneurs across our programs."}
            </p>
          </div>

          <Link
            href="/about/experts"
            className="inline-flex items-center gap-2 self-start md:self-auto text-brand-blue font-semibold border-2 border-brand-blue px-6 py-3 rounded-full hover:bg-brand-blue hover:text-white transition-colors shrink-0"
          >
            {isAr ? "تعرّف عليهم جميعاً" : "Meet our experts & mentors"}
            <ArrowRight className="w-4 h-4 rtl:-scale-x-100" />
          </Link>
        </div>
      </Container>
    </section>
  );
}
