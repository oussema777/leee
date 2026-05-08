"use client";

import { useLocale } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { ArrowRight, Users, BookOpen } from "lucide-react";
import { useInView } from "@/hooks/useInView";
import Image from "next/image";

const cards = [
  {
    titleEn: "Join the Community",
    titleAr: "انضم إلى المجتمع",
    descEn: "Connect with changemakers, entrepreneurs, and dreamers building a better Lebanon.",
    descAr: "تواصل مع صناع التغيير ورواد الأعمال والحالمين الذين يبنون لبنان أفضل.",
    image: "/images/new/team-signs.jpg",
    href: "/get-involved/join-us",
    ctaEn: "Volunteer",
    ctaAr: "تطوع معنا",
    icon: Users,
  },
  {
    titleEn: "Explore Programs",
    titleAr: "اكتشف البرامج",
    descEn: "From capacity building to community initiatives — discover programs that create real impact.",
    descAr: "من بناء القدرات إلى المبادرات المجتمعية — اكتشف برامج تُحدث فرقاً حقيقياً.",
    image: "/images/new/coaching-session.jpg",
    href: "/programs",
    ctaEn: "See Programs",
    ctaAr: "استكشف البرامج",
    icon: BookOpen,
  },
];

export function JoinCommunity() {
  const locale = useLocale();
  const isAr = locale === "ar";
  const { ref, visible } = useInView(0.08);

  return (
    <section className="py-20 md:py-28 relative overflow-hidden">
      <Container>
        <div
          ref={ref}
          className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6"
        >
          {cards.map((card, i) => {
            const Icon = card.icon;
            const fromLeft = i === 0;
            return (
              <div
                key={card.href}
                className={cn(
                  "transition-all duration-700 ease-out",
                  visible
                    ? "opacity-100 translate-x-0 translate-y-0"
                    : fromLeft
                      ? "opacity-0 -translate-x-12 translate-y-4"
                      : "opacity-0 translate-x-12 translate-y-4"
                )}
                style={{ transitionDelay: `${i * 150}ms` }}
              >
                <Link
                  href={card.href}
                  className="group relative block h-[380px] md:h-[460px] rounded-2xl overflow-hidden"
                >
                  <Image
                    src={card.image}
                    alt=""
                    fill
                    className="object-cover transition-all duration-[1200ms] ease-out group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-accent-navy/90 via-accent-navy/40 to-accent-navy/10" />

                  <div className="relative z-10 h-full flex flex-col justify-end p-7 md:p-9">
                    <div className="w-11 h-11 rounded-xl bg-brand-blue/20 backdrop-blur-sm border border-white/10 flex items-center justify-center mb-5">
                      <Icon className="w-5 h-5 text-brand-blue-light" />
                    </div>

                    <h3 className="font-serif text-2xl md:text-3xl text-white mb-3 tracking-tight">
                      {isAr ? card.titleAr : card.titleEn}
                    </h3>
                    <p className="text-white/70 text-sm leading-relaxed mb-7 max-w-sm">
                      {isAr ? card.descAr : card.descEn}
                    </p>

                    <span className="inline-flex items-center gap-2.5 bg-white/0 border border-white/20 text-white font-semibold text-sm uppercase tracking-wider px-6 py-3 rounded-full w-fit transition-all duration-400 group-hover:bg-brand-blue group-hover:border-brand-blue group-hover:text-white group-hover:shadow-lg">
                      {isAr ? card.ctaAr : card.ctaEn}
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
                    </span>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
