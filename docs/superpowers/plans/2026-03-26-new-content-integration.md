# New Content Integration — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate new organizational content into the LEEE Experience website — 4 new pages (About, Impact, Zowada, Get Involved hub), 17 real program records replacing demos, updated homepage copy, and navigation fixes.

**Architecture:** Page-by-page build using established patterns: plain `.ts` data files (no "use client") in `src/components/sections/{section}/`, client section components with Framer Motion, server `page.tsx` with `generateMetadata`, `loading.tsx` skeletons. All pages under `src/app/[locale]/` (no route group subfolder). Prisma seed script updated with real project data.

**Tech Stack:** Next.js 16 (App Router), TypeScript, Tailwind CSS v4, Framer Motion, next-intl, Prisma 6, lucide-react

**Spec:** `docs/superpowers/specs/2026-03-26-new-content-integration-design.md`

---

## Task 1: About Page — Data File

**Files:**
- Create: `src/components/sections/about/aboutData.ts`

- [ ] **Step 1: Create the data file with TypeScript interfaces and data arrays**

```typescript
// src/components/sections/about/aboutData.ts

export interface TimelineItem {
  year: number;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  imageUrl: string;
}

export interface TeamMember {
  id: string;
  nameEn: string;
  nameAr: string;
  roleEn: string;
  roleAr: string;
  quoteEn: string;
  quoteAr: string;
  imageUrl: string;
}

export interface CoreValue {
  id: string;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  storyEn: string;
  storyAr: string;
  sdgNumber: number;
  icon: string;
}

export interface StrategyCard {
  id: string;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  targetMetric: string;
  icon: string;
}

export const timelineData: TimelineItem[] = [
  {
    year: 2020,
    titleEn: "Birth in the Storm",
    titleAr: "TODO_AR: الولادة في العاصفة",
    descriptionEn: "Born in Lebanon during its perfect storm of crises. We saw brilliant minds held back by broken systems and built a bridge between humanitarian urgency and entrepreneurial ambition.",
    descriptionAr: "TODO_AR: ولدت في لبنان خلال عاصفة الأزمات",
    imageUrl: "/images/placeholder-timeline-2020.jpg",
  },
  {
    year: 2021,
    titleEn: "Planting Roots",
    titleAr: "TODO_AR: غرس الجذور",
    descriptionEn: "Established core programs in Lebanon — incubation, training, and business coaching for women and youth in crisis-affected communities.",
    descriptionAr: "TODO_AR: أنشأنا البرامج الأساسية في لبنان",
    imageUrl: "/images/placeholder-timeline-2021.jpg",
  },
  {
    year: 2022,
    titleEn: "Regional Reach",
    titleAr: "TODO_AR: الوصول الإقليمي",
    descriptionEn: "Expanded to 10 countries across MENA and Africa. Launched Zowada digital accelerator. Partnered with ILO, EU, UNIFIL.",
    descriptionAr: "TODO_AR: توسعنا إلى 10 دول",
    imageUrl: "/images/placeholder-timeline-2022.jpg",
  },
  {
    year: 2023,
    titleEn: "Deepening Impact",
    titleAr: "TODO_AR: تعميق الأثر",
    descriptionEn: "Crossed 20,000 beneficiaries. Scaled SIYB-certified training. Launched community kitchens serving 24,000+ meals.",
    descriptionAr: "TODO_AR: تجاوزنا 20,000 مستفيد",
    imageUrl: "/images/placeholder-timeline-2023.jpg",
  },
  {
    year: 2024,
    titleEn: "Innovation",
    titleAr: "TODO_AR: الابتكار",
    descriptionEn: "Pioneered digital learning across 6 MENA countries. Mobilized $1.06M in seed funding. 60% of green ventures thriving post-crisis.",
    descriptionAr: "TODO_AR: ريادة التعلم الرقمي",
    imageUrl: "/images/placeholder-timeline-2024.jpg",
  },
  {
    year: 2025,
    titleEn: "Five Years Forward",
    titleAr: "TODO_AR: خمس سنوات للأمام",
    descriptionEn: "32 strategic projects implemented. 38,790+ lives touched. Operating in 10 countries with 9 branches. A movement, not just an organization.",
    descriptionAr: "TODO_AR: 32 مشروعاً استراتيجياً",
    imageUrl: "/images/placeholder-timeline-2025.jpg",
  },
];

export const teamMembers: TeamMember[] = [
  {
    id: "1",
    nameEn: "Rana",
    nameAr: "رنا",
    roleEn: "Bekaa Hub Lead",
    roleAr: "TODO_AR: مديرة مركز البقاع",
    quoteEn: "I grew up here. I know what works.",
    quoteAr: "TODO_AR: نشأت هنا. أعرف ما ينجح.",
    imageUrl: "/images/placeholder-team-1.jpg",
  },
  {
    id: "2",
    nameEn: "Karim",
    nameAr: "كريم",
    roleEn: "Digital Lead",
    roleAr: "TODO_AR: المدير الرقمي",
    quoteEn: "Offline-first isn't a feature—it's respect.",
    quoteAr: "TODO_AR: العمل بدون إنترنت ليس ميزة—إنه احترام.",
    imageUrl: "/images/placeholder-team-2.jpg",
  },
  {
    id: "3",
    nameEn: "Nour",
    nameAr: "نور",
    roleEn: "Programs Director",
    roleAr: "TODO_AR: مديرة البرامج",
    quoteEn: "We don't deliver projects. We deliver pathways.",
    quoteAr: "TODO_AR: لا نقدم مشاريع. نقدم مسارات.",
    imageUrl: "/images/placeholder-team-3.jpg",
  },
  {
    id: "4",
    nameEn: "Ahmad",
    nameAr: "أحمد",
    roleEn: "Impact & M&E Lead",
    roleAr: "TODO_AR: مسؤول الأثر والمتابعة",
    quoteEn: "Every dollar must earn its place. We measure what matters.",
    quoteAr: "TODO_AR: كل دولار يجب أن يستحق مكانه.",
    imageUrl: "/images/placeholder-team-4.jpg",
  },
  {
    id: "5",
    nameEn: "Lama",
    nameAr: "لمى",
    roleEn: "Academy Coordinator",
    roleAr: "TODO_AR: منسقة الأكاديمية",
    quoteEn: "Skills that stick. Knowledge that transforms.",
    quoteAr: "TODO_AR: مهارات تبقى. معرفة تحول.",
    imageUrl: "/images/placeholder-team-5.jpg",
  },
  {
    id: "6",
    nameEn: "Sara",
    nameAr: "سارة",
    roleEn: "Partnerships Manager",
    roleAr: "TODO_AR: مديرة الشراكات",
    quoteEn: "No one wins alone. We connect, collaborate, and co-create.",
    quoteAr: "TODO_AR: لا أحد يفوز وحده.",
    imageUrl: "/images/placeholder-team-6.jpg",
  },
];

export const coreValues: CoreValue[] = [
  {
    id: "1",
    nameEn: "Inclusion First",
    nameAr: "TODO_AR: الشمولية أولاً",
    descriptionEn: "We design with those left behind—not for them.",
    descriptionAr: "TODO_AR: نصمم مع المهمشين—لا من أجلهم.",
    storyEn: "When we designed the Zowada app, we tested it with women in Baalbek with 2G phones. If it didn't work for them, it didn't launch.",
    storyAr: "TODO_AR: عندما صممنا تطبيق زوادة، اختبرناه مع نساء في بعلبك.",
    sdgNumber: 10,
    icon: "users",
  },
  {
    id: "2",
    nameEn: "Resilience & Ownership",
    nameAr: "TODO_AR: المرونة والملكية",
    descriptionEn: "We build self-reliance, not dependency. Our goal is to work ourselves out of a job.",
    descriptionAr: "TODO_AR: نبني الاعتماد على الذات، لا التبعية.",
    storyEn: "We don't give grants. We co-invest. Because ownership changes everything.",
    storyAr: "TODO_AR: لا نقدم منحاً. نستثمر معاً.",
    sdgNumber: 8,
    icon: "shield",
  },
  {
    id: "3",
    nameEn: "Impact Integrity",
    nameAr: "TODO_AR: نزاهة الأثر",
    descriptionEn: "Every dollar, every hour, every word must earn its place. We measure what matters—and share the results.",
    descriptionAr: "TODO_AR: كل دولار وكل ساعة يجب أن تستحق مكانها.",
    storyEn: "We share our wins and our lessons—because transparency drives trust and trust drives impact.",
    storyAr: "TODO_AR: نشارك نجاحاتنا ودروسنا.",
    sdgNumber: 17,
    icon: "target",
  },
  {
    id: "4",
    nameEn: "Human-Centered Growth",
    nameAr: "TODO_AR: النمو المتمحور حول الإنسان",
    descriptionEn: "People aren't 'beneficiaries'. They're protagonists. We start with their story, not our spreadsheet.",
    descriptionAr: "TODO_AR: الناس ليسوا 'مستفيدين'. إنهم أبطال.",
    storyEn: "Every program begins with listening. We design around lived realities, not theoretical frameworks.",
    storyAr: "TODO_AR: كل برنامج يبدأ بالاستماع.",
    sdgNumber: 1,
    icon: "heart",
  },
  {
    id: "5",
    nameEn: "Equity & Access",
    nameAr: "TODO_AR: المساواة والوصول",
    descriptionEn: "Barriers aren't inevitable—they're design flaws. We fix the design.",
    descriptionAr: "TODO_AR: العوائق ليست حتمية—إنها عيوب تصميم.",
    storyEn: "80% of our supported entrepreneurs are women. That's not a target—it's a reflection of who drives change.",
    storyAr: "TODO_AR: 80% من رواد الأعمال الذين ندعمهم من النساء.",
    sdgNumber: 5,
    icon: "scale",
  },
  {
    id: "6",
    nameEn: "Sustainable Innovation",
    nameAr: "TODO_AR: الابتكار المستدام",
    descriptionEn: "We future-proof, not just patch. Green isn't a theme—it's the foundation.",
    descriptionAr: "TODO_AR: نحصّن المستقبل، لا نرقّع فقط.",
    storyEn: "60% of our green ventures still thrive post-crisis. That's not luck—it's design.",
    storyAr: "TODO_AR: 60% من مشاريعنا الخضراء لا تزال تزدهر.",
    sdgNumber: 13,
    icon: "leaf",
  },
  {
    id: "7",
    nameEn: "Ecosystem Thinking",
    nameAr: "TODO_AR: التفكير المنظومي",
    descriptionEn: "No one wins alone. We connect, collaborate, and co-create—because systems change requires system players.",
    descriptionAr: "TODO_AR: لا أحد يفوز وحده. نتواصل ونتعاون.",
    storyEn: "We co-organize GITS to bring capital to communities, connecting local entrepreneurs with global investors.",
    storyAr: "TODO_AR: ننظم GITS لجلب رأس المال للمجتمعات.",
    sdgNumber: 17,
    icon: "network",
  },
];

export const strategyCards: StrategyCard[] = [
  {
    id: "1",
    titleEn: "Scale Impact with a Green & Gender Lens",
    titleAr: "TODO_AR: توسيع الأثر بعدسة خضراء وجندرية",
    descriptionEn: "Cultivate a $5M+ portfolio of green-focused projects. Directly support 25,000+ women with green skills, services, and climate finance. Ensure 100% gender mainstreaming across all programs.",
    descriptionAr: "TODO_AR: تنمية محفظة بقيمة 5 مليون دولار+",
    targetMetric: "$5M+ portfolio, 25K+ women",
    icon: "trending-up",
  },
  {
    id: "2",
    titleEn: "Build a Robust Ecosystem for Women-Led Green Ventures",
    titleAr: "TODO_AR: بناء منظومة قوية للمشاريع الخضراء بقيادة نسائية",
    descriptionEn: "Strengthen 3,000+ women-led MSMEs in agritech, renewable energy, and circular economy. Forge partnerships with green tech leaders and impact investors.",
    descriptionAr: "TODO_AR: تعزيز 3,000+ مشروع صغير بقيادة نسائية",
    targetMetric: "3,000+ women-led MSMEs",
    icon: "sprout",
  },
  {
    id: "3",
    titleEn: "Innovate Financing for Sustainability",
    titleAr: "TODO_AR: ابتكار التمويل من أجل الاستدامة",
    descriptionEn: "Scale Cash-for-Work models to de-risk green business growth. Digitize presence to attract global donors and green economy investors.",
    descriptionAr: "TODO_AR: توسيع نماذج النقد مقابل العمل",
    targetMetric: "Digital-first financing",
    icon: "coins",
  },
  {
    id: "4",
    titleEn: "Deliver Holistic, Human-Centered Support",
    titleAr: "TODO_AR: تقديم دعم شامل متمحور حول الإنسان",
    descriptionEn: "Bundle services: incubation, climate-smart training, sustainable finance, and market access. Ensure long-term viability beyond crisis response.",
    descriptionAr: "TODO_AR: دمج الخدمات: الحاضنة والتدريب والتمويل",
    targetMetric: "Bundled services model",
    icon: "hand-heart",
  },
];
```

