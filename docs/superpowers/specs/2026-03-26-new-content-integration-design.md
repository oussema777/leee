# New Content Integration — Design Spec

**Date:** 2026-03-26
**Status:** Approved
**Scope:** Integrate content from "LEE Company PC" and "LEE Website Content" documents into the LEEE Experience platform.

---

## Overview

Two new content documents provide: (1) 17 detailed real project descriptions across 3 pillars, (2) complete page copy for 4 new pages + updates to existing pages. This spec covers building everything page-by-page.

## Build Order

1. About Page (new)
2. Impact Page (new) — **Note:** Stories section depends on 4E.3 blog/testimonials update; use placeholder slugs during build, wire after 4E.3.
3. Zowada Page (new)
4. Get Involved Expansion (partial exists)
5. Content Updates (Homepage, Programs DB, Blog/Testimonials, Footer, Translations)
6. Navigation & Link Fixes (cross-cutting)

---

## Phase 4A — About Page

**Route:** `/[locale]/about`
**Page file:** `src/app/[locale]/about/page.tsx` + `loading.tsx`
**Data file:** `src/components/sections/about/aboutData.ts`
**Components:** `src/components/sections/about/`

> **Note:** There is NO physical `(main)` route group folder. The `[locale]/layout.tsx` unconditionally renders Navbar + Footer. New pages go directly under `src/app/[locale]/`.

### Sections

1. **Hero** — PageHeader component with title "Born in crisis. Built for change." and subhead about 2020 Lebanon origin story. Section anchor: `id="story"`.

2. **OurStory Timeline** (`AboutTimeline.tsx`) — Horizontal scrollable timeline (2020→2025). Each year node: year badge, title, 1-sentence lesson, placeholder image slot. Section anchor: `id="journey"`.
   - 2020: Birth in the Storm
   - 2021: Planting Roots
   - 2022: Regional Reach (10 countries)
   - 2023: Deepening Impact
   - 2024: Innovation (Zowada launch)
   - 2025: Five Years Forward

3. **Team Grid** (`AboutTeam.tsx`) — 6-8 card grid. Each card: image placeholder, name, role, short human quote. Responsive: 1-col mobile, 2-col tablet, 3-4 col desktop. Section anchor: `id="team"`.

4. **Values in Action** (`AboutValues.tsx`) — 7 core values, each as a card with: value name, SDG badge, 1-sentence action description, mini-story example. Alternating layout. Section anchor: `id="values"`.
   - Values: Inclusion First, Resilience & Ownership, Impact Integrity, Human-Centered Growth, Equity & Access, Sustainable Innovation, Ecosystem Thinking.

5. **Strategic Framework 2025-2030** (`AboutStrategy.tsx`) — 4 strategy cards in a 2x2 grid. Section anchor: `id="strategy"`.
   - Scale Impact with Green & Gender Lens ($5M+ portfolio, 25K+ women)
   - Build Robust Ecosystem (3,000+ women-led MSMEs)
   - Innovate Financing (CFW models, digital presence)
   - Holistic Human-Centered Support (bundled services)

6. **Partners Section** — Reuse existing `PartnersCarousel` component. The `demoPartners` array in `PartnersCarousel.tsx` will be updated with real partner names in Phase 4E.1.

### TypeScript Interfaces (in `aboutData.ts`)

```typescript
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
  icon: string; // lucide icon name
}

export interface StrategyCard {
  id: string;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  targetMetric: string;
}
```

### Skeleton (`loading.tsx`)
- Hero: tall pulse rectangle
- Timeline: horizontal row of 6 equal-width skeleton blocks
- Team: 3x2 grid of square skeletons with text lines below
- Values: 7 alternating tall rectangle skeletons
- Strategy: 2x2 grid of card skeletons

---

## Phase 4B — Impact Page

**Route:** `/[locale]/impact`
**Page file:** `src/app/[locale]/impact/page.tsx` + `loading.tsx`
**Data file:** `src/components/sections/impact/impactData.ts`
**Components:** `src/components/sections/impact/`

### Sections

1. **Hero** — "Impact isn't a report. It's a ripple." with animated background.

2. **Impact Numbers Dashboard** (`ImpactDashboard.tsx`) — Animated counter cards (reuse StatsCounter animation pattern), organized in 3 categories:
   - Economic: 2,365 startups incubated, 3,421 MSMEs accelerated, $1.06M seed funding, 5,130 feasibility studies
   - Social: 38,790+ lives touched, 8,615 directly supported, 80% women entrepreneurs, 10 countries
   - Environmental: 60% green ventures thriving post-crisis, 1,800+ green jobs

3. **Journey Timeline** (`ImpactJourney.tsx`) — "6 Years of Impact (2020-2025)" — compact visual: 32 projects, 38,790 beneficiaries, $500K+ grants disbursed.

