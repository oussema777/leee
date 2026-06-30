# Expert Applications Intake — Design Spec

**Date:** 2026-06-30
**Status:** Approved (brainstorming complete; pending spec review)
**Author:** LEEE Experience team

## 1. Overview

A public **Expert Profile Submission Form** (the "Expert Applications" intake) that lets
any professional apply to join The Lee Experience expert network. Submissions are an
**internal data-collection tool** — nothing on the form is auto-published to the website.
Each submission lands in an admin **"Expert Applications" inbox** where the team reviews,
triages, and manages it. When the team decides to feature someone publicly, they add that
person manually through the existing **Members** screen, copying only the fields they want
public. There is **no approval→publish pipeline**.

This mirrors the existing **submission-inbox** pattern already proven in the codebase
(Contact Messages, Join Us, Testimonial Submissions): public form → stored submission →
admin inbox. It reuses the existing auth (`withAdmin`), public upload, notification email,
rate-limit, and admin table/badge components.

Source form: `Expert Profile Submission Form — Welcome to The Lee Experience` (Google Form,
21 questions across 5 sections). This spec captures all 21 questions.

## 2. Goals / Non-Goals

**Goals**
- A public, indexable application form collecting all 21 fields, reachable from the existing
  "Apply to Join Our Expert Pool" CTA on `/get-involved/expert`.
- Store each submission with a lightweight management workflow (status, read/unread, notes).
- An admin inbox (visible to **all** admins) to list, filter, search, view, update status,
  add internal notes, delete, and **export to CSV**.
- Notify the team by email when a new application arrives.
- Capture an uploaded headshot with each submission.

**Non-Goals (YAGNI)**
- No auto-publishing and no creation of public `BoardMember`/expert records on submission.
- No changes to the public `/about/experts` page or how experts render.
- No per-expert public profile pages.
- No bilingual *content* translation (the form is English-content; UI labels are EN/AR).
- No payment, scheduling, or contracting features (daily rate is captured as data only).

## 3. Decisions (confirmed with stakeholder)

| Topic | Decision |
|-------|----------|
| Purpose | Internal data collection only. Nothing auto-published. |
| Publishing | Team adds featured experts manually via the existing Members screen. |
| Inbox access | **All admins** (`withAdmin`), not super-admin-only. Sits under "Submissions". |
| Workflow | Lightweight pipeline: `NEW → SHORTLISTED → CONTACTED → ARCHIVED` (+ `REJECTED`); plus read/unread + internal notes. |
| Email notification | Yes — team is emailed on each new application. |
| CSV export | Yes — download all applications as a spreadsheet. |
| Photo | Yes — headshot uploaded in the form, stored with the submission. |
| Form location | New page at `/{locale}/get-involved/expert/apply`; the existing CTA is rewired to it (was `join-us?role=expert`). |
| Indexing | Form page is **indexable** (public call for experts). |
| Country | Stored as a multi-value list (the Google form used checkboxes). |
| Bilingual | UI labels EN/AR; submitted content is free-text (typically English). |

## 4. Data Model

### 4.1 New model: `ExpertSubmission`

```prisma
model ExpertSubmission {
  id                 String  @id @default(cuid())

  // Section 1 — Personal information
  fullName           String
  professionalTitle  String
  countries          String[]            // Q3 — country/countries of residence/practice
  phone              String              // internal only — never published
  email              String              // internal only — never published
  linkedinUrl        String?
  photoUrl           String?             // uploaded headshot
  photoConsent       Boolean @default(false) // Q8 — permission to publish photo

  // Section 2 — Academic degrees
  degrees            String[]            // Q9 — multi-select
  degreeDetails      String  @db.Text    // Q10 — major/university/year details
  majorFieldOfStudy  String              // Q11

  // Section 3 — Professional experience & credentials
  yearsExperience    String              // Q12 — single bucket, e.g. "6-10 years"
  certifications     String  @db.Text    // Q13
  licensesMemberships String? @db.Text   // Q14 — optional

  // Section 4 — Area of expertise
  shortBio           String  @db.Text    // Q15 — 3-line bio
  expertiseKeywords  String              // Q16 — top 3 keywords
  notableWork        String? @db.Text    // Q17 — publications/projects/awards (optional)
  languages          String              // Q18

  // Section 5 — Publishing consent & availability
  availableForEngagements String         // Q19 — "Yes"/"No"
  dailyRate          String              // Q20 — internal only; e.g. "200 USD", "Case by Case"
  publishConsent     Boolean @default(false) // Q21 — agreed to publish profile

  // Moderation / management
  status             ExpertSubmissionStatus @default(NEW)
  isRead             Boolean   @default(false)
  adminNotes         String?   @db.Text   // internal notes
  reviewedAt         DateTime?
  createdAt          DateTime  @default(now())
}

enum ExpertSubmissionStatus {
  NEW
  SHORTLISTED
  CONTACTED
  ARCHIVED
  REJECTED
}
```