- [ ] **Step 2: Verify the file compiles**

Run: `cd "/c/Users/Marketing Manager/Desktop/Agent X/Leee Expirence/leee-experience" && npx tsc --noEmit src/components/sections/about/aboutData.ts 2>&1 | head -20`
Expected: No errors (or only unrelated project-wide errors)

- [ ] **Step 3: Commit**

```bash
git add src/components/sections/about/aboutData.ts
git commit -m "feat(about): add data file with timeline, team, values, and strategy data"
```

---

## Task 2: About Page — Section Components

**Files:**
- Create: `src/components/sections/about/AboutTimeline.tsx`
- Create: `src/components/sections/about/AboutTeam.tsx`
- Create: `src/components/sections/about/AboutValues.tsx`
- Create: `src/components/sections/about/AboutStrategy.tsx`

- [ ] **Step 1: Create AboutTimeline.tsx**

Horizontal scrollable timeline with year badges, titles, and descriptions. Uses `useLocale()` from next-intl, Framer Motion for scroll animation. Each node: circular year badge (blue), title, description text. Overflow-x-auto for horizontal scroll on mobile, flex-row layout.

Import `timelineData` from `./aboutData`. Use `titleEn`/`titleAr` based on locale. Wrap in `Container` + `AnimatedSection`. Section anchor `id="journey"`.