4. **Stories Section** (`ImpactStories.tsx`) — "Numbers don't change the world. People do." 3 featured stories with photo + quote + "Read full story" link. **Imports from updated `blogData.ts` by slug** (wire after 4E.3 is complete; use hardcoded preview data during initial build).

5. **Lessons Learned** (`ImpactLessons.tsx`) — 3 transparent insight cards:
   - "Adaptability beats perfection: Our pivot to digital during lockdown"
   - "Local staff aren't 'implementers'—they're the strategy"
   - "Green isn't a sector—it's a lens"

6. **Downloads** (`ImpactDownloads.tsx`) — Card grid for: Annual Report 2025, Impact Methodology Brief, Project Factsheets. Each with cover image placeholder, title, download button (placeholder `#` URLs).

### TypeScript Interfaces (in `impactData.ts`)

```typescript
export interface ImpactStat {
  id: string;
  labelEn: string;
  labelAr: string;
  value: number;
  suffix?: string; // "+", "%", "M", "K"
  prefix?: string; // "$"
  category: 'economic' | 'social' | 'environmental';
}

export interface LessonCard {
  id: string;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
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
```

### Skeleton
- Hero: tall pulse rectangle
- Dashboard: 3-row grid of counter card skeletons (4 per row)
- Journey: horizontal timeline skeleton
- Stories: 3-column card skeleton grid
- Lessons: 3-column card skeleton
- Downloads: 3-column card skeleton

---

## Phase 4C — Zowada Page

**Route:** `/[locale]/zowada`
**Page file:** `src/app/[locale]/zowada/page.tsx` + `loading.tsx`
**Data file:** `src/components/sections/zowada/zowadaData.ts`
**Components:** `src/components/sections/zowada/`

### Sections

1. **Hero** (`ZowadaHero.tsx`) — "Your green business. In your pocket." Gradient background (black→blue), phone mockup placeholder, app store badge placeholders, 90-sec explainer video placeholder.

2. **Features Grid** (`ZowadaFeatures.tsx`) — 4 feature cards:
   - Green Marketplace: List products, reach conscious buyers
   - Learn: Bite-sized courses on green business, finance, digital skills
   - Mentor: Book 1:1 sessions with vetted experts
   - Crowdfund: Raise capital for your green venture

3. **Built for Real Conditions** (`ZowadaConditions.tsx`) — "Built for Lebanon. Ready for Africa." 4 capability badges:
   - Offline-first, Low-data mode, Multi-language, Inclusive UX

4. **Success on Zowada** (`ZowadaStories.tsx`) — Seller stories carousel (Aline Bekaa seedlings, Houla Collective).

5. **Partner with Zowada** (`ZowadaPartners.tsx`) — 3 pathways in cards:
   - NGOs: White-label Zowada for beneficiaries
   - Corporates: Source sustainable products
   - Investors: Access vetted green startup pipeline
   - CTA: "Let's talk" → `/contact` or contact section

6. **Vision** (`ZowadaVision.tsx`) — Expand to all 10 countries, AI-driven insights, Zowada Green Fund.

### TypeScript Interfaces (in `zowadaData.ts`)

```typescript
export interface ZowadaFeature {
  id: string;
  icon: string;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
}

export interface ZowadaCapability {
  id: string;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  icon: string;
}

export interface ZowadaStory {
  id: string;
  nameEn: string;
  nameAr: string;
  locationEn: string;
  locationAr: string;
  quoteEn: string;
  quoteAr: string;
  imageUrl: string;
}

export interface PartnerPathway {
  id: string;
  audienceEn: string;
  audienceAr: string;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  icon: string;
}
```

### Skeleton
- Hero: tall gradient pulse + phone mockup skeleton
- Features: 4-column card skeleton grid
- Conditions: 4 badge skeletons in a row
- Stories: horizontal carousel skeleton
- Partners: 3-column card skeleton
- Vision: centered text skeleton block

---

## Phase 4D — Get Involved Expansion

**Current state:** Only `/get-involved/join-us` exists with JoinUsForm.
**Target:** Hub page + 4 pathway pages.
**Data file:** `src/components/sections/get-involved/getInvolvedData.ts`

### New Routes

1. **Hub** `src/app/[locale]/get-involved/page.tsx` + `loading.tsx`
2. **Entrepreneur** `src/app/[locale]/get-involved/entrepreneur/page.tsx` + `loading.tsx`
3. **Partner** `src/app/[locale]/get-involved/partner/page.tsx` + `loading.tsx`
4. **Expert** `src/app/[locale]/get-involved/expert/page.tsx` + `loading.tsx`
5. **Advocate** `src/app/[locale]/get-involved/advocate/page.tsx` + `loading.tsx`

