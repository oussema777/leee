# Expert Applications Intake Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A public expert-application form that stores submissions into an admin "Expert Applications" inbox (view, filter, status, notes, delete, CSV export, email-on-new). No auto-publishing.

**Architecture:** Mirror the existing **testimonial-submission** inbox pattern. Pure, unit-tested logic lives in `src/lib/experts/`; route handlers stay thin. All admin endpoints use `withAdmin` (any admin). The public endpoint is rate-limited + honeypot-protected and emails the team on each new application.

**Tech Stack:** Next.js 16 (App Router), React 19, Prisma + PostgreSQL (Supabase, db-push not migrations), next-intl (EN/AR), Tailwind, Vitest. Spec: `docs/superpowers/specs/2026-06-30-expert-applications-intake-design.md`.

**Conventions to follow (read before starting):**
- Public form/API precedent: `src/app/api/public/testimonials/route.ts`, `src/components/forms/ShareStoryForm.tsx`, `src/app/api/public/upload/route.ts`.
- Admin inbox precedent (uses `withAdmin`, NOT super-admin): `src/app/api/admin/testimonial-submissions/route.ts`, `src/app/api/admin/testimonial-submissions/[id]/route.ts`, `src/app/admin/(dashboard)/testimonial-submissions/page.tsx`, `src/app/admin/(dashboard)/testimonial-submissions/[id]/page.tsx`.
- Auth: `src/lib/api-utils.ts` (`withAdmin`, `getPaginationParams`, `paginatedResponse`, `errorResponse`). Email: `src/lib/email.ts` (`sendNotificationEmail`, `renderNotification`). Rate-limit: `src/lib/rate-limit.ts` (`rateLimit`, `clientIp`). Admin client helpers: `src/lib/admin-api.ts` (`adminGet`, `adminPost`, `adminDelete`, `PaginatedResponse`). Photo-domain precedent: `src/lib/team/validation.ts` (`isOwnPhoto`, injectable `allowedHost`). DB: `src/lib/db.ts` (`db`). Sidebar: `src/app/admin/components/Sidebar.tsx`.
- Tests: Vitest, `src/**/*.test.ts`, `import { describe, it, expect } from "vitest"`, `@` alias. `vitest run` does NOT load `.env` (pass `allowedHost` explicitly in tests).
- Next.js 16 dynamic routes: `{ params }: { params: Promise<{ id: string }> }` then `await params`.
- **Do NOT run `prisma db push` against prod without explicit user authorization** (prod write). The client can be regenerated locally with `npx prisma generate` after stopping any running dev server.

---

### Task 1: Prisma model + client

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add the model + enum** (place near `TestimonialSubmission`, before the NEWSLETTER section)

```prisma
model ExpertSubmission {
  id                 String  @id @default(cuid())

  // Section 1 — Personal information
  fullName           String
  professionalTitle  String
  countries          String[]
  phone              String
  email              String
  linkedinUrl        String?
  photoUrl           String?
  photoConsent       Boolean @default(false)

  // Section 2 — Academic degrees
  degrees            String[]
  degreeDetails      String  @db.Text
  majorFieldOfStudy  String

  // Section 3 — Professional experience & credentials
  yearsExperience    String
  certifications     String  @db.Text
  licensesMemberships String? @db.Text

  // Section 4 — Area of expertise
  shortBio           String  @db.Text
  expertiseKeywords  String
  notableWork        String? @db.Text
  languages          String

  // Section 5 — Publishing consent & availability
  availableForEngagements String
  dailyRate          String
  publishConsent     Boolean @default(false)

  // Moderation / management
  status             ExpertSubmissionStatus @default(NEW)
  isRead             Boolean   @default(false)
  adminNotes         String?   @db.Text
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

- [ ] **Step 2: Regenerate the client locally** (stop any running `npm run dev` first so the engine DLL isn't locked)

Run: `npx prisma generate`
Expected: "Generated Prisma Client". (The actual `prisma db push` to prod is a separate, user-authorized rollout step — Task 9.)

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Expected: 0 errors (the new `db.expertSubmission` type now exists).

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat(experts): add ExpertSubmission model + status enum"
```

