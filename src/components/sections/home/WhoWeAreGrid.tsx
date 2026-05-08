"use client";

import { useLocale } from "next-intl";
import { Container } from "@/components/ui/Container";
import { SectionLabel } from "./SectionLabel";
import { cn } from "@/lib/utils";
import { Building2, Lightbulb, Users, MapPin } from "lucide-react";
import { useInView } from "@/hooks/useInView";
import { motion } from "framer-motion";
import Image from "next/image";
import { useState, useCallback } from "react";

const quadrants = {
  en: [
    {
      icon: Building2,
      title: "Who We Are",
      description:
        "A dual-structure ecosystem — a non-profit foundation and a for-profit incubator — united by a single mission to drive sustainable community impact across MENA & Africa.",
      color: "#147DBB",
      image: "/images/new/group-photo.jpg",
    },
    {
      icon: Lightbulb,
      title: "What We Do",
      description:
        "We incubate startups, deliver technical assistance and capacity building, run academies, provide business clinics, and lead humanitarian aid programs — turning ideas into lasting change.",
      color: "#3FAC49",
      image: "/images/new/coaching-session.jpg",
    },
    {
      icon: Users,
      title: "Who We Serve",
      description:
        "Women entrepreneurs, youth, MSMEs, cooperatives, NGOs, and vulnerable communities in post-conflict and developing regions seeking economic empowerment and decent work.",
      color: "#F8B51F",
      image: "/images/new/women-thumbsup.jpg",
    },
    {
      icon: MapPin,
      title: "Where We Work",
      description:
        "Active across 10 countries including Lebanon, Egypt, Jordan, Iraq, Tunisia, and expanding across the MENA region and Africa.",
      color: "#ED6E28",
      image: "/images/new/intl-professionals.jpg",
    },
  ],
  ar: [
    {
      icon: Building2,
      title: "من نحن",
      description:
        "منظومة مزدوجة — مؤسسة غير ربحية وحاضنة أعمال ربحية — متحدتان برسالة واحدة لدفع التأثير المجتمعي المستدام عبر منطقة الشرق الأوسط وشمال أفريقيا.",
      color: "#147DBB",
      image: "/images/new/group-photo.jpg",
    },
    {
      icon: Lightbulb,
      title: "ماذا نفعل",
      description:
        "نحتضن الشركات الناشئة، ونقدم المساعدة التقنية وبناء القدرات، وندير الأكاديميات، ونوفر عيادات الأعمال، ونقود برامج المساعدات الإنسانية.",
      color: "#3FAC49",
      image: "/images/new/coaching-session.jpg",
    },
    {
      icon: Users,
      title: "من نخدم",
      description:
        "رائدات الأعمال، الشباب، المشاريع الصغيرة والمتوسطة، التعاونيات، المنظمات غير الحكومية، والمجتمعات الضعيفة الساعية للتمكين الاقتصادي.",
      color: "#F8B51F",
      image: "/images/new/women-thumbsup.jpg",
    },
    {
      icon: MapPin,
      title: "أين نعمل",
      description:
        "ننشط في أكثر من 10 دول بما في ذلك لبنان ومصر والأردن والعراق وتونس، ونتوسع عبر منطقة الشرق الأوسط وشمال أفريقيا وأفريقيا.",
      color: "#ED6E28",
      image: "/images/new/intl-professionals.jpg",
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

const lineVariants = {
  hidden: { scaleX: 0 },
  visible: {
    scaleX: 1,
    transition: { duration: 0.5, delay: 0.3, ease: "easeOut" as const },
  },
} as const;

function FlipCard({
  item,
  index,
  visible,
}: {
  item: (typeof quadrants.en)[0];
  index: number;
  visible: boolean;
}) {
  const Icon = item.icon;
  const [flipped, setFlipped] = useState(false);

  const toggle = useCallback(() => setFlipped((f) => !f), []);
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggle();
      }
    },
    [toggle]
  );

  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate={visible ? "visible" : "hidden"}
      className="group [perspective:1200px]"
    >
      <div
        role="button"
        tabIndex={0}
        aria-expanded={flipped}
        onClick={toggle}
        onKeyDown={handleKeyDown}
        className={cn(
          "relative h-[320px] md:h-[380px] w-full transition-transform duration-700 ease-in-out [transform-style:preserve-3d] cursor-pointer",
          flipped
            ? "[transform:rotateY(180deg)]"
            : "md:group-hover:[transform:rotateY(180deg)]"
        )}
      >
        {/* ===== FRONT — Full image ===== */}
        <div className="absolute inset-0 [backface-visibility:hidden] rounded-2xl overflow-hidden shadow-lg">
          <Image
            src={item.image}
            alt={item.title}
            fill
            className="object-cover"
          />
          {/* Dark gradient for readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

          {/* Title + icon at bottom */}
          <div className="absolute bottom-0 inset-x-0 p-6 md:p-8">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center mb-3 shadow-md"
              style={{ backgroundColor: item.color }}
            >
              <Icon className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-serif text-2xl md:text-[1.7rem] text-white leading-tight">
              {item.title}
            </h3>
          </div>

          {/* Interaction hint — visible on mobile, hover-reveal on desktop */}
          <div className="absolute top-4 end-4 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm text-white/80 text-xs font-medium tracking-wide opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            Tap to flip
          </div>
        </div>

        {/* ===== BACK — Content ===== */}
        <div
          className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] rounded-2xl overflow-hidden shadow-lg flex flex-col justify-center p-5 md:p-10"
          style={{ backgroundColor: item.color }}
        >
          <div className="relative z-10">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-white/20 flex items-center justify-center mb-3 md:mb-5">
              <Icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>

            <h3 className="font-serif text-xl md:text-[1.7rem] text-white mb-2 md:mb-4 leading-tight">
              {item.title}
            </h3>

            <p className="text-white/90 text-sm md:text-base leading-relaxed">
              {item.description}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function WhoWeAreGrid() {
  const locale = useLocale();
  const isAr = locale === "ar";
  const items = isAr ? quadrants.ar : quadrants.en;
  const { ref, visible } = useInView(0.1);

  return (
    <section className="py-20 md:py-28 bg-surface-primary relative overflow-hidden">
      <Container>
        <div ref={ref} className={cn(isAr && "text-end")}>
          {/* Section header */}
          <motion.div
            className="text-center mb-14"
            variants={headerVariants}
            initial="hidden"
            animate={visible ? "visible" : "hidden"}
          >
            <SectionLabel color="blue">
              {isAr ? "حول تجربة LEE" : "About LEE Experience"}
            </SectionLabel>

            <div className="flex items-center justify-center gap-4 mt-4">
              <motion.span
                className="w-8 h-[1.5px] bg-brand-blue origin-right"
                variants={lineVariants}
                initial="hidden"
                animate={visible ? "visible" : "hidden"}
              />
              <h2 className="font-serif text-[clamp(1.75rem,3vw,2.5rem)] text-text-primary leading-tight">
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

          {/* 4-quadrant flip card grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
            {items.map((item, i) => (
              <FlipCard
                key={i}
                item={item}
                index={i}
                visible={visible}
              />
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
