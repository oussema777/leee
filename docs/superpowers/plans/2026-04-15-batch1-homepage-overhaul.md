# Batch 1: Homepage Overhaul — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the LEEE Experience homepage per client feedback — simplified hero, 2030 vision ribbon, impact stats, 4-quadrant about section, CEO section, refactored partner marquee, and social media bar.

**Architecture:** Rework/replace 4 existing homepage components (HeroSlider, AboutSection, StatsCounter, PartnersCarousel), add 4 new components (VisionRibbon, WhoWeAreGrid, CEOSection, SocialMediaBar), remove 3 components from homepage (QuickAccessCards, AttendEvents, ParallaxImpact). Extract shared `useInView` hook. Centralize social media URLs. All content hardcoded in components with bilingual EN/AR support.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS 4, Framer Motion, next-intl, lucide-react

**Spec:** `docs/superpowers/specs/2026-04-15-client-feedback-redesign-design.md`

**Important notes:**
- `StatsCounter` and `PartnersCarousel` exist as files but are NOT currently imported in `page.tsx` — they will be *added* to the homepage (not just reordered)
- `AboutSection` is currently on the homepage — it will be *replaced* by `WhoWeAreGrid`

---

## File Structure

### Files to Modify
| File | Responsibility | Changes |
|------|---------------|---------|
| `src/app/[locale]/page.tsx` | Homepage composition | Remove old sections, add new ones (including StatsCounter & PartnersCarousel which exist but aren't currently imported), reorder |
| `src/components/sections/home/HeroSlider.tsx` | Hero section (316 lines) | Complete rework — single hero instead of 3-slide carousel |
| `src/components/sections/home/StatsCounter.tsx` | Impact stats (122 lines) | Refactor — rename heading, add missing metrics, change icon system |
| `src/components/sections/home/PartnersCarousel.tsx` | Partner logos (79 lines) | Add gradient fade edges for cleaner look |

### Files to Create
| File | Responsibility |
|------|---------------|
| `src/hooks/useInView.ts` | Shared IntersectionObserver hook (extracted from duplicated pattern) |
| `src/lib/socialLinks.ts` | Centralized social media URLs (used by Footer + SocialMediaBar) |
| `src/components/sections/home/VisionRibbon.tsx` | "Our 2030 Vision" full-width ribbon |
| `src/components/sections/home/WhoWeAreGrid.tsx` | 4-quadrant grid replacing AboutSection |
| `src/components/sections/home/CEOSection.tsx` | CEO profile with photo and bio |
| `src/components/layout/SocialMediaBar.tsx` | Reusable social icons bar for all pages |

### Files Left Unchanged (kept in homepage)
- `src/components/sections/home/ProgramsSection.tsx`
- `src/components/sections/home/JoinCommunity.tsx`
- `src/components/sections/home/LatestBeats.tsx`
- `src/components/sections/home/CTABanner.tsx`

### Files Removed from Homepage (not deleted, just no longer imported)
- `src/components/sections/home/QuickAccessCards.tsx`
- `src/components/sections/home/AttendEvents.tsx`
- `src/components/sections/home/AboutSection.tsx`
- `src/components/sections/home/ParallaxImpact.tsx`

---

## Task 1: Rework HeroSlider to Single Hero

**Files:**
- Modify: `src/components/sections/home/HeroSlider.tsx`

The current HeroSlider (316 lines) has 3 rotating slides with auto-advance, progress bars, and image collages. Replace with a single static hero showing one clear headline and the approved hero text.

- [ ] **Step 1: Read the current HeroSlider.tsx fully to understand the structure**

Read `src/components/sections/home/HeroSlider.tsx` in its entirety.

- [ ] **Step 2: Rewrite HeroSlider.tsx as a single hero**

Replace the entire component. Key changes:
- Remove `useState` for slide index, `useEffect` for auto-rotation, `useCallback` for navigation
- Remove `demoSlides` array — replace with single hero content
- Keep the 2-column grid layout (text left, images right)
- Keep the decorative background elements (blobs, dots) — they match the site's design language
- Keep bilingual support via `useLocale()`

New content:
- **Tag line:** "Leadership & Empowerment" / Arabic equivalent
- **Main headline:** "We turn mindset into movement" / Arabic
- **Sub-text:** "empowering women & youth through green, tech-oriented, and inclusive business development." / Arabic
- **CTA:** "Explore Our Programs" → `/programs`
- **Single image collage** using the best images from the existing slides

The component should:
- Keep `min-h-[600px] md:min-h-[680px] lg:min-h-[720px]`
- Keep `bg-gradient-to-br from-surface-primary via-brand-blue-light to-surface-secondary`
- Keep the 2-column `grid grid-cols-1 lg:grid-cols-2` layout
- Use `motion.div` from framer-motion for a single entrance animation (no carousel)
- Remove slide indicators/progress bars entirely

```tsx
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
    subtitle: "empowering women & youth through green, tech‑oriented, and inclusive business development.",
    cta: "Explore Our Programs",
  },
  ar: {
    tag: "القيادة والتمكين",
    title: "نحوّل العقلية",
    titleHighlight: "إلى حركة",
    subtitle: "تمكين النساء والشباب من خلال التنمية الخضراء والتقنية والشاملة للأعمال.",
    cta: "اكتشف برامجنا",
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
      {/* Background decorative elements — keep existing blob/dot pattern */}
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
```

- [ ] **Step 3: Verify build passes**

Run: `npm run build`
Expected: No build errors related to HeroSlider

- [ ] **Step 4: Commit**

```bash
git add src/components/sections/home/HeroSlider.tsx
git commit -m "feat(homepage): simplify hero to single headline per client feedback"
```

---

## Task 2: Create Shared useInView Hook + VisionRibbon Component

**Files:**
- Create: `src/hooks/useInView.ts`
- Create: `src/components/sections/home/VisionRibbon.tsx`

Extract the shared IntersectionObserver hook (used by VisionRibbon, WhoWeAreGrid, CEOSection), then create the vision ribbon.

- [ ] **Step 0: Create shared useInView hook**

Create `src/hooks/useInView.ts`:

```tsx
import { useRef, useState, useEffect } from "react";

export function useInView(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true); },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}
```

- [ ] **Step 1: Create VisionRibbon.tsx**

```tsx
"use client";

import { useLocale } from "next-intl";
import { cn } from "@/lib/utils";
import { Target } from "lucide-react";

import { useInView } from "@/hooks/useInView";

const content = {
  en: {
    label: "Our 2030 Vision",
    text: "To be the leading catalyst for a resilient, green economy across MENA & Africa, powered by women innovators",
  },
  ar: {
    label: "رؤيتنا 2030",
    text: "أن نكون المحفز الرائد لاقتصاد أخضر ومرن عبر منطقة الشرق الأوسط وشمال أفريقيا، بقيادة النساء المبتكرات",
  },
};

export function VisionRibbon() {
  const locale = useLocale();
  const isAr = locale === "ar";
  const c = isAr ? content.ar : content.en;
  const { ref, visible } = useInView(0.3);

  return (
    <section
      ref={ref}
      className="relative bg-gradient-to-r from-brand-blue-deeper via-brand-blue-dark to-brand-blue py-12 md:py-16 overflow-hidden"
    >
      {/* Subtle background pattern */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 start-0 w-full h-full bg-[radial-gradient(circle_at_20%_50%,rgba(255,255,255,0.05),transparent_50%)]" />
        <div className="absolute top-0 end-0 w-full h-full bg-[radial-gradient(circle_at_80%_50%,rgba(255,255,255,0.03),transparent_50%)]" />
      </div>

      <div className="max-w-5xl mx-auto px-5 sm:px-8 lg:px-10 relative z-10">
        <div
          className={cn(
            "flex flex-col items-center text-center transition-all duration-700",
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          )}
        >
          <span className="inline-flex items-center gap-2 text-brand-gold text-sm font-semibold uppercase tracking-[0.2em] mb-4">
            <Target className="w-4 h-4" />
            {c.label}
          </span>

          <p className="font-serif text-xl md:text-2xl lg:text-3xl text-white leading-relaxed max-w-4xl">
            &ldquo;{c.text}&rdquo;
          </p>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Verify build passes**

Run: `npm run build`
Expected: Component compiles without errors (not yet imported anywhere)

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useInView.ts src/components/sections/home/VisionRibbon.tsx
git commit -m "feat(homepage): add shared useInView hook and 2030 Vision ribbon component"
```

---

## Task 3: Refactor StatsCounter into Impact at a Glance

**Files:**
- Modify: `src/components/sections/home/StatsCounter.tsx`

Currently has 5 stats (Lives Touched, Startups Incubated, Seed Funding, Countries, Green Ventures). Update heading to "Impact at a Glance" and add missing metrics per client request: Women reached %, Youth supported, Programs/Projects delivered, Partners/Donors.

- [ ] **Step 1: Read current StatsCounter.tsx**

Read `src/components/sections/home/StatsCounter.tsx` to confirm current state.

- [ ] **Step 2: Rewrite StatsCounter.tsx completely**

Replace the entire file. Key changes from original:
- Remove `useTranslations` (no longer used) — use `useLocale` for bilingual heading
- Remove string-based `iconMap` — pass icon components directly
- Change `StatItem` icon prop from `string` to `React.ComponentType`
- Expand from 5 to 8 stats (add Women Reached, Youth Supported, Programs Delivered)
- Change grid from `lg:grid-cols-5` to `grid-cols-2 md:grid-cols-4`
- Change heading to "Impact at a Glance"

Complete replacement:

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { Container } from "@/components/ui/Container";
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

function useCountUp(target: number, isVisible: boolean, duration = 2000) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!isVisible) return;
    let start = 0;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [target, isVisible, duration]);
  return count;
}

