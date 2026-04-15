"use client";

import { useLocale } from "next-intl";
import { Container } from "@/components/ui/Container";
import { SectionLabel } from "./SectionLabel";
import { cn } from "@/lib/utils";
import { useInView } from "@/hooks/useInView";
import { motion } from "framer-motion";

const ceoData = {
  en: {
    label: "Leadership",
    name: "CEO Name",
    title: "Founder & CEO",
    bio: "With over a decade of experience driving social enterprise and economic empowerment across MENA, our CEO leads LEEE Experience with a vision rooted in resilience, innovation, and inclusive growth. From incubating over 2,365 startups to mobilizing $1.06M in seed funding, his leadership has transformed thousands of lives across 10 countries.",
    quote: "Mindset is the first investment — everything else follows.",
    badge: "10+ Years",
  },
  ar: {
    label: "القيادة",
    name: "اسم المدير التنفيذي",
    title: "المؤسس والمدير التنفيذي",
    bio: "مع أكثر من عقد من الخبرة في قيادة المشاريع الاجتماعية والتمكين الاقتصادي عبر منطقة الشرق الأوسط وشمال أفريقيا، يقود مديرنا التنفيذي تجربة LEEE برؤية متجذرة في المرونة والابتكار والنمو الشامل.",
    quote: "العقلية هي الاستثمار الأول — وكل شيء آخر يتبع.",
    badge: "+10 سنوات",
  },
};

const photoVariants = {
  hidden: { opacity: 0, x: -60 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  },
};

const photoVariantsRtl = {
  hidden: { opacity: 0, x: 60 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  },
};

