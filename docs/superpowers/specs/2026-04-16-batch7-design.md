# Batch 7 — Get Involved + Reports + Blog — Design

**Date:** 2026-04-16
**Parent spec:** `docs/superpowers/specs/2026-04-15-client-feedback-redesign-design.md` (§ Batch 7)
**Status:** Design approved, pending implementation

---

## Summary

Batch 7 ships four independent improvements across three page groups:

1. **Public Careers page** at `/[locale]/get-involved/careers` — lists active, non-expired openings from the existing `Career` Prisma model, with a bilingual "Apply Now" modal that stores submissions in a new `CareerApplication` model.
2. **Closed-careers filter** — server-side `where` clause hides jobs that are `!isActive` or have a passed `deadline`; no schema change, just a query.
3. **Reports download fix** — seed 3 real placeholder PDFs into `public/reports/`, keep the other 9 demo entries but render a disabled "Coming Soon" button when `fileUrl === "#"`.
4. **Blog search + pagination** — add a debounced URL-synced search input above category tabs, switch the grid to numbered pagination (9 posts per page, `?page=N`), preserve featured-post behavior, preserve category state.

All four items share a single commit `feat(batch7): …` and land together.

---

## 1. Public Careers page + Apply modal

### 1.1 Route

- **New page:** `src/app/[locale]/get-involved/careers/page.tsx` (server component).
- **Nav wiring:** The `nav.careers` key is already translated in `messages/{en,ar}.json`. The nav component is `src/components/layout/Navbar.tsx` (there is no `Header.tsx`). Under the existing `/get-involved` dropdown (which currently lists Entrepreneurs, Partners, Experts, Advocates), add a new child link:
  ```ts
  { label: t("nav.careers"), href: "/get-involved/careers" }
  ```
  Position it **last** in the dropdown (after Advocates). Preserve the existing ordering + styling pattern of the sibling items.

### 1.2 Data fetch

Server component pulls active, non-expired jobs:

```ts
const now = new Date();
const careers = await prisma.career.findMany({
  where: {
    isActive: true,
    OR: [{ deadline: null }, { deadline: { gte: now } }],
  },
  orderBy: { createdAt: "desc" },
});
```

This single query implements both **7.1** (show the careers list at all) and **7.2** (remove closed/expired listings from public view). No schema change.

### 1.3 Listing UI

**Component:** `src/components/sections/careers/CareersList.tsx` (client component — receives `careers` as a prop so the server page can remain a server component).

**Layout:** Vertical stacked list of cards (job listings read better stacked than gridded). Each card is a standalone container with:

- Title (bilingual, `text-xl font-semibold`).
- Job-type chip (`FULL_TIME` → "Full-time", `PART_TIME` → "Part-time", `CONTRACT` → "Contract", `VOLUNTEER` → "Volunteer"). Chip uses brand-blue tinted background.
- Meta row: `<MapPin className="w-4 h-4" /> {location}` + `<CalendarClock className="w-4 h-4" /> Apply by: {formatted deadline}` (deadline row omitted when `deadline === null`). **Do not use emoji** icons (`📍` / `🗓️`) — some Arabic renderers drop them. Use lucide-react `MapPin` and `CalendarClock`, which match the icon conventions used elsewhere on the site.
- Description, `line-clamp-3`, in `text-text-secondary`.
- **Apply Now** button at the end — primary brand-blue, opens the modal with `{ slug, titleEn, titleAr }` as props.

**Empty state:** Icon + "No open positions at the moment. Please check back soon!" + CTA linking to `/get-involved/join-us` (expert pool) for candidates who still want to register interest.

### 1.4 Apply modal

**Component:** `src/components/sections/careers/CareerApplyModal.tsx`.

Modeled directly on `src/components/sections/programs/RegisterModal.tsx` (Batch 3 pattern):

**Props:**
```ts
type CareerApplyModalProps = {
  isOpen: boolean;
  onClose: () => void;
  careerSlug: string;
  careerTitleEn: string;
  careerTitleAr: string;
};
```

**Fields:**
| Field | Type | Required | Notes |
|---|---|---|---|
| `fullName` | text | yes | |
| `email` | email | yes | client-side pattern validation |
| `phone` | tel | no | |
| `resumeUrl` | url | no | helper text: "Link to your CV — Google Drive, Dropbox, or LinkedIn PDF" |
| `coverLetter` | textarea | yes | 6 rows, min 20 chars |

