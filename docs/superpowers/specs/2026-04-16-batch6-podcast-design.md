# Batch 6 — Podcast Enhancements Design

**Date:** 2026-04-16
**Source:** "Copy of Revised action plan - new.xlsx" (client remarks)
**Parent spec:** `docs/superpowers/specs/2026-04-15-client-feedback-redesign-design.md`
**Scope:** Batch 6 of the client feedback redesign

---

## Goals

Improve the podcast experience by adding three capabilities:

1. **SDG badges** per episode — official UN SDG icons + colors, surfaced on grid cards, the featured card, and the episode detail page.
2. **Related project link** per episode — a single program reference that renders as a mini program card on the detail page and a small pillar-color tag on the grid card.
3. **Filters & search** — extend the existing season tabs into a unified filter bar (matching the `/programs` filter pattern): search input, season pills, dropdowns for guest type / country / SDG, active filter chips with clear-all.

No backend changes. All data stays in the existing podcast data file.

---

## Files Affected

### New files
- `public/images/sdg/sdg-1.png` … `sdg-17.png` — official UN SDG icons (downloaded from UN Communications Materials site, transparent backgrounds, with number + symbol)
- `src/components/sections/podcast/sdgData.ts` — SDG number → official title (EN/AR), color hex, icon path
- `src/components/sections/podcast/SdgBadge.tsx` — badge component with `sm` and `md` variants
- `src/components/sections/podcast/PodcastFilters.tsx` — filter bar (search + season pills + 3 dropdowns + active chips)
- `src/components/sections/podcast/RelatedProjectCard.tsx` — mini program card for the episode detail page
- `src/components/sections/podcast/relatedPrograms.ts` — hand-curated lookup of programs referenced from episodes
- `src/lib/pillarColors.ts` — extracted shared pillar color constants (currently inline in `ProgramCard.tsx`)

### Modified files
- `src/components/sections/podcast/podcastData.ts` — extend `PodcastEpisode` interface with `guestType`, `countries`, `sdgTags`, `relatedProgramSlug`; populate values for all 12 existing episodes
- `src/components/sections/podcast/PodcastGrid.tsx` — replace inline season tabs with `<PodcastFilters>`, wire all filters/search, render SDG badges + pillar tag on cards
- `src/components/sections/podcast/PodcastEpisodePage.tsx` — render `<SdgBadge>` row + `<RelatedProjectCard>` below description
- `src/components/sections/programs/ProgramCard.tsx` — switch to import from `src/lib/pillarColors.ts` instead of inline record
- `messages/en.json` and `messages/ar.json` — add `podcast.filters.*`, `podcast.relatedProject.*`, `podcast.sdg.*` strings

---

## Data Model

### `PodcastEpisode` (extended)

```ts
export interface PodcastEpisode {
  // ...existing fields unchanged
  guestType?: "entrepreneur" | "expert";
  countries?: string[];          // codes from impactData.ts: "lb" | "eg" | "jo" | "iq" | "ps" | "tn" | "ma" | "sd" | "ly" | "ke"
  sdgTags?: number[];            // 1..17
  relatedProgramSlug?: string;   // matches a program slug in prisma/seed-programs.ts
}
```

All four fields are optional so the data file remains valid even if a future episode is added with no metadata yet.

### `relatedPrograms.ts`

```ts
export interface RelatedProgramSummary {
  slug: string;
  titleEn: string;
  titleAr: string;
  pillarSlug: string;            // matches keys in pillarColors record
  coverImageUrl: string;
}

export const relatedPrograms: Record<string, RelatedProgramSummary> = { ... };
```

Only contains entries for slugs actually referenced by podcast episodes. Avoids importing Prisma into client code and avoids per-episode network requests on the detail page.

### `sdgData.ts`

```ts
export interface SdgInfo {
  number: number;
  titleEn: string;
  titleAr: string;
  color: string;       // official hex, e.g. "#FF3A21" for SDG 5
  iconPath: string;    // "/images/sdg/sdg-5.png"
}

export const sdgs: Record<number, SdgInfo> = { ... };
```

All 17 SDGs included so any tag in `sdgTags` resolves cleanly.

### `src/lib/pillarColors.ts`

