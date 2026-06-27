# Dynamic Impact Stories — Design

**Date:** 2026-06-27
**Branch:** `feat/newsletter-tool` (current working branch)
**Status:** Approved design, pending implementation

## Summary

The "Impact Stories" band on `/[locale]/impact` currently renders three
**hardcoded** story cards (`previewStories` in `ImpactStories.tsx`), each linking
to a blog post. This change makes the band **dynamic**, fed by the top three
active published `Testimonial` records — the moderated, bilingual output of the
existing "Share testimonial" pipeline. The LEEE team then controls which stories
appear purely through the `order` field in `/admin/testimonials`, with no code
changes.

The card visual style (image-led, current look) is preserved.

## Background / why the published pool, not raw submissions

There are two relevant models:

- **`TestimonialSubmission`** — what beneficiaries submit via "Share testimonial".
  Unmoderated, consent-gated, and **single-language** (`quote` is in whichever
  `locale` the person wrote in). Not safe or bilingual enough to render directly.
- **`Testimonial`** — the **published, curated, bilingual** record
  (`quoteEn` + `quoteAr`, `nameEn/Ar`, `titleEn/Ar`, `imageUrl`, `order`,
  `isActive`). Admins create these by promoting a submission
  (`TestimonialSubmission.publishedTestimonialId` links the two).

The Impact Stories band reads from the **published `Testimonial`** pool. This
still surfaces "stories people actually shared" — it just flows through the
existing moderation gate, so content is bilingual, consent-cleared, and
admin-curated.

The published pool already powers `/media/testimonials` via
`getTestimonials()` in `src/lib/data/testimonials.ts`.

## Scope

### In scope
- Convert `ImpactStories.tsx` from a self-contained client component (hardcoded
  array) to a **prop-based** client component.
- Fetch the top 3 active testimonials server-side on the impact page and pass
  them down.
- Image-led card with an **initials-avatar fallback** when a testimonial has no
  photo.
- Replace per-card "Read full story → blog" links with a single **"See all
  stories →"** CTA under the band, pointing to `/media/testimonials`.
- Auto-hide the entire section when there are zero testimonials.

### Out of scope
- Changing the `Testimonial` schema or admin UI (existing `order`/`isActive`
  fields are sufficient).
- The raw `TestimonialSubmission` flow, moderation UI, or `/media/testimonials`
  page (unchanged).
- Any new "feature on impact" toggle — selection is by `order`, top 3.

## Data flow

1. **`src/app/[locale]/impact/page.tsx`**
   - Add `export const dynamic = "force-dynamic"` (the page is fully static
     today; it must read the DB at request time, matching the existing
     admin↔site wiring pattern).
   - Call `getTestimonials()`, take the first 3 (already ordered by `order asc`,
     filtered to `isActive`), and pass them to `<ImpactStories stories={...} />`.

2. **`src/components/sections/impact/ImpactStories.tsx`**
   - Accepts a `stories: ImpactStoryCard[]` prop instead of the hardcoded
     `previewStories` array.
   - Keeps all existing markup: section wrapper, abstract shapes, animated
     header, pull-quote, and the `useInView` entrance animations.
   - If `stories.length === 0`, render `null` (auto-hide).

### Prop shape

The page maps each `TestimonialListItem` (from `getTestimonials()`) to a small
view model the component renders:

```ts
type ImpactStoryCard = {
  id: string;
  nameEn: string;
  nameAr: string;
  roleEn: string;   // from titleEn
  roleAr: string;   // from titleAr
  quoteEn: string;
  quoteAr: string;
  imageUrl: string; // "" when absent → initials fallback
};
```

`getTestimonials()` already returns these fields (`roleEn/roleAr` map from
`titleEn/titleAr`). The page slices `.slice(0, 3)` and maps to `ImpactStoryCard`.

## Card design (image-led, current look preserved)

Each card keeps today's structure: media area on top, then name, role, quote,
accent bar; hover lift + image zoom unchanged.

- **Media area**
  - When `imageUrl` is non-empty → `next/image` cover (as today).
  - When empty → **initials-avatar fallback**: a soft brand-gradient block
    (`from-brand-blue/15 to-emerald-400/15`) with the person's initials in
    `font-serif`, mirroring `MemberCard.tsx` (`initials()` helper, first two
    word-initials). The fallback fills the same `aspect-[16/10]` media area so
    card heights stay uniform.
- **Text**
  - Name: `nameEn/Ar`.
  - **Role** (new vs. today): `roleEn/Ar`, rendered only when non-empty, in the
    existing small uppercase-accent label style.
  - Quote: `quoteEn/Ar`, italic, as today.
- **Accent color**: cycle the existing blue → emerald → amber palette by card
  index (`i % palette.length`), so cards stay visually varied regardless of
  which testimonials surface. (Today's hardcoded per-story colors are dropped in
  favor of index cycling.)
- **CTA**
  - Per-card blog link **removed**.
  - One **"See all stories →"** button (localized: "See all stories" /
    «شاهد كل القصص») beneath the grid, linking to `/media/testimonials` via the
    locale-aware `Link` from `@/i18n/navigation`.

## Edge cases

- **0 testimonials** → section returns `null`; the impact page shows no empty
  band. (The DB was seeded with ~12 testimonials, so this is a safety net, not
  the expected state.)
- **1–2 testimonials** → grid renders only those; layout already uses
  `grid-cols-1 md:grid-cols-3` and degrades cleanly.
- **Missing role** → role label is omitted (conditional render).
- **Missing photo** → initials fallback (above).
- **RTL/Arabic** → all strings already have `isAr` branches; logical properties
  (`start`/`end`) already used throughout the component.

## Components & files touched

| File | Change |
| --- | --- |
| `src/app/[locale]/impact/page.tsx` | `force-dynamic`; fetch `getTestimonials()`, slice 3, map, pass as prop |
| `src/components/sections/impact/ImpactStories.tsx` | Prop-based; image-led card with initials fallback; role label; index-cycled accents; section CTA; auto-hide |
| `src/lib/data/testimonials.ts` | **No change** — `getTestimonials()` reused as-is |

No schema migration, no admin changes, no new API routes.

## Testing / verification

- `npx tsc --noEmit` clean.
- Dev server (`http://localhost:3000`): load `/en/impact` and `/ar/impact`:
  - Cards render real testimonial names/quotes from the DB.
  - A testimonial with a photo shows the photo; one without shows initials.
  - "See all stories →" links to `/media/testimonials` in both locales.
  - Reorder testimonials in `/admin/testimonials` → top 3 on impact change after
    reload (force-dynamic).
  - Temporarily reduce active testimonials to 0 (e.g. via admin `isActive`) →
    section disappears; restore afterward (the dev DB is the live prod DB —
    revert any test edits).

## Risks / notes

- `npm run dev` points at the **live Supabase prod DB**; any admin toggles made
  while verifying are real — revert them.
- The band now duplicates voices that also appear on `/media/testimonials`
  (by design — it's a curated preview with a "See all" path to the full page).
