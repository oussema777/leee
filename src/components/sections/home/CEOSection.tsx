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
      bio: "With over a decade of experience driving social enterprise and economic empowerment across MENA, Manel leads LEE Experience with a vision rooted in resilience, innovation, and inclusive growth. From incubating over 2,365 startups to mobilizing $3M+ in funds, her leadership has transformed thousands of lives across 10 countries.",
      quote: "Mindset is the first investment — everything else follows.",
      badge: "10+ Years",
      badgeSub: "Leadership",
    },
    {
      name: "Assem Kamel",
      title: "Co-Founder & President, LEE Experience | CEO, SEKETAK Solutions & Sunup",
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
      bio: "مع أكثر من عقد من الخبرة في قيادة المشاريع الاجتماعية والتمكين الاقتصادي عبر منطقة الشرق الأوسط وشمال أفريقيا، تقود منال تجربة LEE برؤية متجذرة في المرونة والابتكار والنمو الشامل. من احتضان أكثر من 2,365 شركة ناشئة إلى تعبئة أكثر من 3 مليون دولار من الأموال.",
      quote: "العقلية هي الاستثمار الأول — وكل شيء آخر يتبع.",
      badge: "+10 سنوات",
      badgeSub: "من القيادة",
    },
    {
      name: "عاصم كامل",
      title: "المؤسس المشارك ورئيس LEE Experience | المدير التنفيذي، SEKETAK Solutions و Sunup",
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
          <div className="relative rounded-2xl overflow-hidden shadow-xl">
            <Image
              src={founder.image}
              alt={founder.name}
              width={400}
              height={533}
              className="w-full h-auto object-contain"
              priority
            />
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
          className="font-serif text-2xl md:text-3xl text-text-primary mb-1 leading-tight"
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
          <div className="rounded-xl p-6 md:p-8 bg-surface-secondary/50 border border-surface-tertiary/40">
            <p className="font-serif text-lg md:text-xl text-text-primary italic">
              &ldquo;{founder.quote}&rdquo;
            </p>
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
    <section className="py-20 md:py-28 bg-surface-secondary relative overflow-hidden">
      <Container>
        <div ref={ref} className={cn(isAr && "text-end")}>
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
            <h2 className="font-serif text-[clamp(1.75rem,3vw,2.5rem)] text-text-primary leading-tight mt-4">
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
