# LEEE Experience - Client Feedback Implementation Design

**Date:** 2026-04-15
**Source:** "Copy of Revised action plan - new.xlsx" (client remarks)
**Approach:** Page-by-page batches, validate each before moving to next

---

## Overview

The client provided detailed feedback across two sheets:
- **Sheet 1:** Phased action plan with edits per task (preparation, content, design phases)
- **Sheet 2:** Page-by-page issues with suggested improvements, SEO keywords, and status notes

This spec covers all client feedback items organized into 8 implementation batches.

---

## Data Dependencies (Pending Client Input)

These items require client-provided content before they can be completed:
- **Phone numbers** for contact section (Batch 2.2)
- **CEO photo and bio** (Batch 1.4)
- **Exact WhatsApp number** for floating button (Batch 2.4)
- **Updated Google Maps location** coordinates (Batch 2.6)
- **Case study content** for Akroum Dairy and Mounet Setti (Batch 5.2) — use written success stories if available

For items pending client data, we'll implement the UI with placeholder content that can be swapped once received.

---

## Batch 1: Homepage Overhaul

**Files affected:** `src/app/[locale]/page.tsx`, `src/components/sections/home/*`

### Existing Components Disposition
| Component | Action |
|-----------|--------|
| `HeroSlider` | **Rework** → Single hero |
| `QuickAccessCards` | **Remove** (replaced by clearer CTAs later in page) |
| `AttendEvents` | **Remove** from homepage (still accessible via /media/events) |
| `AboutSection` | **Replace** with `WhoWeAreGrid` |
| `ParallaxImpact` | **Remove** (replaced by Impact at a Glance) |
| `StatsCounter` | **Refactor** into `ImpactAtGlance` — already has 80% of the needed data |
| `ProgramsSection` | **Keep** |
| `JoinCommunity` | **Keep** |
| `LatestBeats` | **Keep** (podcast/blog section) |
| `PartnersCarousel` | **Refactor** into marquee-style infinite scroll |
| `CTABanner` | **Keep** |

### 1.1 Hero Section Simplification
- **Current:** `HeroSlider` with 3 animated slides and multiple phrases
- **Change:** Single clear headline with the approved hero text
- **Hero text:** "We turn mindset into movement – empowering women & youth through green, tech-oriented, and inclusive business development."
- **Implementation:** Rework `HeroSlider.tsx` — single impactful hero with subtle background animation instead of carousel

### 1.2 Mission/Vision → 4-Quadrant Layout
- **Current:** `AboutSection` with long text blocks for mission and vision
- **Change:** Replace with a visual 4-section grid:
  - Who we are?
  - What we do?
  - Who we serve?
  - Where we work?
- **Implementation:** New component `WhoWeAreGrid.tsx` replacing `AboutSection` on homepage. Delete `AboutSection.tsx` from homepage sections.

### 1.3 Replace Video → "Impact at a Glance"
- **Current:** `StatsCounter.tsx` already has animated counters with 38,790+ beneficiaries, 2,365 startups, $1.06M seed fund, 10 countries
- **Change:** Refactor `StatsCounter.tsx` → add missing metrics: Women reached %, Youth supported, Programs/Projects delivered, Partners/Donors count
- **Rename heading** to "Impact at a Glance"
- Remove any YouTube video embed from the homepage

### 1.4 CEO Section
- **New section:** Formal CEO profile with photo, name, title, and brief bio
- **Implementation:** New `CEOSection.tsx` in `src/components/sections/home/`
- **Content:** Hardcoded in translation files (not database-driven — simple static content)
- **Data dependency:** Need CEO photo and bio from client

### 1.5 "Our 2030 Vision" Ribbon
- **New section:** Full-width ribbon/banner between hero and stats
- **Exact text:** "To be the leading catalyst for a resilient, green economy across MENA & Africa, powered by women innovators"
- **Implementation:** New `VisionRibbon.tsx` in `src/components/sections/home/`
- **Content:** Hardcoded in translation files

### 1.6 Partner/Donor Logo Marquee
- **Current:** `PartnersCarousel.tsx` already exists with partner logos (ILO, EU, UNDP, World Bank, USAID, etc.)
- **Change:** Refactor `PartnersCarousel.tsx` into infinite auto-scrolling marquee style
- **Do NOT** create a duplicate component

