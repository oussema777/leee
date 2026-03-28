"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Users, Rocket, Globe, Coins, Leaf } from "lucide-react";

const demoStats = [
  { id: "1", labelEn: "Lives Touched", labelAr: "حياة تأثرت", value: 38790, suffix: "+", prefix: "", icon: "users" },
  { id: "2", labelEn: "Startups Incubated", labelAr: "شركات ناشئة احتُضنت", value: 2365, suffix: "+", prefix: "", icon: "rocket" },
  { id: "3", labelEn: "Seed Funding", labelAr: "تمويل أولي", value: 1.06, suffix: "M+", prefix: "$", icon: "coins" },
  { id: "4", labelEn: "Countries", labelAr: "دول", value: 10, suffix: "", prefix: "", icon: "globe" },
  { id: "5", labelEn: "Green Ventures", labelAr: "مشاريع خضراء", value: 60, suffix: "%", prefix: "", icon: "leaf" },
];

const iconMap: Record<string, React.ReactNode> = {
  users: <Users className="w-8 h-8" />,
  rocket: <Rocket className="w-8 h-8" />,
  globe: <Globe className="w-8 h-8" />,
  coins: <Coins className="w-8 h-8" />,
  leaf: <Leaf className="w-8 h-8" />,
};

function useCountUp(target: number, isVisible: boolean, duration = 2000) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isVisible) return;
    let start = 0;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [target, isVisible, duration]);

  return count;
}

function StatItem({
  label,
  value,
  suffix,
  prefix,
  icon,
  isVisible,
}: {
  label: string;
  value: number;
  suffix: string;
  prefix: string;
  icon: string;
  isVisible: boolean;
}) {
  const count = useCountUp(value, isVisible);

  return (
    <div className="text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-white/15 text-white mb-3">
        {iconMap[icon] || <Rocket className="w-8 h-8" />}
      </div>
      <div className="text-3xl md:text-4xl font-bold text-white mb-1">
        {prefix}{count.toLocaleString()}
        {suffix}
      </div>
      <div className="text-white/80 font-medium text-sm uppercase tracking-wider">
        {label}
      </div>
    </div>
  );
}

export function StatsCounter() {
  const t = useTranslations("home");
  const locale = useLocale();
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref} className="bg-gradient-to-br from-brand-blue-deeper via-brand-blue-dark to-brand-blue py-16 md:py-20">
      <Container>
        <h2 className="text-center text-2xl md:text-3xl font-bold text-white mb-12">
          {t("statsTitle")}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
          {demoStats.map((stat) => (
            <StatItem
              key={stat.id}
              label={locale === "ar" ? stat.labelAr : stat.labelEn}
              value={stat.value}
              suffix={stat.suffix || ""}
              prefix={stat.prefix || ""}
              icon={stat.icon || "rocket"}
              isVisible={isVisible}
            />
          ))}
        </div>
      </Container>
    </section>
  );
}