**Submission:** `POST /api/public/careers/apply` with payload per §1.6.

**Response handling in modal:**
- `200 { ok: true }` → close modal + render success toast using `careers.apply.success`.
- `400 { ok: false, error: "validation" }` → inline field errors (use `careers.apply.errorValidation`).
- `404 { ok: false, error: "not_found" }` → inline error `careers.apply.errorNotFound` ("This position is no longer available.").
- `410 { ok: false, error: "closed" }` → same inline slot, `careers.apply.errorClosed` ("This position has closed.").
- Any other / network failure → `careers.apply.errorGeneric`.

**Bilingual:** All labels + helper text + validation errors go through `useTranslations("careers.apply.*")`.

**Honeypot:** Render a visually hidden `<input name="website" tabIndex={-1} autoComplete="off" />`. If non-empty on submit, silently pretend success (don't hit the API) — cheap bot filter.

### 1.5 New Prisma model

```prisma
model CareerApplication {
  id          String   @id @default(cuid())
  careerId    String
  career      Career   @relation(fields: [careerId], references: [id])
  fullName    String
  email       String
  phone       String?
  resumeUrl   String?
  coverLetter String   @db.Text
  createdAt   DateTime @default(now())

  @@index([careerId])
  @@index([createdAt])
}
```

Add reverse relation on `Career`:
```prisma
model Career {
  // …existing fields
  applications CareerApplication[]
}
```

**Migration:** `npx prisma migrate dev --name add_career_application`.

### 1.6 API endpoint

**New:** `src/app/api/public/careers/apply/route.ts`.

- Method: `POST` only; other methods return 405.

**Zod schema** (shared between route and client validation):
```ts
const applySchema = z.object({
  careerSlug: z.string().min(1).max(200),
  fullName:   z.string().min(2).max(120),
  email:      z.string().email().max(200),
  phone:      z.string().max(40).optional().or(z.literal("")),
  resumeUrl:  z.string().url().max(500).optional().or(z.literal("")),
  coverLetter:z.string().min(20).max(5000),
  website:    z.string().max(0).optional(),  // honeypot
});
```

**Flow:**
1. Parse with zod — on failure, return `400 { ok: false, error: "validation", fields?: {...} }`.
2. Honeypot: if `website` is non-empty, return `200 { ok: true }` without writing (silent drop).
3. `prisma.career.findUnique({ where: { slug: careerSlug } })` → if null → `404 { ok: false, error: "not_found" }`.
4. If `!isActive` OR (`deadline !== null` AND `deadline < now`) → `410 { ok: false, error: "closed" }`.
5. `prisma.careerApplication.create(...)` → `200 { ok: true }`.
6. Any unhandled throw → `500 { ok: false, error: "server" }`.

**Response envelope** is strictly one of:
- `{ ok: true }`
- `{ ok: false, error: "validation" | "not_found" | "closed" | "server", fields?: Record<string, string> }`

No email notification in this batch (can be a follow-up; admin dashboard view covers the audit need).

### 1.7 Admin applications view

**New:** `src/app/admin/(dashboard)/careers/applications/page.tsx` — **server component**. Inherits the `(dashboard)` route group's layout (sidebar, auth gate) automatically; no separate auth wiring needed.

**Data fetch** (server-side, inside the page component):
```ts
const applications = await prisma.careerApplication.findMany({
  include: { career: { select: { slug: true, titleEn: true, titleAr: true, isActive: true } } },
  orderBy: { createdAt: "desc" },
});
```

**UI** — read-only table:

| Column | Content |
|---|---|
| Applicant | `fullName` |
| Email | `<a href="mailto:…">` |
| Phone | plain text or `—` |
| Position | links to `/admin/careers/{career.id}/edit` with the title |
| Submitted | relative time (e.g. "2 days ago") using existing helper if present, else `toLocaleString()` |
| Resume | external-link icon anchor if `resumeUrl`, else `—` |
| Cover letter | "View" button |

**Cover-letter viewer:** small client component `<CoverLetterDialog />` using a native `<dialog>` element (no existing admin drawer component to reuse). Opens on button click, shows `coverLetter` text in a scrollable panel, closes on ESC or backdrop click.

**Discoverability:** Add a "View Applications" link button in the top-right of `/admin/careers` (list page). Do not restructure the page further.

### 1.8 Translations

New keys under `careers.*` in `messages/en.json` and `messages/ar.json`:

```
careers.pageTitle
careers.pageSubtitle
careers.jobType.{fullTime, partTime, contract, volunteer}
careers.location               // label for location meta, e.g. "Location"
careers.applyBy
careers.applyNow
careers.noPositions
careers.noPositionsCta
careers.apply.title
careers.apply.fullName
careers.apply.email
careers.apply.phone
careers.apply.resumeUrl
careers.apply.resumeUrlHelper
careers.apply.coverLetter
careers.apply.submit
careers.apply.submitting
careers.apply.success
careers.apply.errorValidation
careers.apply.errorNotFound
careers.apply.errorClosed
careers.apply.errorGeneric
```

---

## 2. Reports download fix

### 2.1 Seed real PDFs

Add **3 placeholder PDFs** to `public/reports/`, each mapped to a specific `demoReports` entry:

| File | Target entry (id / title / category) |
|---|---|
| `annual-report-2025.pdf` | `id: "1"` — "LEEE Experience Annual Report 2025" (annual) |
| `nawra-green-ventures-impact.pdf` | `id: "4"` — "NAWRA Green Ventures — Impact Assessment Report" (impact) |
| `enable-programme-mid-term.pdf` | `id: "9"` — "ENABLE Programme — Mid-Term Evaluation" (program) |

This gives one real PDF per major category, and filenames align to the actual report titles.

PDFs are **clearly marked in red on the cover**: "PLACEHOLDER — For demo purposes only". **Production method:** render a minimal HTML page (title, subtitle "Placeholder — For demo purposes only", org logo, year) and use the browser's "Save as PDF" print dialog to produce a **single-page PDF**. Target size **< 50 KB** each. This avoids adding any runtime or dev-time PDF dependency; the 3 generated files are committed to `public/reports/`.

### 2.2 Data change

`src/components/sections/reports/reportsData.ts` — update **only** entries `id: "1"`, `id: "4"`, `id: "9"`. Set their `fileUrl` from `"#"` to `/reports/annual-report-2025.pdf`, `/reports/nawra-green-ventures-impact.pdf`, `/reports/enable-programme-mid-term.pdf` respectively. Leave the other 9 entries as `"#"` unchanged.

### 2.3 UI change

`src/components/sections/reports/ReportsGrid.tsx` already uses the inline-bilingual pattern (`isAr ? "…" : "…"`) with **no** `useTranslations` hook. Keep that pattern — do **not** convert to `useTranslations` in this batch. Replace the unconditional download anchor with a conditional:

```tsx
{report.fileUrl && report.fileUrl !== "#" ? (
  <a
    href={report.fileUrl}
    download
    target="_blank"
    rel="noopener noreferrer"
    className="inline-flex items-center justify-center gap-2 text-sm font-medium text-white bg-brand-blue hover:bg-brand-blue-dark transition-colors px-4 py-2.5 w-full"
  >
    <Download className="w-4 h-4" />
    {isAr ? "تحميل التقرير" : "Download Report"}
  </a>
) : (
  <button
    type="button"
    disabled
    aria-disabled="true"
    className="inline-flex items-center justify-center gap-2 text-sm font-medium text-text-muted bg-gray-100 px-4 py-2.5 w-full cursor-not-allowed"
  >
    <Clock className="w-4 h-4" />
    {isAr ? "قريباً" : "Coming Soon"}
  </button>
)}
```

`download` attribute added so browsers prompt a save dialog instead of opening inline. Import `Clock` from `lucide-react` (already in the codebase elsewhere).

### 2.4 Translations

No new `reports.*` translation keys needed — the inline-bilingual pattern is preserved. Strings baked in the JSX as shown above.

---

## 3. Blog search + pagination

### 3.1 Search input

**Component edit:** `src/components/sections/blog/BlogGrid.tsx`.

- Place a search `<input type="search">` above the category tabs (full-width on mobile, `max-w-sm` on desktop with category tabs beside it on the same row when space allows).
- Local `useState` for the raw input value; a `useEffect` pushes `?search={value}` to the URL after **250 ms debounce** (same pattern as `PodcastFilters`).
- Reading current value: `searchParams.get("search") ?? ""` syncs on mount.
- Placeholder: `blog.searchPlaceholder` ("Search articles…" / "ابحث في المقالات…").
- A clear "✕" icon button appears when the input is non-empty; it clears both local state and URL param.

**Search matching:** case-insensitive substring against the concatenated haystack:
```
[post.titleEn, post.titleAr, post.excerptEn, post.excerptAr, post.authorNameEn, post.authorNameAr].join(" ").toLowerCase()
```

- Searching **always crosses both locales' fields**, regardless of the current UI locale — a user in `en` can still match an Arabic title, and vice versa. This is intentional for a bilingual site.
- **Body content is out of scope** for this batch — `BlogPost` has no `bodyEn`/`bodyAr` field today; only title, excerpt, and author are searched.

### 3.2 Pagination

**Constants:** `const PAGE_SIZE = 9;`

**Flow (precise):**
1. Apply category filter → subset A.
2. Apply search filter on A → subset B.
3. **Featured-post split:** if **no active filters** (no category, no search), find and **remove** the featured post from B into a separate variable `featured`. The remaining B no longer contains it. Otherwise `featured = null`.
4. `totalPages = Math.max(1, Math.ceil(B.length / PAGE_SIZE))`.
5. Clamp `page` to `[1, totalPages]`.
6. `pageItems = B.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)`.
7. Render: `featured` (if non-null **and** `page === 1`) above the grid; then `pageItems` in the grid; then pagination controls.

**Consequence:** page 1 (no filters) shows 1 featured card + up to 9 grid cards = up to 10 items visible, matching today's visual density. Page 2+ shows only 9 grid cards.

**URL state:** `?page=N`. Default page = 1. Any change to `?category` or `?search` resets `?page` to 1 (omits the param).

**Controls (below the grid, centered):**
- `←` prev (disabled on page 1).
- Page numbers with ellipsis windowing: show page 1, page N, current ± 1, and `…` between gaps (e.g. `1 … 4 5 **6** 7 8 … 12`).
- `→` next (disabled on last page).
- Current page: brand-blue filled square. Others: text-only, hover brand-blue.
- If total pages ≤ 1 → hide the control entirely.

Accessibility: `aria-label="Go to page N"`, `aria-current="page"` on the active page.

### 3.3 Empty state

When filtered + paginated result is empty, render:
- Icon (`FileX2`, already used)
- Text: `blog.noResults` ("No articles match your search.")
- Button: `blog.clearFilters` — resets search + category + page.

Reuse the existing empty-state layout; just expand the current "no posts in category" branch.

### 3.4 SEO tweak (7.4 spec keywords)

**Metadata** (`src/app/[locale]/media/blog/page.tsx` — `generateMetadata`):
- EN description: `"How-to guides, training tutorials, insights, and stories on building resilient businesses, the green economy, and women innovators across MENA."`
- AR description: `"أدلة إرشادية وتدريبات تعليمية ورؤى وقصص حول بناء الأعمال المرنة، والاقتصاد الأخضر، والمبتكرات من النساء في منطقة الشرق الأوسط وشمال أفريقيا."`

**Subtitle copy** — exact replacements for `blog.pageSubtitle`:
- EN (new): `"Insights, guides, tutorials, and stories from the LEEE Experience team."`
- AR (new): `"رؤى وأدلة ودروس تعليمية وقصص من فريق LEEE Experience."`

(Previously: EN `"Insights, stories, and updates from the LEEE Experience team"` / AR `"رؤى وقصص وتحديثات من فريق LEEE Experience"`. Only inject "guides" + "tutorials" keywords while keeping tone consistent.)

### 3.5 Translations

New keys under `blog.*`:
```
blog.searchPlaceholder
blog.noResults
blog.clearFilters
blog.previousPage
blog.nextPage
blog.pageLabel        // e.g. "Page {page}"
blog.pageOf           // e.g. "of {total}"
```

---

## Non-goals / out of scope

- Full-text search infrastructure (Postgres `tsvector`, Algolia, etc.) — client-side substring is fine at current data volume.
- File upload for resumes — we accept URLs only this batch.
- Email notifications for career applications — admin list view is sufficient for MVP.
- Admin CRUD on `CareerApplication` beyond list/view — deletions/edits can wait.
- Real PDFs with real content — 3 placeholder PDFs is all we need to prove the flow works.
- Moving `Report` to the database — still file-based.

---

## Risks & mitigations

| Risk | Mitigation |
|---|---|
| Prisma migration fails on the deployed DB | Run `migrate dev` locally first; commit `migration.sql`; document rollback. |
| Career Apply API spammed | Rate-limit handled by existing middleware if present; otherwise accept as MVP risk. Add honeypot field (hidden `website` input) as a cheap bot filter. |
| Placeholder PDFs get confused with final copy | Each PDF cover reads "PLACEHOLDER — For demo purposes only" in red. |
| Blog search + pagination interaction bugs | Page index resets to 1 on any filter change; explicit unit-like mental model in code comments. |
| Nav still doesn't route to `/careers` | Update `src/components/layout/Navbar.tsx` alongside the new page; add "Careers" as the last child in the `/get-involved` dropdown. Verified by Batch 7 test plan. |

---

## Files affected (expected)

**New:**
- `src/app/[locale]/get-involved/careers/page.tsx`
- `src/components/sections/careers/CareersList.tsx`
- `src/components/sections/careers/CareerApplyModal.tsx`
- `src/app/api/public/careers/apply/route.ts`
- `src/app/admin/(dashboard)/careers/applications/page.tsx`
- `prisma/migrations/<timestamp>_add_career_application/migration.sql`
- `public/reports/annual-report-2025.pdf`
- `public/reports/impact-study-women-entrepreneurs.pdf`
- `public/reports/program-evaluation-nawra.pdf`

**Modified:**
- `prisma/schema.prisma` — add `CareerApplication` model + reverse relation on `Career`
- `src/components/layout/Navbar.tsx` — wire `/get-involved/careers` as last child in the Get Involved dropdown
- `src/app/admin/(dashboard)/careers/page.tsx` — add "View Applications" link in the top-right
- `src/components/sections/reports/reportsData.ts` — 3 real `fileUrl`s (ids 1, 4, 9)
- `src/components/sections/reports/ReportsGrid.tsx` — conditional download button (inline-bilingual, no `useTranslations`)
- `src/components/sections/blog/BlogGrid.tsx` — search input + pagination
- `src/app/[locale]/media/blog/page.tsx` — `generateMetadata` SEO tweak + `blog.pageSubtitle` update
- `messages/en.json` + `messages/ar.json` — new `careers.*` keys + updated `blog.pageSubtitle` + new `blog.*` keys (search + pagination). **No** new `reports.*` keys.

---

## Validation strategy

1. `npm run lint` clean.
2. `npx next build` succeeds, all static pages generated.
3. Manual (EN + AR):
   - `/get-involved/careers` — list shows, chips correct, deadline filtering works (seed one career via admin with `deadline` set to yesterday; confirm it does **not** appear in the public list).
   - Navbar Get Involved dropdown includes the new Careers item in both locales.
   - Apply flow submits and the row appears in `/admin/careers/applications`.
   - Honeypot: inject a value into `name="website"` via devtools before submit; expect a fake success response and no row created in the DB.
   - `/media/reports` — entries 1/4/9 download real PDF; the other 9 show "Coming Soon" disabled state.
   - `/media/blog` — search filters; pagination works; resets to page 1 on category or search change; deep-link `?page=2&category=impact&search=women` works on hard reload; empty state renders with Clear Filters button.
4. **API defense-in-depth** — with an expired career in the DB:
   ```
   curl -X POST http://localhost:3000/api/public/careers/apply \
     -H "Content-Type: application/json" \
     -d '{"careerSlug":"<expired-slug>","fullName":"Test","email":"t@t.com","coverLetter":"A cover letter at least twenty chars."}'
   ```
   Expect `410 { ok: false, error: "closed" }` and no new `CareerApplication` row.
   Repeat with a non-existent slug → expect `404 { ok: false, error: "not_found" }`.
5. Mobile viewport check — careers list, apply modal, blog search + pagination controls.
6. No regressions elsewhere.
