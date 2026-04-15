"use client";

import { useLocale } from "next-intl";
import { Container } from "@/components/ui/Container";
import { SectionLabel } from "./SectionLabel";
import { cn } from "@/lib/utils";
import { Building2, Lightbulb, Users, MapPin } from "lucide-react";
import { useInView } from "@/hooks/useInView";
import { motion } from "framer-motion";

const quadrants = {
  en: [
    {
      icon: Building2,
      title: "Who We Are",
      description:
        "A dual-structure ecosystem — a non-profit foundation and a for-profit incubator — united by a single mission to drive sustainable community impact across MENA & Africa.",
      color: "bg-brand-blue",
      accent: "from-brand-blue/20 to-brand-blue/5",
      borderAccent: "from-brand-blue to-blue-400",
      ringColor: "border-brand-blue/20",
    },
    {
      icon: Lightbulb,
      title: "What We Do",
      description:
        "We incubate startups, deliver technical assistance and capacity building, run academies, provide business clinics, and lead humanitarian aid programs — turning ideas into lasting change.",
      color: "bg-emerald-500",
      accent: "from-emerald-500/20 to-emerald-500/5",
      borderAccent: "from-emerald-500 to-emerald-300",
      ringColor: "border-emerald-500/20",
    },
    {
      icon: Users,
      title: "Who We Serve",
      description:
        "Women entrepreneurs, youth, MSMEs, cooperatives, NGOs, and vulnerable communities in post-conflict and developing regions seeking economic empowerment and decent work.",
      color: "bg-brand-gold",
      accent: "from-brand-gold/20 to-brand-gold/5",
      borderAccent: "from-brand-gold to-yellow-300",
      ringColor: "border-brand-gold/20",
    },
    {
      icon: MapPin,
      title: "Where We Work",
      description:
        "Active across 10 countries including Lebanon, Egypt, Jordan, Iraq, Tunisia, and expanding across the MENA region and Africa.",
      color: "bg-rose-500",
      accent: "from-rose-500/20 to-rose-500/5",
      borderAccent: "from-rose-500 to-rose-300",
      ringColor: "border-rose-500/20",
    },
  ],
  ar: [
    {
      icon: Building2,
      title: "من نحن",
      description:
        "منظومة مزدوجة — مؤسسة غير ربحية وحاضنة أعمال ربحية — متحدتان برسالة واحدة لدفع التأثير المجتمعي المستدام عبر منطقة الشرق الأوسط وشمال أفريقيا.",
      color: "bg-brand-blue",
      accent: "from-brand-blue/20 to-brand-blue/5",
      borderAccent: "from-brand-blue to-blue-400",
      ringColor: "border-brand-blue/20",
    },
    {
      icon: Lightbulb,
      title: "ماذا نفعل",
      description:
        "نحتضن الشركات الناشئة، ونقدم المساعدة التقنية وبناء القدرات، وندير الأكاديميات، ونوفر عيادات الأعمال، ونقود برامج المساعدات الإنسانية.",
      color: "bg-emerald-500",
      accent: "from-emerald-500/20 to-emerald-500/5",
      borderAccent: "from-emerald-500 to-emerald-300",
      ringColor: "border-emerald-500/20",
    },
    {
      icon: Users,
      title: "من نخدم",
      description:
        "رائدات الأعمال، الشباب، المشاريع الصغيرة والمتوسطة، التعاونيات، المنظمات غير الحكومية، والمجتمعات الضعيفة الساعية للتمكين الاقتصادي.",
      color: "bg-brand-gold",
      accent: "from-brand-gold/20 to-brand-gold/5",
      borderAccent: "from-brand-gold to-yellow-300",
      ringColor: "border-brand-gold/20",
    },
    {
      icon: MapPin,
      title: "أين نعمل",
      description:
        "ننشط في أكثر من 10 دول بما في ذلك لبنان ومصر والأردن والعراق وتونس، ونتوسع عبر منطقة الشرق الأوسط وشمال أفريقيا وأفريقيا.",
      color: "bg-rose-500",
      accent: "from-rose-500/20 to-rose-500/5",
      borderAccent: "from-rose-500 to-rose-300",
      ringColor: "border-rose-500/20",
    },
  ],
};