### Hub Page Design
Hero: "Change isn't a spectator sport."
4 interactive cards, each with icon, title, description, CTA:
- "I have an idea" → `/get-involved/entrepreneur`
- "I fund impact" → `/get-involved/partner`
- "I have skills to share" → `/get-involved/expert`
- "I believe in this mission" → `/get-involved/advocate`

### Entrepreneur Page
- 3-step visual: Eligibility Quiz → Idea Lab → Apply to Incubator
- Brief descriptions of Green Seeds Incubator and SIYB Green Pathway
- CTA: "Start Your Journey" → links to join-us form with pre-selected "Entrepreneur" role

### Partner Page
- 3 options: Fund a Pillar, Co-design a Program, License Methodology
- Each with description, example ("Sponsor 100 women in SIYB Green")
- CTA: "Explore Partnership Models" → contact form

### Expert Page
- Join trainer/coach/mentor pool description
- Zowada Time Banking mention
- CTA: "Apply to Join" → reuse existing JoinUs form

### Advocate Page
- Share stories, host screenings, champion women-led green innovation
- Media kit download placeholder
- CTA: "Get Advocacy Tools"

### TypeScript Interfaces (in `getInvolvedData.ts`)

```typescript
export interface PathwayCard {
  id: string;
  slug: string;
  icon: string;
  promptEn: string;
  promptAr: string;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  href: string;
}

export interface PathwayStep {
  stepNumber: number;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
}

export interface PartnerOption {
  id: string;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  exampleEn: string;
  exampleAr: string;
}
```

---

## Phase 4E — Content Updates

### 4E.1 — Homepage Copy Updates

**Update inline data arrays directly** (these components use hardcoded data, NOT translations):

- **`HeroSlider.tsx`**: Update the `demoSlides` array — new headline "Mindset is the first investment.", new subhead, new CTAs ("Explore Our Pathways", "See Impact in Numbers").
- **`StatsCounter.tsx`**: Update the `demoStats` array — new values: 38,790+ lives touched, 2,365 startups incubated, $1.06M seed funding, 60% green ventures thriving.
- **`AboutPreview.tsx`**: Update content to "LEE Difference" copy (Bridge Not Silo, Women-Led, Green by Design). **Fix broken link**: change href from `/about/overview` to `/about`.
- **`PartnersCarousel.tsx`**: Update `demoPartners` array with real partner names from new content (ILO, EU, UNIFIL, Canada, Norway, BMZ, Solidarités, CAWTAR, Kvinna till Kvinna, Relief International, etc.).
- **`ContactSection.tsx`** or home CTA section: Update final CTA to "Ready to turn mindset into movement?" with 3 buttons (Entrepreneur → `/get-involved/entrepreneur`, Partner → `/get-involved/partner`, Expert → `/get-involved/expert`).

### 4E.2 — Programs Database (17 Real Projects)

**Seed approach:** The existing `prisma/seed-programs.ts` already contains many of these projects (18 programs currently seeded). Cross-reference and:
1. **Update existing records** where slugs match (update descriptions, stats, deliverables to match new content).
2. **Add any missing projects** from the 17 listed.
3. **Remove any pure demo/placeholder records** that don't correspond to real projects.
4. Use the existing `findUnique` + conditional `create` pattern (consistent with current code).

**Pillar 1 — LEE Incubators (7 projects):**
1.1 Prospects Program (ILO/Netherlands) — 2,365 agri-entrepreneurs
1.2 UNIFIL Women Social Enterprises — 450 women founders
1.3 AAH Farmers & Cooperatives — 850 farmers
1.4 UNIFIL COOP South — 120 cooperatives
1.5 PSDP Gender-sensitive MSMEs (Canada/ILO) — 1,200 MSMEs
1.6 CAWTAR Women MENA (6 countries) — 2,500 women
1.7 UNIFIL Women Aquaculture — 320 women

**Pillar 2 — LEE Academy (6 projects):**
2.1 Financial Education Women (USAID/LWR) — 1,800 women
2.2 Youth Business North (Oxfam/Utopia) — 420 youth
2.3 Digital Learning MENA (CAWTAR, 6 countries) — 3,200 women
2.4 WFP Livelihoods & Resilience — 1,500 individuals
2.5 ENABLE/SIYB (EU/ILO) — 200 entrepreneurs
2.6 SI Women MSMEs Bekaa — 180 women

**Pillar 3 — Business Clinic & Humanitarian Aid (4 projects):**
3.1 GIZ/IA Community Kitchens — 28 CSOs + 2,000 served
3.2 RMF/WHH Resilience — 900 individuals
3.3 Norway/UNDP Cash-for-Work — 1,100 workers
3.4 IRC/World Bank SGBV Support — 650 survivors

Each project includes: title (EN/AR), slug, description, client, location, beneficiary count, SDGs, deliverables, key activities, measurable impact, status, year, pillar relation.

