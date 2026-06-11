# Beneficiary Testimonial Submission — Design Spec

**Date:** 2026-06-11
**Project:** The LEE Experience website (`leee-experience`)
**Status:** Approved for implementation planning

## 1. Purpose

Let LEEE program beneficiaries submit their own testimonial through the public
website. Each submission lands in an admin moderation inbox; an admin reviews it,
polishes/translates the quote, and publishes it. Published testimonials appear on
the existing public testimonials page (`/[locale]/media/testimonials`).

The source-of-truth intake form is "TESTIMONIAL FORM.docx", which mixes two things:
- **Q1–Q12, Q16** — a long internal *impact-measurement survey* (motivation,
  challenges, lessons, results, etc.). Internal data; not published.
- **Q13–Q15** — the actual *website testimonial*: a short quote, a publish-consent
  Yes/No, and an optional photo.

## 2. Decisions (locked)

| Topic | Decision |
|---|---|
| Form scope | **Hybrid** — short testimonial required; deeper survey optional/collapsible into a second step. |
| Placement | **Get Involved** — a distinct "Share Your Story" CTA band on `/get-involved`, linking to a dedicated form page. |
| Approval flow | **Review & polish, then publish** — submissions land in an admin inbox; "Approve & Publish" opens the existing testimonial editor pre-filled, admin adds the second-language translation, then publishes. |
| Data model | New `TestimonialSubmission` table holding the full form + survey. Existing `Testimonial` table is **untouched**. |
| Submission language | Beneficiary writes in **the current site locale** (EN or AR). Admin supplies the second language at approval. |
| Admin alerting | **Email notification + unread-count badge** on the admin sidebar inbox. |
| No-consent submissions | Still **saved** as internal impact data; cannot be published (Approve disabled). |
| Photo upload | New dedicated **public** upload endpoint (image-only, size-capped, magic-byte checked). Do **not** reuse the admin-authenticated `/api/admin/upload`. |
| Contact info | **Email required**, phone optional — internal-only, never published; enables verification, follow-up, and `replyTo` on notifications. |
| Abuse control | Honeypot + lightweight **per-IP rate limiting** on both public endpoints. No CAPTCHA (consistent with the rest of the site). |
| Privacy | Privacy notice on the form; consent wording version stored; manual withdrawal/erasure via admin delete (§8). |

## 3. User-facing flows

### 3.1 Beneficiary (public)
1. On `/[locale]/get-involved`, a "Share Your Story" CTA band sits below the 2×2
   persona grid (visually distinct — this audience is alumni, not prospects).
2. CTA → `/[locale]/get-involved/share-your-story`.
3. A multi-step form (mirrors the existing `JoinUsForm` wizard UX):
   - **Step 1 — Your Testimonial (required):** full name; **email (required)**;
     phone (optional); business/project name (optional); governorate (dropdown, 8
     options, optional — empty default); program/service (dropdown, 6 options,
     optional — empty default); short quote (the published text); optional photo;
     **publish consent (required Yes/No radio)**.
   - **Step 2 — Tell us more (optional):** the survey questions (motivation,
     challenges, skills gained, most valuable lesson, impact on life, results/
     milestones, success story, advice to others, additional comments).
   - Email/phone are **never published** — they exist so admins can verify
     authenticity, ask clarifying questions, and tell the beneficiary their story
     is live. The form states this next to the email field.
   - A short **privacy notice** sits above the consent radio: what is collected,
     that only the quote/name/photo/project info are published (and only with
     consent), that contact details stay internal, and how to request removal
     (contact email). The consent label mirrors the docx wording — publication on
     the **website and social media**.
4. Submit → success confirmation screen (same style as `JoinUsForm` success state).

### 3.2 Admin (moderation)
1. New sidebar item **"Testimonial Submissions"** with an unread-count badge.
2. Inbox list (table like Contacts / Join Us): name, program, quote preview,
   consent badge, status badge, date.
