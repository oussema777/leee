"use client";

import { useLocale } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import { useInView } from "@/hooks/useInView";

export function CTABanner() {
  const locale = useLocale();
  const isAr = locale === "ar";
  const { ref, visible } = useInView(0.15);

  return (
    <section className="relative overflow-hidden">
      {/* Wave divider */}
      <div className="relative -mb-px">
        <svg
          viewBox="0 0 1440 60"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-auto block"
          preserveAspectRatio="none"
        >
          <path
            d="M0 60V30C360 60 720 0 1080 20C1260 30 1380 50 1440 30V60H0Z"
            fill="#1B3A5C"
          />
        </svg>
      </div>

      <div ref={ref} className="bg-gradient-to-br from-accent-navy via-brand-blue-deeper to-accent-steel relative py-20 md:py-24">
        <Container>
          <div
            className={cn(
              "flex flex-col items-center text-center transition-all duration-700 ease-out",
              visible ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-6"
            )}
          >
            <span className="w-12 h-[2px] bg-brand-blue mb-8 rounded-full" />

            <h2 className={cn(
              "font-serif text-[clamp(1.75rem,3vw,2.5rem)] text-white leading-tight mb-5 max-w-2xl tracking-tight transition-all duration-700",
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )} style={{ transitionDelay: "150ms" }}>
              {isAr
                ? "هل تبدأ رحلتك نحو الأثر الاجتماعي؟"
                : "Starting your journey towards social impact?"}
            </h2>
            <p className={cn(
              "text-white/70 text-base md:text-lg mb-10 max-w-lg transition-all duration-700",
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )} style={{ transitionDelay: "250ms" }}>
              {isAr
                ? "لا تفعل ذلك وحدك. نحن هنا للمساعدة."
                : "Don\u2019t do it alone. We\u2019re here to help."}
            </p>

            <Link
              href="/get-involved"
              className={cn(
                "group inline-flex items-center gap-3 bg-white text-brand-blue-deeper font-bold text-sm uppercase tracking-[0.15em] px-10 py-4 rounded-full shadow-[0_4px_20px_rgba(255,255,255,0.2)] hover:shadow-[0_6px_30px_rgba(255,255,255,0.3)] hover:scale-105 active:scale-95 transition-all duration-300",
                visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              )}
              style={{ transitionDelay: "350ms" }}
            >
              {isAr ? "تواصل معنا" : "Get in Touch"}
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
            </Link>
          </div>
        </Container>
      </div>
    </section>
  );
}
