"use client";

import { useLocale } from "next-intl";
import { Container } from "@/components/ui/Container";
import { SectionLabel } from "./SectionLabel";
import { cn } from "@/lib/utils";
import { useInView } from "@/hooks/useInView";
import { motion } from "framer-motion";
import Image from "next/image";

const founders = {
  en: [
    {
      name: "Manel Hassoun",
      title: "Founder & CEO",
      image: "/images/new/manal-hassoun.png",
      bio: "With over a decade of experience driving social enterprise and economic empowerment across MENA, Manel leads LEEE Experience with a vision rooted in resilience, innovation, and inclusive growth. From incubating over 2,365 startups to mobilizing $1.06M in seed funding, her leadership has transformed thousands of lives across 10 countries.",
      quote: "Mindset is the first investment — everything else follows.",
      badge: "10+ Years",
      badgeSub: "Leadership",
    },
    {
      name: "Assem Kamel",
      title: "Co-Founder",
      image: "/images/new/assem-kamel.png",
      bio: "A strategic visionary committed to building sustainable ecosystems for social impact. Assem brings deep expertise in business development, partnership building, and scaling impact-driven initiatives across the MENA region and Africa.",
      quote: "Impact scales when purpose meets partnership.",
      badge: "MENA & Africa",
      badgeSub: "Strategy",
    },
  ],
  ar: [
    {
      name: "منال حسون",
      title: "المؤسِّسة والمديرة التنفيذية",
      image: "/images/new/manal-hassoun.png",
      bio: "مع أكثر من عقد من الخبرة في قيادة المشاريع الاجتماعية والتمكين الاقتصادي عبر منطقة الشرق الأوسط وشمال أفريقيا، تقود منال تجربة LEEE برؤية متجذرة في المرونة والابتكار والنمو الشامل. من احتضان أكثر من 2,365 شركة ناشئة إلى تعبئة أكثر من 1.06 مليون دولار في التمويل الأولي.",
      quote: "العقلية هي الاستثمار الأول — وكل شيء آخر يتبع.",
      badge: "+10 سنوات",
      badgeSub: "من القيادة",
    },
    {
      name: "عاصم كامل",
      title: "المؤسس المشارك",
      image: "/images/new/assem-kamel.png",
      bio: "صاحب رؤية استراتيجية ملتزم ببناء منظومات مستدامة للتأثير الاجتماعي. يجلب عاصم خبرة عميقة في تطوير الأعمال وبناء الشراكات وتوسيع المبادرات المؤثرة عبر منطقة الشرق الأوسط وشمال أفريقيا وأفريقيا.",
      quote: "يتوسع التأثير عندما يلتقي الهدف بالشراكة.",
      badge: "الشرق الأوسط وأفريقيا",
      badgeSub: "الاستراتيجية",
    },
  ],
};

const photoVariantsLtr = {
  hidden: { opacity: 0, x: -60 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
  },
} as const;

const photoVariantsRtl = {
  hidden: { opacity: 0, x: 60 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
  },
} as const;

const textVariantsLtr = {
  hidden: { opacity: 0, x: 40 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: 0.15 + i * 0.1,
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  }),
};

const textVariantsRtl = {
  hidden: { opacity: 0, x: -40 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: 0.15 + i * 0.1,
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  }),
};

const headerVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  },
} as const;