- [ ] **Step 2: Create AboutTeam.tsx**

Grid of team member cards. Each card: rounded image placeholder (aspect-square), name, role, italic quote. Responsive: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`. Import `teamMembers` from `./aboutData`. Wrap in `Container` + `AnimatedSection`. Section anchor `id="team"`.

- [ ] **Step 3: Create AboutValues.tsx**

7 value cards in a vertical stack. Each card: icon (lucide-react), value name in bold, SDG badge (small pill showing "SDG {number}"), description text, story text in italic/lighter color. Cards alternate between text-left and text-right alignment for visual variety. Import `coreValues` from `./aboutData`. Wrap in `Container` + `AnimatedSection`. Section anchor `id="values"`.

- [ ] **Step 4: Create AboutStrategy.tsx**

2x2 grid of strategy cards. Each card: icon, title, description, target metric badge at bottom. Cards have blue gradient top border. Import `strategyCards` from `./aboutData`. Wrap in `Container` + `AnimatedSection`. Section anchor `id="strategy"`.

- [ ] **Step 5: Verify components compile**

Run: `cd "/c/Users/Marketing Manager/Desktop/Agent X/Leee Expirence/leee-experience" && npx tsc --noEmit 2>&1 | head -30`

- [ ] **Step 6: Commit**

```bash
git add src/components/sections/about/
git commit -m "feat(about): add timeline, team, values, and strategy section components"
```

---

## Task 3: About Page — Page & Loading

**Files:**
- Create: `src/app/[locale]/about/page.tsx`
- Create: `src/app/[locale]/about/loading.tsx`

- [ ] **Step 1: Create the about page**

Server component. Import `useTranslations` for metadata, `PageHeader` for hero, all 4 section components, and `PartnersCarousel`. Export `generateMetadata` with title/description. Layout:
1. `PageHeader` — title "Born in crisis. Built for change.", breadcrumbs: [{label: "Home", href: "/"}, {label: "About"}]
2. Intro text section — "In 2020, Lebanon collapsed. We didn't wait for permission to act..." in a Container
3. `AboutTimeline`
4. `AboutTeam`
5. `AboutValues`
6. `AboutStrategy`
7. `PartnersCarousel` (existing, reused)

Follow the pattern from `src/app/[locale]/media/events/page.tsx` for structure.

- [ ] **Step 2: Create the loading skeleton**

Follow pattern from existing `loading.tsx` files. Use `SkeletonBlock` or simple pulse divs:
- Hero pulse rectangle (h-48)
- Timeline: horizontal row of 6 skeleton blocks
- Team: 3x2 grid of square skeletons
- Values: 7 card skeletons
- Strategy: 2x2 grid of card skeletons

- [ ] **Step 3: Verify the page loads in dev**

Run: `cd "/c/Users/Marketing Manager/Desktop/Agent X/Leee Expirence/leee-experience" && npx next build 2>&1 | tail -30`
Expected: Build succeeds, `/about` route visible in output.

- [ ] **Step 4: Commit**

```bash
git add src/app/[locale]/about/
git commit -m "feat(about): add about page with hero, timeline, team, values, strategy sections"
```

---

## Task 4: Impact Page — Data File

**Files:**
- Create: `src/components/sections/impact/impactData.ts`

- [ ] **Step 1: Create the data file with interfaces and data**

```typescript
// src/components/sections/impact/impactData.ts

export interface ImpactStat {
  id: string;
  labelEn: string;
  labelAr: string;
  value: number;
  suffix?: string;
  prefix?: string;
  category: 'economic' | 'social' | 'environmental';
  icon: string;
}

export interface LessonCard {
  id: string;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  icon: string;
}

export interface DownloadItem {
  id: string;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  coverImageUrl: string;
  fileUrl: string;
  fileType: 'pdf' | 'xlsx';
}

export const impactStats: ImpactStat[] = [
  // Economic
  { id: "e1", labelEn: "Startups Incubated", labelAr: "TODO_AR: شركات ناشئة", value: 2365, suffix: "+", category: "economic", icon: "rocket" },
  { id: "e2", labelEn: "MSMEs Accelerated", labelAr: "TODO_AR: مشاريع مُسَرَّعة", value: 3421, suffix: "+", category: "economic", icon: "trending-up" },
  { id: "e3", labelEn: "Seed Funding Mobilized", labelAr: "TODO_AR: تمويل أولي", value: 1.06, prefix: "$", suffix: "M+", category: "economic", icon: "coins" },
  { id: "e4", labelEn: "Feasibility Studies", labelAr: "TODO_AR: دراسات جدوى", value: 5130, suffix: "+", category: "economic", icon: "file-text" },
  // Social
  { id: "s1", labelEn: "Lives Touched", labelAr: "TODO_AR: حياة تأثرت", value: 38790, suffix: "+", category: "social", icon: "users" },
  { id: "s2", labelEn: "Directly Supported", labelAr: "TODO_AR: دعم مباشر", value: 8615, suffix: "+", category: "social", icon: "hand-helping" },
  { id: "s3", labelEn: "Women Entrepreneurs", labelAr: "TODO_AR: رائدات أعمال", value: 80, suffix: "%", category: "social", icon: "user-check" },
  { id: "s4", labelEn: "Countries", labelAr: "TODO_AR: دول", value: 10, category: "social", icon: "globe" },
  // Environmental
  { id: "v1", labelEn: "Green Ventures Thriving Post-Crisis", labelAr: "TODO_AR: مشاريع خضراء مزدهرة", value: 60, suffix: "%", category: "environmental", icon: "leaf" },
  { id: "v2", labelEn: "Green Jobs Created", labelAr: "TODO_AR: وظائف خضراء", value: 1800, suffix: "+", category: "environmental", icon: "briefcase" },
];