---

### Task 2: Submission validation (pure, TDD)

**Files:**
- Create: `src/lib/experts/validation.ts`
- Test: `src/lib/experts/validation.test.ts`

The validator returns the FIRST offending `field` so the API can build a field-level error envelope. `allowedHost` is injectable (default = env host) so tests run without `.env`.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { validateExpertSubmission } from "./validation";

const HOST = "wqphvlzndbwqgcojipvn.supabase.co";
const photo = `https://${HOST}/storage/v1/object/public/uploads/x.jpg`;

const base = {
  fullName: "Dr. Sara Smith",
  professionalTitle: "Senior Data Scientist",
  countries: ["United States"],
  phone: "+1 555 1234",
  email: "sara@example.com",
  photoUrl: photo,
  photoConsent: true,
  degrees: ["Doctorate (PhD, EdD, DBA, DSc,etc.)"],
  degreeDetails: "PhD in CS, MIT, 2014",
  majorFieldOfStudy: "Computer Science",
  yearsExperience: "11-15 years",
  certifications: "AWS Certified Solutions Architect",
  shortBio: "12 years in AI. Led two FDA models. Advises biotech startups.",
  expertiseKeywords: "AI, oncology, ML",
  languages: "English, Arabic",
  availableForEngagements: "Yes",
  dailyRate: "200 USD",
  publishConsent: true,
};

describe("validateExpertSubmission", () => {
  it("accepts a complete valid submission", () => {
    const r = validateExpertSubmission(base, HOST);
    expect(r.ok).toBe(true);
  });
  it("rejects each missing required field with that field name", () => {
    for (const key of ["fullName", "professionalTitle", "phone", "email", "degreeDetails", "majorFieldOfStudy", "yearsExperience", "certifications", "shortBio", "expertiseKeywords", "languages", "availableForEngagements", "dailyRate"]) {
      const r = validateExpertSubmission({ ...base, [key]: "  " }, HOST);
      expect(r.ok, key).toBe(false);
      if (!r.ok) expect(r.field).toBe(key);
    }
  });
  it("rejects empty countries / degrees arrays", () => {
    expect(validateExpertSubmission({ ...base, countries: [] }, HOST).ok).toBe(false);
    expect(validateExpertSubmission({ ...base, degrees: [] }, HOST).ok).toBe(false);
  });
  it("requires photoUrl + photoConsent true", () => {
    expect(validateExpertSubmission({ ...base, photoUrl: "" }, HOST).ok).toBe(false);
    expect(validateExpertSubmission({ ...base, photoConsent: false }, HOST).ok).toBe(false);
  });
  it("rejects bad email and bad linkedin URL", () => {
    expect(validateExpertSubmission({ ...base, email: "nope" }, HOST).ok).toBe(false);
    expect(validateExpertSubmission({ ...base, linkedinUrl: "not a url" }, HOST).ok).toBe(false);
  });
  it("rejects a photoUrl outside our host", () => {
    expect(validateExpertSubmission({ ...base, photoUrl: "https://evil.com/x.jpg" }, HOST).ok).toBe(false);
  });
  it("rejects over-length fields", () => {
    expect(validateExpertSubmission({ ...base, fullName: "x".repeat(121) }, HOST).ok).toBe(false);
    expect(validateExpertSubmission({ ...base, shortBio: "x".repeat(1001) }, HOST).ok).toBe(false);
  });
  it("accepts and passes through optional fields; ignores unknown", () => {
    const r = validateExpertSubmission({ ...base, linkedinUrl: "https://linkedin.com/in/sara", notableWork: "Paper X", evil: "y" }, HOST);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.linkedinUrl).toBe("https://linkedin.com/in/sara");
      expect((r.value as any).evil).toBeUndefined();
    }
  });
});
```

- [ ] **Step 2: Run test, verify it fails** — `npm test -- src/lib/experts/validation.test.ts` → FAIL (module not found)

- [ ] **Step 3: Implement**

```ts
const ENGAGEMENT = ["Yes", "No"] as const;