Extract the existing inline `pillarAccents` record from `ProgramCard.tsx` into one shared file. Same shape, same values. Both `ProgramCard` and the new `RelatedProjectCard` import from here.

---

## Episode Defaults (initial assignment)

These are reasonable starting values for the 12 existing demo episodes. Slugs are pulled from `prisma/seed-programs.ts` so they resolve to real programs. Client can refine.

| ID | Episode title (EN) | guestType | countries | sdgTags | relatedProgramSlug |
|----|-------------------|-----------|-----------|---------|---------------------|
| 1 | Women Redefining Entrepreneurship in MENA | entrepreneur | lb, tn, ma | 5, 8, 10 | `nawra-green-ventures-acceleration` |
| 2 | From Houla to the World: The Green Fashion Revolution | entrepreneur | lb | 5, 8, 12 | `houla-women-green-fashion-factory` |
| 3 | Financial Literacy: The Key to Women's Empowerment | expert | lb | 4, 5, 8 | `financial-education-women` |
| 4 | The Agritech Revolution in Rural Lebanon | entrepreneur | lb | 2, 9, 13 | `prospects-entrepreneurship-agriculture` |
| 5 | Circular Economy: The $100M Opportunity for Lebanon | expert | lb | 8, 11, 12 | `nawra-green-ventures-acceleration` |
| 6 | Solar Pioneers: Renewable Energy Entrepreneurs in MENA | entrepreneur | lb | 7, 8, 13 | (none) |
| 7 | Community Kitchens: Healing Through Food | expert | lb | 1, 2, 5 | `community-kitchens-social-cohesion` |
| 8 | What is LEEE Experience? Our Origin Story | expert | lb | 8, 17 | (none) |
| 9 | SIYB: Changing Lives One Business at a Time | expert | lb | 4, 8 | `enable-siyb-training-2024` |
| 10 | The Entrepreneurship Education Gap in MENA | expert | lb | 4, 8 | `empowering-women-entrepreneurs-mena` |
| 11 | Bridging the Digital Divide for Rural Entrepreneurs | expert | lb | 4, 9 | `digital-learning-women-sustainable-business` |
| 12 | Impact Beyond Numbers: How We Measure Real Change | expert | lb | 17 | (none) |

If a `relatedProgramSlug` cannot be matched (e.g., spelling drift, slug not in `relatedPrograms.ts`), the detail page silently omits the Related Project section — no broken UI.

---

## Component Behavior

### `SdgBadge.tsx`

Props:
```ts
{ sdgNumber: number; size?: "sm" | "md"; showLabel?: boolean }
```

- Resolves `sdgData[sdgNumber]`. Returns `null` if unknown number.
- `sm` (24×24): icon-only `<img>` with `title` attr (browser tooltip). Used on grid cards.
- `md` (56×56): icon plus the official title text below in the SDG color. Used on the episode detail page.
- Uses Next.js `<Image>` for optimization, with explicit `width`/`height`.

### `PodcastFilters.tsx`

URL-driven state. Query params:
- `search` (text, debounced 250ms)
- `season` (`s1` | `s2` | `s3`)
- `guest` (`entrepreneur` | `expert`)
- `country` (any of the 10 country codes)
- `sdg` (1..17)

Layout (matches `/programs` pattern):

```
[ search input.................................. ]

[All] [S1] [S2] [S3]      Guest ▾  Country ▾  SDG ▾

Active: [Season 3 ×] [Lebanon ×] [SDG 5 ×]   Clear all
```

- Country dropdown options: read from `impactData.menaCountries` (single source of truth).
- SDG dropdown options: auto-derived — only show SDG numbers that appear in at least one episode's `sdgTags`. Avoids empty filter results.
- Guest dropdown: fixed two options (Entrepreneur, Expert).
- Active filter chips render below the controls; each removes its own param. "Clear all" wipes everything except season=All.
- Mobile (<sm breakpoint): controls stack vertically; dropdowns become full-width.

### `PodcastGrid.tsx`