export const lessonsLearned: LessonCard[] = [
  {
    id: "1",
    titleEn: "Adaptability beats perfection",
    titleAr: "TODO_AR: القدرة على التكيف تتفوق على الكمال",
    descriptionEn: "Our pivot to digital during lockdown wasn't planned—it was necessary. And it became our strongest asset.",
    descriptionAr: "TODO_AR: تحولنا إلى الرقمي خلال الإغلاق لم يكن مخططاً",
    icon: "refresh-cw",
  },
  {
    id: "2",
    titleEn: "Local staff aren't 'implementers'—they're the strategy",
    titleAr: "TODO_AR: الموظفون المحليون ليسوا 'منفذين'—إنهم الاستراتيجية",
    descriptionEn: "The best ideas don't come from headquarters. They come from the field, where reality meets ambition.",
    descriptionAr: "TODO_AR: أفضل الأفكار لا تأتي من المقر الرئيسي",
    icon: "map-pin",
  },
  {
    id: "3",
    titleEn: "Green isn't a sector—it's a lens",
    titleAr: "TODO_AR: الأخضر ليس قطاعاً—إنه عدسة",
    descriptionEn: "We stopped asking 'Is this a green project?' and started asking 'How does this build climate resilience?' Here's what changed.",
    descriptionAr: "TODO_AR: توقفنا عن السؤال 'هل هذا مشروع أخضر؟'",
    icon: "eye",
  },
];

export const downloads: DownloadItem[] = [
  {
    id: "1",
    titleEn: "Annual Report 2025",
    titleAr: "TODO_AR: التقرير السنوي 2025",
    descriptionEn: "Our comprehensive look at six years of impact, growth, and lessons.",
    descriptionAr: "TODO_AR: نظرة شاملة على ست سنوات من الأثر",
    coverImageUrl: "/images/placeholder-report-annual.jpg",
    fileUrl: "#",
    fileType: "pdf",
  },
  {
    id: "2",
    titleEn: "Impact Methodology Brief",
    titleAr: "TODO_AR: موجز منهجية الأثر",
    descriptionEn: "How we measure what matters—our framework for tracking lasting change.",
    descriptionAr: "TODO_AR: كيف نقيس ما يهم",
    coverImageUrl: "/images/placeholder-report-methodology.jpg",
    fileUrl: "#",
    fileType: "pdf",
  },
  {
    id: "3",
    titleEn: "Project Factsheets",
    titleAr: "TODO_AR: صحائف وقائع المشاريع",
    descriptionEn: "One-page snapshots of every active project, filterable by country and pillar.",
    descriptionAr: "TODO_AR: لقطات من صفحة واحدة لكل مشروع نشط",
    coverImageUrl: "/images/placeholder-report-factsheets.jpg",
    fileUrl: "#",
    fileType: "pdf",
  },
];
```

- [ ] **Step 2: Commit**

```bash
git add src/components/sections/impact/impactData.ts
git commit -m "feat(impact): add data file with stats, lessons, and downloads"
```

---

## Task 5: Impact Page — Section Components

**Files:**
- Create: `src/components/sections/impact/ImpactDashboard.tsx`
- Create: `src/components/sections/impact/ImpactLessons.tsx`
- Create: `src/components/sections/impact/ImpactDownloads.tsx`
- Create: `src/components/sections/impact/ImpactStories.tsx`

- [ ] **Step 1: Create ImpactDashboard.tsx**

Client component with animated counters. Group stats by category (Economic / Social / Environmental) with category headings. Each stat: animated count-up (reuse the counting animation pattern from `StatsCounter.tsx` — `useInView` + counter interval), icon (lucide), label, value with prefix/suffix. 4-col grid per category on desktop, 2-col on tablet, 1-col on mobile. Wrap in `Container` + `AnimatedSection`.

- [ ] **Step 2: Create ImpactJourney.tsx**

Client component. "6 Years of Impact (2020-2025)" — compact horizontal timeline similar to `AboutTimeline` but simpler. Key milestones as connected nodes showing: 32 projects implemented, 38,790+ beneficiaries reached, $500K+ grants disbursed, 2,365 startups incubated. Each node: year, metric, short label. Wrap in `Container` + `AnimatedSection`.

- [ ] **Step 3: Create ImpactStories.tsx**

Client component. Hero text: "Numbers don't change the world. People do." 3 story cards in a row: placeholder image, name, short quote, "Read full story" link (href to `/media/blog/{slug}`). For now, hardcode 3 story references that will be wired to real blog slugs in Task 11 (4E.3). Wrap in `Container` + `AnimatedSection`.

- [ ] **Step 3: Create ImpactLessons.tsx**

3-column card grid. Each card: icon (lucide), bold title, description text. Cards have subtle border and hover shadow. Import `lessonsLearned` from `./impactData`. Wrap in `Container` + `AnimatedSection`.

- [ ] **Step 5: Create ImpactDownloads.tsx**

3-column card grid. Each card: cover image placeholder, title, description, download button (lucide `Download` icon + "Download PDF"). Import `downloads` from `./impactData`. Button links to `fileUrl` (placeholder `#` for now). Wrap in `Container` + `AnimatedSection`.

- [ ] **Step 6: Commit**

```bash
git add src/components/sections/impact/
git commit -m "feat(impact): add dashboard, journey, stories, lessons, and downloads section components"
```

---

## Task 6: Impact Page — Page & Loading

**Files:**
- Create: `src/app/[locale]/impact/page.tsx`
- Create: `src/app/[locale]/impact/loading.tsx`

- [ ] **Step 1: Create the impact page**

Server component. `generateMetadata` with title "Impact". Layout:
1. `PageHeader` — "Impact isn't a report. It's a ripple." breadcrumbs: Home > Impact
2. Intro paragraph: "From the ashes of crisis, we've grown a movement. 32 strategic projects. 38,790+ lives touched. Here's how."
3. `ImpactDashboard`
4. `ImpactJourney`
5. `ImpactStories`
6. `ImpactLessons`
7. `ImpactDownloads`

- [ ] **Step 2: Create loading skeleton**

- [ ] **Step 3: Build test**

Run: `cd "/c/Users/Marketing Manager/Desktop/Agent X/Leee Expirence/leee-experience" && npx next build 2>&1 | tail -30`

- [ ] **Step 4: Commit**

```bash
git add src/app/[locale]/impact/
git commit -m "feat(impact): add impact page with dashboard, stories, lessons, downloads"
```

---

## Task 7: Zowada Page — Data File

**Files:**
- Create: `src/components/sections/zowada/zowadaData.ts`

- [ ] **Step 1: Create data file**

Interfaces: `ZowadaFeature`, `ZowadaCapability`, `ZowadaStory`, `PartnerPathway`.

Data arrays:
- `features` (4): Green Marketplace, Learn, Mentor, Crowdfund — with icons (shopping-cart, book-open, users, lightbulb), EN/AR titles and descriptions from the content doc.
- `capabilities` (4): Offline-first, Low-data mode, Multi-language, Inclusive UX — icons (wifi-off, minimize, languages, accessibility).
- `stories` (2): Aline Bekaa (500 organic seedlings in 2 months), Houla Collective (50 women, 1 factory, 100% online sales).
- `partnerPathways` (3): NGOs (white-label), Corporates (source products), Investors (pipeline access).

