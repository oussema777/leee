"use client";

import { useLocale } from "next-intl";
import { Container } from "@/components/ui/Container";
import { SectionLabel } from "./SectionLabel";
import { cn } from "@/lib/utils";
import { Quote } from "lucide-react";
import { useInView } from "@/hooks/useInView";

const ceoData = {
  en: {
    label: "Leadership",
    name: "CEO Name",
    title: "Founder & CEO",
    bio: "With over a decade of experience driving social enterprise and economic empowerment across MENA, our CEO leads LEEE Experience with a vision rooted in resilience, innovation, and inclusive growth. From incubating over 2,365 startups to mobilizing $1.06M in seed funding, his leadership has transformed thousands of lives across 10 countries.",
    quote: "Mindset is the first investment — everything else follows.",
  },
  ar: {
    label: "القيادة",
    name: "اسم المدير التنفيذي",
    title: "المؤسس والمدير التنفيذي",
    bio: "مع أكثر من عقد من الخبرة في قيادة المشاريع الاجتماعية والتمكين الاقتصادي عبر منطقة الشرق الأوسط وشمال أفريقيا، يقود مديرنا التنفيذي تجربة LEEE برؤية متجذرة في المرونة والابتكار والنمو الشامل.",
    quote: "العقلية هي الاستثمار الأول — وكل شيء آخر يتبع.",
  },
};

export function CEOSection() {
  const locale = useLocale();
  const isAr = locale === "ar";
  const c = isAr ? ceoData.ar : ceoData.en;
  const { ref, visible } = useInView(0.1);

  return (
    <section className="py-20 md:py-28 bg-surface-primary relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 end-0 w-96 h-96 bg-brand-blue/[0.02] rounded-full blur-3xl" />
      </div>

      <Container>
        <div ref={ref} className={cn(isAr && "text-right")}>
          <div
            className={cn(
              "grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center",
              "transition-all duration-700",
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            )}
          >
            {/* Photo — replace gradient placeholder with <Image> when CEO photo is provided */}
            <div className={cn("lg:col-span-4", isAr && "lg:order-2")}>
              <div className="relative w-full aspect-[3/4] max-w-sm mx-auto rounded-2xl overflow-hidden shadow-xl bg-gradient-to-br from-brand-blue to-brand-blue-dark">
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-6xl font-serif text-white/30">CEO</span>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className={cn("lg:col-span-8", isAr && "lg:order-1")}>
              <SectionLabel color="blue">{c.label}</SectionLabel>

              <h2 className="font-serif text-3xl md:text-4xl text-text-primary mt-4 mb-1">
                {c.name}
              </h2>
              <p className="text-brand-blue font-semibold text-lg mb-6">
                {c.title}
              </p>

              <p className="text-text-secondary text-base md:text-lg leading-relaxed mb-8 max-w-2xl">
                {c.bio}
              </p>

              {/* Quote */}
              <div className="relative bg-surface-secondary/50 rounded-xl p-6 md:p-8 border border-surface-tertiary/50 max-w-2xl">
                <Quote className="w-8 h-8 text-brand-blue/20 absolute top-4 start-4" />
                <p className="font-serif text-lg md:text-xl text-text-primary italic ps-8">
                  {c.quote}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