const cardVariants = {
  hidden: { opacity: 0, y: 32 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.12,
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

const headerVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

const lineVariants = {
  hidden: { scaleX: 0 },
  visible: {
    scaleX: 1,
    transition: { duration: 0.5, delay: 0.3, ease: "easeOut" },
  },
};

export function WhoWeAreGrid() {
  const locale = useLocale();
  const isAr = locale === "ar";
  const items = isAr ? quadrants.ar : quadrants.en;
  const { ref, visible } = useInView(0.1);

  return (
    <section className="py-20 md:py-28 bg-surface-primary relative overflow-hidden">
      {/* Dot grid pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.035]"
        style={{
          backgroundImage:
            "radial-gradient(circle, #5895D0 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* Floating abstract shapes */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Morphing blob top-left */}
        <div
          className="absolute -top-16 -start-20 w-72 h-72 rounded-full bg-brand-blue/[0.04] blur-2xl"
          style={{ animation: "morph-blob 18s ease-in-out infinite" }}
        />
        {/* Gold ring mid-right */}
        <div
          className="absolute top-1/3 -end-10 w-40 h-40 rounded-full border-2 border-brand-gold/10"
          style={{ animation: "float-slow 14s ease-in-out infinite" }}
        />
        {/* Small blue dot */}
        <div
          className="absolute top-24 end-1/4 w-3 h-3 rounded-full bg-brand-blue/20"
          style={{ animation: "float-medium 8s ease-in-out infinite" }}
        />
        {/* Morphing blob bottom-right */}
        <div
          className="absolute -bottom-20 -end-32 w-80 h-80 rounded-full bg-brand-gold/[0.03] blur-3xl"
          style={{ animation: "morph-blob 22s ease-in-out infinite reverse" }}
        />
        {/* Star / cross shape */}
        <div
          className="absolute bottom-32 start-16 w-5 h-5 opacity-15"
          style={{ animation: "float-particle 10s ease-in-out infinite" }}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-full h-[1.5px] bg-brand-blue rounded-full" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-full w-[1.5px] bg-brand-blue rounded-full" />
          </div>
        </div>
      </div>

      <Container>
        <div ref={ref} className={cn(isAr && "text-right")}>
          {/* Section header with animated flanking lines */}
          <motion.div
            className="text-center mb-14"
            variants={headerVariants}
            initial="hidden"
            animate={visible ? "visible" : "hidden"}
          >
            <SectionLabel color="blue">
              {isAr ? "حول تجربة LEEE" : "About LEEE Experience"}
            </SectionLabel>

            <div className="flex items-center justify-center gap-4 mt-4">
              <motion.span
                className="w-8 h-[1.5px] bg-brand-blue origin-right"
                variants={lineVariants}
                initial="hidden"
                animate={visible ? "visible" : "hidden"}
              />
              <h2 className="font-serif text-3xl md:text-4xl lg:text-[2.75rem] text-text-primary leading-tight">
                {isAr
                  ? "نظرة شاملة على منظومتنا"
                  : "A Snapshot of Our Ecosystem"}
              </h2>
              <motion.span
                className="w-8 h-[1.5px] bg-brand-blue origin-left"
                variants={lineVariants}
                initial="hidden"
                animate={visible ? "visible" : "hidden"}
              />
            </div>
          </motion.div>

          {/* 4-quadrant grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
            {items.map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={i}
                  custom={i}
                  variants={cardVariants}
                  initial="hidden"
                  animate={visible ? "visible" : "hidden"}
                  className="group relative"
                >
                  {/* Gradient border wrapper */}
                  <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-br from-transparent via-transparent to-transparent group-hover:from-brand-blue/20 group-hover:via-transparent group-hover:to-brand-gold/20 transition-all duration-500 opacity-0 group-hover:opacity-100" />

                  <div
                    className={cn(
                      "relative bg-white rounded-2xl p-8 md:p-10 border border-surface-tertiary/50",
                      "transition-all duration-500",
                      "hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.12)] hover:-translate-y-[6px]"
                    )}
                  >
                    {/* Colored accent line at top - appears on hover */}
                    <div
                      className={cn(
                        "absolute top-0 start-8 end-8 h-[2.5px] rounded-full bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-500",
                        item.borderAccent
                      )}
                    />

                    {/* Icon with pulsing ring */}
                    <div className="relative w-14 h-14 mb-5">
                      {/* Pulsing outer ring */}
                      <div
                        className={cn(
                          "absolute -inset-2 rounded-xl border-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500",
                          item.ringColor
                        )}
                        style={{
                          animation: "float-medium 3s ease-in-out infinite",
                        }}
                      />
                      <div
                        className={cn(
                          "w-14 h-14 rounded-xl flex items-center justify-center relative z-10",
                          item.color
                        )}
                      >
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                    </div>

                    <h3 className="font-serif text-xl md:text-2xl text-text-primary mb-3">
                      {item.title}
                    </h3>
                    <p className="text-text-secondary text-sm md:text-base leading-relaxed">
                      {item.description}
                    </p>

                    {/* Decorative subtle ring in corner */}
                    <div
                      className={cn(
                        "absolute bottom-4 end-4 w-10 h-10 rounded-full border opacity-[0.06] group-hover:opacity-[0.12] transition-opacity duration-500",
                        item.ringColor
                      )}
                    />
                    {/* Tiny decorative dot */}
                    <div
                      className={cn(
                        "absolute top-6 end-6 w-1.5 h-1.5 rounded-full opacity-[0.15]",
                        item.color
                      )}
                    />

                    {/* Background gradient corner accent */}
                    <div
                      className={cn(
                        "absolute top-0 end-0 w-24 h-24 rounded-bl-[48px] bg-gradient-to-bl opacity-[0.03] group-hover:opacity-[0.06] transition-opacity duration-500",
                        item.accent
                      )}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </Container>
    </section>
  );
}