3. Row → detail view: full submission (Step-1 fields + Step-2 survey + photo).
4. Actions:
   - **Reject** → status `REJECTED`. Stays as internal data.
   - **Approve & Publish** → navigates to the **existing** testimonial editor at
     `/admin/testimonials/new?fromSubmission=<id>`. The `new` page reads that
     submission **server-side** and passes it as the `initial` prop to the existing
     `TestimonialForm` (which already accepts pre-filled data) — name, role/business,
     quote in the submitted language, program, governorate→category, photo. Admin
     adds the second-language translation, sets year/order, and saves to publish.
     On save, the submission is marked `APPROVED`, stamped `reviewedAt`, and linked
     via `publishedTestimonialId`.
   - Approve is **disabled** when `consent = false`, with a "no publish consent" note.
   - **Reject** also stamps `reviewedAt` (both moderation outcomes set the timestamp).
   - **Delete** (with confirm modal) → hard-deletes the submission; used for erasure
     requests (§8) and spam.
5. Opening a submission sets `isRead = true`.

**Read-state vs. status (independent fields):** `isRead` tracks whether an admin has
opened the submission; `status` tracks the moderation outcome. The sidebar **unread
badge counts `isRead = false`** regardless of status (so a still-unopened REJECTED
item would not normally occur, because rejecting happens from the detail view which
already marks it read). The badge is purely "new things to look at."

## 4. Data model

New Prisma model (mirrors the `JoinUsSubmission` convention):

```prisma
enum TestimonialSubmissionStatus {
  PENDING
  APPROVED
  REJECTED
}

model TestimonialSubmission {
  id            String   @id @default(cuid())

  // Step 1 — publishable testimonial
  fullName      String
  email         String   // internal only — never published
  phone         String?  // internal only — never published
  businessName  String?
  governorate   String?
  program       String?
  quote         String   @db.Text
  locale        String   // "en" | "ar" — language the beneficiary wrote in
  consent       Boolean  @default(false)
  consentTextVersion String? // identifier of the consent wording shown (e.g. "v1-en")
  photoUrl      String?

  // Step 2 — internal impact survey (all optional)
  motivation        String? @db.Text
  challenges        String? @db.Text
  skillsGained      String? @db.Text
  valuableLesson    String? @db.Text
  lifeImpact        String? @db.Text
  results           String? @db.Text
  successStory      String? @db.Text
  adviceToOthers    String? @db.Text
  additionalComments String? @db.Text

  // Moderation
  status        TestimonialSubmissionStatus @default(PENDING)
  publishedTestimonialId String?
  isRead        Boolean  @default(false)
  reviewedAt    DateTime?
  createdAt     DateTime @default(now())
}
```

The existing `Testimonial` model is unchanged. Governorate maps to the `Testimonial.category`
field at approval (admin can adjust). Program maps to `programEn`/`programAr`.

### Reference option lists (from the docx)

- **Governorates:** Akkar; North Lebanon; South Lebanon; Beirut; Mount Lebanon;
  Nabatieh; Bekaa; Baalbek-Hermel.
- **Programs:** LEE Incubation; LEE Acceleration; LEE Humanitarian Aid; LEE Digital
  Media Hub; LEE Academy; LEE Business Clinic.

Each option carries an EN and AR label; the stored value is a stable English key.

## 5. APIs

### 5.1 `POST /api/public/testimonials`
- Pattern follows `POST /api/public/careers/apply`.
- zod-validated body; honeypot field short-circuits (silent 200, writes nothing).
- Required: `fullName`, `email` (validated format), `quote`, `consent` (boolean),
  `locale`. Others optional.
- **Rate limited:** simple in-memory per-IP limiter (e.g. max 5 submissions per IP
  per hour) — over-limit returns 429. Lightweight, no new dependency.
- Creates a `TestimonialSubmission` (status `PENDING`), recording the
  `consentTextVersion` shown to the user.
- Sends an admin email via `sendNotificationEmail` + `renderNotification` (same as
  Join Us / Careers) with **`replyTo` set to the beneficiary's email**, including
  the quote, name, program, governorate, and whether consent was given.
- Returns `{ ok: true }` on success; validation envelope `{ ok:false, error, fields }`
  on failure.

