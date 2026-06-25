# Team Self-Service Onboarding — Design Spec

**Date:** 2026-06-25
**Status:** Approved (spec review + expert hardening pass complete)
**Author:** LEEE Experience team

## 1. Overview

Replace the manually-seeded ("mock") About-page team list with a self-service
onboarding flow:

1. A super-admin copies a **secret invite link** from the admin dashboard and
   shares it with team members.
2. Each team member opens the link (no login), fills a short form (name, role,
   photo, social links) in their own language, and saves.
3. The submission lands in a **super-admin-only inbox** as `PENDING`.
4. The super-admin reviews, fills in the second language, and **Approves**
   (creates a real `TEAM` member visible on the About page) or **Rejects**.

This mirrors the existing **Testimonial Submission** feature
(`TestimonialSubmission` model + `/admin/testimonial-submissions` inbox +
`/api/public/testimonials`), reusing its proven patterns for consistency and
low risk.

## 2. Goals / Non-Goals

**Goals**
- Team members self-onboard via a private, shareable link without an account.
- Super-admin (and only super-admin) approves submissions; approval creates a
  real `BoardMember` of `memberType = TEAM`.
- The invite link is copyable and regenerable from the admin dashboard.
- Remove the 6 existing placeholder TEAM members.

**Non-Goals (YAGNI)**
- No email notifications on submission (explicitly declined).
- No public quote/bio collection (only name, role, photo, socials).
- No per-person one-time tokens — a single shared secret link is sufficient.
- No editing of an already-approved member through this flow (use the existing
  `/admin/members` editor for that).

## 3. Decisions (confirmed with stakeholder)

| Topic | Decision |
|-------|----------|
| Bilingual content | Member fills ONE language; super-admin completes the other at approval. |
| Collected fields | Name + Role/Title (required); Photo + social links (optional). No quote, no contact info. |
| Placeholders | Delete the 6 mock TEAM members during rollout. Team section auto-hides while empty. |
| Notifications | None. |
| Approver | `SUPER_ADMIN` role only. |

## 4. Data Model

### 4.1 New model: `TeamSubmission`

```prisma
model TeamSubmission {
  id           String  @id @default(cuid())

  // What the member submits (single language)
  name         String                 // their name in `locale`
  title        String                 // their role/title in `locale`
  locale       String                 // "en" | "ar" — language they wrote in
  photoUrl     String?
  linkedinUrl  String?
  twitterUrl   String?
  instagramUrl String?
  websiteUrl   String?

  // Moderation
  status           TeamSubmissionStatus @default(PENDING)
  approvedMemberId String?              // BoardMember.id once approved
  isRead           Boolean   @default(false)
  reviewedAt       DateTime?
  createdAt        DateTime  @default(now())
}

enum TeamSubmissionStatus {
  PENDING
  APPROVED
  REJECTED
}
```

Rationale: stores the submitted single-language values plus `locale`. At
approval the super-admin supplies the opposite-language `name`/`title`; the flow
then writes both `nameEn/nameAr` and `titleEn/titleAr` onto the new
`BoardMember`.

### 4.2 New model: `TeamInviteLink` (single row)