function StatItem({
  label,
  value,
  suffix,
  prefix,
  icon: Icon,
  isVisible,
}: {
  label: string;
  value: number;
  suffix: string;
  prefix: string;
  icon: React.ComponentType<{ className?: string }>;
  isVisible: boolean;
}) {
  const count = useCountUp(value, isVisible);
  return (
    <div className="text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-white/15 text-white mb-3 rounded-xl">
        <Icon className="w-8 h-8" />
      </div>
      <div className="text-3xl md:text-4xl font-bold text-white mb-1">
        {prefix}{count.toLocaleString()}{suffix}
      </div>
      <div className="text-white/80 font-medium text-sm uppercase tracking-wider">
        {label}
      </div>
    </div>
  );
}

export function StatsCounter() {
  const locale = useLocale();
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
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref} className="bg-gradient-to-br from-brand-blue-deeper via-brand-blue-dark to-brand-blue py-16 md:py-20">
      <Container>
        <h2 className="text-center text-2xl md:text-3xl font-bold text-white mb-12">
          {locale === "ar" ? "تأثيرنا بلمحة" : "Impact at a Glance"}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {demoStats.map((stat) => (
            <StatItem
              key={stat.id}
              label={locale === "ar" ? stat.labelAr : stat.labelEn}
              value={stat.value}
              suffix={stat.suffix}
              prefix={stat.prefix}
              icon={stat.icon}
              isVisible={isVisible}
            />
          ))}
        </div>
      </Container>
    </section>
  );
}
```

- [ ] **Step 3: Verify build passes**

Run: `npm run build`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/components/sections/home/StatsCounter.tsx
git commit -m "feat(homepage): refactor stats into Impact at a Glance with 8 metrics"
```