### 5.2 `POST /api/public/upload` (new)
- Public (no `withAdmin`). Accepts a single image file via `multipart/form-data`.
- Validation, in order:
  1. Size cap 5MB.
  2. Declared MIME must be `image/jpeg|png|webp` **and** the file's magic bytes must
     match (sniff the first bytes — JPEG `FF D8 FF`, PNG `89 50 4E 47`, WebP
     `RIFF....WEBP`). Declared-type-only checks are trivially spoofed.
  3. Server-generated random filename (never trust the client filename); fixed
     folder `testimonials/submissions` (the `folder` is NOT client-controlled).
- **Rate limited** with the same per-IP limiter (e.g. max 10 uploads per IP per hour).
- Reuses the underlying `uploadFile` helper from `@/lib/upload`.
- Returns `{ url }`.
- **Orphan handling:** uploads from abandoned forms are acceptable residue at this
  site's traffic level; the size/rate caps bound the damage. A cleanup job is
  explicitly out of scope (noted in §11) — revisit if abuse is observed.
- Note: this also gives existing public forms a correct upload target; the current
  `JoinUsForm` posting to the admin-only `/api/admin/upload` is a latent bug, but
  fixing JoinUs is out of scope here.

### 5.3 Admin endpoints (`/api/admin/testimonial-submissions`)
- `GET` — paginated list (search, status filter), like other admin list routes.
- `GET /[id]` — single submission detail.
- `PATCH /[id]` — update status (reject) and/or mark read.
- `DELETE /[id]` — hard-delete a submission (supports erasure requests, §8).
- Unread count surfaced for the sidebar badge (either via the list response or a
  small count endpoint, consistent with how other inboxes do it — implementation
  plan to confirm the existing pattern for Contacts/Join Us badges).
- All guarded by the existing admin auth (`withAdmin`).

### 5.4 Approve mechanism (explicit)
- The existing `POST /api/admin/testimonials` (create) route gains an **optional
  `submissionId`** field. When present, the route creates the `Testimonial` and
  updates the `TestimonialSubmission` (status `APPROVED`, `reviewedAt = now()`,
  `publishedTestimonialId = <new id>`) **in a single `db.$transaction`**.
- `publishedTestimonialId` is deliberately a plain string, not a Prisma relation:
  if the published testimonial is later deleted, the submission keeps a historical
  pointer without FK constraints complicating deletes. This is a recorded choice,
  not an oversight.
- If the admin navigates to the pre-filled editor and abandons without saving, the
  submission simply remains `PENDING` — no state to clean up.

## 6. Components / pages

| Path | Type | Notes |
|---|---|---|
| `src/app/[locale]/get-involved/page.tsx` | edit | add "Share Your Story" CTA band under `GetInvolvedHub`. |
| `src/app/[locale]/get-involved/share-your-story/page.tsx` | new | server page with `PageHeader` + form card (mirror `join-us/page.tsx`). |
| `src/app/[locale]/get-involved/share-your-story/loading.tsx` | new | skeleton, per project route convention. |
| `src/components/forms/ShareStoryForm.tsx` | new | client multi-step form; mirrors `JoinUsForm` patterns (state, validation, success state, EN/AR `content` map). |
| `src/components/forms/fields.tsx` | new | `FormField` / `FormSelect` / `FormTextarea` extracted as a shared module (currently private to `JoinUsForm`); `ShareStoryForm` imports from here. Refactoring `JoinUsForm` to use it is optional follow-up, not required. |
| `src/lib/rate-limit.ts` | new | small in-memory per-IP limiter used by both public endpoints. |
| `src/app/api/public/testimonials/route.ts` | new | public submit endpoint. |
| `src/app/api/public/upload/route.ts` | new | public image upload. |
| `src/app/admin/(dashboard)/testimonial-submissions/page.tsx` | new | inbox list. |
| `src/app/admin/(dashboard)/testimonial-submissions/[id]/page.tsx` | new | detail + Reject / Approve&Publish actions. |
| `src/app/admin/(dashboard)/testimonials/new/page.tsx` | edit | read optional `?fromSubmission=<id>`, load submission server-side, pass as `initial` to `TestimonialForm`. |
| `src/app/api/admin/testimonial-submissions/route.ts` + `[id]/route.ts` | new | admin list/detail/patch. |
| `src/app/api/admin/testimonials/route.ts` | edit | accept optional `submissionId`; transactional approve (see §5.4). |
| `src/app/admin/components/Sidebar.tsx` | edit | add nav item + unread badge. |
| `prisma/schema.prisma` | edit | add model + enum; run migration. |
| `messages/en.json`, `messages/ar.json` | edit | new keys (labels, option lists, validation, success copy). |

