"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { motion } from "framer-motion";
import { Users, Briefcase, Rocket, UserCheck, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

const stats = [
  { value: 2413, suffix: "", labelEn: "Training & Coaching\nBeneficiaries", labelAr: "مستفيد من التدريب\nوالإرشاد", icon: Users },
  { value: 2619, suffix: "", labelEn: "Total Projects\nBeneficiaries", labelAr: "إجمالي المستفيدين\nمن المشاريع", icon: Briefcase },
  { value: 153, suffix: "", labelEn: "Total\nStartups", labelAr: "إجمالي الشركات\nالناشئة", icon: Rocket },
  { value: 70, suffix: "", labelEn: "Total\nEntrepreneurs", labelAr: "إجمالي رواد\nالأعمال", icon: UserCheck },
  { value: 53, suffix: "", labelEn: "Technical Assistance\n& Corporates", labelAr: "المساعدة الفنية\nوالشركات", icon: Building2 },
];

const cardColors = [
  { iconBg: "bg-brand-blue/25", ring: "border-brand-blue/15" },
  { iconBg: "bg-emerald-400/25", ring: "border-emerald-400/15" },
  { iconBg: "bg-amber-400/25", ring: "border-amber-400/15" },
  { iconBg: "bg-pink-400/25", ring: "border-pink-400/15" },
  { iconBg: "bg-cyan-400/25", ring: "border-cyan-400/15" },
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
      const current = Math.floor(eased * target);
      setCount(current);
      if (progress < 1) requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
  }, [target, isVisible]);
  return count;
}

function StatCard({
  value,
  suffix,
  label,
  isVisible,
  icon: Icon,
  index,
}: {
  value: number;
  suffix: string;
  label: string;
  isVisible: boolean;
  icon: React.ComponentType<{ className?: string }>;
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
      <div className="bg-white/[0.06] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6 md:p-7 text-center transition-all duration-500 group-hover:bg-white/[0.12] group-hover:border-white/[0.16] group-hover:translate-y-[-4px] relative overflow-hidden">
        {/* Decorative ring */}
        <div className={cn("absolute -top-4 -end-4 w-14 h-14 rounded-full border-2 transition-transform duration-500 group-hover:scale-110", colors.ring)} />

        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-4 transition-transform duration-500 group-hover:scale-110", colors.iconBg)}>
          <Icon className="w-5 h-5 text-brand-blue" />
        </div>
        <div className="font-serif text-3xl md:text-4xl lg:text-[2.75rem] text-white mb-2 tabular-nums">
          {count.toLocaleString()}{suffix}
        </div>
        <div className="text-white/45 text-[11px] font-medium uppercase tracking-[0.15em] leading-relaxed whitespace-pre-line">
          {label}
        </div>
      </div>
    </motion.div>
  );
}

export function ParallaxImpact() {
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
      className="relative min-h-[550px] md:min-h-[620px] flex items-center justify-center overflow-hidden py-20 md:py-28"
    >
      {/* Parallax background */}
      <div
        className="absolute inset-0 bg-fixed bg-center bg-cover scale-110"
        style={{ backgroundImage: "url('/images/new/group-photo.jpg')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-accent-navy/92 via-brand-blue-deeper/88 to-accent-slate/85" />
      <div className="absolute inset-0 grain-overlay pointer-events-none" />

      {/* ═══ ABSTRACT SHAPES ═══ */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Giant rings */}
        <div className="absolute -top-20 -start-20 w-[350px] h-[350px] rounded-full border border-white/[0.04] animate-[drift-horizontal_18s_ease-in-out_infinite]" />
        <div className="absolute -bottom-16 -end-16 w-[300px] h-[300px] rounded-full border border-white/[0.03] animate-[drift-horizontal_20s_ease-in-out_infinite_3s]" />
        {/* Morphing blobs */}
        <div className="absolute top-[5%] end-[8%] w-[200px] h-[200px] bg-brand-blue/[0.04] animate-[morph-blob_12s_ease-in-out_infinite]" style={{ borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%" }} />
        <div className="absolute bottom-[8%] start-[5%] w-[160px] h-[160px] bg-emerald-400/[0.03] animate-[morph-blob_10s_ease-in-out_infinite_2.5s]" style={{ borderRadius: "40% 60% 70% 30% / 50% 60% 30% 60%" }} />
        {/* Floating colored shapes */}
        <div className="absolute top-[10%] end-[12%] w-16 h-16 rounded-full border-2 border-white/[0.06] animate-[float-slow_8s_ease-in-out_infinite]" />
        <div className="absolute top-[25%] start-[6%] w-6 h-6 rounded-full bg-emerald-400/20 animate-[float-medium_6s_ease-in-out_infinite_0.5s]" />
        <div className="absolute bottom-[18%] end-[10%] text-amber-400/20 animate-[float-slow_5s_ease-in-out_infinite_1s]">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" /></svg>
        </div>
        <div className="absolute top-[15%] start-[18%] w-4 h-4 rounded-full bg-pink-400/20 animate-[drift-horizontal_7s_ease-in-out_infinite_0.8s]" />
        <div className="absolute bottom-[25%] start-[40%] w-3 h-3 rounded-full bg-cyan-400/15 animate-[float-slow_6.5s_ease-in-out_infinite_1.5s]" />
        <div className="absolute bottom-[12%] start-[15%] w-3 h-3 bg-violet-400/20 rotate-45 animate-[float-slow_5s_ease-in-out_infinite_1.2s]" />
        {/* Dotted arc */}
        <svg className="absolute top-[20%] end-[4%] w-28 h-28 text-white/[0.04] animate-[float-slow_12s_ease-in-out_infinite]" viewBox="0 0 112 112" fill="none">
          <circle cx="56" cy="56" r="48" stroke="currentColor" strokeWidth="1" strokeDasharray="4 6" />
        </svg>
        {/* Particles */}
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white/15 animate-float-particle"
            style={{
              width: `${2 + (i % 3)}px`,
              height: `${2 + (i % 3)}px`,
              left: `${8 + (i * 8.5) % 84}%`,
              top: `${10 + (i * 7.8) % 80}%`,
              animationDelay: `${(i * 0.7) % 6}s`,
              animationDuration: `${5 + (i % 4) * 1.5}s`,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-5 sm:px-8 lg:px-10">
        <motion.div
          className="text-center mb-14 md:mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-flex items-center gap-3 text-brand-blue text-[11px] font-bold uppercase tracking-[0.3em] mb-4">
            <span className="w-6 h-[1.5px] bg-brand-blue" />
            {isAr ? "تجربة LEE بالأرقام" : "The LEE Experience in Numbers"}
            <span className="w-6 h-[1.5px] bg-brand-blue" />
          </span>
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-white tracking-tight mt-4">
            {isAr ? "أثرنا المستدام" : "Our Lasting Impact"}
          </h2>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-5">
          {stats.map((stat, i) => (
            <StatCard
              key={stat.labelEn}
              value={stat.value}
              suffix={stat.suffix}
              label={isAr ? stat.labelAr : stat.labelEn}
              isVisible={isVisible}
              icon={stat.icon}
              index={i}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