export type CleanExpert = {
  fullName: string;
  professionalTitle: string;
  countries: string[];
  phone: string;
  email: string;
  linkedinUrl?: string;
  photoUrl: string;
  photoConsent: boolean;
  degrees: string[];
  degreeDetails: string;
  majorFieldOfStudy: string;
  yearsExperience: string;
  certifications: string;
  licensesMemberships?: string;
  shortBio: string;
  expertiseKeywords: string;
  notableWork?: string;
  languages: string;
  availableForEngagements: string;
  dailyRate: string;
  publishConsent: boolean;
};

type Result =
  | { ok: true; value: CleanExpert }
  | { ok: false; field?: string; error: string };

function supabaseHost(): string | null {
  try { return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").host; } catch { return null; }
}
function isValidUrl(v: string): boolean { try { new URL(v); return true; } catch { return false; } }
function isEmail(v: string): boolean { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }
function isOwnPhoto(url: string, host: string | null): boolean {
  if (url.startsWith("/")) return true;
  try { return !!host && new URL(url).host === host; } catch { return false; }
}
function cleanArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.map((x) => String(x).trim()).filter(Boolean);
}

export function validateExpertSubmission(
  input: Record<string, unknown>,
  allowedHost: string | null = supabaseHost()
): Result {
  const fail = (field: string, error: string): Result => ({ ok: false, field, error });

  // Required text fields with max length
  const text: Array<[keyof CleanExpert, number]> = [
    ["fullName", 120], ["professionalTitle", 200], ["phone", 40],
    ["majorFieldOfStudy", 200], ["yearsExperience", 40], ["certifications", 5000],
    ["degreeDetails", 5000], ["shortBio", 1000], ["expertiseKeywords", 300],
    ["languages", 300], ["dailyRate", 50],
  ];
  const out: Record<string, unknown> = {};
  for (const [key, max] of text) {
    const v = String(input[key] ?? "").trim();
    if (!v) return fail(key, `${key} is required`);
    if (v.length > max) return fail(key, `${key} is too long`);
    out[key] = v;
  }

  // Email
  const email = String(input.email ?? "").trim();
  if (!email) return fail("email", "Email is required");
  if (email.length > 200 || !isEmail(email)) return fail("email", "Valid email required");
  out.email = email;

  // Arrays (>=1)
  const countries = cleanArray(input.countries);
  if (countries.length === 0) return fail("countries", "Select at least one country");
  const degrees = cleanArray(input.degrees);
  if (degrees.length === 0) return fail("degrees", "Select at least one degree");
  out.countries = countries;
  out.degrees = degrees;

  // Availability (Yes/No)
  const avail = String(input.availableForEngagements ?? "").trim();
  if (!ENGAGEMENT.includes(avail as any)) return fail("availableForEngagements", "Select Yes or No");
  out.availableForEngagements = avail;

  // Photo (required, own host) + photo consent
  const photoUrl = String(input.photoUrl ?? "").trim();
  if (!photoUrl) return fail("photoUrl", "Photo is required");
  if (photoUrl.length > 500 || !isOwnPhoto(photoUrl, allowedHost)) return fail("photoUrl", "Invalid photo");
  out.photoUrl = photoUrl;
  if (input.photoConsent !== true) return fail("photoConsent", "Photo permission is required");
  out.photoConsent = true;

  // publishConsent: required to be a boolean choice (true or false both valid)
  out.publishConsent = input.publishConsent === true;

  // Optional fields
  for (const [key, max] of [["linkedinUrl", 500], ["licensesMemberships", 5000], ["notableWork", 5000]] as const) {
    const raw = input[key];
    if (raw == null || String(raw).trim() === "") continue;
    const v = String(raw).trim();
    if (v.length > max) return fail(key, `${key} is too long`);
    if (key === "linkedinUrl" && !isValidUrl(v)) return fail("linkedinUrl", "Invalid LinkedIn URL");
    out[key] = v;
  }

  return { ok: true, value: out as CleanExpert };
}
```

- [ ] **Step 4: Run test, verify it passes** — `npm test -- src/lib/experts/validation.test.ts` → PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/experts/validation.ts src/lib/experts/validation.test.ts
git commit -m "feat(experts): submission validation with tests"
```