## 7. i18n
- New translation keys under the `getInvolved` namespace (e.g. `getInvolved.shareStory.*`)
  for CTA, form labels, governorate/program option labels, validation messages, and
  the success state — both `en.json` and `ar.json`.
- Form is RTL-aware (uses `ms-`/`me-` logical classes and `rtl:` variants like the
  rest of the site).

## 8. Privacy & data protection

Submitters are program beneficiaries — including humanitarian-aid recipients, a
potentially vulnerable population. The feature therefore commits to:

- **Minimal publication:** only quote, name, business/project, program, photo are
  ever published — and only when `consent = true`. Email/phone are internal-only,
  shown exclusively in the admin detail view.
- **Informed consent:** the form shows a privacy notice before the consent radio;
  the consent label states publication scope (website **and social media**, per the
  original docx wording). The wording version shown is stored per submission
  (`consentTextVersion`) so we can always say what a person agreed to.
- **Withdrawal:** handled manually — beneficiary contacts LEEE (email in the privacy
  notice); admin unpublishes the testimonial (existing `isActive` toggle / delete)
  and may delete the submission. No self-service flow (YAGNI).
- **Retention:** REJECTED and no-consent submissions are kept as internal impact
  data — that's their stated purpose, not an accident. Admins can hard-delete a
  submission from the detail view if someone requests erasure.

## 9. Error handling & edge cases
- **Validation:** server returns field-level errors; client shows inline messages
  (same envelope as `careers/apply`).
- **Honeypot:** silent success, nothing written.
- **Upload failures:** inline error on the photo field; form still submittable without
  a photo (photo is optional).
- **No consent:** submission saved; admin Approve action disabled.
- **Email failure:** submission still succeeds (email is best-effort, matching the
  existing public form behavior — submission is persisted before/independently of the
  email outcome).
- **Approval re-entrancy:** once a submission is `APPROVED` with a linked
  `publishedTestimonialId`, the Approve action is no longer offered.

## 10. Verification

The project has **no automated test infrastructure** (no test runner, no test
scripts) — adding one is out of scope. Verification is a manual checklist, executed
against the dev server before the feature is called done:

**Public form**
- Submit with all required fields (EN locale) → row created, status PENDING, admin
  email sent with correct `replyTo`.
- Repeat in AR locale → `locale = "ar"` stored; RTL layout correct.
- Missing required field / bad email → inline validation, no row.
- Honeypot filled → 200 response, **no row written**.
- Photo: valid JPEG uploads; renamed file with spoofed extension (e.g. `.exe`→`.jpg`)
  rejected; >5MB rejected; submit succeeds with no photo.
- Rate limit: 6th rapid submission from same IP → 429.

**Admin moderation**
- New submission shows in inbox with unread badge; opening clears it.
- Reject → status REJECTED + `reviewedAt` set.
- Approve & Publish → editor pre-filled; saving creates the testimonial, marks the
  submission APPROVED + linked (verify both rows); testimonial appears on
  `/[locale]/media/testimonials` immediately.
- Approve disabled when consent = No.
- Delete removes the row.

## 11. Out of scope (YAGNI)
- Auto-translation of quotes (admin translates manually).
- Editing/replacing the existing `Testimonial` admin editor beyond pre-fill via query.
- Fixing the unrelated `JoinUsForm` admin-upload latent bug (the new public upload
  endpoint makes a later fix trivial).
- Public-facing "my submission status" tracking; beneficiary notification emails.
- Self-service consent withdrawal (handled manually, §8).
- Orphaned-upload cleanup job (rate/size caps bound the risk; revisit if abused).
- Adding a test framework to the project.
- A second entry point on the testimonials media page (Get Involved only, per decision).