- [ ] **Step 2: Commit**

```bash
git add src/components/sections/zowada/zowadaData.ts
git commit -m "feat(zowada): add data file with features, capabilities, stories, partnerships"
```

---

## Task 8: Zowada Page — Section Components

**Files:**
- Create: `src/components/sections/zowada/ZowadaHero.tsx`
- Create: `src/components/sections/zowada/ZowadaFeatures.tsx`
- Create: `src/components/sections/zowada/ZowadaConditions.tsx`
- Create: `src/components/sections/zowada/ZowadaStories.tsx`
- Create: `src/components/sections/zowada/ZowadaPartners.tsx`
- Create: `src/components/sections/zowada/ZowadaVision.tsx`

- [ ] **Step 1: Create ZowadaHero.tsx**

Custom hero (NOT PageHeader — this is a product landing page hero). Full-width gradient section (bg-gradient from black to brand-blue). Large headline "Your green business. In your pocket.", subhead text. Placeholder phone mockup image (centered). Two CTA buttons: App Store badge placeholder, Google Play badge placeholder. Below: "See how it works" text link with play icon.

- [ ] **Step 2: Create ZowadaFeatures.tsx**

4-column grid. Each feature card: large icon (48px), title, description, subtle blue left-border accent. Import `features` from `./zowadaData`.

- [ ] **Step 3: Create ZowadaConditions.tsx**

Section heading: "Built for Lebanon. Ready for Africa." 4 capability badges in a flex-row: each with icon, title, description. Horizontal on desktop, 2x2 grid on tablet, stacked on mobile. Import `capabilities`.

- [ ] **Step 4: Create ZowadaStories.tsx**

Carousel or flex-row of 2 story cards. Each: image placeholder, name + location, italicized quote. Import `stories`.

- [ ] **Step 5: Create ZowadaPartners.tsx**

3-column card grid. Each pathway card: icon, audience label ("For NGOs"), title, description, CTA button ("Let's talk"). Import `partnerPathways`.

- [ ] **Step 6: Create ZowadaVision.tsx**

Centered text section with blue background. Title: "Vision 2025+". 3 bullet points: expand to 10 countries, AI-driven market insights, Zowada Green Fund launch. Simple, clean layout.

- [ ] **Step 7: Commit**

```bash
git add src/components/sections/zowada/
git commit -m "feat(zowada): add hero, features, conditions, stories, partners, vision components"
```

---

## Task 9: Zowada Page — Page & Loading

**Files:**
- Create: `src/app/[locale]/zowada/page.tsx`
- Create: `src/app/[locale]/zowada/loading.tsx`

- [ ] **Step 1: Create the zowada page**

Server component. `generateMetadata` with title "Zowada Digital Accelerator". Layout:
1. `ZowadaHero` (no PageHeader — custom hero)
2. `ZowadaFeatures`
3. `ZowadaConditions`
4. `ZowadaStories`
5. `ZowadaPartners`
6. `ZowadaVision`

- [ ] **Step 2: Create loading skeleton**

- [ ] **Step 3: Build test**

- [ ] **Step 4: Commit**

```bash
git add src/app/[locale]/zowada/
git commit -m "feat(zowada): add Zowada product landing page"
```

---

## Task 10: Get Involved — Hub + 4 Pathway Pages

**Files:**
- Create: `src/components/sections/get-involved/getInvolvedData.ts`
- Create: `src/app/[locale]/get-involved/page.tsx`
- Create: `src/app/[locale]/get-involved/loading.tsx`
- Create: `src/app/[locale]/get-involved/entrepreneur/page.tsx`
- Create: `src/app/[locale]/get-involved/entrepreneur/loading.tsx`
- Create: `src/app/[locale]/get-involved/partner/page.tsx`
- Create: `src/app/[locale]/get-involved/partner/loading.tsx`
- Create: `src/app/[locale]/get-involved/expert/page.tsx`
- Create: `src/app/[locale]/get-involved/expert/loading.tsx`
- Create: `src/app/[locale]/get-involved/advocate/page.tsx`
- Create: `src/app/[locale]/get-involved/advocate/loading.tsx`

- [ ] **Step 1: Create getInvolvedData.ts**

Interfaces: `PathwayCard`, `PathwayStep`, `PartnerOption`.

Data:
- `pathways` (4 cards): Entrepreneur ("I have an idea"), Partner ("I fund impact"), Expert ("I have skills to share"), Advocate ("I believe in this mission"). Each with icon, slug, href.
- `entrepreneurSteps` (3): Eligibility Quiz, Idea Lab, Apply to Incubator.
- `partnerOptions` (3): Fund a Pillar, Co-design a Program, License Methodology.

- [ ] **Step 2: Create hub page.tsx**

PageHeader: "Change isn't a spectator sport." 4 pathway cards in 2x2 grid. Each card: large icon, prompt text ("I have an idea"), title, description, arrow link to pathway page. Cards animate on hover (scale + shadow). Use Framer Motion `whileHover`.

- [ ] **Step 3: Create entrepreneur/page.tsx**

PageHeader: "Got an idea? Let's grow it." 3-step visual process (numbered circles connected by dotted line). Below: brief descriptions of Green Seeds Incubator + SIYB Green Pathway. CTA button: "Start Your Journey" linking to `/get-involved/join-us?role=entrepreneur`.

- [ ] **Step 4: Create partner/page.tsx**

PageHeader: "Want impact that lasts? Co-create with us." 3 option cards from `partnerOptions`. Each with description and example. CTA: "Explore Partnership Models" linking to `/contact` or contact section.

- [ ] **Step 5: Create expert/page.tsx**

PageHeader: "Your skills can change a life." Description of trainer/coach/mentor pool + Zowada Time Banking. CTA: "Apply to Join Our Expert Pool" linking to `/get-involved/join-us?role=expert`.

- [ ] **Step 6: Create advocate/page.tsx**

PageHeader: "Amplify what works." 3 items: Share stories (media kit link), Host a screening, Champion women-led green innovation. CTA: "Get Advocacy Tools" (placeholder link).

- [ ] **Step 7: Create all loading.tsx files**

Simple skeletons for each page.

- [ ] **Step 8: Build test**

- [ ] **Step 9: Commit**

```bash
git add src/components/sections/get-involved/getInvolvedData.ts src/app/[locale]/get-involved/
git commit -m "feat(get-involved): add hub page and 4 pathway pages (entrepreneur, partner, expert, advocate)"
```

---

## Task 11: Homepage Content Updates

**Files:**
- Modify: `src/components/sections/home/HeroSlider.tsx` (lines 10-44: `demoSlides`)
- Modify: `src/components/sections/home/StatsCounter.tsx` (lines 8-14: `demoStats`)
- Modify: `src/components/sections/home/AboutPreview.tsx` (line 48: broken `/about/overview` link)
- Modify: `src/components/sections/home/PartnersCarousel.tsx` (lines 7-11: `demoPartners`)
- Modify: `src/components/sections/home/ContactSection.tsx` (final CTA area)