---

## Task 4: Create WhoWeAreGrid Component

**Files:**
- Create: `src/components/sections/home/WhoWeAreGrid.tsx`

Replaces `AboutSection` on the homepage. 4-quadrant visual layout answering: Who we are? What we do? Who we serve? Where we work?

- [ ] **Step 1: Create WhoWeAreGrid.tsx**

```tsx
"use client";

import { useLocale } from "next-intl";
import { Container } from "@/components/ui/Container";
import { SectionLabel } from "./SectionLabel";
import { cn } from "@/lib/utils";
import { Building2, Lightbulb, Users, MapPin } from "lucide-react";
import { useInView } from "@/hooks/useInView";

const quadrants = {
  en: [
    {
      icon: Building2,
      title: "Who We Are",
      description: "A dual-structure ecosystem — a non-profit foundation and a for-profit incubator — united by a single mission to drive sustainable community impact across MENA & Africa.",
      color: "bg-brand-blue",
    },
    {
      icon: Lightbulb,
      title: "What We Do",
      description: "We incubate startups, deliver technical assistance and capacity building, run academies, provide business clinics, and lead humanitarian aid programs — turning ideas into lasting change.",
      color: "bg-emerald-500",
    },
    {
      icon: Users,
      title: "Who We Serve",
      description: "Women entrepreneurs, youth, MSMEs, cooperatives, NGOs, and vulnerable communities in post-conflict and developing regions seeking economic empowerment and decent work.",
      color: "bg-brand-gold",
    },
    {
      icon: MapPin,
      title: "Where We Work",
      description: "Active across 10 countries including Lebanon, Egypt, Jordan, Iraq, Tunisia, and expanding across the MENA region and Africa.",
      color: "bg-rose-500",
    },
  ],
  ar: [
    {
      icon: Building2,
      title: "من نحن",
      description: "منظومة مزدوجة — مؤسسة غير ربحية وحاضنة أعمال ربحية — متحدتان برسالة واحدة لدفع التأثير المجتمعي المستدام عبر منطقة الشرق الأوسط وشمال أفريقيا.",
      color: "bg-brand-blue",
    },
    {
      icon: Lightbulb,
      title: "ماذا نفعل",
      description: "نحتضن الشركات الناشئة، ونقدم المساعدة التقنية وبناء القدرات، وندير الأكاديميات، ونوفر عيادات الأعمال، ونقود برامج المساعدات الإنسانية.",
      color: "bg-emerald-500",
    },
    {
      icon: Users,
      title: "من نخدم",
      description: "رائدات الأعمال، الشباب، المشاريع الصغيرة والمتوسطة، التعاونيات، المنظمات غير الحكومية، والمجتمعات الضعيفة الساعية للتمكين الاقتصادي.",
      color: "bg-brand-gold",
    },
    {
      icon: MapPin,
      title: "أين نعمل",
      description: "ننشط في أكثر من 10 دول بما في ذلك لبنان ومصر والأردن والعراق وتونس، ونتوسع عبر منطقة الشرق الأوسط وشمال أفريقيا وأفريقيا.",
      color: "bg-rose-500",
    },
  ],
};

export function WhoWeAreGrid() {
  const locale = useLocale();
  const isAr = locale === "ar";
  const items = isAr ? quadrants.ar : quadrants.en;
  const { ref, visible } = useInView(0.1);

  return (
    <section className="py-20 md:py-28 bg-surface-primary relative overflow-hidden">
      {/* Background shapes */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 -start-40 w-80 h-80 bg-brand-blue/[0.03] rounded-full blur-3xl" />
        <div className="absolute bottom-20 -end-40 w-80 h-80 bg-brand-gold/[0.03] rounded-full blur-3xl" />
      </div>

      <Container>
        <div ref={ref} className={cn(isAr && "text-right")}>
          {/* Section header */}
          <div
            className={cn(
              "text-center mb-14 transition-all duration-700",
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            )}
          >
            <SectionLabel color="blue">{isAr ? "حول تجربة LEEE" : "About LEEE Experience"}</SectionLabel>
            <h2 className="font-serif text-3xl md:text-4xl lg:text-[2.75rem] text-text-primary leading-tight mt-4">
              {isAr ? "نظرة شاملة على منظومتنا" : "A Snapshot of Our Ecosystem"}
            </h2>
          </div>

          {/* 4-quadrant grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
            {items.map((item, i) => {
              const Icon = item.icon;
              return (
                <div
                  key={i}
                  className={cn(
                    "group relative bg-white rounded-2xl p-8 md:p-10 border border-surface-tertiary/50",
                    "hover:shadow-xl hover:-translate-y-1 transition-all duration-500",
                    visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
                  )}
                  style={{ transitionDelay: visible ? `${150 * i}ms` : "0ms" }}
                >
                  {/* Icon */}
                  <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-5", item.color)}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>

                  {/* Title */}
                  <h3 className="font-serif text-xl md:text-2xl text-text-primary mb-3">
                    {item.title}
                  </h3>

                  {/* Description */}
                  <p className="text-text-secondary text-sm md:text-base leading-relaxed">
                    {item.description}
                  </p>

                  {/* Decorative corner accent */}
                  <div className={cn("absolute top-0 end-0 w-20 h-20 rounded-bl-[40px] opacity-[0.04]", item.color)} />
                </div>
              );
            })}
          </div>
        </div>
      </Container>
    </section>
  );
}
```

