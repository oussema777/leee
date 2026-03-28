"use client";

import { useRef, useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { ArrowRight, Users, BookOpen } from "lucide-react";
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

function useInView(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

export function JoinCommunity() {
  const locale = useLocale();
  const isAr = locale === "ar";
  const { ref, visible } = useInView(0.08);

  return (
    <section className="py-20 md:py-28 relative overflow-hidden">
      {/* ═══ ABSTRACT SHAPES ═══ */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-12 start-[15%] w-[240px] h-[240px] bg-brand-blue/[0.03] animate-[morph-blob_13s_ease-in-out_infinite]" style={{ borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%" }} />
        <div className="absolute -bottom-10 end-[10%] w-[200px] h-[200px] bg-emerald-400/[0.03] animate-[morph-blob_10s_ease-in-out_infinite_2s]" style={{ borderRadius: "40% 60% 70% 30% / 50% 60% 30% 60%" }} />
        <div className="absolute top-[8%] end-[5%] w-14 h-14 rounded-full border-2 border-brand-blue/[0.06] animate-[drift-horizontal_8s_ease-in-out_infinite]" />
        <div className="absolute bottom-[12%] start-[4%] w-4 h-4 rounded-full bg-amber-400/12 animate-[float-medium_5s_ease-in-out_infinite_0.6s]" />
        <div className="absolute top-[45%] start-[2%] w-3 h-3 bg-pink-400/10 rotate-45 animate-[float-slow_6s_ease-in-out_infinite_1s]" />
        <div className="absolute top-[20%] end-[3%] w-3 h-3 rounded-full bg-violet-400/10 animate-[float-medium_4s_ease-in-out_infinite_0.3s]" />
        <svg className="absolute bottom-[8%] end-[18%] w-16 h-16 text-brand-blue/[0.04] animate-[float-slow_9s_ease-in-out_infinite]" viewBox="0 0 64 64" fill="none">
          <circle cx="32" cy="32" r="26" stroke="currentColor" strokeWidth="1" strokeDasharray="3 5" />
        </svg>
      </div>

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
                  <div className="absolute inset-0 grain-overlay" />

                  {/* Abstract shapes inside cards */}
                  <div className="absolute top-4 end-4 w-16 h-16 rounded-full border border-white/[0.08] animate-[float-slow_7s_ease-in-out_infinite]" />
                  <div className="absolute top-[20%] start-[5%] w-3 h-3 rounded-full bg-white/10 animate-[float-medium_5s_ease-in-out_infinite_0.5s]" />

                  <div className="relative z-10 h-full flex flex-col justify-end p-7 md:p-9">
                    <div className="w-11 h-11 rounded-xl bg-brand-blue/20 backdrop-blur-sm border border-white/10 flex items-center justify-center mb-5">
                      <Icon className="w-5 h-5 text-brand-blue-light" />
                    </div>

                    <h3 className="font-serif text-2xl md:text-3xl text-white mb-3 tracking-tight">
                      {isAr ? card.titleAr : card.titleEn}
                    </h3>
                    <p className="text-white/50 text-sm leading-relaxed mb-7 max-w-sm">
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