const textVariants = {
  hidden: { opacity: 0, x: 40 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: 0.15 + i * 0.1,
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1],
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
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

export function CEOSection() {
  const locale = useLocale();
  const isAr = locale === "ar";
  const c = isAr ? ceoData.ar : ceoData.en;
  const { ref, visible } = useInView(0.1);
  const textV = isAr ? textVariantsRtl : textVariants;
  const photoV = isAr ? photoVariantsRtl : photoVariants;

  return (
    <section className="py-20 md:py-28 bg-surface-primary relative overflow-hidden">
      {/* Floating abstract shapes */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Morphing blob top-right */}
        <div
          className="absolute -top-24 -end-32 w-96 h-96 rounded-full bg-brand-blue/[0.03] blur-3xl"
          style={{ animation: "morph-blob 20s ease-in-out infinite" }}
        />
        {/* Ring mid-left */}
        <div
          className="absolute top-1/2 -start-12 w-32 h-32 rounded-full border-2 border-brand-gold/10"
          style={{ animation: "float-slow 16s ease-in-out infinite" }}
        />
        {/* Blue dot */}
        <div
          className="absolute bottom-32 end-1/4 w-3 h-3 rounded-full bg-brand-blue/15"
          style={{ animation: "float-medium 9s ease-in-out infinite" }}
        />
        {/* Blob bottom-left */}
        <div
          className="absolute -bottom-16 -start-24 w-72 h-72 rounded-full bg-brand-gold/[0.03] blur-3xl"
          style={{ animation: "morph-blob 24s ease-in-out infinite reverse" }}
        />
        {/* Small emerald dot */}
        <div
          className="absolute top-20 end-32 w-2 h-2 rounded-full bg-emerald-400/20"
          style={{ animation: "float-particle 7s ease-in-out infinite" }}
        />
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[
          { top: "15%", start: "10%", size: "4px", delay: "0s", dur: "12s" },
          { top: "70%", start: "85%", size: "3px", delay: "2s", dur: "10s" },
          { top: "40%", start: "60%", size: "2px", delay: "4s", dur: "14s" },
          { top: "85%", start: "25%", size: "3px", delay: "1s", dur: "11s" },
          { top: "25%", start: "75%", size: "2px", delay: "3s", dur: "13s" },
          { top: "55%", start: "15%", size: "3px", delay: "5s", dur: "9s" },
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
          <div
            className={cn(
              "grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center"
            )}
          >
            {/* Photo with decorative elements */}
            <motion.div
              className={cn("lg:col-span-4", isAr && "lg:order-2")}
              variants={photoV}
              initial="hidden"
              animate={visible ? "visible" : "hidden"}
            >
              <div className="relative w-full max-w-sm mx-auto">
                {/* Decorative rotating ring behind photo */}
                <div
                  className="absolute -inset-4 md:-inset-6 rounded-2xl border border-brand-blue/10"
                  style={{
                    animation: "drift-horizontal 20s linear infinite",
                  }}
                />
                {/* Second decorative ring */}
                <div
                  className="absolute -inset-2 md:-inset-3 rounded-2xl border border-brand-gold/[0.07]"
                  style={{
                    animation: "float-slow 12s ease-in-out infinite",
                  }}
                />

                {/* Photo container */}
                <div className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-xl bg-gradient-to-br from-brand-blue to-brand-blue-dark">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-6xl font-serif text-white/30">
                      CEO
                    </span>
                  </div>

                  {/* Glowing accent at bottom */}
                  <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-brand-blue/40 to-transparent" />
                  <div className="absolute bottom-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-brand-gold/60 to-transparent" />
                </div>

                {/* Glass morphism badge */}
                <div
                  className={cn(
                    "absolute -bottom-3 z-10",
                    isAr ? "-start-3" : "-end-3"
                  )}
                >
                  <div className="px-4 py-2 rounded-xl bg-white/70 backdrop-blur-md border border-white/40 shadow-lg">
                    <span className="text-xs font-semibold text-brand-blue/80 block leading-none">
                      {c.badge}
                    </span>
                    <span className="text-[10px] text-text-secondary mt-0.5 block">
                      {isAr ? "من القيادة" : "Leadership"}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Content with staggered cascade */}
            <div className={cn("lg:col-span-8", isAr && "lg:order-1")}>
              <motion.div
                custom={0}
                variants={textV}
                initial="hidden"
                animate={visible ? "visible" : "hidden"}
              >
                <SectionLabel color="blue">{c.label}</SectionLabel>
              </motion.div>

              <motion.h2
                className="font-serif text-3xl md:text-4xl lg:text-[2.75rem] text-text-primary mt-4 mb-1 leading-tight"
                custom={1}
                variants={textV}
                initial="hidden"
                animate={visible ? "visible" : "hidden"}
              >
                {c.name}
              </motion.h2>

              <motion.p
                className="text-brand-blue font-semibold text-lg md:text-xl mb-6 tracking-wide"
                custom={2}
                variants={textV}
                initial="hidden"
                animate={visible ? "visible" : "hidden"}
              >
                {c.title}
              </motion.p>

              <motion.p
                className="text-text-secondary text-base md:text-lg leading-relaxed mb-8 max-w-2xl"
                custom={3}
                variants={textV}
                initial="hidden"
                animate={visible ? "visible" : "hidden"}
              >
                {c.bio}
              </motion.p>

              {/* Premium pullquote */}
              <motion.div
                className="relative max-w-2xl"
                custom={4}
                variants={textV}
                initial="hidden"
                animate={visible ? "visible" : "hidden"}
              >
                <div className="relative rounded-xl p-6 md:p-8 bg-gradient-to-br from-surface-secondary/60 to-surface-secondary/30 border border-surface-tertiary/40 overflow-hidden">
                  {/* Accent bar on the left/right for RTL */}
                  <div
                    className={cn(
                      "absolute top-4 bottom-4 w-[3px] rounded-full bg-brand-blue",
                      isAr ? "end-0" : "start-0"
                    )}
                  />

                  {/* Large decorative quotation marks */}
                  <span
                    className={cn(
                      "absolute font-serif text-6xl md:text-7xl text-brand-blue/[0.08] leading-none select-none",
                      isAr
                        ? "top-2 end-4"
                        : "top-2 start-4"
                    )}
                  >
                    &ldquo;
                  </span>
                  <span
                    className={cn(
                      "absolute font-serif text-6xl md:text-7xl text-brand-blue/[0.08] leading-none select-none",
                      isAr
                        ? "bottom-0 start-4"
                        : "bottom-0 end-4"
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
                    {c.quote}
                  </p>

                  {/* Subtle background glow */}
                  <div className="absolute -top-8 -end-8 w-32 h-32 rounded-full bg-brand-blue/[0.04] blur-2xl" />
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
