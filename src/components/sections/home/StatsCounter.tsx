"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
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

const cardColors = [
  { iconBg: "bg-brand-blue/25", ring: "border-brand-blue/15" },
  { iconBg: "bg-emerald-400/25", ring: "border-emerald-400/15" },
  { iconBg: "bg-amber-400/25", ring: "border-amber-400/15" },
  { iconBg: "bg-pink-400/25", ring: "border-pink-400/15" },
  { iconBg: "bg-cyan-400/25", ring: "border-cyan-400/15" },
  { iconBg: "bg-brand-blue/25", ring: "border-brand-blue/15" },
  { iconBg: "bg-emerald-400/25", ring: "border-emerald-400/15" },
  { iconBg: "bg-amber-400/25", ring: "border-amber-400/15" },
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
      // Cubic easeOut
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = eased * target;
      // For decimal values (like 1.06), preserve decimals
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
  isVisible,
  index,
}: {
  label: string;
  value: number;
  suffix: string;
  prefix: string;
  icon: React.ComponentType<{ className?: string }>;
  isVisible: boolean;
  index: number;
}) {
  const count = useCountUp(value, isVisible);
  const colors = cardColors[index % cardColors.length];
  const fromLeft = index % 2 === 0;

  return (
    <motion.div
      className="relative group"
      initial={{ opacity: 0, x: fromLeft ? -30 : 30, y: 10 }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7, delay: index * 0.1, ease: "easeOut" }}
    >
      <div className="bg-white/[0.06] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-5 md:p-6 text-center transition-all duration-500 group-hover:bg-white/[0.12] group-hover:border-white/[0.16] group-hover:translate-y-[-4px] relative overflow-hidden">
        {/* Decorative ring */}
        <div
          className={cn(
            "absolute -top-4 -end-4 w-14 h-14 rounded-full border-2 transition-transform duration-500 group-hover:scale-110",
            colors.ring
          )}
        />

        {/* Colored icon background */}
        <div
          className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3 transition-transform duration-500 group-hover:scale-110",
            colors.iconBg
          )}
        >
          <Icon className="w-5 h-5 text-white" />
        </div>

        {/* Value */}
        <div className="font-serif text-2xl md:text-3xl lg:text-4xl text-white mb-1 tabular-nums">
          {prefix}
          {value % 1 !== 0 ? count.toFixed(2) : count.toLocaleString()}
          {suffix}
        </div>

        {/* Label */}
        <div className="text-white/50 text-[11px] font-medium uppercase tracking-[0.15em] leading-relaxed">
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
      className="relative min-h-[600px] md:min-h-[700px] flex items-center justify-center overflow-hidden py-20 md:py-28"
    >
      {/* Parallax background image */}
      <div
        className="absolute inset-0 bg-fixed bg-center bg-cover scale-110"
        style={{ backgroundImage: "url('/images/new/group-photo.jpg')" }}
      />

      {/* Dark gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-accent-navy/92 via-brand-blue-deeper/88 to-accent-slate/85" />

      {/* Grain texture */}
      <div className="absolute inset-0 grain-overlay pointer-events-none" />

      {/* ═══ ABSTRACT SHAPES ═══ */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Giant rings */}
        <div className="absolute -top-24 -start-24 w-[380px] h-[380px] rounded-full border border-white/[0.04] animate-[drift-horizontal_18s_ease-in-out_infinite]" />
        <div className="absolute -bottom-20 -end-20 w-[320px] h-[320px] rounded-full border border-white/[0.03] animate-[drift-horizontal_22s_ease-in-out_infinite_3s]" />
        <div className="absolute top-[40%] end-[3%] w-[200px] h-[200px] rounded-full border border-white/[0.03] animate-[drift-horizontal_15s_ease-in-out_infinite_6s]" />

        {/* Morphing blobs */}
        <div
          className="absolute top-[5%] end-[10%] w-[220px] h-[220px] bg-brand-blue/[0.04] animate-[morph-blob_12s_ease-in-out_infinite]"
          style={{ borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%" }}
        />
        <div
          className="absolute bottom-[10%] start-[5%] w-[180px] h-[180px] bg-emerald-400/[0.03] animate-[morph-blob_10s_ease-in-out_infinite_2.5s]"
          style={{ borderRadius: "40% 60% 70% 30% / 50% 60% 30% 60%" }}
        />

        {/* Floating colored shapes */}
        <div className="absolute top-[8%] end-[15%] w-16 h-16 rounded-full border-2 border-white/[0.06] animate-[float-slow_8s_ease-in-out_infinite]" />
        <div className="absolute top-[22%] start-[8%] w-6 h-6 rounded-full bg-emerald-400/20 animate-[float-medium_6s_ease-in-out_infinite_0.5s]" />
        <div className="absolute bottom-[15%] end-[12%] w-4 h-4 rounded-full bg-pink-400/20 animate-[drift-horizontal_7s_ease-in-out_infinite_0.8s]" />

        {/* Dotted arc SVG */}
        <svg
          className="absolute top-[18%] end-[5%] w-28 h-28 text-white/[0.04] animate-[float-slow_12s_ease-in-out_infinite]"
          viewBox="0 0 112 112"
          fill="none"
        >
          <circle
            cx="56"
            cy="56"
            r="48"
            stroke="currentColor"
            strokeWidth="1"
            strokeDasharray="4 6"
          />
        </svg>

        {/* Floating particles */}
        {[...Array(10)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white/15 animate-float-particle"
            style={{
              width: `${2 + (i % 3)}px`,
              height: `${2 + (i % 3)}px`,
              left: `${6 + (i * 9.2) % 88}%`,
              top: `${8 + (i * 8.5) % 84}%`,
              animationDelay: `${(i * 0.65) % 6}s`,
              animationDuration: `${4.5 + (i % 4) * 1.3}s`,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-5 sm:px-8 lg:px-10">
        {/* Header */}
        <motion.div
          className="text-center mb-14 md:mb-16"
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
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-white tracking-tight mt-4">
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
              isVisible={isVisible}
              index={i}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