- Replace inline season tabs with `<PodcastFilters />`.
- Combine all active filters into a single in-memory filter pass over `demoEpisodes`. Search matches across `titleEn`, `titleAr`, `descriptionEn`, `descriptionAr` (case-insensitive `includes`).
- **Featured episode rule:** only render the featured card when **no filters are active** (i.e. `search` empty AND `season` empty AND `guest` empty AND `country` empty AND `sdg` empty). Once any filter is active, all matching episodes render uniformly in the list.
- On each card (list view): existing thumbnail + title + meta, plus a row of small `<SdgBadge size="sm">` icons (max 3 visible, "+N" if more) and, if `relatedProgramSlug` resolves, a small pillar-color tag like `[• Akroum Dairy]` linking to `/programs/[slug]` (stop click propagation so it doesn't trigger the card link).
- Empty state when zero matches: friendly message + "Clear all filters" button.

### `RelatedProjectCard.tsx`

Props: `{ slug: string }`

- Looks up `relatedPrograms[slug]`. Returns `null` if unknown.
- Layout: cover image (left, 96×96), then a vertical pillar-colored accent bar (4px wide, full card height), then content (right): pillar tag chip in pillar color, program title, "Explore Project →" CTA link to `/programs/[slug]`.
- Section heading above the card: "Related Project" (EN) / "مشروع ذو صلة" (AR).
- Placed in `PodcastEpisodePage.tsx` after the description, before the share/back footer.

### `PodcastEpisodePage.tsx` additions

- New section **"Impact Areas"** (heading EN) / "مجالات الأثر" (AR) below the guest info card and before the description: renders `<SdgBadge size="md">` for each tag in `episode.sdgTags`. Hidden if no tags.
- Render `<RelatedProjectCard slug={episode.relatedProgramSlug}>` after the description article. Hidden if no slug or slug doesn't resolve.

---

## SDG Asset Acquisition

Official UN SDG icons are downloaded from the UN Sustainable Development Goals Communications Materials site (United Nations, public domain for non-commercial educational use, attribution preserved by their use here as topic tags). Files placed at `public/images/sdg/sdg-{n}.png` for n = 1..17.

If the official PNGs are temporarily unavailable, fallback is to use the official SDG colors (hex codes published by the UN) on a solid colored square with the number — visually consistent until real assets are obtained. The component contract does not change.

Official SDG colors used in `sdgData.ts`:

| # | Color | # | Color | # | Color |
|---|-------|---|-------|---|-------|
| 1 | #E5243B | 7 | #FCC30B | 13 | #3F7E44 |
| 2 | #DDA63A | 8 | #A21942 | 14 | #0A97D9 |
| 3 | #4C9F38 | 9 | #FD6925 | 15 | #56C02B |
| 4 | #C5192D | 10 | #DD1367 | 16 | #00689D |
| 5 | #FF3A21 | 11 | #FD9D24 | 17 | #19486A |
| 6 | #26BDE2 | 12 | #BF8B2E |    |        |

---

## Translations (additions)

`messages/en.json` → `podcast`:

```json
{
  "filters": {
    "search": "Search episodes...",
    "season": "Season",
    "allSeasons": "All Seasons",
    "guestType": "Guest type",
    "country": "Country",
    "sdg": "SDG",
    "any": "Any",
    "active": "Active",
    "clearAll": "Clear all",
    "noResults": "No episodes match your filters.",
    "guestTypes": {
      "entrepreneur": "Entrepreneur / Founder",
      "expert": "Expert / Researcher"
    }
  },
  "impactAreas": "Impact Areas",
  "relatedProject": {
    "heading": "Related Project",
    "cta": "Explore Project"
  }
}
```

Mirror in `messages/ar.json` with Arabic equivalents.

---

## Validation

- `npm run build` passes (no TypeScript errors, no missing imports).
- Visual review on `/media/podcast` desktop + mobile, English + Arabic.
- All filter combinations produce expected results; URL persists across reloads.
- All 17 SDG icons load (no broken image placeholders) on a test page that renders all numbers.
- Episodes without `relatedProgramSlug` or `sdgTags` render gracefully (sections omitted).
- `/programs` page still renders correctly after the `pillarColors.ts` extraction (no visual regression).

---

## Out of Scope

- Database schema changes (none needed — all metadata is hardcoded).
- Admin CRUD for episodes (still managed via the data file).
- Audio player implementation (placeholder remains as-is).
- New episode content from the client — defaults are best-effort assignments for the existing 12 demo episodes.
- A test page that renders all 17 SDG badges (visual confirmation can happen via the actual episode detail pages).
