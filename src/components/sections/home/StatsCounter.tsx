"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { Container } from "@/components/ui/Container";
import { Users, Rocket, Globe, Coins, Leaf, Heart, GraduationCap, FolderOpen } from "lucide-react";

const demoStats = [
  { id: "1", labelEn: "Lives Touched", labelAr: "حياة تأثرت", value: 38790, suffix: "+", prefix: "", icon: Users },
  { id: "2", labelEn: "Startups Incubated", labelAr: "شركات ناشئة احتُضنت", value: 2365, suffix: "+", prefix: "", icon: Rocket },
  { id: "3", labelEn: "Seed Funding", labelAr: "تمويل أولي", value: 1.06, suffix: "M+", prefix: "$", icon: Coins },
  { id: "4", labelEn: "Countries", labelAr: "دول", value: 10, suffix: "", prefix: "", icon: Globe },
  { id: "5", labelEn: "Green Ventures", labelAr: "مشاريع خضراء", value: 60, suffix: "%", prefix: "", icon: Leaf },
  { id: "6", labelEn: "Women Reached", labelAr: "نساء مستفيدات", value: 65, suffix: "%", prefix: "", icon: Heart },
  { id: "7", labelEn: "Youth Supported", labelAr: "شباب مدعوم", value: 12400, suffix: "+", prefix: "", icon: GraduationCap },
  { id: "8", labelEn: "Programs Delivered", labelAr: "برامج منفذة", value: 45, suffix: "+", prefix: "", icon: FolderOpen },
];

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
  icon: Icon,
  isVisible,
}: {
  label: string;
  value: number;
  suffix: string;
  prefix: string;
  icon: React.ComponentType<{ className?: string }>;
  isVisible: boolean;
}) {
  const count = useCountUp(value, isVisible);
  return (
    <div className="text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-white/15 text-white mb-3 rounded-xl">
        <Icon className="w-8 h-8" />
      </div>
      <div className="text-3xl md:text-4xl font-bold text-white mb-1">
        {prefix}{count.toLocaleString()}{suffix}
      </div>
      <div className="text-white/80 font-medium text-sm uppercase tracking-wider">
        {label}
      </div>
    </div>
  );
}

export function StatsCounter() {
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
          {locale === "ar" ? "تأثيرنا بلمحة" : "Impact at a Glance"}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {demoStats.map((stat) => (
            <StatItem
              key={stat.id}
              label={locale === "ar" ? stat.labelAr : stat.labelEn}
              value={stat.value}
              suffix={stat.suffix}
              prefix={stat.prefix}
              icon={stat.icon}
              isVisible={isVisible}
            />
          ))}
        </div>
      </Container>
    </section>
  );
}
