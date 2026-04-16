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
- **Nav wiring:** The `nav.careers` key is already translated in `messages/{en,ar}.json`. Update the Header navigation to resolve it to `/get-involved/careers` (currently renders nothing).

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
- Meta row: `📍 {location}` + `🗓️ Apply by: {formatted deadline}` (deadline row omitted when `deadline === null`).
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

**Submission:** `POST /api/public/careers/apply` with `{ careerSlug, fullName, email, phone, resumeUrl, coverLetter }`. The API resolves `careerSlug → careerId` server-side. Success → close modal + toast "Application submitted! We'll be in touch.". Failure → inline error.

**Bilingual:** All labels + helper text + validation errors go through `useTranslations("careers.apply.*")`.

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
- Validates payload with zod (pattern used elsewhere in `/api/public/*`).
- Rejects if the referenced career is not found, not active, or past its deadline (defense in depth — UI already hides these, but attackers can still POST directly).
- On success, inserts the `CareerApplication`, returns `{ ok: true }`.
- No email notification in this batch (can be a follow-up; admin dashboard view covers the audit need).

### 1.7 Admin applications view

**New:** `src/app/admin/(dashboard)/careers/applications/page.tsx` — read-only list of all `CareerApplication` rows joined with their parent `Career`.

Columns: Applicant name | Email | Phone | Position (links to the career edit page) | Submitted (relative time) | Resume link (if present, opens in new tab). Coverletter accessible via a "View" drawer/modal (reuses existing admin drawer pattern if one exists, otherwise a simple details `<dialog>`).

Add a top-right link on `/admin/careers` to "View Applications" for discoverability.

### 1.8 Translations

New keys under `careers.*` in `messages/en.json` and `messages/ar.json`:

```
careers.pageTitle
careers.pageSubtitle
careers.jobType.{fullTime, partTime, contract, volunteer}
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
careers.apply.success
careers.apply.errorGeneric
```

---

## 2. Reports download fix

### 2.1 Seed real PDFs

Add **3 placeholder PDFs** to `public/reports/`:

| File | Assigned to demo id | Notes |
|---|---|---|
| `annual-report-2025.pdf` | `1` ("LEEE Annual Report 2025") | 1-page cover + 1-page overview |
| `impact-study-women-entrepreneurs.pdf` | impact-category entry | 1 page |
| `program-evaluation-nawra.pdf` | program-category entry | 1 page |

PDFs are **clearly marked "Placeholder — For demo purposes"** on the cover so the client doesn't misread them as final content. Generated locally via a lightweight approach (e.g., `pdf-lib` ad-hoc script or simple HTML→PDF; do not add `pdf-lib` as a runtime dependency — generate PDFs once, commit the files).

### 2.2 Data change

`src/components/sections/reports/reportsData.ts` — update the 3 chosen entries' `fileUrl` from `"#"` to `/reports/<filename>.pdf`. Leave the other 9 as `"#"`.

### 2.3 UI change

`src/components/sections/reports/ReportsGrid.tsx` — replace the unconditional download anchor with:

```tsx
{report.fileUrl && report.fileUrl !== "#" ? (
  <a
    href={report.fileUrl}
    download
    target="_blank"
    rel="noopener noreferrer"
    className="…existing classes…"
  >
    <Download className="w-4 h-4" />
    {t("download")}
  </a>
) : (
  <button
    disabled
    aria-disabled="true"
    className="inline-flex items-center justify-center gap-2 text-sm font-medium text-text-muted bg-gray-100 px-4 py-2.5 w-full cursor-not-allowed"
  >
    <Clock className="w-4 h-4" />
    {t("comingSoon")}
  </button>
)}
```

`download` attribute added so browsers prompt a save dialog instead of opening inline.

### 2.4 Translations

Add `reports.comingSoon` to `messages/{en,ar}.json`:
- EN: `"Coming Soon"`
- AR: `"قريباً"`

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

### 3.2 Pagination

**Constants:** `const PAGE_SIZE = 9;`

**Flow:**
1. Apply category filter → subset A.
2. Apply search filter → subset B.
3. On page 1 with **no active filters** (no category, no search), lift the featured post out of B (same behavior as today).
4. Slice B by page: `B.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)`.

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

Edit `src/app/[locale]/media/blog/page.tsx` metadata (`generateMetadata`):
- Extend the `description` to include: *"how-to guides, training tutorials, and stories on building resilient businesses, the green economy, and women innovators across MENA."*
- Also ensure the page `<h1>` / subtitle copy naturally contains "guides" and "tutorials" — lightly edit the existing `blog.pageSubtitle` translation, don't rewrite.

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
| Nav header still doesn't route to `/careers` | Update `Header.tsx` / relevant nav component alongside the new page. Verified by Batch 7 test plan. |

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
- `src/components/layout/Header.tsx` (or equivalent nav file) — wire `/get-involved/careers`
- `src/components/sections/reports/reportsData.ts` — 3 real `fileUrl`s
- `src/components/sections/reports/ReportsGrid.tsx` — conditional download button
- `src/components/sections/blog/BlogGrid.tsx` — search input + pagination
- `src/app/[locale]/media/blog/page.tsx` — metadata SEO tweak
- `messages/en.json` + `messages/ar.json` — `careers.*`, `reports.comingSoon`, `blog.*` new keys

---

## Validation strategy

1. `npm run lint` clean.
2. `npx next build` succeeds, all static pages generated.
3. Manual: EN + AR.
   - `/get-involved/careers` — list shows, chips correct, deadline filtering works (seed one expired job via admin to confirm).
   - Apply flow submits and the row appears in admin applications view.
   - `/media/reports` — 3 entries download real PDF; 9 entries show "Coming Soon" disabled state.
   - `/media/blog` — search filters; pagination works; resets on category change; empty state renders with clear button; deep-link `?page=2&category=impact&search=women` works on hard reload.
4. Mobile viewport check — careers list, apply modal, blog search + pagination controls.
5. No regressions elsewhere.