- [ ] **Step 1: Update HeroSlider.tsx demoSlides (lines 10-44)**

Replace 3 slides with new content:
- Slide 1: titleEn "Mindset is the first investment.", subtitleEn "We equip women and youth in post-conflict markets to build resilient, green businesses—because the future isn't waiting.", ctaTextEn "Explore Our Pathways", ctaUrl "/programs"
- Slide 2: titleEn "Where mindset becomes movement.", subtitleEn "Leadership. Entrepreneurship. Employment. Across 10 countries, 38,790+ lives touched.", ctaTextEn "See Impact in Numbers", ctaUrl "/impact"
- Slide 3: titleEn "Your green business. In your pocket.", subtitleEn "Zowada — marketplace, classroom, mentor network, and funding portal for entrepreneurs in high-potential markets.", ctaTextEn "Discover Zowada", ctaUrl "/zowada"

Also: wrap the CTA button in a `<Link>` component if it isn't already (line ~115 — the current button is not navigable).

- [ ] **Step 2: Update StatsCounter.tsx demoStats (lines 8-14)**

Replace with real values:
```typescript
const demoStats = [
  { id: "1", labelEn: "Lives Touched", labelAr: "حياة تأثرت", value: 38790, suffix: "+", icon: "users" },
  { id: "2", labelEn: "Startups Incubated", labelAr: "شركات ناشئة محتضنة", value: 2365, suffix: "+", icon: "rocket" },
  { id: "3", labelEn: "Seed Funding Mobilized", labelAr: "تمويل أولي", value: 1.06, suffix: "M+", icon: "coins", prefix: "$" },
  { id: "4", labelEn: "Countries", labelAr: "دول", value: 10, suffix: "", icon: "globe" },
  { id: "5", labelEn: "Green Ventures Thriving", labelAr: "مشاريع خضراء مزدهرة", value: 60, suffix: "%", icon: "leaf" },
];
```

**Required:** The `StatsCounter.tsx` `StatItem` component (line ~46) does NOT currently support a `prefix` prop. You MUST:
1. Add `prefix?: string` to the `StatItem` function params (alongside `label`, `value`, `suffix`, `icon`, `isVisible`)
2. Update the render (line ~67) from `{count.toLocaleString()}{suffix}` to `{prefix}{count.toLocaleString()}{suffix}`
3. Add `prefix: stat.prefix || ""` when passing props to `StatItem`

- [ ] **Step 3: Fix AboutPreview.tsx link (line 48)**

Change `href="/about/overview"` to `href="/about"`.

- [ ] **Step 4: Update PartnersCarousel.tsx demoPartners (lines 7-11)**

Replace generated placeholders with real partner list:
```typescript
const demoPartners = [
  { id: "p-ilo", name: "ILO", logoUrl: "https://placehold.co/200x80/f8f9fa/333?text=ILO" },
  { id: "p-eu", name: "European Union", logoUrl: "https://placehold.co/200x80/f8f9fa/333?text=EU" },
  { id: "p-unifil", name: "UNIFIL", logoUrl: "https://placehold.co/200x80/f8f9fa/333?text=UNIFIL" },
  { id: "p-wfp", name: "WFP", logoUrl: "https://placehold.co/200x80/f8f9fa/333?text=WFP" },
  { id: "p-undp", name: "UNDP", logoUrl: "https://placehold.co/200x80/f8f9fa/333?text=UNDP" },
  { id: "p-irc", name: "IRC", logoUrl: "https://placehold.co/200x80/f8f9fa/333?text=IRC" },
  { id: "p-canada", name: "Canada Embassy", logoUrl: "https://placehold.co/200x80/f8f9fa/333?text=Canada" },
  { id: "p-netherlands", name: "Netherlands Embassy", logoUrl: "https://placehold.co/200x80/f8f9fa/333?text=Netherlands" },
  { id: "p-norway", name: "Norway Embassy", logoUrl: "https://placehold.co/200x80/f8f9fa/333?text=Norway" },
  { id: "p-bmz", name: "BMZ Germany", logoUrl: "https://placehold.co/200x80/f8f9fa/333?text=BMZ" },
  { id: "p-usaid", name: "USAID", logoUrl: "https://placehold.co/200x80/f8f9fa/333?text=USAID" },
  { id: "p-cawtar", name: "CAWTAR", logoUrl: "https://placehold.co/200x80/f8f9fa/333?text=CAWTAR" },
  { id: "p-kvinna", name: "Kvinna till Kvinna", logoUrl: "https://placehold.co/200x80/f8f9fa/333?text=KtK" },
  { id: "p-solidarites", name: "Solidarités International", logoUrl: "https://placehold.co/200x80/f8f9fa/333?text=SI" },
  { id: "p-ri", name: "Relief International", logoUrl: "https://placehold.co/200x80/f8f9fa/333?text=RI" },
  { id: "p-oxfam", name: "Oxfam", logoUrl: "https://placehold.co/200x80/f8f9fa/333?text=Oxfam" },
  { id: "p-aah", name: "Action Against Hunger", logoUrl: "https://placehold.co/200x80/f8f9fa/333?text=AAH" },
  { id: "p-berytech", name: "Berytech", logoUrl: "https://placehold.co/200x80/f8f9fa/333?text=Berytech" },
  { id: "p-wb", name: "World Bank", logoUrl: "https://placehold.co/200x80/f8f9fa/333?text=WorldBank" },
];
```

- [ ] **Step 5: Update ContactSection.tsx — final CTA**

Update the CTA section with:
- New headline: "Ready to turn mindset into movement?"
- 3 pathway buttons:
  - "I'm an Entrepreneur" → `/get-involved/entrepreneur`
  - "I'm a Partner/Donor" → `/get-involved/partner`
  - "I'm an Expert/Mentor" → `/get-involved/expert`

- [ ] **Step 6: Build test**

- [ ] **Step 7: Commit**

```bash
git add src/components/sections/home/HeroSlider.tsx src/components/sections/home/StatsCounter.tsx src/components/sections/home/AboutPreview.tsx src/components/sections/home/PartnersCarousel.tsx src/components/sections/home/ContactSection.tsx
git commit -m "feat(home): update hero, stats, about link, partners, and CTA with real content"
```

---

## Task 12: Programs Seed Script Update

**Files:**
- Modify: `prisma/seed-programs.ts`

- [ ] **Step 1: Review existing seed script**

Read `prisma/seed-programs.ts` in full. The script already contains ~20 programs (many overlapping with new content). Cross-reference existing slugs with the 17 projects.