---

### Task 3: CSV builder (pure, TDD)

**Files:**
- Create: `src/lib/experts/csv.ts`
- Test: `src/lib/experts/csv.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { buildExpertCsv } from "./csv";

const row = {
  fullName: "Sara, Smith", professionalTitle: 'Lead "AI"', countries: ["US", "UK"],
  phone: "1", email: "s@x.com", linkedinUrl: null, degrees: ["PhD"],
  degreeDetails: "line1\nline2", majorFieldOfStudy: "CS", yearsExperience: "11-15 years",
  certifications: "AWS", licensesMemberships: null, shortBio: "bio", expertiseKeywords: "AI",
  notableWork: null, languages: "EN", availableForEngagements: "Yes", dailyRate: "200 USD",
  photoUrl: "https://x/y.jpg", photoConsent: true, publishConsent: false,
  status: "NEW", createdAt: new Date("2026-06-30T00:00:00Z"),
};

describe("buildExpertCsv", () => {
  it("emits a header + one row, escaping commas/quotes/newlines and joining arrays", () => {
    const csv = buildExpertCsv([row as any]);
    const lines = csv.split("\n");
    expect(lines[0]).toContain("fullName");
    expect(csv).toContain('"Sara, Smith"');       // comma escaped
    expect(csv).toContain('"Lead ""AI"""');         // quotes doubled
    expect(csv).toContain("US; UK");                // array joined
    expect(csv).toContain('"line1\nline2"');        // newline preserved inside quotes
  });
  it("handles empty list (header only)", () => {
    expect(buildExpertCsv([]).split("\n")[0]).toContain("email");
  });
});
```

- [ ] **Step 2: Run test, verify it fails** → FAIL

- [ ] **Step 3: Implement**

```ts
type CsvRow = Record<string, unknown>;

const COLUMNS: string[] = [
  "createdAt", "status", "fullName", "professionalTitle", "countries", "phone", "email",
  "linkedinUrl", "degrees", "degreeDetails", "majorFieldOfStudy", "yearsExperience",
  "certifications", "licensesMemberships", "shortBio", "expertiseKeywords", "notableWork",
  "languages", "availableForEngagements", "dailyRate", "photoConsent", "publishConsent",
  "photoUrl",
];

function cell(value: unknown): string {
  let s: string;
  if (value == null) s = "";
  else if (Array.isArray(value)) s = value.join("; ");
  else if (value instanceof Date) s = value.toISOString();
  else s = String(value);
  if (/[",\n]/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function buildExpertCsv(rows: CsvRow[]): string {
  const header = COLUMNS.join(",");
  const body = rows.map((r) => COLUMNS.map((c) => cell(r[c])).join(",")).join("\n");
  return body ? `${header}\n${body}` : header;
}
```

- [ ] **Step 4: Run test, verify it passes** → PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/experts/csv.ts src/lib/experts/csv.test.ts
git commit -m "feat(experts): CSV export builder with tests"
```

---

### Task 4: Public submission API

**Files:**
- Create: `src/app/api/public/expert-submissions/route.ts`

- [ ] **Step 1: Implement** (model on `src/app/api/public/testimonials/route.ts` for the rate-limit + honeypot + error-envelope shape)

```ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateExpertSubmission } from "@/lib/experts/validation";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { sendNotificationEmail, renderNotification } from "@/lib/email";

type ErrorEnvelope = { ok: false; error: "validation" | "rate_limited" | "server"; fields?: Record<string, string> };