**Notes:**
- The genuine multi-selects (`countries`, `degrees`) use Postgres scalar arrays (`String[]`),
  which the Supabase Postgres datasource + Prisma support (already used elsewhere in the
  schema). `yearsExperience` is a **single** mutually-exclusive bucket → stored as `String`.
- **"Other" free-text:** when an applicant types an "Other" value for `countries` or
  `degrees`, that string is appended verbatim as an additional array element. For
  `dailyRate "Other"`, the typed value is stored as the `dailyRate` string.
- `availableForEngagements` is stored as a string (`"Yes"`/`"No"`) to faithfully capture the
  form; consumers treat it as a label.
- `dailyRate` is a string because the form mixes numeric tiers with `"Case by Case"`/`"Other"`.
- `publishConsent` / `photoConsent` are recorded so the team respects them when manually
  publishing; they do not drive any automated behavior.
- **Schema-nullable vs app-required:** `photoUrl` is `String?` in the schema but required at
  the app/validation layer (same pattern as `TestimonialSubmission.photoUrl`). `degreeDetails`
  and `majorFieldOfStudy` are non-null in the schema and required in validation (consistent).

### 4.2 Reused infrastructure (no changes)
- `withAdmin` (`src/lib/api-utils.ts`), session shape `{ userId, email, role }`.
- Public upload `POST /api/public/upload`.
- `sendNotificationEmail` + `renderNotification` (`src/lib/email.ts`).
- `rateLimit` + `clientIp` (`src/lib/rate-limit.ts`).
- Admin table/badge components and `adminGet/adminPost/adminDelete` (`@/lib/admin-api`).

### 4.3 Code organization (for testability)
Pure, unit-tested logic lives in a new `src/lib/experts/` module; route handlers stay thin:
- `validateExpertSubmission(input, allowedHost?) → { ok: true; value: CleanExpert } | { ok: false; field?: string; error: string }`
  — required-field checks, length caps, email shape, URL shape, photo-domain check, ignores
  unknown fields, normalizes arrays. On failure it returns the first offending `field`
  (when attributable) plus a human message, so the route can build a field-level error
  envelope (see §5.4).
- `buildExpertCsv(rows) → string` — **net-new** deterministic CSV builder (there is no
  existing CSV-builder to reuse; `src/lib/newsletter/csv.ts` is an import *parser*). Proper
  escaping (quotes, commas, newlines); arrays joined with `"; "`; stable column order; header
  row + one row per submission.

## 5. Public Form & API

### 5.1 Page: `src/app/[locale]/get-involved/expert/apply/page.tsx`
- Server component shell + metadata (indexable). Renders the client form `ExpertApplyForm`.
- A new `expertApply` i18n namespace (EN + AR) supplies labels, section headers, the intro
  copy, and the success message ("Thank you for contributing to The Lee Experience.").

### 5.2 Form: `src/components/sections/expert-apply/ExpertApplyForm.tsx`
- `"use client"`. Five visual sections matching the source form (Personal, Academic,
  Experience, Expertise, Consent & Availability).