```prisma
model TeamInviteLink {
  id        String   @id            // fixed value "singleton" — enforces one row
  token     String   @unique        // long random, URL-safe
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

**Singleton invariant (enforced, not assumed):** the row always uses the fixed
primary key `id = "singleton"`. All reads use `findUnique({ where: { id:
"singleton" } })`; creation and regeneration use `upsert({ where: { id:
"singleton" }, ... })`. This makes "the active token" unambiguous and makes it
structurally impossible to create a second row. Created lazily on first read
(upsert with a freshly generated token if absent). Regenerating overwrites
`token`, invalidating any previously shared link.

### 4.3 Reused: `BoardMember`

Approval creates:
```
BoardMember {
  nameEn, nameAr, titleEn, titleAr,
  imageUrl,            // from submission.photoUrl
  linkedinUrl, twitterUrl, instagramUrl, websiteUrl,
  memberType: TEAM,
  isActive: true,
  order: (max existing TEAM order) + 1,
}
```

### 4.4 Code organization (for testability)

The repo's convention is to unit-test **pure functions in `src/lib/`** (Vitest,
`src/**/*.test.ts`, node env) and keep route handlers thin. Therefore the logic
lives in a new `src/lib/team/` module with pure, directly-testable functions:

- `generateInviteToken(): string` — 32-byte URL-safe random token.
- `validateSubmission(input): { ok: true; value: CleanSubmission } | { ok: false; error: string }`
  — required-field + URL-shape + photo-domain checks; ignores unknown fields.
- `buildBoardMemberData(submission, secondLang): Prisma.BoardMemberCreateInput`
  — maps a submission + the super-admin-supplied opposite-language values into
  the `BoardMember` create payload (handles which of `en`/`ar` came from the
  submission vs. the admin, sets `memberType=TEAM`, `isActive=true`).

Route handlers and DB transactions call these. Tests target the pure functions;
DB-touching transaction logic is kept minimal and exercised via a thin
integration check where practical.

## 5. The Invite Link

- **Format:** `/{locale}/join-team/{token}` (localized route so the form UI is
  EN/AR aware).
- **Token:** ≥ 32 chars, URL-safe random (e.g. crypto random hex/base64url).
- **Validation:** the public page server-loads and compares `{token}` against
  the active `TeamInviteLink.token`. Mismatch → render a friendly "this link is
  no longer active — please request a new one" state (HTTP 200, not an error).
- **Copy/Regenerate:** admin-only endpoints (see §7) gated to `SUPER_ADMIN`.

## 6. Public Form & API

### 6.1 Page: `src/app/[locale]/join-team/[token]/page.tsx`
- Server component validates the token (active vs inactive state).
- **`noindex`:** the page sets `robots: { index: false, follow: false }` via
  route metadata — this is a private form, not public content to be indexed.
- Renders a client form: Full Name, Role/Title (required); Photo upload
  (optional, via existing `/api/public/upload`); LinkedIn, X, Instagram, Website
  (optional, URL fields).
- UI strings come from a new `joinTeam` i18n namespace (EN + AR).
- On submit → `POST /api/public/team-submissions`. Success → inline
  confirmation ("Thanks — we'll review and add you to the team.").

### 6.2 API: `POST /api/public/team-submissions`
- Body: `{ token, name, title, photoUrl?, linkedinUrl?, twitterUrl?,
  instagramUrl?, websiteUrl? }`.
- **`locale` is NOT trusted from the body.** It is derived server-side: the
  client sends the value from the page's `[locale]` route segment, and the API
  validates it is exactly `"en"` or `"ar"`, rejecting anything else. (The form
  posts the locale it was rendered under; the server still validates it.)
- **Validate the token server-side** via `findUnique({ where: { id:
  "singleton" } })` and compare — defense in depth, never trust the page.
- Validate required fields; basic URL sanity on socials; reject `photoUrl` that
  is not within our own upload bucket/domain; ignore unknown fields. (All via
  `validateSubmission` from §4.4.)
- Create `TeamSubmission` (status `PENDING`). Return `{ ok: true }`.
- **Known open surfaces (acknowledged, deferred):** (a) rate-limiting/abuse is
  out of scope for v1 — the shared token limits but does not eliminate exposure;
  (b) the photo is uploaded via the pre-existing **unauthenticated**
  `/api/public/upload` (already used by the testimonial form), so the token does
  not gate the upload itself. Neither is newly introduced by this feature; both
  are documented here so they are not mistaken for solved.

## 7. Admin: Inbox, Approval & Link Management

All admin endpoints/pages require `SUPER_ADMIN`. Add a helper
`requireSuperAdmin` (or extend `withAdmin`) that returns 403 for non-super
admins.

### 7.1 Inbox page: `src/app/admin/(dashboard)/team-submissions/`
- Mirrors `testimonial-submissions`: list with photo thumbnail, name, role,
  language, submitted-at, status; filter by status; unread count badge.
- Row → detail/review view.

### 7.2 Review & approve
- Detail view pre-fills the submitted-language side and presents empty fields for
  the other language (e.g. submitted EN → ask for `nameAr`, `titleAr`).
  Super-admin can edit any field and the photo/socials.
- **Both languages requested at approval.** The approval form asks the super-admin
  to fill the second-language `name`/`title`. If left blank, approval still
  proceeds and the public card degrades gracefully via the existing render
  fallback in `MemberCard` (`nameAr || nameEn`, `titleAr || titleEn`) — i.e. the
  Arabic view shows the English text until edited. This fallback is the
  documented, intended behavior, not an accident.
- **Approve:** `POST /api/admin/team-submissions/[id]/approve` — performed in a
  **single Prisma `$transaction`** (mirroring the testimonial approve flow):
  - create `BoardMember` (data built by `buildBoardMemberData`, §4.4),
  - set submission `status = APPROVED`, `approvedMemberId`, `reviewedAt`.
  Atomicity guarantees we never create a member without marking the submission
  approved, or vice versa.
- **Reject:** `POST /api/admin/team-submissions/[id]/reject` → `status = REJECTED`,
  `reviewedAt`. No member created.
- Both transitions must be **idempotent-safe**: the handler re-reads the
  submission inside the transaction and returns `409 Conflict` (no-op) if it is
  not currently `PENDING`. This prevents double-approval (duplicate members) and
  approve-then-reject races.

### 7.3 Invite link management
- `GET /api/admin/team-invite-link` → `{ token, url }` (creates the row if none).
- `POST /api/admin/team-invite-link/regenerate` → new token, returns new url.
- UI: a "Team invite link" panel on `/admin/members` (Board & Team) showing the
  full URL, a **Copy** button, and a **Regenerate** button (with a confirm —
  regenerating breaks the old link).

### 7.4 Sidebar
- Add "Team Submissions" under the People/Submissions group, visible only when
  the session role is `SUPER_ADMIN`.

## 8. Public About Page Impact

- `getTeamMembers()` already returns approved `TEAM` `BoardMember`s as
  `ShowcaseMember[]`; approved submissions appear automatically.
- `AboutTeam` returns `null` when the list is empty, so removing placeholders
  cleanly hides the section until the first approval. No change needed.

## 9. Rollout / Migration

> **Placeholder location (verified 2026-06-25):** The 6 mock people exist in
> **two** places: (a) as live `BoardMember` rows with `memberType=TEAM` in the
> prod DB — confirmed present via direct query (Rana, Karim, Nour, Ahmad, Lama,
> Sara), and these ARE what currently render via `getTeamMembers()`; and (b) as a
> **dead, unused** static `teamMembers: TeamMember[]` array (plus the
> `TeamMember` type) in `src/components/sections/about/aboutData.ts` — not
> imported anywhere. Both must be cleaned up.

1. Prisma migration: add `TeamSubmission`, `TeamSubmissionStatus`,
   `TeamInviteLink`.
2. Generate the initial invite token (lazy creation on first admin read is
   acceptable; no seed needed).
3. **Remove DB placeholders:** delete the 6 mock `TEAM` `BoardMember` rows.
   One-off script, run against prod DB after the feature is verified. Confirm the
   matched set is exactly those 6 placeholder rows before deleting; report which
   rows were removed. (If real members were approved first, delete only the
   placeholder rows, not the new ones.)
4. **Remove dead static mock data:** delete the unused `teamMembers` array and
   the now-unused `TeamMember` type from `aboutData.ts` so the codebase has no
   stale "team" source.

## 10. Security Considerations

- Token compared server-side on BOTH the page load and the submission API.
- Approval, rejection, and link management strictly gated to `SUPER_ADMIN`
  (regular `ADMIN`/`EDITOR` get 403).
- Submitted `photoUrl` must be a URL within our own upload bucket/domain — reject
  arbitrary external URLs to avoid the card rendering attacker-controlled images.
- Treat all submitted text as untrusted: it is stored as data and rendered as
  text (no HTML), consistent with how `BoardMember` fields render today.
- No public endpoint exposes the token value except to a `SUPER_ADMIN`.

## 11. Testing

**Framework:** Vitest is already configured (`npm test` → `vitest run`; node env;
`src/**/*.test.ts`; `@` alias). Following repo convention, the primary tests are
**unit tests on the pure functions in `src/lib/team/`** (§4.4). Route/DB behavior
is verified with a thin integration check and manual verification where a pure
unit test isn't practical.

**Pure-function unit tests (`src/lib/team/*.test.ts`):**
- `validateSubmission`: rejects missing name/title; accepts valid input; rejects
  malformed social URLs; rejects a `photoUrl` outside our bucket/domain; ignores
  unknown fields.
- `buildBoardMemberData`: submitted-EN + admin-AR produces correct
  `nameEn/nameAr/titleEn/titleAr`; submitted-AR + admin-EN mirrors correctly;
  sets `memberType=TEAM`, `isActive=true`; passes through photo + socials.
- `generateInviteToken`: returns ≥ 32-char URL-safe string; two calls differ.

**Behavioral checks (integration/manual):**
- **Token gate:** valid token renders form; wrong/old token renders inactive
  state; submission API rejects bad token (no row created).
- **`locale` validation:** non-`en`/`ar` value is rejected.
- **Role gating:** non-super-admin gets 403 on inbox + approve/reject + link
  endpoints; super-admin succeeds.
- **Approve (transaction):** creates a `TEAM` `BoardMember` with correct `order`
  and `isActive=true`; submission becomes `APPROVED` with `approvedMemberId`;
  member appears via `getTeamMembers()`.
- **Reject:** no member created; status `REJECTED`.
- **Idempotency:** approving/rejecting a non-`PENDING` submission returns `409`
  and creates no duplicate member.
- **Regenerate (singleton):** still exactly one `TeamInviteLink` row; old token
  stops working; new token works.

## 12. Open Questions

- None blocking. Abuse/rate-limiting on the public endpoint is deferred to a
  future iteration and noted as a known limitation.