Existing programs that map to new content (keep/update):
- `prospects-entrepreneurship-agriculture` → Project 1.1
- `unifil-women-social-enterprises` → Project 1.2
- `capacity-building-farmers-cooperatives` → Project 1.3 (move from technical-assistance to incubators pillar)
- `unifil-coop-south-strengthening` → Project 1.4
- `psdp-gender-sensitive-business-support` → Project 1.5
- `empowering-women-entrepreneurs-mena` → Project 1.6 (move from academy to incubators)
- `unifil-women-aquaculture` → Project 1.7
- `financial-education-women` → Project 2.1
- `business-development-youth-north` → Project 2.2 (move from technical-assistance to academy)
- `digital-learning-women-sustainable-business` → Project 2.3
- `livelihoods-resilience-lebanese-syrians` → Project 2.4 (move from coaching to academy)
- `enable-siyb-training-2024` → Project 2.5
- `optimizing-women-entrepreneurs-bekaa` → Project 2.6 (move from coaching to academy)
- `community-kitchens-social-cohesion` → Project 3.1 (keep in humanitarian-aid, now under Pillar 3)
- `social-economic-resilience-vulnerable-communities` → Project 3.2 (move from coaching)
- `cash-for-work-food-relief-north` → Project 3.3
- `srp2-economic-empowerment-sgbv` → Project 3.4 (move from incubators)

Extra programs NOT in new content (keep as-is or mark inactive):
- `nawra-green-ventures-acceleration` — keep (real project)
- `houla-women-green-fashion-factory` — keep (real project)
- `digital-media-campaigns-women-empowerment` — keep (Pillar 4)

- [ ] **Step 2: Update the programs array**

For each program, update:
- `descriptionEn` / `descriptionAr` with full content from documents (intervention scope, deliverables, key activities as bullet points)
- `pillarSlug` to match new pillar assignments (some programs moved pillars)
- Add rich `stats` data (beneficiary count, funding mobilized, etc.)
- Ensure `status` matches (most are COMPLETED)

Update pillar slugs to match the 5 pillars:
- `incubators` (Pillar 1)
- `academy` (Pillar 2)
- `coaching` → rename concept to "business-clinic" or keep as-is and update label
- `humanitarian-aid` (Pillar 5 / combined with 3)
- `digital-media-hub` (Pillar 4)

- [ ] **Step 3: Run the seed**

```bash
cd "/c/Users/Marketing Manager/Desktop/Agent X/Leee Expirence/leee-experience" && ./node_modules/.bin/prisma db seed
```

- [ ] **Step 4: Commit**

```bash
git add prisma/seed-programs.ts
git commit -m "feat(programs): update seed script with real project data from content documents"
```

---

## Task 13: Blog & Testimonials — Real Success Stories

**Depends on:** Task 5 (`ImpactStories.tsx` must already exist for Step 3)

**Files:**
- Modify: `src/components/sections/blog/blogData.ts` (lines 34-199: `demoPosts`)
- Modify: `src/components/sections/testimonials/testimonialsData.ts` (lines 29-205: `demoTestimonials`)

- [ ] **Step 1: Update blogData.ts demoPosts**

Replace 9 demo posts with posts built around the 5 real success stories. Keep existing `BlogPost` and `BlogCategory` interfaces unchanged. Keep existing categories. New posts:

1. `sir-el-danniyeh-nursery` — Luqman Gida & Ahmed Safadi, 200K seedlings, 100 poor families. Category: `impact`. Featured.
2. `lama-hamza-career-transformation` — 3-month internship → project management career. Category: `impact`.
3. `aline-barakat-agroecological-nursery` — Organic drought-resistant seedlings, food sovereignty. Category: `entrepreneurship`.
4. `houla-green-fashion-factory` — 50+ women, e-commerce, sustainable production. Category: `entrepreneurship`.
5. `nakoura-blue-economy-women` — Aquaculture post-harvesting, fish processing, food safety. Category: `impact`.
6. Keep 3-4 of the strongest existing demo posts as general content (green entrepreneurship future, 5 SIYB lessons, women economic empowerment).

Total: ~8-9 posts. Each with full `contentEn` markdown body.

- [ ] **Step 2: Update testimonialsData.ts demoTestimonials**

Update testimonial quotes to reference real programs where possible. Add quotes from the success stories:
- Luqman: "From a simple idea to 200,000 seedlings — and 100 families fed."
- Lama: "A 3-month internship changed my entire career path."
- Aline: "Growing organic seedlings isn't just farming — it's building food sovereignty."
- Houla women: "50 women, one factory, and a new definition of economic empowerment."

Keep existing partner testimonials (ILO, EU, UNIFIL reps) — these are realistic.

- [ ] **Step 3: Wire Impact page stories**

Update `ImpactStories.tsx` to import from `blogData.ts` and filter by slugs: `sir-el-danniyeh-nursery`, `houla-green-fashion-factory`, `nakoura-blue-economy-women`.

- [ ] **Step 4: Build test**

- [ ] **Step 5: Commit**

```bash
git add src/components/sections/blog/blogData.ts src/components/sections/testimonials/testimonialsData.ts src/components/sections/impact/ImpactStories.tsx
git commit -m "feat(content): replace demo blog/testimonials with real success stories"
```

---

## Task 14: Footer Update

**Files:**
- Modify: `src/components/layout/Footer.tsx`

- [ ] **Step 1: Update Footer.tsx**

Current structure: 4-column grid (`lg:grid-cols-4`). Keep 4 columns but reorganize:

**Column 1 — Brand** (keep, update tagline):
- Logo
- New tagline: "Built in Lebanon. Rooted in resilience. Growing with you."

**Column 2 — Quick Links** (update list):
- About → `/about`
- Programs → `/programs`
- Impact → `/impact`
- Zowada → `/zowada`
- Get Involved → `/get-involved`
- The Beat → `/media/blog`

Fix the existing duplicate/wrong links (lines 44-56): currently has "About" pointing to `/programs`.

**Column 3 — Resources** (replace "Get In Touch"):
- Annual Report → `#` (placeholder)
- Methodology → `#`
- Careers → `/get-involved/join-us`
- Press Kit → `#`

**Column 4 — Connect** (update):
- Newsletter: "Get field notes, not spam." (text only, no email input yet)
- Social icons (keep existing)
- Add contact info: phone, email from Column 3

**Bottom bar**: "© 2026 The LEE Experience. Built in Lebanon. Rooted in resilience. Growing with you."

