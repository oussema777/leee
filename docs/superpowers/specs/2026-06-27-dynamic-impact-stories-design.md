# Dynamic Impact Stories — Design

**Date:** 2026-06-27
**Branch:** `feat/newsletter-tool` (current working branch)
**Status:** Approved design (10/10 after expert review), proceeding to implementation

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
- Changing the `Testimonial` **schema** or admin UI (existing `order`/`isActive`
  fields are sufficient). Note: `getTestimonials()` gets a one-line `orderBy`
  tiebreaker change (see Deterministic ordering) — no schema/migration involved.
- The raw `TestimonialSubmission` flow, moderation UI, or `/media/testimonials`
  page (unchanged).
- Any new "feature on impact" toggle — selection is by `order`, top 3.

## Data flow

1. **`src/app/[locale]/impact/page.tsx`**
   - Add `export const revalidate = 60` (ISR) rather than `force-dynamic`. The
     page is fully static today and most of it (dashboard, MENA map, journey,
     lessons, downloads) has no DB dependency — `force-dynamic` would add a DB
     round-trip to *every* view of the whole page for the sake of 3 testimonials.
     ISR keeps the page statically served, refreshing testimonials at most once a
     minute, which is far fresh-enough for an admin reorder. (Deviation from the
     repo's usual `force-dynamic` wiring pattern, made deliberately because the
     impact page is heavy and the dynamic data is a small, change-rarely island.)
   - Call `getTestimonials()`, take the first 3 (ordered deterministically — see
     below — and filtered to `isActive`), and pass them to
     `<ImpactStories stories={...} />`.

### Deterministic ordering (required)

`getTestimonials()` today sorts by `order: "asc"` only. `Testimonial.order`
defaults to `0` and the model has **no `createdAt`**, so multiple rows sharing
`order = 0` would make "top 3" **non-deterministic per request** — the band
could reshuffle on every revalidation and the "team curates via `order`"
guarantee would silently fail.

**Fix:** change the `orderBy` in `getTestimonials()` to a stable compound sort:

```ts
orderBy: [{ order: "asc" }, { id: "asc" }]
```

`id` is a `cuid` (unique, immutable) so it is a guaranteed tiebreaker. This is a
safe, backwards-compatible change to the shared `getTestimonials()` (the
`/media/testimonials` page only benefits from stable ordering too). Admins should
still set **distinct** `order` values on the 3 they want featured; the tiebreaker
just guarantees determinism when they don't.

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
  - When `imageUrl` is non-empty → `next/image` cover (as today). Testimonial
    photos are typically **portraits of a person**, not the scene photos used by
    the old hardcoded cards, so a 16:10 landscape crop can clip faces. **Use
    `object-cover object-top`** (instead of plain `object-cover`) so the crop
    favors the head/face. Aspect stays `aspect-[16/10]` for layout consistency
    with the rest of the page.
  - When empty → **initials-avatar fallback**: a soft brand-gradient block
    (`from-brand-blue/15 to-emerald-400/15`) with the person's initials in
    `font-serif`, mirroring `MemberCard.tsx` (`initials()` helper, first two
    word-initials). The fallback fills the same `aspect-[16/10]` media area so
    card heights stay uniform.
- **Text**
  - Name: `nameEn/Ar`.
  - **Role** (new vs. today): `roleEn/Ar`, rendered only when non-empty, in the
    existing small uppercase-accent label style.
  - Quote: `quoteEn/Ar`, italic. Unlike the old short hardcoded teasers,
    `Testimonial.quoteEn/Ar` is `@db.Text` and can be a full paragraph, so the
    quote **must be clamped** (`line-clamp-4`) to keep the three cards at uniform
    height; the full quote lives on `/media/testimonials`. Wrap the clamped quote
    in typographic quotation marks (localized: `“…”` / `«…»`) for first-person
    voice, consistent with the section's existing pull-quote treatment.
- **Role label style**: reuse the section's existing small uppercase-accent
  label treatment (the `text-[11px] font-bold uppercase tracking-[...]` eyebrow
  style already in this component / `MemberCard`'s `accent.text`), colored with
  the card's cycled accent.
- **Accent color**: cycle the existing blue → emerald → amber palette by card
  index (`i % palette.length`), so cards stay visually varied regardless of
  which testimonials surface. (Today's hardcoded per-story colors are dropped in
  favor of index cycling.) Today's accent is used in **three** places — the
  outer card `border` color, the `-top-3 -end-3` abstract ring `border`, and the
  bottom accent bar `bg` — so the palette is an index→`{ color, borderColor }`
  map (e.g. `{ color: "bg-emerald-500", borderColor: "border-emerald-400/15" }`)
  covering all three, mirroring the current `previewStories` color/border pairs.
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
| `src/app/[locale]/impact/page.tsx` | `export const revalidate = 60` (ISR); fetch `getTestimonials()`, slice 3, map, pass as prop |
| `src/components/sections/impact/ImpactStories.tsx` | Prop-based; image-led card with initials fallback (`object-top` crop); role label; clamped quote with quotation marks; index-cycled accents; section CTA; auto-hide |
| `src/lib/data/testimonials.ts` | One-line `orderBy` tiebreaker → `[{ order: "asc" }, { id: "asc" }]` for deterministic ordering |

No schema migration, no admin changes, no new API routes. The `impact/loading.tsx`
skeleton is unaffected by ISR (the page is still statically generated and served;
revalidation happens in the background), so no loading-state change is needed.

## Testing / verification

- `npx tsc --noEmit` clean.
- Dev server (`http://localhost:3000`): load `/en/impact` and `/ar/impact`:
  - Cards render real testimonial names/quotes from the DB.
  - A testimonial with a photo shows the photo; one without shows initials.
  - "See all stories →" links to `/media/testimonials` in both locales.
  - A long (paragraph-length) quote is clamped to ~4 lines and cards stay
    uniform height; quotation marks wrap the quote in both locales.
  - Reorder testimonials in `/admin/testimonials` → top 3 on impact change after
    revalidation (ISR; ≤60s, or immediately in dev where every request rebuilds).
  - Two testimonials sharing the same `order` always render in the same sequence
    across reloads (deterministic tiebreaker).
  - Temporarily reduce active testimonials to 0 (e.g. via admin `isActive`) →
    section disappears; restore afterward (the dev DB is the live prod DB —
    revert any test edits).

## Risks / notes

- `npm run dev` points at the **live Supabase prod DB**; any admin toggles made
  while verifying are real — revert them.
- The band now duplicates voices that also appear on `/media/testimonials`
  (by design — it's a curated preview with a "See all" path to the full page).
