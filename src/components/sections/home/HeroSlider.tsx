"use client";

import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import { motion } from "framer-motion";

const heroContent = {
  en: {
    tag: "Leadership & Empowerment",
    title: "We turn mindset",
    titleHighlight: "into movement",
    subtitle: "empowering women & youth through green, tech\u2011oriented, and inclusive business development.",
    cta: "Explore Our Programs",
  },
  ar: {
    tag: "\u0627\u0644\u0642\u064A\u0627\u062F\u0629 \u0648\u0627\u0644\u062A\u0645\u0643\u064A\u0646",
    title: "\u0646\u062D\u0648\u0651\u0644 \u0627\u0644\u0639\u0642\u0644\u064A\u0629",
    titleHighlight: "\u0625\u0644\u0649 \u062D\u0631\u0643\u0629",
    subtitle: "\u062A\u0645\u0643\u064A\u0646 \u0627\u0644\u0646\u0633\u0627\u0621 \u0648\u0627\u0644\u0634\u0628\u0627\u0628 \u0645\u0646 \u062E\u0644\u0627\u0644 \u0627\u0644\u062A\u0646\u0645\u064A\u0629 \u0627\u0644\u062E\u0636\u0631\u0627\u0621 \u0648\u0627\u0644\u062A\u0642\u0646\u064A\u0629 \u0648\u0627\u0644\u0634\u0627\u0645\u0644\u0629 \u0644\u0644\u0623\u0639\u0645\u0627\u0644.",
    cta: "\u0627\u0643\u062A\u0634\u0641 \u0628\u0631\u0627\u0645\u062C\u0646\u0627",
  },
};

export function HeroSlider() {
  const locale = useLocale();
  const isAr = locale === "ar";
  const content = isAr ? heroContent.ar : heroContent.en;

  return (
    <section
      className={cn(
        "relative bg-gradient-to-br from-surface-primary via-brand-blue-light to-surface-secondary overflow-hidden",
        "min-h-[600px] md:min-h-[680px] lg:min-h-[720px] flex items-center"
      )}
    >
      {/* Background decorative elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-20 -start-20 w-[500px] h-[500px] bg-brand-blue/[0.04] rounded-full blur-3xl" />
        <div className="absolute bottom-0 end-0 w-[600px] h-[600px] bg-brand-gold/[0.03] rounded-full blur-3xl" />
        <div className="absolute top-1/3 start-1/4 w-3 h-3 bg-brand-blue/20 rounded-full" />
        <div className="absolute top-2/3 end-1/3 w-2 h-2 bg-brand-gold/30 rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10 relative z-10 w-full py-16 md:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left: Text content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className={cn(isAr && "text-right")}
          >
            <span className="inline-flex items-center gap-2 text-brand-blue text-sm font-semibold uppercase tracking-[0.15em] mb-6">
              <span className="w-8 h-[2px] bg-brand-blue rounded-full" />
              {content.tag}
            </span>

            <h1 className="font-serif text-[clamp(2.2rem,5vw,4.2rem)] text-text-primary leading-[1.05] mb-6">
              {content.title}
              <br />
              <span className="text-brand-blue">{content.titleHighlight}</span>
            </h1>

            <p className="text-text-secondary text-xl md:text-2xl leading-relaxed mb-10 max-w-xl">
              {content.subtitle}
            </p>

            <Link
              href="/programs"
              className="group inline-flex items-center gap-3 bg-brand-blue text-white font-bold text-sm uppercase tracking-[0.15em] px-8 py-4 rounded-full hover:bg-brand-blue-dark transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              {content.cta}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform rtl:rotate-180 rtl:group-hover:-translate-x-1" />
            </Link>
          </motion.div>

          {/* Right: Image collage */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="relative h-[400px] md:h-[500px] lg:h-[550px] hidden md:block"
          >
            {/* Main image */}
            <div className="absolute top-0 start-0 w-[55%] h-[58%] rounded-2xl overflow-hidden shadow-2xl">
              <Image
                src="/images/new/lee-vest.jpg"
                alt="LEEE Experience"
                fill
                className="object-cover"
                priority
              />
            </div>
            {/* Second image */}
            <div className="absolute bottom-0 end-0 w-[50%] h-[48%] rounded-2xl overflow-hidden shadow-xl border-4 border-white">
              <Image
                src="/images/new/award-winner.jpg"
                alt="Impact"
                fill
                className="object-cover"
              />
            </div>
            {/* Third image */}
            <div className="absolute top-[15%] end-[5%] w-[35%] h-[35%] rounded-2xl overflow-hidden shadow-lg border-4 border-white">
              <Image
                src="/images/new/coaching-session.jpg"
                alt="Programs"
                fill
                className="object-cover"
              />
            </div>

            {/* Decorative floating elements */}
            <div className="absolute -top-4 end-[40%] w-16 h-16 bg-brand-gold/20 rounded-full blur-xl" />
            <div className="absolute bottom-[20%] -start-4 w-20 h-20 bg-brand-blue/10 rounded-full blur-xl" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