- [ ] **Step 2: Verify build passes**

Run: `npm run build`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/components/sections/home/WhoWeAreGrid.tsx
git commit -m "feat(homepage): add WhoWeAreGrid 4-quadrant component replacing AboutSection"
```

---

## Task 5: Create CEOSection Component

**Files:**
- Create: `src/components/sections/home/CEOSection.tsx`

Formal CEO profile section with photo placeholder, name, title, and brief bio.

- [ ] **Step 1: Create CEOSection.tsx**

```tsx
"use client";

import { useLocale } from "next-intl";
import { Container } from "@/components/ui/Container";
import { SectionLabel } from "./SectionLabel";
import { cn } from "@/lib/utils";
import { Quote } from "lucide-react";
import { useInView } from "@/hooks/useInView";

const ceoData = {
  en: {
    label: "Leadership",
    name: "CEO Name",
    title: "Founder & CEO",
    bio: "With over a decade of experience driving social enterprise and economic empowerment across MENA, our CEO leads LEEE Experience with a vision rooted in resilience, innovation, and inclusive growth. From incubating over 2,365 startups to mobilizing $1.06M in seed funding, his leadership has transformed thousands of lives across 10 countries.",
    quote: "Mindset is the first investment — everything else follows.",
  },
  ar: {
    label: "القيادة",
    name: "اسم المدير التنفيذي",
    title: "المؤسس والمدير التنفيذي",
    bio: "مع أكثر من عقد من الخبرة في قيادة المشاريع الاجتماعية والتمكين الاقتصادي عبر منطقة الشرق الأوسط وشمال أفريقيا، يقود مديرنا التنفيذي تجربة LEEE برؤية متجذرة في المرونة والابتكار والنمو الشامل.",
    quote: "العقلية هي الاستثمار الأول — وكل شيء آخر يتبع.",
  },
};

