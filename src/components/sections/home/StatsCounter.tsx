"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Users, Rocket, Globe, Coins, Leaf, Heart, GraduationCap, FolderOpen } from "lucide-react";

const demoStats = [
  { id: "1", labelEn: "Lives Touched", labelAr: "حياة تأثرت", value: 38790, suffix: "+", prefix: "", icon: Users, bgColor: "#5A5A59" },
  { id: "2", labelEn: "Startups Incubated", labelAr: "شركات ناشئة احتُضنت", value: 2365, suffix: "+", prefix: "", icon: Rocket, bgColor: "#F8B51F" },
  { id: "3", labelEn: "Funds Mobilized", labelAr: "أموال مُعبأة", value: 3, suffix: "M+", prefix: "$", icon: Coins, bgColor: "#3FAC49" },
  { id: "4", labelEn: "Countries", labelAr: "دول", value: 10, suffix: "", prefix: "", icon: Globe, bgColor: "#147DBB" },
  { id: "5", labelEn: "Green Ventures", labelAr: "مشاريع خضراء", value: 60, suffix: "%", prefix: "", icon: Leaf, bgColor: "#ED6E28" },
  { id: "6", labelEn: "Women Reached", labelAr: "نساء مستفيدات", value: 65, suffix: "%", prefix: "", icon: Heart, bgColor: "#1B3765" },
  { id: "7", labelEn: "Youth Supported", labelAr: "شباب مدعوم", value: 12400, suffix: "+", prefix: "", icon: GraduationCap, bgColor: "#5193CF" },
  { id: "8", labelEn: "Programs Delivered", labelAr: "برامج منفذة", value: 45, suffix: "+", prefix: "", icon: FolderOpen, bgColor: "#DE1881" },
];

function useCountUp(target: number, isVisible: boolean) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!isVisible) return;
    const duration = 2000;
    const startTime = performance.now();

    function animate(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = eased * target;
      setCount(target % 1 !== 0 ? parseFloat(current.toFixed(2)) : Math.floor(current));
      if (progress < 1) requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
  }, [target, isVisible]);
  return count;
}

function StatCard({
  label,
  value,
  suffix,
  prefix,
  icon: Icon,
  bgColor,
  isVisible,
  index,
}: {
  label: string;
  value: number;
  suffix: string;
  prefix: string;
  icon: React.ComponentType<{ className?: string }>;
  bgColor: string;
  isVisible: boolean;
  index: number;
}) {
  const count = useCountUp(value, isVisible);

  return (
    <motion.div
      className="relative group"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: "easeOut" }}
    >
      <div
        className="rounded-2xl p-6 md:p-7 text-center transition-all duration-400 group-hover:translate-y-[-4px] group-hover:shadow-xl relative overflow-hidden"
        style={{ backgroundColor: bgColor }}
      >
        {/* Subtle light overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/10 pointer-events-none" />

        {/* Icon */}
        <div className="relative z-10 w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mx-auto mb-3">
          <Icon className="w-6 h-6 text-white" />
        </div>

        {/* Value */}
        <div className="relative z-10 font-serif text-2xl md:text-3xl lg:text-4xl text-white font-bold mb-1 tabular-nums">
          {prefix}
          {value % 1 !== 0 ? count.toFixed(2) : count.toLocaleString()}
          {suffix}
        </div>

        {/* Label */}
        <div className="relative z-10 text-white/85 text-xs font-medium uppercase tracking-[0.12em] leading-relaxed">
          {label}
        </div>
      </div>
    </motion.div>
  );
}

export function StatsCounter() {
  const locale = useLocale();
  const isAr = locale === "ar";
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
      { threshold: 0.15 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      className="relative py-20 md:py-28 bg-surface-primary overflow-hidden"
    >
      {/* Subtle background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-20 -start-20 w-[400px] h-[400px] bg-brand-blue/[0.03] rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -end-20 w-[400px] h-[400px] bg-brand-gold/[0.03] rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-5 sm:px-8 lg:px-10">
        {/* Header */}
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-flex items-center gap-3 text-brand-blue text-[11px] font-bold uppercase tracking-[0.3em] mb-4">
            <span className="w-6 h-[1.5px] bg-brand-blue" />
            {isAr ? "تأثيرنا بالأرقام" : "Impact in Numbers"}
            <span className="w-6 h-[1.5px] bg-brand-blue" />
          </span>
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-text-primary tracking-tight mt-4">
            {isAr ? "تأثيرنا بلمحة" : "Impact at a Glance"}
          </h2>
        </motion.div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
          {demoStats.map((stat, i) => (
            <StatCard
              key={stat.id}
              label={isAr ? stat.labelAr : stat.labelEn}
              value={stat.value}
              suffix={stat.suffix}
              prefix={stat.prefix}
              icon={stat.icon}
              bgColor={stat.bgColor}
              isVisible={isVisible}
              index={i}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