- Field types: text inputs, multi-select checkbox groups (countries, degrees), long-text
  areas (bio, certifications, notable work, degree details), single-select (years of
  experience, daily rate), Yes/No (availability), consent checkboxes, and a photo upload
  (reusing the testimonial form's upload pattern → `POST /api/public/upload`).
- A hidden **honeypot** field (mirrors `JoinUs`/testimonial anti-spam).
- On submit → `POST /api/public/expert-submissions`. Success → inline confirmation; the form
  is replaced by the thank-you state. Inline field-level errors on validation failure.
- Models its markup/styling on the existing public forms (e.g. `ShareStoryForm`,
  `JoinUsForm`) so it looks native.

### 5.3 CTA rewire
In `src/app/[locale]/get-involved/expert/page.tsx`, the "Apply to Join Our Expert Pool →"
link changes from `/${locale}/get-involved/join-us?role=expert` to
`/${locale}/get-involved/expert/apply` (keep the locale prefix, matching the codebase
convention).

### 5.4 API: `POST /api/public/expert-submissions`
- **Rate-limit** per IP (e.g. `expert-apply:{ip}`, 5 / hour) → 429 when exceeded.
- **Honeypot**: if the hidden field is filled, return `{ ok: true }` and write nothing.
- Parse + validate via `validateExpertSubmission`. On failure, return the testimonial-style
  envelope `{ ok: false, error: "validation", fields }`, where `fields` is
  `{ [field]: message }` built from the validator's returned `field` + `error` (empty object
  if the failure isn't field-attributable). The form renders `fields` inline.
- Create `ExpertSubmission` (status `NEW`).
- Send a notification email summarizing key triage fields (name, title, email, phone,
  country, expertise keywords, years, daily rate, availability).
- Return `{ ok: true }`.
- **Known deferred (acknowledged):** the photo is uploaded via the pre-existing
  **unauthenticated** `/api/public/upload` (same as the testimonial form). Not newly
  introduced here.

## 6. Admin: Inbox, Detail, Status, Notes, Export

All admin endpoints require `withAdmin` (any admin role). **Note for implementers:** although
this feature mirrors the recently-built Team Submissions inbox, it deliberately uses
`withAdmin` (NOT `withSuperAdmin`), and its sidebar item omits the `superAdminOnly` flag —
unlike Team Submissions. Copy the testimonial-submissions routes (which use `withAdmin`) as
the closest precedent, not the team-submissions routes.

### 6.1 List: `GET /api/admin/expert-submissions` + page `/admin/expert-submissions`
- List newest-first; optional `?status=` filter and `?search=` (name/title/keywords);
  paginated (mirror the testimonial-submissions list route + page).
- Table columns: photo thumb, name, professional title, primary country, expertise
  keywords, status badge, submitted date; an unread indicator; a status filter.

### 6.2 Detail: `GET /api/admin/expert-submissions/[id]` + page `[id]/page.tsx`
- `GET` returns one submission and marks `isRead = true`.
- Page shows **all 21 answers** grouped by the five sections, plus the photo.
- Controls: a **status** dropdown (`NEW/SHORTLISTED/CONTACTED/ARCHIVED/REJECTED`), an
  **internal notes** textarea (saved via PATCH), and a **delete** action.

### 6.3 Mutations
- `PATCH /api/admin/expert-submissions/[id]` — update `status` and/or `adminNotes`. The
  handler validates an incoming `status` against the `ExpertSubmissionStatus` enum and
  rejects unknown values (400). `reviewedAt` is set the first time the status moves off `NEW`
  to any other value; notes-only edits and staying on/returning to `NEW` leave `reviewedAt`
  untouched.
- `DELETE /api/admin/expert-submissions/[id]` — remove a submission.

### 6.4 Unread count: `GET /api/admin/expert-submissions/unread-count`
- Returns the count of `isRead = false` for the sidebar badge (mirrors testimonial pattern).

### 6.5 CSV export: `GET /api/admin/expert-submissions/export`
- `withAdmin`; returns `text/csv` with `Content-Disposition: attachment`. Body produced by
  the pure `buildExpertCsv`. Columns cover all submitted application fields plus `status`,
  `adminNotes`, and `createdAt` (the `isRead`/`reviewedAt` metadata is omitted); arrays joined
  with `"; "`.

### 6.6 Sidebar
- Add "Expert Applications" under the "Submissions" group, visible to **all** admins (do NOT
  set the `superAdminOnly` flag the Team Submissions item uses), with the unread badge wired
  to `unread-count`.

## 7. Validation Rules (`validateExpertSubmission`)

- **Required** (per the source form's `*`): `fullName`, `professionalTitle`, `countries` (≥1),
  `phone`, `email` (valid email), `photoUrl` + `photoConsent = true`, `degrees` (≥1),
  `degreeDetails`, `majorFieldOfStudy`, `yearsExperience` (a non-empty single value),
  `certifications`, `shortBio`, `expertiseKeywords`, `languages`, `availableForEngagements`,
  `dailyRate`.
- **Consent fields differ:** `photoConsent` must be `true` (you cannot submit a photo without
  agreeing to its publication — the source form's Q8 only offers "Yes"). `publishConsent` is a
  required *choice* on the form (Q21: "Yes, I agree" / "No, internal review only") but is
  stored as a boolean and a `false` ("internal review only") is a **valid, accepted**
  submission — the validator does NOT reject it. (Nothing auto-publishes regardless; the flag
  is recorded for the team to respect when manually featuring someone.)
- On the first failed required field the validator returns `{ ok:false, field, error }` so the
  route can surface it inline (see §4.3, §5.4).
- **Optional:** `linkedinUrl` (valid URL if present), `licensesMemberships`, `notableWork`.
- **Length caps** (reject over-length): names/titles ≤120/200, phone ≤40, email ≤200,
  majorFieldOfStudy ≤200, expertiseKeywords/languages ≤300, shortBio ≤1000, long-text fields
  (certifications, licenses, notableWork, degreeDetails) ≤5000, dailyRate ≤50, URLs ≤500.
- **Photo domain:** `photoUrl` must be a relative path on our site or a URL on our Supabase
  bucket host (reuse the team feature's `isOwnPhoto` logic); reject arbitrary external URLs.
- **`allowedHost`** is an injectable parameter (defaults to the env host) so the function is
  pure and unit-testable without env (the team feature established this pattern).
- Unknown fields ignored. All text stored as data and rendered as text (no HTML).

## 8. Security Considerations

- Public endpoint is rate-limited + honeypot-protected; no auth (by design — open intake).
- All admin endpoints (`list/detail/patch/delete/unread-count/export`) require `withAdmin`.
- PII (`phone`, `email`, `dailyRate`) is only exposed through admin-gated endpoints and the
  admin-gated CSV export; never on any public surface.
- `photoUrl` restricted to our own upload host to avoid rendering attacker-controlled images
  in admin.
- Submitted text is untrusted: stored as data, rendered as text.

## 9. Testing

**Framework:** Vitest (existing config; `src/**/*.test.ts`, node env, `@` alias).

**Pure-function unit tests (`src/lib/experts/*.test.ts`):**
- `validateExpertSubmission`: accepts a complete valid payload; rejects each missing required
  field (returning that field name); rejects empty `countries`/`degrees` arrays and an empty
  `yearsExperience`; rejects bad email; rejects malformed `linkedinUrl`; rejects over-length
  text; rejects a `photoUrl` outside our host; accepts a Supabase-host photo URL; requires
  `photoConsent = true`; **accepts a submission with `publishConsent = false`**; ignores
  unknown fields.
- `buildExpertCsv`: stable column order; escapes quotes/commas/newlines; joins arrays with
  `"; "`; handles empty optional fields; one row per submission + header.

**Behavioral checks (integration/manual):**
- Public submit: valid payload creates a `NEW` row + sends the notification; honeypot writes
  nothing; rate-limit returns 429; invalid returns field errors.
- Admin: list filters by status + search; detail marks read; PATCH updates status/notes and
  sets `reviewedAt`; delete removes; unread-count accurate; CSV downloads with all rows;
  every admin endpoint rejects unauthenticated (401).
- CTA: the expert page button now navigates to `/get-involved/expert/apply`.

## 10. Rollout / Migration

1. Add `ExpertSubmission` + `ExpertSubmissionStatus` to `prisma/schema.prisma`; apply with
   `npx prisma db push` (this repo uses db-push, not migrations). One new table + enum; no
   data migration; no impact on existing tables.
2. Set/confirm the notification email env vars already used by Contact/testimonial flows.
3. Deploy; verify the public form, a test submission, the inbox, and CSV export.

## 11. Open Questions

- None blocking. `degreeDetails` is marked required on the source form even though it reads
  like an "if Other / extra details" field; we keep it required to match the form exactly and
  can relax later if applicants find it confusing.
- Abuse/rate-limiting beyond the per-IP limiter + honeypot (e.g. CAPTCHA) is deferred and
  noted as a known limitation for an open public endpoint.