### 1.7 Social Media Icons at Page Bottom
- **Change:** Add social media icon row at the bottom of all landing pages
- **Implementation:** New `SocialMediaBar.tsx` in `src/components/layout/` (global, reusable)
- **Icons:** Include updated X (formerly Twitter) icon using custom SVG (lucide-react doesn't have X logo)
- **Note:** Use correct icons from the start to avoid rework in Batch 2

### Homepage Layout Order (top to bottom):
1. Hero (single headline) — reworked `HeroSlider`
2. 2030 Vision Ribbon — new `VisionRibbon`
3. Impact at a Glance — refactored `StatsCounter`
4. Who We Are Grid — new `WhoWeAreGrid` (replaces `AboutSection`)
5. Programs Section — existing `ProgramsSection` (keep)
6. CEO Section — new `CEOSection`
7. Partner/Donor Marquee — refactored `PartnersCarousel`
8. Community/Podcast — existing `JoinCommunity` + `LatestBeats` (keep)
9. CTA Banner — existing `CTABanner` (keep)
10. Social Media Bar — new `SocialMediaBar`

---

## Batch 2: Footer & Contact Section

**Files affected:** `src/components/layout/Footer.tsx`, `src/components/sections/home/ContactSection.tsx`, `src/components/layout/WhatsAppButton.tsx`

### 2.1 "We would love to hear from you"
- Add this phrase in the blue space above the contact form section

### 2.2 Add Phone Numbers
- Add phone numbers to contact section and footer
- **Data dependency:** Awaiting actual numbers from client (use existing +961 3 002 430 as placeholder)

### 2.3 Update Locations
- Mention Lebanon AND Egypt explicitly in footer and contact section
- Update address text in both EN and AR translations

### 2.4 WhatsApp Floating Icon
- New `WhatsAppButton.tsx` in `src/components/layout/`
- Fixed-position floating button (bottom-right corner)
- Links to WhatsApp with pre-filled message
- Add to locale layout so it appears on all pages

### 2.5 Update Social Media Icons
- Replace lucide `Twitter` icon with custom X (formerly Twitter) SVG in Footer.tsx
- Ensure YouTube link is correct
- Sync with `SocialMediaBar` created in Batch 1.7

### 2.6 Update Google Maps
- Update embedded map in `ContactSection.tsx` to show correct/updated location
- **Data dependency:** Need confirmed address/coordinates from client

---

## Batch 3: Programs / Pillars Page

**Files affected:** `src/app/[locale]/programs/page.tsx`, `src/app/[locale]/programs/[slug]/page.tsx`, `src/components/sections/programs/*`, program detail components

### 3.1 Correct 5 Pillars Naming
- LEEE Incubators
- LEEE Academy
- LEEE Business Clinic
- LEEE Humanitarian Aid
- LEEE Digital Media Hub
- Update Prisma Pillar seed data and all UI references
- **Note:** Using "LEEE" (three E's) consistent with organization branding. Client Excel says "LEE" — will confirm, defaulting to "LEEE" to match existing branding.

### 3.2 Digital Media Hub Content
- Add subtitle: "Supporting visibility, communication, and digital solutions for impact-driven initiatives"
- Add infographic elements (icons/visuals showing services)
- This section was previously "under construction"

### 3.3 Register Popup/Button
- Add prominent "Register" or "Apply" CTA button on each program card and detail page
- Modal form with basic fields (name, email, program interest) submitting to existing `/api/public/join-us` endpoint

### 3.4 "Funded by" Donor Section
- On each program detail page, add dynamic "Funded by" section
- **Data source:** Use existing `donorEn`/`donorAr` text fields on Program model (already per-program)
- Supplement with `ProgramPartner` relation for logo display

### 3.5 Finafas Teaser Card
- New program card/teaser: "Launching 2026 – Hybrid coaching for financial empowerment"
- Styled distinctly as "coming soon" with muted CTA

### 3.6 Secondary Color Palette
- Introduce visual distinction between humanitarian aid programs and for-profit incubation
- Humanitarian: warmer tones (amber/orange accents)
- For-profit: existing blue/professional palette
- Apply via pillar-based conditional styling on program cards and detail pages

---

## Batch 4: Projects / Filtering System

**Files affected:** `src/components/sections/programs/ProgramsGrid.tsx`, `src/app/[locale]/programs/page.tsx`, `src/app/[locale]/programs/[slug]/page.tsx`

### 4.1 Filter System
- Add filtering by: theme (women, youth), donor, year
- Tags/categories on each program card
- Active filter chips UI with clear-all option

### 4.2 Fix Repetitive Content
- Ensure each project card uses its own unique cover image
- Differentiate intro text per project (this is a content/admin task — flag for client)

### 4.3 SEO Keywords
- Add meta descriptions with target keywords per program page (in page.tsx `generateMetadata`)
- Keywords: Delivered, Supported, Strengthened, Programs, Projects, Implementation, Market access, Livelihoods, Economic empowerment, MSMEs, Cooperatives

---

## Batch 5: Impact Page Redesign

**Files affected:** `src/app/[locale]/impact/page.tsx`, `src/components/sections/impact/*`

**Note:** This batch has no dependency on Batches 3-4 and could theoretically run in parallel.

### 5.1 Two-Tab Layout
- Tab 1 "For-profit Impact": startups incubated, MSMEs accelerated, seed fund amount
- Tab 2 "Non-profit Impact": meals distributed, PSS sessions, CFW workers
- Use numbers from company profile
- Refactor existing `ImpactDashboard` to support tabbed view

### 5.2 Real Case Studies
- Akroum Dairy social & solidarity project
- Mounet Setti
- Written success stories with images, stats, outcomes
- **Content:** Hardcoded in translation files initially
- **Data dependency:** Need written success stories from client

### 5.3 Interactive MENA Map
- Custom SVG map (not react-simple-maps — too heavy for ~15 countries)
- Hand-crafted SVG with MENA country paths
- Hover/click to see country-specific stats
- **Data:** Stats hardcoded in a data file (e.g., `menaCountryData.ts`) — no schema change needed

---

## Batch 6: Podcast Enhancements

**Files affected:** `src/app/[locale]/media/podcast/page.tsx`, `src/app/[locale]/media/podcast/[slug]/page.tsx`, `src/components/sections/podcast/*`

### 6.1 SDG Badges
- Small icon/label per episode showing relevant UN SDGs
- Example: Women-led agritech → SDG 5 (Gender Equality), SDG 8 (Decent Work), SDG 13 (Climate Action)
- Badge component with official SDG colors
- **Data:** Add `sdgTags` field to podcast data structure (currently hardcoded in `podcastData.ts`)

### 6.2 Related Track Record Project Links
- Link each episode to a related program/project
- Add `relatedProgramSlug` field to podcast data
- Example: agritech episode → Akroum Dairy project

### 6.3 Filters
- Filter by: season, guest type, country
- Search by title/description
- Extend existing `PodcastGrid` component

---

## Batch 7: Get Involved + Reports + Blog

**Files affected:** Multiple page files across get-involved, media/reports, media/blog

### 7.1 Careers Apply Button
- Add visible "Apply" button in get-involved/careers sections
- Link to application form or email

### 7.2 Remove Closed Careers
- Filter out expired/closed career listings from public view
- Add status field filtering in the careers query

### 7.3 Fix Report Downloads
- Debug and fix PDF download functionality in `ReportsGrid`
- Ensure file URLs are valid and accessible from Supabase storage

### 7.4 Blog Landing Page
- Build out the blog page with proper content display
- Add category filters, search, proper pagination
- SEO keywords: How to, guides, improve, build, Training, Tutorials

---

## Batch 8: Special Features

### 8.1 "Find Your Track" Quiz
- 3-question interactive quiz on a dedicated page or modal
- Maps user to: Incubator / Academy / Business Clinic / Humanitarian Aid / Finafas
- **Content:** Questions hardcoded (no database/admin CRUD needed)
- **Rough question outline:**
  1. What describes your situation? (Aspiring entrepreneur / Established business / Looking for training / In crisis/need support / Seeking financial guidance)
  2. What sector interests you? (Tech / Agriculture / Services / Social enterprise / Any)
  3. What do you need most? (Funding & mentorship / Skills & training / Business consulting / Humanitarian aid / Financial coaching)
- Scoring logic maps answer combinations to the 5 tracks
- Results page shows recommended track with CTA to that program

### 8.2 Tone & Keyword Consistency Pass
- **Depends on:** All Batches 1-7 must be complete
- Review all page copy for consistent tone
- Must include keywords: resilient, green economy, women innovators, post-conflict, mindset into movement, decent work, SDGs
- SEO meta tags update across all pages

---

## Technical Considerations

- **Existing stack:** Next.js 16 + Tailwind 4 + Framer Motion + Prisma/PostgreSQL
- **No new dependencies** unless strictly needed
- **Follow existing patterns:** Component structure in `src/components/sections/[page]/`
- **Global components** (WhatsApp, SocialMediaBar) go in `src/components/layout/`
- **Bilingual support:** All new text needs EN/AR translations via next-intl message files
- **Responsive:** All new components must be mobile-first
- **No schema migrations needed** — all new content is either hardcoded in data files/translations or uses existing Prisma fields
- **No admin panel changes** in this phase — new content is managed via code/translation files

---

## Validation Strategy

Each batch is validated before moving to the next:
1. Visual review of all changed pages (desktop + mobile)
2. Mobile responsiveness check
3. Verify no regressions on other pages
4. Confirm content accuracy against client feedback
5. Run `npm run build` to ensure no build errors