export function CEOSection() {
  const locale = useLocale();
  const isAr = locale === "ar";
  const c = isAr ? ceoData.ar : ceoData.en;
  const { ref, visible } = useInView(0.1);

  return (
    <section className="py-20 md:py-28 bg-surface-primary relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 end-0 w-96 h-96 bg-brand-blue/[0.02] rounded-full blur-3xl" />
      </div>

      <Container>
        <div ref={ref} className={cn(isAr && "text-right")}>
          <div
            className={cn(
              "grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center",
              "transition-all duration-700",
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            )}
          >
            {/* Photo — replace gradient placeholder with <Image> when CEO photo is provided */}
            <div className={cn("lg:col-span-4", isAr && "lg:order-2")}>
              <div className="relative w-full aspect-[3/4] max-w-sm mx-auto rounded-2xl overflow-hidden shadow-xl bg-gradient-to-br from-brand-blue to-brand-blue-dark">
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-6xl font-serif text-white/30">CEO</span>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className={cn("lg:col-span-8", isAr && "lg:order-1")}>
              <SectionLabel color="blue">{c.label}</SectionLabel>

              <h2 className="font-serif text-3xl md:text-4xl text-text-primary mt-4 mb-1">
                {c.name}
              </h2>
              <p className="text-brand-blue font-semibold text-lg mb-6">
                {c.title}
              </p>

              <p className="text-text-secondary text-base md:text-lg leading-relaxed mb-8 max-w-2xl">
                {c.bio}
              </p>

              {/* Quote */}
              <div className="relative bg-surface-secondary/50 rounded-xl p-6 md:p-8 border border-surface-tertiary/50 max-w-2xl">
                <Quote className="w-8 h-8 text-brand-blue/20 absolute top-4 start-4" />
                <p className="font-serif text-lg md:text-xl text-text-primary italic ps-8">
                  {c.quote}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
```

**Note:** Uses gradient placeholder — the client needs to provide the actual CEO photo. When received, replace the placeholder div with `<Image src="/images/new/ceo.jpg" alt={c.name} fill className="object-cover" />`.

- [ ] **Step 2: Verify build passes**

Run: `npm run build`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/components/sections/home/CEOSection.tsx
git commit -m "feat(homepage): add CEO section with placeholder content"
```

---

## Task 6: Create Shared Social Links + SocialMediaBar Component

**Files:**
- Create: `src/components/layout/SocialMediaBar.tsx`

Reusable social media icon bar placed before the footer on all landing pages. Uses custom X (Twitter) SVG since lucide-react doesn't include it.

- [ ] **Step 1: Create shared social links constants**

Create `src/lib/socialLinks.ts` — single source of truth for social URLs used by both Footer and SocialMediaBar. Use the URLs currently in Footer.tsx:

```tsx
import { Facebook, Instagram, Linkedin, Youtube } from "lucide-react";

// Custom X (Twitter) icon — lucide-react doesn't include it
export function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export const socialLinks = [
  { name: "Facebook", icon: Facebook, href: "https://www.facebook.com/theleeexperience/" },
  { name: "X", icon: XIcon, href: "https://twitter.com/lee_experience" },
  { name: "Instagram", icon: Instagram, href: "https://www.instagram.com/the_lee_experience/" },
  { name: "LinkedIn", icon: Linkedin, href: "https://www.linkedin.com/company/the-lee-experience" },
  { name: "YouTube", icon: Youtube, href: "https://www.youtube.com/" },
];
```

**Note:** These URLs match the current Footer. In Batch 2, we'll update them (Twitter→X URL, YouTube channel URL) and update Footer to import from this file too.

- [ ] **Step 2: Create SocialMediaBar.tsx**

```tsx
"use client";

import { useLocale } from "next-intl";
import { Container } from "@/components/ui/Container";
import { cn } from "@/lib/utils";
import { socialLinks } from "@/lib/socialLinks";

export function SocialMediaBar() {
  const locale = useLocale();
  const isAr = locale === "ar";

  return (
    <section className="py-8 md:py-10 bg-surface-secondary/50 border-t border-surface-tertiary/30">
      <Container>
        <div className="flex flex-col items-center gap-4">
          <p className="text-text-secondary text-sm font-medium uppercase tracking-wider">
            {isAr ? "تابعونا" : "Follow Us"}
          </p>
          <div className="flex items-center gap-4">
            {socialLinks.map((social) => {
              const Icon = social.icon;
              return (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.name}
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center",
                    "bg-accent-navy/10 text-text-secondary",
                    "hover:bg-brand-blue hover:text-white transition-all duration-300",
                    "hover:shadow-lg hover:-translate-y-0.5"
                  )}
                >
                  <Icon className="w-5 h-5" />
                </a>
              );
            })}
          </div>
        </div>
      </Container>
    </section>
  );
}
```

- [ ] **Step 3: Verify build passes**

Run: `npm run build`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/lib/socialLinks.ts src/components/layout/SocialMediaBar.tsx
git commit -m "feat(layout): add shared social links and reusable SocialMediaBar"
```

---

## Task 7: Refactor PartnersCarousel Marquee Styling

**Files:**
- Modify: `src/components/sections/home/PartnersCarousel.tsx`

Currently 79 lines with basic infinite scroll. Minor improvements: update heading text if needed, ensure the marquee looks clean. The component is already functional — this is a light touch-up.

- [ ] **Step 1: Read current PartnersCarousel.tsx**

Read `src/components/sections/home/PartnersCarousel.tsx` to confirm current state.

- [ ] **Step 2: Update PartnersCarousel.tsx**

Minor changes only:
- Verify the `animate-scroll` CSS animation is smooth (already exists)
- Ensure heading matches client expectation (partners & donors)
- Add a second row scrolling in reverse direction for visual richness (split 19 partners into 2 rows of ~10)
- Add gradient fade edges on left/right for cleaner look

Key additions:

Add gradient fade overlays at start/end of the scroll container. Wrap the existing scroll div in a `relative` container, then add:

```tsx
{/* Left fade */}
<div className="absolute inset-y-0 start-0 w-20 bg-gradient-to-r from-surface-primary to-transparent z-10 pointer-events-none" />
{/* Right fade */}
<div className="absolute inset-y-0 end-0 w-20 bg-gradient-to-l from-surface-primary to-transparent z-10 pointer-events-none" />
```

**Note:** Uses `bg-gradient-to-r` and `bg-gradient-to-l` (valid Tailwind classes). The `start-0`/`end-0` logical properties handle RTL automatically.

- [ ] **Step 3: Verify build passes**

Run: `npm run build`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/components/sections/home/PartnersCarousel.tsx
git commit -m "feat(homepage): improve partners marquee with gradient fade edges"
```

---

## Task 8: Wire Up Homepage — Update page.tsx

**Files:**
- Modify: `src/app/[locale]/page.tsx`

This is the final assembly step. Remove old sections, import new ones, and set the correct order.

- [ ] **Step 1: Read current page.tsx**

Read `src/app/[locale]/page.tsx` to confirm current imports and order.

- [ ] **Step 2: Update page.tsx**

Replace the entire file with the new layout order:

```tsx
import { HeroSlider } from "@/components/sections/home/HeroSlider";
import { VisionRibbon } from "@/components/sections/home/VisionRibbon";
import { StatsCounter } from "@/components/sections/home/StatsCounter";
import { WhoWeAreGrid } from "@/components/sections/home/WhoWeAreGrid";
import { ProgramsSection } from "@/components/sections/home/ProgramsSection";
import { CEOSection } from "@/components/sections/home/CEOSection";
import { PartnersCarousel } from "@/components/sections/home/PartnersCarousel";
import { JoinCommunity } from "@/components/sections/home/JoinCommunity";
import { LatestBeats } from "@/components/sections/home/LatestBeats";
import { CTABanner } from "@/components/sections/home/CTABanner";
import { SocialMediaBar } from "@/components/layout/SocialMediaBar";
import { getFeaturedPrograms } from "@/lib/data/programs";

export default async function HomePage() {
  const featuredPrograms = await getFeaturedPrograms();

  const sliderPrograms = featuredPrograms.map((p) => ({
    id: p.id,
    slug: p.slug,
    titleEn: p.titleEn,
    titleAr: p.titleAr,
    summaryEn: p.summaryEn,
    summaryAr: p.summaryAr,
    coverImageUrl: p.coverImageUrl,
    status: p.status,
    year: p.year,
    donorEn: p.donorEn,
    donorAr: p.donorAr,
    locationEn: p.locationEn,
    locationAr: p.locationAr,
    pillar: p.pillar,
  }));

  return (
    <>
      <HeroSlider />
      <VisionRibbon />
      <StatsCounter />
      <WhoWeAreGrid />
      <ProgramsSection programs={sliderPrograms} />
      <CEOSection />
      <PartnersCarousel />
      <JoinCommunity />
      <LatestBeats />
      <CTABanner />
      <SocialMediaBar />
    </>
  );
}
```

Removed imports: `QuickAccessCards`, `AttendEvents`, `ParallaxImpact`, `AboutSection`
Added imports: `VisionRibbon`, `WhoWeAreGrid`, `CEOSection`, `SocialMediaBar`

- [ ] **Step 3: Verify build passes**

Run: `npm run build`
Expected: Full build succeeds with no errors

- [ ] **Step 4: Visual verification**

Run: `npm run dev`
Open `http://localhost:3000` and verify:
1. Hero shows single headline (no carousel)
2. 2030 Vision ribbon appears below hero
3. Impact at a Glance shows 8 stats in 4-column grid
4. Who We Are grid shows 4 quadrants
5. Programs section still works
6. CEO section visible with placeholder
7. Partners marquee scrolls
8. Community + Blog sections still work
9. CTA banner still works
10. Social media bar appears before footer

- [ ] **Step 5: Commit**

```bash
git add src/app/[locale]/page.tsx
git commit -m "feat(homepage): assemble new layout — vision ribbon, stats, who-we-are grid, CEO, social bar"
```

---

## Task 9: Final Polish & Integration Check

- [ ] **Step 1: Run full build**

```bash
npm run build
```

Expected: Clean build, no warnings related to our changes.

- [ ] **Step 2: Test Arabic locale**

Open `http://localhost:3000/ar` and verify:
- All new sections display Arabic text correctly
- RTL layout is correct (text alignment, grid order)
- No broken elements

- [ ] **Step 3: Test mobile responsiveness**

Open browser DevTools, test at 375px (iPhone) and 768px (iPad):
- Hero stacks vertically, images hidden on mobile
- Vision ribbon text is readable
- Stats grid is 2 columns on mobile
- Who We Are grid is single column on mobile
- CEO section stacks (photo above text on mobile)
- Social media bar centers properly

- [ ] **Step 4: Final commit if any polish needed**

```bash
git add -A
git commit -m "fix(homepage): polish responsive layout and RTL for batch 1"
```