- [ ] **Step 2: Build test**

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/Footer.tsx
git commit -m "feat(footer): reorganize columns with real links, resources, and updated copy"
```

---

## Task 15: Navigation Fixes

**Files:**
- Modify: `src/components/layout/Navbar.tsx` (lines 23-72: `navItems`)
- Modify: `messages/en.json`
- Modify: `messages/ar.json`

- [ ] **Step 1: Update Navbar.tsx navItems (lines 23-72)**

Replace the `navItems` array:

```typescript
const navItems: NavItem[] = [
  {
    label: t("nav.about"),
    href: "/about",
    children: [
      { label: t("nav.aboutOverview"), href: "/about#story" },
      { label: t("nav.aboutVision"), href: "/about#journey" },
      { label: t("nav.aboutTeam"), href: "/about#team" },
      { label: t("nav.aboutValues"), href: "/about#values" },
      { label: t("nav.aboutImpact"), href: "/impact" },
    ],
  },
  {
    label: t("nav.programs"),
    href: "/programs",
    children: [
      { label: t("nav.allPrograms"), href: "/programs" },
      { label: t("nav.pillarsIncubators"), href: "/programs?pillar=incubators" },
      { label: t("nav.pillarsAcademy"), href: "/programs?pillar=academy" },
      { label: t("nav.pillarsDigitalHub"), href: "/programs?pillar=digital-media-hub" },
    ],
  },
  {
    label: t("nav.zowada"),
    href: "/zowada",
  },
  {
    label: t("nav.getInvolved"),
    href: "/get-involved",
    children: [
      { label: t("nav.entrepreneur"), href: "/get-involved/entrepreneur" },
      { label: t("nav.partner"), href: "/get-involved/partner" },
      { label: t("nav.expert"), href: "/get-involved/expert" },
      { label: t("nav.advocate"), href: "/get-involved/advocate" },
      { label: t("nav.joinUs"), href: "/get-involved/join-us" },
    ],
  },
  {
    label: t("nav.media"),
    href: "/media",
    children: [
      { label: t("nav.events"), href: "/media/events" },
      { label: t("nav.gallery"), href: "/media/gallery" },
      { label: t("nav.videos"), href: "/media/videos" },
      { label: t("nav.reports"), href: "/media/reports" },
      { label: t("nav.testimonials"), href: "/media/testimonials" },
      { label: t("nav.blog"), href: "/media/blog" },
      { label: t("nav.podcast"), href: "/media/podcast" },
    ],
  },
];
```

- [ ] **Step 2: Update en.json nav namespace**

Add new keys to `nav`:
```json
"zowada": "Zowada",
"allPrograms": "All Programs",
"entrepreneur": "For Entrepreneurs",
"partner": "For Partners & Donors",
"expert": "For Experts & Mentors",
"advocate": "For Advocates"
```

**Before removing any keys**, run this grep to confirm no components reference them:
```bash
cd "/c/Users/Marketing Manager/Desktop/Agent X/Leee Expirence/leee-experience" && grep -r "nav\.careers\|nav\.requestService\|nav\.crowdfunding\|nav\.partners\|nav\.pillarsCoaching\|nav\.pillarsTechnical\|nav\.pillarsResearch\|nav\.pillarsMarketing" src/
```
If no results, safely remove obsolete keys: `pillarsCoaching`, `pillarsTechnical`, `pillarsResearch`, `pillarsMarketing`, `requestService`, `careers`, `crowdfunding`, `partners`. If results found, keep those keys and only remove the unreferenced ones.

- [ ] **Step 3: Update en.json — add `impact` and `zowada` namespaces + expand `about` and `getInvolved`**

Add to `en.json`:

```json
"impact": {
  "pageTitle": "Our Impact",
  "pageSubtitle": "Impact isn't a report. It's a ripple.",
  "dashboardTitle": "The Numbers That Move Us",
  "economic": "Economic Impact",
  "social": "Social Impact",
  "environmental": "Environmental Impact",
  "storiesTitle": "Stories, Not Statistics",
  "storiesSubtitle": "Numbers don't change the world. People do.",
  "lessonsTitle": "Lessons, Not Just Wins",
  "lessonsSubtitle": "What we've learned (so you don't have to)",
  "downloadsTitle": "Resources & Downloads",
  "readStory": "Read full story",
  "download": "Download"
},
"zowada": {
  "pageTitle": "Zowada Digital Accelerator",
  "heroTitle": "Your green business. In your pocket.",
  "heroSubtitle": "Zowada isn't just an app. It's your marketplace, classroom, mentor network, and funding portal—designed for entrepreneurs in low-connectivity, high-potential markets.",
  "featuresTitle": "Features That Fit Your Reality",
  "conditionsTitle": "Built for Lebanon. Ready for Africa.",
  "storiesTitle": "Success on Zowada",
  "partnersTitle": "Partner with Zowada",
  "visionTitle": "Vision 2025+",
  "downloadApp": "Download Zowada",
  "seeHow": "See how it works",
  "letsTalk": "Let's Talk"
}
```

Add to existing `about` namespace (keep existing keys):
```json
"heroSubtitle": "In 2020, Lebanon collapsed. We didn't wait for permission to act. We built a bridge between survival and ambition.",
"storyTitle": "Our Story",
"strategyTitle": "Strategic Framework 2025–2030",
"partnersTitle": "Partners Who Power Our Impact"
```

Add to existing `getInvolved` namespace:
```json
"hubTitle": "Get Involved",
"hubSubtitle": "Change isn't a spectator sport.",
"entrepreneurTitle": "For Entrepreneurs",
"entrepreneurSubtitle": "Got an idea? Let's grow it.",
"partnerTitle": "For Partners & Donors",
"partnerSubtitle": "Want impact that lasts? Co-create with us.",
"expertTitle": "For Experts & Mentors",
"expertSubtitle": "Your skills can change a life.",
"advocateTitle": "For Advocates",
"advocateSubtitle": "Amplify what works."
```

- [ ] **Step 4: Update ar.json with matching keys**

Mirror all new keys from en.json with `TODO_AR:` prefixed Arabic placeholder values.

- [ ] **Step 5: Build test**

Run: `cd "/c/Users/Marketing Manager/Desktop/Agent X/Leee Expirence/leee-experience" && npx next build 2>&1 | tail -40`
Expected: Build succeeds with all routes.

- [ ] **Step 6: Commit**

```bash
git add src/components/layout/Navbar.tsx messages/en.json messages/ar.json
git commit -m "feat(nav): update navbar, add Zowada link, fix About anchors, update translations"
```

---

## Task 16: Final Build Verification

- [ ] **Step 1: Full build**

```bash
cd "/c/Users/Marketing Manager/Desktop/Agent X/Leee Expirence/leee-experience" && npx next build 2>&1
```

Expected: All routes build successfully:
- `/about` ✓
- `/impact` ✓
- `/zowada` ✓
- `/get-involved` ✓
- `/get-involved/entrepreneur` ✓
- `/get-involved/partner` ✓
- `/get-involved/expert` ✓
- `/get-involved/advocate` ✓

- [ ] **Step 2: Dev server smoke test**

```bash
cd "/c/Users/Marketing Manager/Desktop/Agent X/Leee Expirence/leee-experience" && npx next dev &
```

Check: Homepage loads, navbar links work, new pages render.

- [ ] **Step 3: Commit any remaining fixes**

```bash
git add -A && git commit -m "fix: resolve build issues from content integration"
```
