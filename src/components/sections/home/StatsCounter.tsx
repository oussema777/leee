"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Users, Rocket, Globe, Coins, Leaf, Heart, GraduationCap, FolderOpen } from "lucide-react";
import type { StatItem } from "@/lib/data/stats";

// Map the DB icon string key to a lucide icon component.
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  users: Users,
  rocket: Rocket,
  coins: Coins,
  globe: Globe,
  leaf: Leaf,
  heart: Heart,
  "graduation-cap": GraduationCap,
  "folder-open": FolderOpen,
};

function useCountUp(target: number, isVisible: boolean) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!isVisible) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      setCount(target);
      return;
    }

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
        className="rounded-2xl p-6 md:p-7 text-center transition-all duration-400 group-hover:translate-y-[-4px] group-hover:shadow-xl"
        style={{ backgroundColor: bgColor }}
      >
        {/* Icon */}
        <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mx-auto mb-3">
          <Icon className="w-6 h-6 text-white" />
        </div>

        {/* Value */}
        <div className="font-serif text-2xl md:text-3xl lg:text-4xl text-white mb-1 tabular-nums">
          {prefix}
          {value % 1 !== 0 ? count.toFixed(2) : count.toLocaleString()}
          {suffix}
        </div>

        {/* Label */}
        <div className="text-white/85 text-sm font-medium uppercase tracking-[0.08em] leading-relaxed">
          {label}
        </div>
      </div>
    </motion.div>
  );
}

export function StatsCounter({ stats }: { stats: StatItem[] }) {
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
      className="relative py-14 md:py-20 bg-surface-primary overflow-hidden"
    >
      <div className="w-full max-w-7xl mx-auto px-5 sm:px-8 lg:px-10">
        {/* Header */}
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-flex items-center gap-3 text-brand-blue text-xs font-bold uppercase tracking-[0.15em] mb-4">
            <span className="w-6 h-[1.5px] bg-brand-blue" />
            {isAr ? "تأثيرنا بالأرقام" : "Impact in Numbers"}
            <span className="w-6 h-[1.5px] bg-brand-blue" />
          </span>
          <h2 className="font-serif text-[clamp(1.75rem,3vw,2.5rem)] text-text-primary tracking-tight mt-4">
            {isAr ? "تأثيرنا بلمحة" : "Impact at a Glance"}
          </h2>
        </motion.div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
          {stats.map((stat, i) => (
            <StatCard
              key={stat.id}
              label={isAr ? stat.labelAr : stat.labelEn}
              value={stat.value}
              suffix={stat.suffix}
              prefix={stat.prefix}
              icon={ICON_MAP[stat.icon] ?? Users}
              bgColor={stat.color}
              isVisible={isVisible}
              index={i}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