function FounderRow({
  founder,
  isAr,
  visible,
  reverse,
}: {
  founder: (typeof founders.en)[0];
  isAr: boolean;
  visible: boolean;
  reverse: boolean;
}) {
  const textV = isAr ? textVariantsRtl : textVariantsLtr;
  const photoV = isAr ? photoVariantsRtl : photoVariantsLtr;

  return (
    <div
      className={cn(
        "grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center"
      )}
    >
      {/* Photo */}
      <motion.div
        className={cn(
          "lg:col-span-4",
          reverse ? (isAr ? "lg:order-1" : "lg:order-2") : (isAr ? "lg:order-2" : "lg:order-1")
        )}
        variants={photoV}
        initial="hidden"
        animate={visible ? "visible" : "hidden"}
      >
        <div className="relative w-full max-w-sm mx-auto">
          {/* Decorative rings */}
          <div
            className="absolute -inset-4 md:-inset-6 rounded-2xl border border-brand-blue/10"
            style={{ animation: "drift-horizontal 20s linear infinite" }}
          />
          <div
            className="absolute -inset-2 md:-inset-3 rounded-2xl border border-brand-gold/[0.07]"
            style={{ animation: "float-slow 12s ease-in-out infinite" }}
          />

          {/* Photo — full natural height */}
          <div className="relative rounded-2xl overflow-hidden shadow-xl">
            <Image
              src={founder.image}
              alt={founder.name}
              width={400}
              height={533}
              className="w-full h-auto object-contain"
              priority
            />
            {/* Bottom glow accent */}
            <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-black/30 to-transparent" />
            <div className="absolute bottom-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-brand-gold/60 to-transparent" />
          </div>

          {/* Glass badge */}
          <div
            className={cn(
              "absolute -bottom-3 z-10",
              isAr ? "-start-3" : "-end-3"
            )}
          >
            <div className="px-4 py-2 rounded-xl bg-white/70 backdrop-blur-md border border-white/40 shadow-lg">
              <span className="text-xs font-semibold text-brand-blue/80 block leading-none">
                {founder.badge}
              </span>
              <span className="text-[10px] text-text-secondary mt-0.5 block">
                {founder.badgeSub}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Content */}
      <div
        className={cn(
          "lg:col-span-8",
          reverse ? (isAr ? "lg:order-2" : "lg:order-1") : (isAr ? "lg:order-1" : "lg:order-2")
        )}
      >
        <motion.h3
          className="font-serif text-3xl md:text-4xl lg:text-[2.75rem] text-text-primary mb-1 leading-tight"
          custom={0}
          variants={textV}
          initial="hidden"
          animate={visible ? "visible" : "hidden"}
        >
          {founder.name}
        </motion.h3>

        <motion.p
          className="text-brand-blue font-semibold text-lg md:text-xl mb-6 tracking-wide"
          custom={1}
          variants={textV}
          initial="hidden"
          animate={visible ? "visible" : "hidden"}
        >
          {founder.title}
        </motion.p>

        <motion.p
          className="text-text-secondary text-base md:text-lg leading-relaxed mb-8 max-w-2xl"
          custom={2}
          variants={textV}
          initial="hidden"
          animate={visible ? "visible" : "hidden"}
        >
          {founder.bio}
        </motion.p>

        {/* Quote */}
        <motion.div
          className="relative max-w-2xl"
          custom={3}
          variants={textV}
          initial="hidden"
          animate={visible ? "visible" : "hidden"}
        >
          <div className="relative rounded-xl p-6 md:p-8 bg-gradient-to-br from-surface-secondary/60 to-surface-secondary/30 border border-surface-tertiary/40 overflow-hidden">
            <div
              className={cn(
                "absolute top-4 bottom-4 w-[3px] rounded-full bg-brand-blue",
                isAr ? "end-0" : "start-0"
              )}
            />
            <span
              className={cn(
                "absolute font-serif text-6xl md:text-7xl text-brand-blue/[0.08] leading-none select-none",
                isAr ? "top-2 end-4" : "top-2 start-4"
              )}
            >
              &ldquo;
            </span>
            <span
              className={cn(
                "absolute font-serif text-6xl md:text-7xl text-brand-blue/[0.08] leading-none select-none",
                isAr ? "bottom-0 start-4" : "bottom-0 end-4"
              )}
            >
              &rdquo;
            </span>
            <p
              className={cn(
                "font-serif text-lg md:text-xl text-text-primary italic relative z-10",
                isAr ? "pe-6" : "ps-6"
              )}
            >
              {founder.quote}
            </p>
            <div className="absolute -top-8 -end-8 w-32 h-32 rounded-full bg-brand-blue/[0.04] blur-2xl" />
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export function CEOSection() {
  const locale = useLocale();
  const isAr = locale === "ar";
  const team = isAr ? founders.ar : founders.en;
  const { ref, visible } = useInView(0.1);

  return (
    <section className="py-20 md:py-28 bg-surface-primary relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute -top-24 -end-32 w-96 h-96 rounded-full bg-brand-blue/[0.03] blur-3xl"
          style={{ animation: "morph-blob 20s ease-in-out infinite" }}
        />
        <div
          className="absolute top-1/2 -start-12 w-32 h-32 rounded-full border-2 border-brand-gold/10"
          style={{ animation: "float-slow 16s ease-in-out infinite" }}
        />
        <div
          className="absolute -bottom-16 -start-24 w-72 h-72 rounded-full bg-brand-gold/[0.03] blur-3xl"
          style={{ animation: "morph-blob 24s ease-in-out infinite reverse" }}
        />
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[
          { top: "15%", start: "10%", size: "4px", delay: "0s", dur: "12s" },
          { top: "70%", start: "85%", size: "3px", delay: "2s", dur: "10s" },
          { top: "40%", start: "60%", size: "2px", delay: "4s", dur: "14s" },
          { top: "85%", start: "25%", size: "3px", delay: "1s", dur: "11s" },
        ].map((p, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-brand-blue/10"
            style={{
              top: p.top,
              insetInlineStart: p.start,
              width: p.size,
              height: p.size,
              animation: `float-particle ${p.dur} ease-in-out ${p.delay} infinite`,
            }}
          />
        ))}
      </div>

      <Container>
        <div ref={ref} className={cn(isAr && "text-right")}>
          {/* Section header */}
          <motion.div
            className="text-center mb-16 md:mb-20"
            variants={headerVariants}
            initial="hidden"
            animate={visible ? "visible" : "hidden"}
          >
            <SectionLabel color="blue">
              {isAr ? "القيادة" : "Leadership"}
            </SectionLabel>
            <h2 className="font-serif text-3xl md:text-4xl lg:text-[2.75rem] text-text-primary leading-tight mt-4">
              {isAr ? "تعرّف على مؤسسينا" : "Meet Our Founders"}
            </h2>
          </motion.div>

          {/* Founder 1 — photo left, content right */}
          <FounderRow
            founder={team[0]}
            isAr={isAr}
            visible={visible}
            reverse={false}
          />

          {/* Divider */}
          <div className="my-16 md:my-20 flex items-center justify-center gap-4">
            <span className="w-12 h-[1.5px] bg-brand-blue/15 rounded-full" />
            <span className="w-2 h-2 rounded-full bg-brand-gold/30" />
            <span className="w-12 h-[1.5px] bg-brand-blue/15 rounded-full" />
          </div>

          {/* Founder 2 — photo right, content left */}
          <FounderRow
            founder={team[1]}
            isAr={isAr}
            visible={visible}
            reverse={true}
          />
        </div>
      </Container>
    </section>
  );
}
