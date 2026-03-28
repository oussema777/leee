"use client";

import { useRef, useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { HandHeart, Play, Rocket, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const ctas = [
  {
    icon: HandHeart,
    titleEn: "Volunteer With Us",
    titleAr: "تطوع معنا",
    descEn: "Make a real difference",
    descAr: "اصنع فرقاً حقيقياً",
    href: "/get-involved/join-us",
    gradient: "from-brand-blue-deeper to-brand-blue-dark",
    iconBg: "bg-white/20",
    ring: "border-white/10",
  },
  {
    icon: Play,
    titleEn: "Watch Our Impact",
    titleAr: "شاهد أثرنا",
    descEn: "See stories of change",
    descAr: "شاهد قصص التغيير",
    href: "/media/videos",
    gradient: "from-accent-steel to-brand-blue",
    iconBg: "bg-white/20",
    ring: "border-white/10",
  },
  {
    icon: Rocket,
    titleEn: "Request a Service",
    titleAr: "اطلب خدمة",
    descEn: "Start your journey",
    descAr: "ابدأ رحلتك",
    href: "/get-involved/request-service",
    gradient: "from-brand-blue to-accent-steel",
    iconBg: "bg-white/20",
    ring: "border-white/10",
  },
];

function useInView(threshold = 0.2) {
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

export function QuickAccessCards() {
  const locale = useLocale();
  const isAr = locale === "ar";
  const { ref, visible } = useInView(0.15);

  return (
    <section ref={ref} className="relative z-20 -mt-14 md:-mt-16 pb-8 md:pb-12">
      <div className="max-w-5xl mx-auto px-5 sm:px-8 lg:px-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {ctas.map((cta, i) => {
            const Icon = cta.icon;
            const entranceClass = i === 0
              ? "opacity-0 -translate-x-8 translate-y-4"
              : i === 2
                ? "opacity-0 translate-x-8 translate-y-4"
                : "opacity-0 scale-95 translate-y-6";

            return (
              <Link
                key={cta.href}
                href={cta.href}
                className={cn(
                  "group relative bg-gradient-to-br text-white rounded-2xl p-5 md:p-6 shadow-xl hover:shadow-2xl transition-all duration-700 ease-out overflow-hidden hover:-translate-y-1",
                  cta.gradient,
                  visible
                    ? "opacity-100 translate-x-0 translate-y-0 scale-100"
                    : entranceClass
                )}
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                {/* Decorative ring */}
                <div className={cn("absolute -top-4 -end-4 w-16 h-16 rounded-full border-2 transition-transform duration-500 group-hover:scale-125", cta.ring)} />
                <div className="absolute bottom-2 start-2 w-8 h-8 rounded-full border border-white/[0.06]" />

                <div className="relative z-10">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-transform duration-500 group-hover:scale-110", cta.iconBg)}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-[15px] mb-1">
                    {isAr ? cta.titleAr : cta.titleEn}
                  </h3>
                  <p className="text-white/60 text-xs mb-3">
                    {isAr ? cta.descAr : cta.descEn}
                  </p>
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/80 group-hover:text-white transition-colors">
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