### 4E.3 — Blog & Testimonials Update
Replace demo data in `blogData.ts` and `testimonialsData.ts` with 5 real success stories:
1. Sir El-Danniyeh Nursery (Luqman & Ahmed) — 200K seedlings, social enterprise
2. Lama Hamza — Internship → career transformation
3. Aline Barakat — Agroecological nursery, food sovereignty
4. Houla Women's Green Fashion Factory — 50+ women, e-commerce
5. Nakoura Blue Economy — Women in aquaculture post-harvesting

Keep existing TypeScript interfaces (`BlogPost`, `BlogCategory`, `TestimonialItem`, etc.) — only replace the data arrays.

### 4E.4 — Footer Update
- Reorganize to 4 columns (keep `lg:grid-cols-4`):
  - Col 1: Brand + tagline "Built in Lebanon. Rooted in resilience."
  - Col 2: Quick Links (About | Programs | Impact | Zowada | Get Involved | News)
  - Col 3: Resources (Annual Report | Methodology | Careers | Press Kit) — placeholder `#` URLs
  - Col 4: Connect (newsletter tagline "Get field notes, not spam" — placeholder, no email input yet; social icons)
- Final line: "© 2026 The LEE Experience. Built in Lebanon. Rooted in resilience. Growing with you."
- Newsletter email input will be functional in Phase 6 (admin backoffice).

### 4E.5 — Translations
Update `en.json` and `ar.json`:

**New namespaces to add:**
- `impact` — all Impact page section titles and labels
- `zowada` — all Zowada page section titles and labels

**Existing namespaces to expand (ADD keys, don't remove existing ones):**
- `about` — add: `heroSubtitle`, `storyTitle`, `strategyTitle`, `partnersTitle` (existing keys like `pageTitle`, `overviewTitle`, `visionTitle`, `missionTitle`, `teamTitle`, `boardTitle`, `impactTitle`, `roadTitle`, `valuesTitle` are kept — used by admin `AboutTab.tsx` and `CoreValuesTab.tsx`)
- `getInvolved` — add: `hubTitle`, `hubSubtitle`, `entrepreneurTitle`, `partnerTitle`, `expertTitle`, `advocateTitle` + pathway descriptions
- `home` — update: `heroTitle`, `heroSubtitle`, CTA labels
- `nav` — add: `zowada`, update Get Involved sub-items
- `common` — add: footer resource labels

Arabic values: use `TODO_AR:` prefix for new strings, refined in Phase 7.

---

## Phase 4F — Navigation & Link Fixes (Cross-cutting)

This phase ensures all navbar links work after the new pages are built.

### Navbar Updates (`Navbar.tsx` + translation `nav` namespace)

1. **About dropdown** — Replace sub-route links (`/about/overview`, `/about/vision-mission`, `/about/team`, `/about/impact`, `/about/core-values`) with anchor links to the single `/about` page:
   - Overview → `/about#story`
   - Vision & Mission → `/about#journey`
   - Team → `/about#team`
   - Impact → `/impact` (separate page)
   - Core Values → `/about#values`

2. **Add Zowada** — Add as a top-level nav item (between Programs and Get Involved), or as a sub-item under Programs. **Decision: top-level** since Zowada is a flagship product.

3. **Get Involved dropdown** — Replace existing sub-items:
   - Old: Join Us, Request Service, Careers, Partners (partially broken)
   - New: Hub (`/get-involved`), Entrepreneur, Partner, Expert, Advocate, Join Us (keep existing)

4. **Impact link** — The existing `aboutImpact` nav item currently points to `/about/impact`. Change href to `/impact`.

### Translation Updates for Nav
Add to `nav` namespace in `en.json`/`ar.json`:
- `zowada: "Zowada"`
- `entrepreneur: "For Entrepreneurs"`
- `partner: "For Partners"`
- `expert: "For Experts"`
- `advocate: "For Advocates"`
- Update `aboutImpact` description if needed

---

## Technical Decisions

- All new pages follow existing pattern: `{section}Data.ts` (in `src/components/sections/{section}/`) + client components + server `page.tsx` + `loading.tsx` skeleton
- New pages go directly under `src/app/[locale]/` (no physical route group folder needed)
- Programs seed script uses existing `findUnique` + `create` pattern, updating existing records where needed
- Reuse existing UI components (Button, Card, Badge, SectionHeader, Container, AnimatedSection, PageHeader)
- No new dependencies needed
- Arabic translations use `TODO_AR:` prefix initially, refined in Phase 7

---

## Out of Scope

- Admin CRUD for new pages (Phase 6)
- Real image/video assets (placeholders used)
- Contact page (separate item)
- Careers page
- Arabic content polish (Phase 7)
- SEO optimization (Phase 7)
- Newsletter email input functionality (Phase 6)