export async function POST(request: NextRequest) {
  if (!rateLimit(`expert-apply:${clientIp(request)}`, 5, 60 * 60 * 1000)) {
    return NextResponse.json<ErrorEnvelope>({ ok: false, error: "rate_limited" }, { status: 429 });
  }
  try {
    const body = await request.json().catch(() => null);
    if (body && typeof body === "object" && (body as any).website) {
      return NextResponse.json({ ok: true }, { status: 200 }); // honeypot
    }
    const result = validateExpertSubmission(body ?? {});
    if (!result.ok) {
      const fields = result.field ? { [result.field]: result.error } : {};
      return NextResponse.json<ErrorEnvelope>({ ok: false, error: "validation", fields }, { status: 400 });
    }
    const v = result.value;
    await db.expertSubmission.create({ data: { ...v, status: "NEW" } });

    await sendNotificationEmail({
      subject: `[LEEE] New expert application: ${v.fullName}`,
      replyTo: v.email,
      html: renderNotification(
        "New expert application",
        "A professional applied to join the expert network via the website.",
        [
          { label: "Name", value: v.fullName },
          { label: "Title", value: v.professionalTitle },
          { label: "Email", value: v.email },
          { label: "Phone", value: v.phone },
          { label: "Country", value: v.countries.join(", ") },
          { label: "Expertise", value: v.expertiseKeywords },
          { label: "Experience", value: v.yearsExperience },
          { label: "Daily rate", value: v.dailyRate },
          { label: "Available", value: v.availableForEngagements },
        ]
      ),
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error("Expert submission error:", err);
    return NextResponse.json<ErrorEnvelope>({ ok: false, error: "server" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Typecheck** → `npx tsc --noEmit` (0 errors). Confirm `renderNotification`/`sendNotificationEmail` signatures match `src/lib/email.ts` (adjust the field-list shape if the helper differs).

- [ ] **Step 3: Commit**

```bash
git add src/app/api/public/expert-submissions/route.ts
git commit -m "feat(experts): public submission API (rate-limit, honeypot, validate, notify)"
```

---

### Task 5: Public apply page + form + i18n + CTA rewire

**Files:**
- Create: `src/app/[locale]/get-involved/expert/apply/page.tsx`
- Create: `src/components/sections/expert-apply/ExpertApplyForm.tsx`
- Modify: `messages/en.json`, `messages/ar.json` (add `expertApply` namespace)
- Modify: `src/app/[locale]/get-involved/expert/page.tsx` (CTA link)

- [ ] **Step 1: i18n** — add an `expertApply` namespace to BOTH messages files (parallel EN/AR): page `title`, `intro`, the 5 section headers, every field label + helper, the option lists (countries, degrees, years buckets, daily-rate tiers, Yes/No), `submit`, `success`, and a generic `errorBanner`. Keep EN + AR in sync. Validate JSON (`node -e "require('./messages/en.json');require('./messages/ar.json')"`).

- [ ] **Step 2: Page (server component, indexable)**

```tsx
import { buildPageMetadata } from "@/lib/metadata";
import { PageHeader } from "@/components/layout/PageHeader";
import { ExpertApplyForm } from "@/components/sections/expert-apply/ExpertApplyForm";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const isAr = locale === "ar";
  return buildPageMetadata({
    title: isAr ? "نموذج انضمام الخبراء" : "Expert Profile Submission",
    description: isAr
      ? "انضم إلى شبكة الخبراء في تجربة LEE — قدّم ملفك المهني للمراجعة."
      : "Join The Lee Experience expert network — submit your professional profile for review.",
    path: "get-involved/expert/apply",
    locale,
  });
}

export default async function ExpertApplyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const isAr = locale === "ar";
  return (
    <>
      <PageHeader
        title={isAr ? "نموذج ملف الخبير" : "Expert Profile Submission"}
        subtitle={isAr ? "خبرتك تبني الثقة. ملفك يفتح الأبواب." : "Your expertise builds trust. Your profile opens doors."}
      />
      <ExpertApplyForm locale={locale} />
    </>
  );
}
```

- [ ] **Step 3: Client form** — `"use client"`, prop `{ locale }`. Build the 5 sections with the field types from the spec (text, multi-select checkbox groups for countries/degrees, single-select for years + daily rate, Yes/No for availability, consent checkboxes, long-text areas, photo upload to `/api/public/upload`). Include a hidden honeypot input named `website`. MODEL markup/styling + the upload + success/error handling on `src/components/forms/ShareStoryForm.tsx`. On submit POST JSON to `/api/public/expert-submissions`; on `{ ok: true }` show the `success` state; on `{ error: "validation", fields }` show inline field errors; on `rate_limited`/`server` show the error banner. The option lists (countries, degrees, years buckets, daily-rate tiers) come from the i18n namespace; values posted must match the spec (e.g. `yearsExperience` is one selected string; `countries`/`degrees` are arrays; `availableForEngagements` is "Yes"/"No"; `photoConsent`/`publishConsent` booleans).

- [ ] **Step 4: CTA rewire** — in `src/app/[locale]/get-involved/expert/page.tsx`, change the "Apply to Join Our Expert Pool" `href` from `/${locale}/get-involved/join-us?role=expert` to `/${locale}/get-involved/expert/apply`.

- [ ] **Step 5: Verify** — `npx tsc --noEmit` (0 errors); JSON valid. Manual: visit `/en/get-involved/expert/apply`, submit a valid form → success; submit missing required → inline error.

- [ ] **Step 6: Commit**

```bash
git add "src/app/[locale]/get-involved/expert/apply" src/components/sections/expert-apply messages/en.json messages/ar.json "src/app/[locale]/get-involved/expert/page.tsx"
git commit -m "feat(experts): public apply page, form, i18n, and CTA rewire"
```

---

### Task 6: Admin list API + unread-count + list page + sidebar

**Files:**
- Create: `src/app/api/admin/expert-submissions/route.ts` (GET list)
- Create: `src/app/api/admin/expert-submissions/unread-count/route.ts` (GET)
- Create: `src/app/admin/(dashboard)/expert-submissions/page.tsx`
- Modify: `src/app/admin/components/Sidebar.tsx`

- [ ] **Step 1: List route** — mirror `src/app/api/admin/testimonial-submissions/route.ts`. Gate with `withAdmin`. Use `getPaginationParams` + `paginatedResponse`. Support `?status=` filter (validate against the enum) and `?search=` across `fullName`/`professionalTitle`/`expertiseKeywords`. Order newest-first.

- [ ] **Step 2: unread-count route** — `withAdmin`; returns `{ count }` of `isRead = false` (mirror the testimonial unread-count route exactly).

- [ ] **Step 3: List page** — mirror `testimonial-submissions/page.tsx`: `AdminDataTable` with columns photo thumb, name, title, primary country (`countries[0]`), expertise keywords, status badge, date; a status filter `<select>`; unread indicator; rows link to `/admin/expert-submissions/[id]`. Use `adminGet` + `PaginatedResponse`.

- [ ] **Step 4: Sidebar** — add `{ label: "Expert Applications", href: "/admin/expert-submissions", icon: <pick a lucide icon e.g. UserСog/Award>, }` under the "Submissions" group. Wire the unread badge to `/expert-submissions/unread-count` exactly like the testimonial item. **Do NOT set `superAdminOnly`** — this is visible to all admins.

- [ ] **Step 5: Verify** — `npx tsc --noEmit` (0). Manual: list renders, status filter works, unread badge shows.

- [ ] **Step 6: Commit**

```bash
git add src/app/api/admin/expert-submissions "src/app/admin/(dashboard)/expert-submissions/page.tsx" src/app/admin/components/Sidebar.tsx
git commit -m "feat(experts): admin list API + unread-count + inbox page + sidebar"
```

---

### Task 7: Admin detail API + page (status, notes, delete)

**Files:**
- Create: `src/app/api/admin/expert-submissions/[id]/route.ts` (GET + PATCH + DELETE)
- Create: `src/app/admin/(dashboard)/expert-submissions/[id]/page.tsx`

- [ ] **Step 1: Detail route** — `withAdmin`. Next.js 16 `params: Promise<{ id: string }>`.
  - `GET`: return one; on read set `isRead = true`; 404 if missing.
  - `PATCH`: accept `{ status?, adminNotes? }`. If `status` present, validate it is in `["NEW","SHORTLISTED","CONTACTED","ARCHIVED","REJECTED"]` (400 otherwise). Set `reviewedAt = new Date()` only when moving from `NEW` to a non-`NEW` status and `reviewedAt` is currently null. Update `adminNotes` when present.
  - `DELETE`: remove the row; return `{ ok: true }`.

- [ ] **Step 2: Review/detail page** — client page; model on `testimonial-submissions/[id]/page.tsx`. Fetch via `adminGet("/expert-submissions/" + id)`. Display ALL fields grouped by the 5 sections + the photo. Controls: a **status** `<select>` (PATCH on change), an **internal notes** `<textarea>` + Save (PATCH), and a **Delete** button (confirm → DELETE → redirect to inbox). Show arrays as comma-joined. Handle 404 gracefully.

- [ ] **Step 3: Verify** — `npx tsc --noEmit` (0). Manual end-to-end: submit via public form → appears in inbox → open (marks read) → change status (reviewedAt set) → add notes (saved) → invalid status PATCH returns 400 → delete removes it.

- [ ] **Step 4: Commit**

```bash
git add "src/app/api/admin/expert-submissions/[id]" "src/app/admin/(dashboard)/expert-submissions/[id]/page.tsx"
git commit -m "feat(experts): admin detail API + review page (status, notes, delete)"
```

---

### Task 8: CSV export endpoint + button

**Files:**
- Create: `src/app/api/admin/expert-submissions/export/route.ts`
- Modify: `src/app/admin/(dashboard)/expert-submissions/page.tsx` (add Export button)

- [ ] **Step 1: Export route**

```ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withAdmin } from "@/lib/api-utils";
import { buildExpertCsv } from "@/lib/experts/csv";

export async function GET(request: NextRequest) {
  const auth = await withAdmin(request);
  if ("error" in auth) return auth.error;
  const rows = await db.expertSubmission.findMany({ orderBy: { createdAt: "desc" } });
  const csv = buildExpertCsv(rows as any);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="expert-applications.csv"`,
    },
  });
}
```

- [ ] **Step 2: Export button** — on the inbox page, add an "Export CSV" button that navigates to / fetches `/api/admin/expert-submissions/export` (a plain `<a href>` to the admin API with the auth cookie is simplest; confirm the admin cookie is sent — if the admin API requires the cookie and a direct link works for other admin GETs, use that; otherwise fetch as a blob and trigger download).

- [ ] **Step 3: Verify** — `npx tsc --noEmit` (0). Manual: click Export → downloads a CSV with the header + all rows; PII columns present; unauthenticated request → 401.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/admin/expert-submissions/export "src/app/admin/(dashboard)/expert-submissions/page.tsx"
git commit -m "feat(experts): CSV export endpoint + button"
```

---

### Task 9: Verification + prod rollout

- [ ] **Step 1: Full gates** — `npx tsc --noEmit` (0), `npm test` (all pass), `npm run build` (succeeds; stop any dev server first).

- [ ] **Step 2: Prod DB push (USER-AUTHORIZED ONLY)** — with explicit go-ahead, run `npx prisma db push` to create the `ExpertSubmission` table + enum in prod (additive, no data migration). Confirm the table exists via a read.

- [ ] **Step 3: Smoke test on the deployed build** — submit the public form once; confirm the row appears in the inbox, the notification email arrives, status/notes/delete work, and CSV export downloads.

- [ ] **Step 4: Final commit (if any cleanup)**

```bash
git add -A
git commit -m "chore(experts): final verification"
```

---

## Done criteria
- A professional can submit the public expert form at `/get-involved/expert/apply` (linked from the existing CTA); it stores a `NEW` `ExpertSubmission` and emails the team.
- Any admin sees the "Expert Applications" inbox: list + status filter + search + unread badge; opens a detail view of all 21 answers; changes status; edits internal notes; deletes; exports CSV.
- Nothing is auto-published; the public experts page is unchanged.
- All Vitest unit tests pass; `npm run build` succeeds.
