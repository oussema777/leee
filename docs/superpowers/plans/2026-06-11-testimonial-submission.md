# Beneficiary Testimonial Submission Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Public "Share Your Story" form under Get Involved where beneficiaries submit testimonials; admin moderates in an inbox and publishes approved ones to the live testimonials page.

**Architecture:** New `TestimonialSubmission` Prisma model holds raw submissions (testimonial + optional impact survey). Public API (`/api/public/testimonials` + `/api/public/upload`) creates them; admin inbox (`/admin/testimonial-submissions`) moderates; "Approve & Publish" pre-fills the existing testimonial editor which, on save, transactionally creates the `Testimonial` and marks the submission APPROVED. The live `Testimonial` table and public testimonials page are untouched except for receiving new rows.

**Tech Stack:** Next.js 16 App Router, TypeScript, Prisma 6 + PostgreSQL (Supabase), zod, Tailwind v4, next-intl (locale via `useLocale`; bilingual copy lives in in-component EN/AR content maps, matching `JoinUsForm`), Resend email.

**Spec:** `docs/superpowers/specs/2026-06-11-testimonial-submission-design.md`

---

## Context for the implementer (read first)

- **Working dir:** `C:\Users\Marketing Manager\Desktop\Agent X\Leee Expirence\leee-experience`. Path contains spaces — in bash, quote it. A cosmetic "Permission denied" sometimes appears in bash; commands still succeed.
- **Branch:** work on `feature/testimonial-submission` (already created; spec committed there).
- **No test framework exists.** Verification per task = `npx tsc --noEmit` for type-checking plus targeted `curl` checks / manual dev-server checks. Do NOT add a test framework. Note: `npm run build` also works but is slow; prefer `npx tsc --noEmit` per task and run one full build at the end. **Caveat:** the working tree carries many unrelated uncommitted changes; if `tsc` reports errors in files this plan doesn't touch, they're pre-existing — ignore them, only fix errors in files you created/modified.
- **DB workflow:** there is NO `prisma/migrations` dir — this project uses `db push`. Use `npm run db:push` (which runs `prisma db push`). If the CLI complains, use `./node_modules/.bin/prisma db push`.
- **The dev server may already be running** (background task). After the schema change + `db push` (which regenerates the Prisma client), restart the dev server if types look stale.
- **Commits:** the tree has MANY unrelated uncommitted changes. `git add` ONLY the files named in each task — never `git add -A` / `git add .`. **Exception:** `prisma/schema.prisma` already has unrelated uncommitted edits; Task 1's commit will include them (file-level staging can't split hunks non-interactively). That's accepted — note it in the commit message.
- **Existing patterns to mirror** (read them before coding):
  - Public API: `src/app/api/public/careers/apply/route.ts` (zod, honeypot, error envelope).
  - Admin list/detail API: `src/app/api/admin/contacts/route.ts`, `src/app/api/admin/contacts/[id]/route.ts`.
  - Admin inbox UI: `src/app/admin/(dashboard)/contacts/page.tsx` and `[id]/page.tsx`.
  - Public form: `src/components/forms/JoinUsForm.tsx` (wizard, content map, success state).
  - Form page: `src/app/[locale]/get-involved/join-us/page.tsx`.
- **Two recorded deviations from the spec** (deliberate, follow them):
  1. Spec §7 says add `messages/*.json` keys; the codebase convention for forms is in-component EN/AR content maps (`JoinUsForm`) and inline locale ternaries in pages. Follow the codebase convention; no messages/*.json changes.
  2. Spec §3.2 mentions "governorate→category" pre-fill; `Testimonial.category` values are audience slugs (`entrepreneurs|women|community|partners`), not regions. Pre-fill category to `entrepreneurs` (admin adjusts); governorate is shown in the admin detail view only.

---

### Task 1: Prisma model + enum

**Files:**
- Modify: `prisma/schema.prisma` (append near the other FORM SUBMISSIONS models, after `ServiceRequest` ~line 540)

- [ ] **Step 1: Add the enum and model to `prisma/schema.prisma`**

Insert after the `ServiceRequest` model:

```prisma
enum TestimonialSubmissionStatus {
  PENDING
  APPROVED
  REJECTED
}

model TestimonialSubmission {
  id           String  @id @default(cuid())

  // Step 1 — publishable testimonial
  fullName     String
  email        String   // internal only — never published
  phone        String?  // internal only — never published
  businessName String?
  governorate  String?
  program      String?
  quote        String  @db.Text
  locale       String   // "en" | "ar" — language the beneficiary wrote in
  consent      Boolean @default(false)
  consentTextVersion String?
  photoUrl     String?

  // Step 2 — internal impact survey (all optional)
  motivation         String? @db.Text
  challenges         String? @db.Text
  skillsGained       String? @db.Text
  valuableLesson     String? @db.Text
  lifeImpact         String? @db.Text
  results            String? @db.Text
  successStory       String? @db.Text
  adviceToOthers     String? @db.Text
  additionalComments String? @db.Text

  // Moderation
  status                 TestimonialSubmissionStatus @default(PENDING)
  publishedTestimonialId String?
  isRead                 Boolean   @default(false)
  reviewedAt             DateTime?
  createdAt              DateTime  @default(now())
}
```

- [ ] **Step 2: Push schema and regenerate client**

Run: `npm run db:push`
Expected: "Your database is now in sync with your Prisma schema" and client regeneration. (This also applies the unrelated pending schema edits already in the working tree — expected.)

- [ ] **Step 3: Verify the model exists in the generated client**

Run: `node -e "const {PrismaClient}=require('@prisma/client'); const db=new PrismaClient(); db.testimonialSubmission.count().then(c=>{console.log('count',c);process.exit(0)})"`
Expected: `count 0`

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat: add TestimonialSubmission model and status enum

Note: includes unrelated pending schema edits already in the tree."
```

---

### Task 2: Rate-limit helper

**Files:**
- Create: `src/lib/rate-limit.ts`

- [ ] **Step 1: Create `src/lib/rate-limit.ts`**

```ts
/**
 * Minimal in-memory per-key rate limiter for public endpoints.
 * Good enough for this site's traffic; resets on server restart and is
 * per-instance (fine on a single Vercel region / dev). Not a security
 * boundary — a damage limiter.
 */
type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 10_000;

/** Returns true if the call is allowed, false if over the limit. */
export function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();

  if (buckets.size > MAX_BUCKETS) {
    for (const [k, b] of buckets) if (now > b.resetAt) buckets.delete(k);
  }

  const bucket = buckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (bucket.count >= max) return false;
  bucket.count++;
  return true;
}

/** Best-effort client IP (behind Vercel/proxies). */
export function clientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  return fwd ? fwd.split(",")[0].trim() : "unknown";
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no NEW errors in `src/lib/rate-limit.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/lib/rate-limit.ts
git commit -m "feat: add in-memory per-IP rate limiter for public endpoints"
```

---

### Task 3: Public image upload endpoint

**Files:**
- Create: `src/app/api/public/upload/route.ts`

- [ ] **Step 1: Create `src/app/api/public/upload/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { uploadFile } from "@/lib/upload";
import { rateLimit, clientIp } from "@/lib/rate-limit";

/**
 * Public image upload for the testimonial form photo.
 * Hardening: per-IP rate limit, 5MB cap, magic-byte sniffing (declared
 * MIME alone is trivially spoofed), server-generated filename, fixed
 * folder (never client-controlled).
 */

const MAX_BYTES = 5 * 1024 * 1024;
const FOLDER = "testimonials/submissions";

const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function sniffImageType(buf: Buffer): string | null {
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf.length > 4 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return "image/png";
  if (buf.length > 12 && buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") return "image/webp";
  return null;
}

export async function POST(request: NextRequest) {
  if (!rateLimit(`pub-upload:${clientIp(request)}`, 10, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many uploads. Try again later." }, { status: 429 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
    if (file.size > MAX_BYTES) return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const sniffed = sniffImageType(buffer);
    if (!sniffed || !EXT[sniffed]) {
      return NextResponse.json({ error: "Only JPEG, PNG, or WebP images are allowed" }, { status: 400 });
    }

    const url = await uploadFile(buffer, `${randomUUID()}.${EXT[sniffed]}`, sniffed, FOLDER);
    return NextResponse.json({ url });
  } catch (err) {
    console.error("Public upload error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Verify with curl against the dev server**

With the dev server running:

```bash
# valid JPEG magic bytes
printf '\xff\xd8\xff\xe0FAKEJPEGDATA' > /tmp/ok.jpg
curl -s -o /dev/null -w "%{http_code}\n" -F "file=@/tmp/ok.jpg;type=image/jpeg" http://localhost:3000/api/public/upload
# spoofed: declared image/jpeg but not a real image
printf 'MZNOTANIMAGE' > /tmp/bad.jpg
curl -s -F "file=@/tmp/bad.jpg;type=image/jpeg" http://localhost:3000/api/public/upload
```

Expected: first prints `200` (Supabase upload succeeds; if Supabase env is missing locally it may 500 — the 400-path checks below still hold); second returns `{"error":"Only JPEG, PNG, or WebP images are allowed"}`.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/public/upload/route.ts
git commit -m "feat: add hardened public image upload endpoint"
```

---

### Task 4: Public testimonial submission endpoint

**Files:**
- Create: `src/app/api/public/testimonials/route.ts`

- [ ] **Step 1: Create `src/app/api/public/testimonials/route.ts`**

```ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { sendNotificationEmail, renderNotification } from "@/lib/email";
import { rateLimit, clientIp } from "@/lib/rate-limit";

const optionalText = (max: number) => z.string().max(max).optional().or(z.literal(""));

const submitSchema = z.object({
  fullName: z.string().min(2).max(120),
  email: z.string().email().max(200),
  phone: optionalText(40),
  businessName: optionalText(200),
  governorate: optionalText(50),
  program: optionalText(60),
  quote: z.string().min(10).max(1000),
  consent: z.boolean(),
  locale: z.enum(["en", "ar"]),
  photoUrl: z.string().url().max(500).optional().or(z.literal("")),
  motivation: optionalText(5000),
  challenges: optionalText(5000),
  skillsGained: optionalText(5000),
  valuableLesson: optionalText(5000),
  lifeImpact: optionalText(5000),
  results: optionalText(5000),
  successStory: optionalText(5000),
  adviceToOthers: optionalText(5000),
  additionalComments: optionalText(5000),
  website: z.string().max(0).optional(), // honeypot
});

type ErrorEnvelope = {
  ok: false;
  error: "validation" | "rate_limited" | "server";
  fields?: Record<string, string>;
};

export async function POST(request: NextRequest) {
  if (!rateLimit(`pub-testimonial:${clientIp(request)}`, 5, 60 * 60 * 1000)) {
    return NextResponse.json<ErrorEnvelope>({ ok: false, error: "rate_limited" }, { status: 429 });
  }

  try {
    const body = await request.json().catch(() => null);
    const parsed = submitSchema.safeParse(body);

    if (!parsed.success) {
      const fields: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string") fields[key] = issue.message;
      }
      return NextResponse.json<ErrorEnvelope>({ ok: false, error: "validation", fields }, { status: 400 });
    }

    const data = parsed.data;

    // Honeypot: silently pretend success, write nothing
    if (data.website && data.website.length > 0) {
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    const clean = (s?: string) => (s && s.trim() ? s.trim() : null);

    const submission = await db.testimonialSubmission.create({
      data: {
        fullName: data.fullName.trim(),
        email: data.email.trim().toLowerCase(),
        phone: clean(data.phone),
        businessName: clean(data.businessName),
        governorate: clean(data.governorate),
        program: clean(data.program),
        quote: data.quote.trim(),
        locale: data.locale,
        consent: data.consent,
        consentTextVersion: `v1-${data.locale}`,
        photoUrl: clean(data.photoUrl),
        motivation: clean(data.motivation),
        challenges: clean(data.challenges),
        skillsGained: clean(data.skillsGained),
        valuableLesson: clean(data.valuableLesson),
        lifeImpact: clean(data.lifeImpact),
        results: clean(data.results),
        successStory: clean(data.successStory),
        adviceToOthers: clean(data.adviceToOthers),
        additionalComments: clean(data.additionalComments),
      },
    });

    await sendNotificationEmail({
      subject: `[LEEE] New testimonial submission: ${data.fullName}`,
      replyTo: data.email,
      html: renderNotification(
        "New testimonial submitted",
        `A beneficiary shared their story via the website (in ${data.locale === "ar" ? "Arabic" : "English"}).`,
        [
          { label: "Name", value: data.fullName },
          { label: "Email", value: data.email },
          { label: "Phone", value: data.phone },
          { label: "Business / Project", value: data.businessName },
          { label: "Governorate", value: data.governorate },
          { label: "Program", value: data.program },
          { label: "Quote", value: data.quote },
          { label: "Publish consent", value: data.consent ? "Yes" : "No" },
          { label: "Photo", value: data.photoUrl },
        ]
      ),
    });

    return NextResponse.json({ ok: true, id: submission.id }, { status: 201 });
  } catch (err) {
    console.error("Testimonial submission error:", err);
    return NextResponse.json<ErrorEnvelope>({ ok: false, error: "server" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Verify with curl**

```bash
# valid submission
curl -s -X POST http://localhost:3000/api/public/testimonials -H "Content-Type: application/json" \
  -d '{"fullName":"Test Person","email":"test@example.com","quote":"This program changed my life completely.","consent":true,"locale":"en"}'
# missing email -> validation envelope
curl -s -X POST http://localhost:3000/api/public/testimonials -H "Content-Type: application/json" \
  -d '{"fullName":"Test Person","quote":"This program changed my life completely.","consent":true,"locale":"en"}'
# honeypot -> ok:true but no new row
curl -s -X POST http://localhost:3000/api/public/testimonials -H "Content-Type: application/json" \
  -d '{"fullName":"Bot Bot","email":"bot@example.com","quote":"Spam spam spam spam.","consent":true,"locale":"en","website":""}'
```

Expected: first `{"ok":true,"id":"..."}` (201); second `{"ok":false,"error":"validation","fields":{"email":...}}`.

Honeypot semantics (mirrors `careers/apply`, do not "fix"): the real form always sends `website: ""`, which passes `max(0)` and writes a row — so the third curl above DOES create a row (expected). A bot that fills the honeypot (`"website":"http://spam"`) fails `max(0)` and gets a 400 validation envelope instead of the spec's "silent 200" — either way **nothing is written**, which is the outcome that matters.

Run: `node -e "const {PrismaClient}=require('@prisma/client'); const db=new PrismaClient(); db.testimonialSubmission.count().then(c=>{console.log('count',c);process.exit(0)})"`

- [ ] **Step 3: Clean up test rows**

Run: `node -e "const {PrismaClient}=require('@prisma/client'); const db=new PrismaClient(); db.testimonialSubmission.deleteMany({where:{email:{in:['test@example.com','bot@example.com']}}}).then(r=>{console.log('deleted',r.count);process.exit(0)})"`

- [ ] **Step 4: Commit**

```bash
git add src/app/api/public/testimonials/route.ts
git commit -m "feat: add public testimonial submission endpoint"
```

---

### Task 5: Shared public form field components

**Files:**
- Create: `src/components/forms/fields.tsx`

The three field sub-components at the bottom of `src/components/forms/JoinUsForm.tsx` (lines ~501–611: `FormField`, `FormSelect`, `FormTextarea`) are needed by the new form. Extract them into a shared module. Do NOT modify `JoinUsForm` (out of scope; it keeps its private copies).

- [ ] **Step 1: Create `src/components/forms/fields.tsx`**

Copy the three components from `JoinUsForm.tsx` verbatim, add `"use client";` at top, `import { cn } from "@/lib/utils";`, and `export` each function. Exact code:

```tsx
"use client";

import { cn } from "@/lib/utils";

export function FormField({
  label,
  value,
  onChange,
  error,
  required,
  optional,
  type = "text",
  placeholder,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  required?: boolean;
  optional?: string;
  type?: string;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-text-primary">
        {label}
        {required && <span className="text-red-500 ms-1">*</span>}
        {optional && !required && (
          <span className="text-gray-400 text-xs ms-1.5">({optional})</span>
        )}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "w-full px-4 py-2.5 bg-white border rounded-lg text-sm text-text-primary placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all",
          error ? "border-red-400" : "border-gray-200"
        )}
      />
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

export function FormSelect({
  label,
  value,
  onChange,
  options,
  placeholder,
  optional,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { label: string; value: string }[];
  placeholder: string;
  optional?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-text-primary">
        {label}
        {optional && <span className="text-gray-400 text-xs ms-1.5">({optional})</span>}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all"
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function FormTextarea({
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
  optional,
  required,
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  optional?: string;
  required?: boolean;
  error?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-text-primary">
        {label}
        {required && <span className="text-red-500 ms-1">*</span>}
        {optional && !required && (
          <span className="text-gray-400 text-xs ms-1.5">({optional})</span>
        )}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className={cn(
          "w-full px-4 py-2.5 bg-white border rounded-lg text-sm text-text-primary placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all resize-none",
          error ? "border-red-400" : "border-gray-200"
        )}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
```

(Differences from the JoinUsForm originals — deliberate, the new form needs them: `FormField` gains optional `hint`; `FormTextarea` gains optional `required`/`error`.)

- [ ] **Step 2: Type-check** — `npx tsc --noEmit`, no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/forms/fields.tsx
git commit -m "feat: add shared public form field components"
```

---

### Task 6: ShareStoryForm component

**Files:**
- Create: `src/components/forms/ShareStoryForm.tsx`

- [ ] **Step 1: Create `src/components/forms/ShareStoryForm.tsx`**

Two-step wizard mirroring `JoinUsForm` (state machine, step indicator, success screen). Complete code:

```tsx
"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { cn } from "@/lib/utils";
import {
  Quote,
  ClipboardList,
  ChevronRight,
  ChevronLeft,
  Loader2,
  CheckCircle2,
  Upload,
  ShieldCheck,
} from "lucide-react";
import { FormField, FormSelect, FormTextarea } from "./fields";

interface FormData {
  fullName: string;
  email: string;
  phone: string;
  businessName: string;
  governorate: string;
  program: string;
  quote: string;
  consent: "" | "yes" | "no";
  photoUrl: string;
  motivation: string;
  challenges: string;
  skillsGained: string;
  valuableLesson: string;
  lifeImpact: string;
  results: string;
  successStory: string;
  adviceToOthers: string;
  additionalComments: string;
}

const initialForm: FormData = {
  fullName: "", email: "", phone: "", businessName: "",
  governorate: "", program: "", quote: "", consent: "", photoUrl: "",
  motivation: "", challenges: "", skillsGained: "", valuableLesson: "",
  lifeImpact: "", results: "", successStory: "", adviceToOthers: "",
  additionalComments: "",
};

// Stored values are stable English keys (see spec §4).
const governorates = [
  { en: "Akkar", ar: "عكار" },
  { en: "North Lebanon", ar: "الشمال" },
  { en: "South Lebanon", ar: "الجنوب" },
  { en: "Beirut", ar: "بيروت" },
  { en: "Mount Lebanon", ar: "جبل لبنان" },
  { en: "Nabatieh", ar: "النبطية" },
  { en: "Bekaa", ar: "البقاع" },
  { en: "Baalbek-Hermel", ar: "بعلبك الهرمل" },
];

const programs = [
  { en: "LEE Incubation", ar: "حاضنة LEE" },
  { en: "LEE Acceleration", ar: "مسرعة LEE" },
  { en: "LEE Humanitarian Aid", ar: "LEE للمساعدات الإنسانية" },
  { en: "LEE Digital Media Hub", ar: "مركز LEE للإعلام الرقمي" },
  { en: "LEE Academy", ar: "أكاديمية LEE" },
  { en: "LEE Business Clinic", ar: "عيادة الأعمال LEE" },
];

const content = {
  en: {
    step1: "Your Testimonial",
    step2: "Tell Us More (Optional)",
    fullName: "Full Name",
    email: "Email Address",
    emailHint: "Never published — only so our team can verify and follow up with you.",
    phone: "Phone Number",
    businessName: "Business / Project Name",
    governorate: "Governorate",
    selectGovernorate: "Select your governorate...",
    program: "Which program or service did you participate in?",
    selectProgram: "Select a program...",
    quote: "Your testimonial",
    quotePlaceholder: "A short quote that reflects your experience with LEEE...",
    photo: "Upload Photo (Optional)",
    photoNote: "JPEG, PNG, or WebP, max 5MB",
    photoUploaded: "Photo uploaded",
    remove: "Remove",
    uploadingLabel: "Uploading...",
    privacyTitle: "Your privacy",
    privacyBody:
      "Only your quote, name, photo, and project information may be published — and only if you agree below. Your email and phone stay internal and are never shared. To request removal later, email info@theleeexperience.com.",
    consentLabel: "May we publish your testimonial, name, photo, and project information on our website and social media?",
    consentYes: "Yes, you may publish it",
    consentNo: "No, keep it internal",
    motivation: "What motivated you to join the program?",
    challenges: "What were the main challenges you were facing before participating?",
    skillsGained: "What skills, knowledge, or support did you gain through the program?",
    valuableLesson: "What is the most valuable lesson you learned?",
    lifeImpact: "How has the program impacted your personal or professional life?",
    results: "Have you achieved any specific results or milestones after participating?",
    resultsPlaceholder: "Examples: started a business, found employment, increased income, improved confidence, expanded network...",
    successStory: "Can you share a success story or achievement that makes you proud?",
    adviceToOthers: "What would you say to someone considering joining this program?",
    additionalComments: "Additional Comments",
    optionalIntro: "These questions are optional — they help us understand and improve our programs. Feel free to skip any or all of them.",
    next: "Continue",
    back: "Back",
    submit: "Submit My Story",
    submitting: "Submitting...",
    required: "Required",
    invalidEmail: "Invalid email",
    quoteTooShort: "Please write at least a sentence (10+ characters)",
    consentRequired: "Please choose Yes or No",
    successTitle: "Thank You for Sharing!",
    successMessage:
      "Your story has been received. Our team will review it, and if you agreed to publication, it may appear on our website soon.",
    successBack: "Back to Home",
    errorMessage: "Something went wrong. Please try again.",
    rateLimited: "Too many submissions. Please try again later.",
    optional: "Optional",
  },
  ar: {
    step1: "شهادتك",
    step2: "أخبرنا المزيد (اختياري)",
    fullName: "الاسم الكامل",
    email: "البريد الإلكتروني",
    emailHint: "لن يُنشر أبداً — فقط ليتمكن فريقنا من التحقق والتواصل معك.",
    phone: "رقم الهاتف",
    businessName: "اسم العمل / المشروع",
    governorate: "المحافظة",
    selectGovernorate: "اختر محافظتك...",
    program: "في أي برنامج أو خدمة شاركت؟",
    selectProgram: "اختر البرنامج...",
    quote: "شهادتك",
    quotePlaceholder: "اقتباس قصير يعكس تجربتك مع LEEE...",
    photo: "تحميل صورة (اختياري)",
    photoNote: "JPEG أو PNG أو WebP، بحد أقصى 5 ميغابايت",
    photoUploaded: "تم تحميل الصورة",
    remove: "إزالة",
    uploadingLabel: "جارٍ التحميل...",
    privacyTitle: "خصوصيتك",
    privacyBody:
      "قد يُنشر فقط اقتباسك واسمك وصورتك ومعلومات مشروعك — وفقط إذا وافقت أدناه. يبقى بريدك الإلكتروني وهاتفك داخليين ولا تتم مشاركتهما أبداً. لطلب الإزالة لاحقاً، راسلنا على info@theleeexperience.com.",
    consentLabel: "هل يمكننا نشر شهادتك واسمك وصورتك ومعلومات مشروعك على موقعنا الإلكتروني ووسائل التواصل الاجتماعي؟",
    consentYes: "نعم، يمكنكم النشر",
    consentNo: "لا، أبقوها داخلية",
    motivation: "ما الذي حفزك للانضمام إلى البرنامج؟",
    challenges: "ما هي التحديات الرئيسية التي كنت تواجهها قبل المشاركة؟",
    skillsGained: "ما المهارات أو المعرفة أو الدعم الذي اكتسبته من خلال البرنامج؟",
    valuableLesson: "ما هو أثمن درس تعلمته؟",
    lifeImpact: "كيف أثّر البرنامج على حياتك الشخصية أو المهنية؟",
    results: "هل حققت نتائج أو إنجازات محددة بعد المشاركة؟",
    resultsPlaceholder: "أمثلة: بدأت عملاً، وجدت وظيفة، زاد دخلي، تحسنت ثقتي، توسعت شبكتي...",
    successStory: "هل يمكنك مشاركة قصة نجاح أو إنجاز تفتخر به؟",
    adviceToOthers: "ماذا تقول لشخص يفكر في الانضمام إلى هذا البرنامج؟",
    additionalComments: "تعليقات إضافية",
    optionalIntro: "هذه الأسئلة اختيارية — تساعدنا على فهم برامجنا وتحسينها. لا تتردد في تخطي أي منها أو جميعها.",
    next: "متابعة",
    back: "السابق",
    submit: "أرسل قصتي",
    submitting: "جارٍ الإرسال...",
    required: "مطلوب",
    invalidEmail: "بريد إلكتروني غير صالح",
    quoteTooShort: "يرجى كتابة جملة على الأقل (10 أحرف أو أكثر)",
    consentRequired: "يرجى اختيار نعم أو لا",
    successTitle: "شكراً لمشاركتك!",
    successMessage:
      "تم استلام قصتك. سيراجعها فريقنا، وإذا وافقت على النشر، فقد تظهر على موقعنا قريباً.",
    successBack: "العودة إلى الرئيسية",
    errorMessage: "حدث خطأ ما. يرجى المحاولة مرة أخرى.",
    rateLimited: "محاولات كثيرة جداً. يرجى المحاولة لاحقاً.",
    optional: "اختياري",
  },
};

const steps = [
  { icon: Quote, key: "step1" as const },
  { icon: ClipboardList, key: "step2" as const },
];

export function ShareStoryForm() {
  const locale = useLocale();
  const isAr = locale === "ar";
  const t = content[isAr ? "ar" : "en"];

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(initialForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  const set = (key: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validateStep1 = () => {
    const errs: Partial<Record<keyof FormData, string>> = {};
    if (!form.fullName.trim()) errs.fullName = t.required;
    if (!form.email.trim()) errs.email = t.required;
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = t.invalidEmail;
    if (form.quote.trim().length < 10) errs.quote = form.quote.trim() ? t.quoteTooShort : t.required;
    if (form.consent === "") errs.consent = t.consentRequired;
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const nextStep = () => {
    if (validateStep1()) setStep(1);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, photoUrl: t.photoNote }));
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/public/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      set("photoUrl", data.url);
    } catch {
      setErrors((prev) => ({ ...prev, photoUrl: t.errorMessage }));
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep1()) { setStep(0); return; }

    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/public/testimonials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          consent: form.consent === "yes",
          locale: isAr ? "ar" : "en",
          website: "", // honeypot
        }),
      });
      if (!res.ok) {
        if (res.status === 429) throw new Error(t.rateLimited);
        throw new Error(t.errorMessage);
      }
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-16 px-4">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-100 rounded-full mb-6">
          <CheckCircle2 className="w-10 h-10 text-emerald-600" />
        </div>
        <h3 className="text-2xl font-bold text-text-primary mb-3">{t.successTitle}</h3>
        <p className="text-text-secondary max-w-md mx-auto mb-8">{t.successMessage}</p>
        <a
          href={`/${locale}`}
          className="inline-flex items-center gap-2 px-6 py-3 bg-brand-blue text-white font-medium hover:bg-brand-blue/90 transition-colors"
        >
          {t.successBack}
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Step indicator */}
      <div className="flex items-center justify-between mb-10">
        {steps.map((s, i) => {
          const Icon = s.icon;
          const isActive = i === step;
          const isDone = i < step;
          return (
            <div key={i} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all mb-2",
                    isActive
                      ? "border-brand-blue bg-brand-blue text-white"
                      : isDone
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : "border-gray-200 bg-white text-gray-400"
                  )}
                >
                  {isDone ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                </div>
                <span
                  className={cn(
                    "text-xs font-medium text-center",
                    isActive ? "text-brand-blue" : isDone ? "text-emerald-600" : "text-gray-400"
                  )}
                >
                  {t[s.key]}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className={cn("h-0.5 flex-1 mx-2 mt-[-1.5rem]", isDone ? "bg-emerald-500" : "bg-gray-200")} />
              )}
            </div>
          );
        })}
      </div>

      <form onSubmit={handleSubmit}>
        {step === 0 && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <FormField label={t.fullName} value={form.fullName} onChange={(v) => set("fullName", v)} error={errors.fullName} required />
              <FormField label={t.businessName} value={form.businessName} onChange={(v) => set("businessName", v)} optional={t.optional} />
            </div>
            <FormField label={t.email} type="email" value={form.email} onChange={(v) => set("email", v)} error={errors.email} required hint={t.emailHint} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <FormField label={t.phone} type="tel" value={form.phone} onChange={(v) => set("phone", v)} optional={t.optional} />
              <FormSelect
                label={t.governorate} value={form.governorate} onChange={(v) => set("governorate", v)}
                placeholder={t.selectGovernorate} optional={t.optional}
                options={governorates.map((g) => ({ label: isAr ? g.ar : g.en, value: g.en }))}
              />
            </div>
            <FormSelect
              label={t.program} value={form.program} onChange={(v) => set("program", v)}
              placeholder={t.selectProgram} optional={t.optional}
              options={programs.map((p) => ({ label: isAr ? p.ar : p.en, value: p.en }))}
            />
            <FormTextarea label={t.quote} value={form.quote} onChange={(v) => set("quote", v)} placeholder={t.quotePlaceholder} rows={4} required error={errors.quote} />

            {/* Photo upload */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-text-primary">{t.photo}</label>
              <div
                className={cn(
                  "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
                  form.photoUrl ? "border-emerald-300 bg-emerald-50" : "border-gray-200 hover:border-brand-blue/50"
                )}
              >
                {form.photoUrl ? (
                  <div className="flex items-center justify-center gap-2 text-emerald-600">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="text-sm font-medium">{t.photoUploaded}</span>
                    <button type="button" onClick={() => set("photoUrl", "")} className="text-xs text-gray-500 underline ms-2">
                      {t.remove}
                    </button>
                  </div>
                ) : uploading ? (
                  <div className="flex items-center justify-center gap-2 text-brand-blue">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-sm">{t.uploadingLabel}</span>
                  </div>
                ) : (
                  <label className="cursor-pointer">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <span className="text-sm text-text-secondary">{t.photoNote}</span>
                    <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileUpload} />
                  </label>
                )}
              </div>
              {errors.photoUrl && <p className="text-xs text-red-500">{errors.photoUrl}</p>}
            </div>

            {/* Privacy notice + consent */}
            <div className="bg-brand-blue/5 border border-brand-blue/15 rounded-lg p-5 space-y-4">
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-brand-blue shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-text-primary mb-1">{t.privacyTitle}</p>
                  <p className="text-xs text-text-secondary leading-relaxed">{t.privacyBody}</p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-text-primary">
                  {t.consentLabel}
                  <span className="text-red-500 ms-1">*</span>
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  {(["yes", "no"] as const).map((v) => (
                    <label
                      key={v}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2.5 border rounded-lg cursor-pointer text-sm transition-all flex-1",
                        form.consent === v ? "border-brand-blue bg-brand-blue/10 text-text-primary font-medium" : "border-gray-200 text-text-secondary hover:border-gray-300"
                      )}
                    >
                      <input
                        type="radio"
                        name="consent"
                        checked={form.consent === v}
                        onChange={() => set("consent", v)}
                        className="accent-[#5895D0]"
                      />
                      {v === "yes" ? t.consentYes : t.consentNo}
                    </label>
                  ))}
                </div>
                {errors.consent && <p className="text-xs text-red-500">{errors.consent}</p>}
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5">
            <p className="text-sm text-text-secondary bg-gray-50 border border-gray-100 rounded-lg p-4">{t.optionalIntro}</p>
            <FormTextarea label={t.motivation} value={form.motivation} onChange={(v) => set("motivation", v)} optional={t.optional} rows={3} />
            <FormTextarea label={t.challenges} value={form.challenges} onChange={(v) => set("challenges", v)} optional={t.optional} rows={3} />
            <FormTextarea label={t.skillsGained} value={form.skillsGained} onChange={(v) => set("skillsGained", v)} optional={t.optional} rows={3} />
            <FormTextarea label={t.valuableLesson} value={form.valuableLesson} onChange={(v) => set("valuableLesson", v)} optional={t.optional} rows={3} />
            <FormTextarea label={t.lifeImpact} value={form.lifeImpact} onChange={(v) => set("lifeImpact", v)} optional={t.optional} rows={3} />
            <FormTextarea label={t.results} value={form.results} onChange={(v) => set("results", v)} placeholder={t.resultsPlaceholder} optional={t.optional} rows={3} />
            <FormTextarea label={t.successStory} value={form.successStory} onChange={(v) => set("successStory", v)} optional={t.optional} rows={3} />
            <FormTextarea label={t.adviceToOthers} value={form.adviceToOthers} onChange={(v) => set("adviceToOthers", v)} optional={t.optional} rows={3} />
            <FormTextarea label={t.additionalComments} value={form.additionalComments} onChange={(v) => set("additionalComments", v)} optional={t.optional} rows={3} />
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>
        )}

        <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
          {step > 0 ? (
            <button type="button" onClick={() => setStep(0)} className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">
              <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
              {t.back}
            </button>
          ) : (
            <div />
          )}

          {step === 0 ? (
            <button type="button" onClick={nextStep} className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-brand-blue hover:bg-brand-blue/90 transition-colors">
              {t.next}
              <ChevronRight className="w-4 h-4 rtl:rotate-180" />
            </button>
          ) : (
            <button type="submit" disabled={loading || uploading} className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-brand-blue hover:bg-brand-blue/90 transition-colors disabled:opacity-50">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? t.submitting : t.submit}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
```

- [ ] **Step 2: Type-check** — `npx tsc --noEmit`, no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/forms/ShareStoryForm.tsx
git commit -m "feat: add ShareStoryForm two-step testimonial wizard"
```

---

### Task 7: Public page, loading skeleton, and Get Involved CTA

**Files:**
- Create: `src/app/[locale]/get-involved/share-your-story/page.tsx`
- Create: `src/app/[locale]/get-involved/share-your-story/loading.tsx`
- Create: `src/components/sections/get-involved/ShareStoryCTA.tsx`
- Modify: `src/app/[locale]/get-involved/page.tsx` (add CTA after `<GetInvolvedHub />`)

- [ ] **Step 1: Create the form page**

`src/app/[locale]/get-involved/share-your-story/page.tsx` (mirrors `join-us/page.tsx`):

```tsx
import { getTranslations } from "next-intl/server";
import { buildPageMetadata } from "@/lib/metadata";
import { PageHeader } from "@/components/layout/PageHeader";
import { Container } from "@/components/ui/Container";
import { ShareStoryForm } from "@/components/forms/ShareStoryForm";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return buildPageMetadata({
    title: locale === "ar" ? "شارك قصتك — تجربة LEE" : "Share Your Story — The LEE Experience",
    description: locale === "ar"
      ? "هل شاركت في أحد برامج LEEE؟ شارك شهادتك وألهم الآخرين"
      : "Were you part of a LEEE program? Share your testimonial and inspire others",
    path: "get-involved/share-your-story",
    locale,
  });
}

export default async function ShareYourStoryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const tNav = await getTranslations({ locale, namespace: "nav" });

  return (
    <>
      <PageHeader
        title={locale === "ar" ? "شارك قصتك" : "Share Your Story"}
        subtitle={
          locale === "ar"
            ? "تجربتك قد تكون الشرارة التي تلهم شخصاً آخر ليبدأ"
            : "Your experience could be the spark that inspires someone else to start"
        }
        breadcrumbs={[
          { label: tNav("home"), href: "/" },
          { label: tNav("getInvolved"), href: "/get-involved" },
          { label: locale === "ar" ? "شارك قصتك" : "Share Your Story" },
        ]}
      />

      <section className="py-12 md:py-20">
        <Container>
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-4">
                {locale === "ar" ? "كنت جزءاً من تجربة LEE؟" : "Were You Part of The LEE Experience?"}
              </h2>
              <p className="text-text-secondary max-w-xl mx-auto leading-relaxed">
                {locale === "ar"
                  ? "أخبرنا كيف أثّر البرنامج على حياتك. بعد مراجعة فريقنا وبموافقتك، قد تُنشر شهادتك على موقعنا."
                  : "Tell us how the program changed things for you. After our team reviews it — and with your consent — your testimonial may be published on our website."}
              </p>
            </div>

            <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-6 md:p-10">
              <ShareStoryForm />
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
```

Note: verify `PageHeader` breadcrumbs accept `href` on middle items (join-us page passes `{ label: tNav("getInvolved") }` without href — if the type rejects `href`, drop it).

- [ ] **Step 2: Create the loading skeleton**

`src/app/[locale]/get-involved/share-your-story/loading.tsx`:

```tsx
import { Skeleton } from "@/components/shared/SkeletonBlock";

export default function ShareYourStoryLoading() {
  return (
    <>
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 py-16 px-4 animate-pulse">
        <div className="max-w-7xl mx-auto space-y-3">
          <Skeleton className="h-3 w-40 rounded" />
          <Skeleton className="h-10 w-[420px] max-w-full rounded" />
          <Skeleton className="h-4 w-64 rounded" />
        </div>
      </div>
      <div className="max-w-3xl mx-auto px-4 py-16 space-y-4">
        <Skeleton className="h-8 w-72 mx-auto rounded" />
        <Skeleton className="h-4 w-96 max-w-full mx-auto rounded" />
        <div className="border border-gray-100 rounded-xl p-8 space-y-5 mt-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-11 w-full rounded-lg" />
          ))}
        </div>
      </div>
    </>
  );
}
```

- [ ] **Step 3: Create the CTA band**

`src/components/sections/get-involved/ShareStoryCTA.tsx`:

```tsx
"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import { Quote, ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { AnimatedSection } from "@/components/shared/AnimatedSection";

export function ShareStoryCTA() {
  const locale = useLocale();
  const isAr = locale === "ar";

  return (
    <section className="pb-16 md:pb-24">
      <Container>
        <AnimatedSection>
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0f2741] to-[#1B3A5C] px-8 py-12 md:px-14 md:py-14">
            <Quote className="absolute -top-4 -end-4 w-40 h-40 text-brand-blue/10 rotate-12" />
            <div className="relative flex flex-col md:flex-row md:items-center gap-8">
              <div className="flex-1">
                <p className="text-brand-blue font-semibold text-sm uppercase tracking-wider mb-2">
                  {isAr ? "لخريجي برامجنا" : "For our program alumni"}
                </p>
                <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">
                  {isAr ? "كنت جزءاً من برنامج LEEE؟ شارك قصتك." : "Were you part of a LEEE program? Share your story."}
                </h3>
                <p className="text-gray-300 leading-relaxed max-w-2xl">
                  {isAr
                    ? "أخبرنا كيف غيّر البرنامج حياتك — قد تلهم تجربتك الشخص التالي ليبدأ رحلته."
                    : "Tell us how the program changed things for you — your experience might inspire the next person to start their journey."}
                </p>
              </div>
              <Link
                href={`/${locale}/get-involved/share-your-story`}
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-brand-blue text-white font-semibold rounded-full hover:bg-brand-blue/90 transition-all hover:gap-3 shrink-0"
              >
                {isAr ? "شارك شهادتك" : "Share your testimonial"}
                <ArrowRight className="w-4 h-4 rtl:rotate-180" />
              </Link>
            </div>
          </div>
        </AnimatedSection>
      </Container>
    </section>
  );
}
```

- [ ] **Step 4: Add the CTA to the Get Involved page**

In `src/app/[locale]/get-involved/page.tsx`, add the import and render after the hub:

```tsx
import { ShareStoryCTA } from "@/components/sections/get-involved/ShareStoryCTA";
// ...
      <GetInvolvedHub />
      <ShareStoryCTA />
```

- [ ] **Step 5: Verify in browser**

Visit `http://localhost:3000/en/get-involved` → CTA band shows under the 2×2 grid. Click it → form page renders. Repeat at `/ar/get-involved` → RTL, Arabic copy. Submit a valid test entry end-to-end (then clean it up via the node one-liner from Task 4 Step 3, matching its email).

- [ ] **Step 6: Commit**

```bash
git add "src/app/[locale]/get-involved/share-your-story" src/components/sections/get-involved/ShareStoryCTA.tsx "src/app/[locale]/get-involved/page.tsx"
git commit -m "feat: add Share Your Story page and Get Involved CTA"
```

---

### Task 8: Admin API for submissions

**Files:**
- Create: `src/app/api/admin/testimonial-submissions/route.ts`
- Create: `src/app/api/admin/testimonial-submissions/[id]/route.ts`
- Create: `src/app/api/admin/testimonial-submissions/unread-count/route.ts`

- [ ] **Step 1: List route** — `src/app/api/admin/testimonial-submissions/route.ts`:

```ts
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { withAdmin, getPaginationParams, paginatedResponse, errorResponse } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  const auth = await withAdmin(request);
  if ("error" in auth) return auth.error;

  try {
    const { page, limit, search, sort, order, skip } = getPaginationParams(request);
    const url = new URL(request.url);
    const status = url.searchParams.get("status");

    const where = {
      ...(search
        ? { OR: [
            { fullName: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
            { quote: { contains: search, mode: "insensitive" as const } },
          ] }
        : {}),
      ...(status === "PENDING" || status === "APPROVED" || status === "REJECTED" ? { status } : {}),
    };

    const [data, total] = await Promise.all([
      db.testimonialSubmission.findMany({ where, orderBy: { [sort]: order }, skip, take: limit }),
      db.testimonialSubmission.count({ where }),
    ]);
    return paginatedResponse(data, total, page, limit);
  } catch {
    return errorResponse("Failed to fetch submissions");
  }
}
```

- [ ] **Step 2: Detail route** — `src/app/api/admin/testimonial-submissions/[id]/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withAdmin, errorResponse } from "@/lib/api-utils";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await withAdmin(request);
  if ("error" in auth) return auth.error;
  const { id } = await params;
  try {
    const item = await db.testimonialSubmission.findUnique({ where: { id } });
    if (!item) return errorResponse("Not found", 404);
    return NextResponse.json(item);
  } catch { return errorResponse("Failed to fetch submission"); }
}

// Accepts { isRead?: boolean, status?: "REJECTED" }.
// APPROVED is set only by the testimonial-create transaction (see admin/testimonials POST).
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await withAdmin(request);
  if ("error" in auth) return auth.error;
  const { id } = await params;
  try {
    const body = await request.json().catch(() => ({}));
    const data: { isRead?: boolean; status?: "REJECTED"; reviewedAt?: Date } = {};
    if (typeof body.isRead === "boolean") data.isRead = body.isRead;
    if (body.status === "REJECTED") {
      data.status = "REJECTED";
      data.reviewedAt = new Date();
    }
    if (Object.keys(data).length === 0) return errorResponse("Nothing to update", 400);
    const item = await db.testimonialSubmission.update({ where: { id }, data });
    return NextResponse.json(item);
  } catch { return errorResponse("Failed to update submission"); }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await withAdmin(request);
  if ("error" in auth) return auth.error;
  const { id } = await params;
  try {
    await db.testimonialSubmission.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch { return errorResponse("Failed to delete submission"); }
}
```

- [ ] **Step 3: Unread count route** — `src/app/api/admin/testimonial-submissions/unread-count/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withAdmin, errorResponse } from "@/lib/api-utils";

export async function GET(request: NextRequest) {
  const auth = await withAdmin(request);
  if ("error" in auth) return auth.error;
  try {
    const count = await db.testimonialSubmission.count({ where: { isRead: false } });
    return NextResponse.json({ count });
  } catch { return errorResponse("Failed to count"); }
}
```

- [ ] **Step 4: Verify** — `npx tsc --noEmit` (no new errors), and unauthenticated curl returns 401:

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/api/admin/testimonial-submissions
```
Expected: `401`

- [ ] **Step 5: Commit**

```bash
git add src/app/api/admin/testimonial-submissions
git commit -m "feat: add admin testimonial-submissions API (list, detail, patch, delete, unread count)"
```

---

### Task 9: Transactional approve + editor pre-fill

**Files:**
- Modify: `src/app/api/admin/testimonials/route.ts` (POST handler)
- Modify: `src/app/admin/(dashboard)/testimonials/components/TestimonialForm.tsx` (export type; add `submissionId` prop)
- Modify: `src/app/admin/(dashboard)/testimonials/new/page.tsx` (server-side pre-fill via `?fromSubmission=`)

- [ ] **Step 1: Update the POST handler in `src/app/api/admin/testimonials/route.ts`**

Replace the existing `POST` with:

```ts
export async function POST(request: NextRequest) {
  const auth = await withAdmin(request);
  if ("error" in auth) return auth.error;

  try {
    const body = await request.json();
    const { submissionId, ...data } = body;

    if (submissionId) {
      // Approve & Publish: create the testimonial and mark the source
      // submission APPROVED atomically.
      const testimonial = await db.$transaction(async (tx) => {
        const created = await tx.testimonial.create({ data });
        await tx.testimonialSubmission.update({
          where: { id: submissionId },
          data: { status: "APPROVED", reviewedAt: new Date(), publishedTestimonialId: created.id },
        });
        return created;
      });
      return NextResponse.json(testimonial, { status: 201 });
    }

    const testimonial = await db.testimonial.create({ data });
    return NextResponse.json(testimonial, { status: 201 });
  } catch {
    return errorResponse("Failed to create testimonial");
  }
}
```

- [ ] **Step 2: Update `TestimonialForm.tsx`**

Three small changes:
1. Export the data interface: `export interface TestimonialData { ... }` (add `export` to the existing declaration).
2. Add the prop: `export default function TestimonialForm({ initial, submissionId }: { initial?: TestimonialData; submissionId?: string }) {`
3. In `handleSubmit`, change the create call to: `await adminPost("/testimonials", submissionId ? { ...form, submissionId } : form);`

- [ ] **Step 3: Rewrite `src/app/admin/(dashboard)/testimonials/new/page.tsx`**

```tsx
import { db } from "@/lib/db";
import TestimonialForm, { type TestimonialData } from "../components/TestimonialForm";

export const dynamic = "force-dynamic";

export default async function NewTestimonialPage({
  searchParams,
}: {
  searchParams: Promise<{ fromSubmission?: string }>;
}) {
  const { fromSubmission } = await searchParams;
  if (!fromSubmission) return <TestimonialForm />;

  const sub = await db.testimonialSubmission.findUnique({ where: { id: fromSubmission } });
  // Guard: only consented, not-yet-approved submissions may pre-fill.
  if (!sub || !sub.consent || sub.status === "APPROVED") return <TestimonialForm />;

  const isAr = sub.locale === "ar";
  const initial: TestimonialData = {
    nameEn: isAr ? "" : sub.fullName,
    nameAr: isAr ? sub.fullName : "",
    titleEn: isAr ? "" : (sub.businessName ?? ""),
    titleAr: isAr ? (sub.businessName ?? "") : "",
    quoteEn: isAr ? "" : sub.quote,
    quoteAr: isAr ? sub.quote : "",
    imageUrl: sub.photoUrl ?? "",
    programEn: sub.program ?? "",
    programAr: "",
    category: "entrepreneurs",
    year: new Date().getFullYear(),
    isOriginalCard: false,
    order: 0,
    isActive: true,
  };

  return <TestimonialForm initial={initial} submissionId={sub.id} />;
}
```

(The existing `TestimonialForm` requires `nameEn` + `quoteEn` before save — for Arabic submissions that's exactly the forcing function for the admin to add the English translation.)

- [ ] **Step 4: Type-check** — `npx tsc --noEmit`, no new errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/admin/testimonials/route.ts "src/app/admin/(dashboard)/testimonials/components/TestimonialForm.tsx" "src/app/admin/(dashboard)/testimonials/new/page.tsx"
git commit -m "feat: transactional approve-and-publish with editor pre-fill from submission"
```

---

### Task 10: Admin inbox UI (list + detail)

**Files:**
- Create: `src/app/admin/(dashboard)/testimonial-submissions/page.tsx`
- Create: `src/app/admin/(dashboard)/testimonial-submissions/[id]/page.tsx`

- [ ] **Step 1: Create the list page** — `src/app/admin/(dashboard)/testimonial-submissions/page.tsx`:

```tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import AdminPageHeader from "../../components/AdminPageHeader";
import AdminDataTable, { type Column } from "../../components/AdminDataTable";
import StatusBadge from "../../components/StatusBadge";
import AdminModal from "../../components/AdminModal";
import { useToast } from "../../components/AdminToast";
import { adminGet, adminDelete, type PaginatedResponse } from "@/lib/admin-api";

interface Submission {
  id: string;
  fullName: string;
  program: string | null;
  quote: string;
  consent: boolean;
  status: "PENDING" | "APPROVED" | "REJECTED";
  isRead: boolean;
  createdAt: string;
}

const STATUS_VARIANT = { PENDING: "warning", APPROVED: "success", REJECTED: "danger" } as const;

export default function TestimonialSubmissionsPage() {
  const router = useRouter();
  const toast = useToast();
  const [data, setData] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Submission | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminGet<PaginatedResponse<Submission>>(`/testimonial-submissions?page=${page}&search=${search}`);
      setData(res.data); setTotalPages(res.pagination.totalPages); setTotal(res.pagination.total);
    } catch { toast.error("Failed to load submissions"); }
    finally { setLoading(false); }
  }, [page, search, toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try { await adminDelete(`/testimonial-submissions/${deleteTarget.id}`); toast.success("Deleted"); setDeleteTarget(null); fetchData(); }
    catch { toast.error("Failed to delete"); }
    finally { setDeleting(false); }
  };

  const columns: Column<Submission>[] = [
    { key: "fullName", label: "Name", sortable: true, render: (item) => (
      <span className={item.isRead ? "text-gray-300" : "text-white font-semibold"}>
        {!item.isRead && <span className="inline-block w-2 h-2 bg-brand-blue rounded-full mr-2" />}
        {item.fullName}
      </span>
    )},
    { key: "program", label: "Program" },
    { key: "quote", label: "Quote", render: (item) => <span className="line-clamp-2 max-w-xs">{item.quote}</span> },
    { key: "consent", label: "Consent", render: (item) => (
      <StatusBadge label={item.consent ? "Yes" : "No"} variant={item.consent ? "success" : "danger"} />
    )},
    { key: "status", label: "Status", render: (item) => (
      <StatusBadge label={item.status} variant={STATUS_VARIANT[item.status]} />
    )},
    { key: "createdAt", label: "Date", sortable: true, render: (item) => new Date(item.createdAt).toLocaleDateString() },
  ];

  return (
    <div>
      <AdminPageHeader title="Testimonial Submissions" />
      <AdminDataTable columns={columns} data={data} totalPages={totalPages} currentPage={page} total={total}
        search={search} onSearch={(s) => { setSearch(s); setPage(1); }} onPageChange={setPage}
        onView={(item) => router.push(`/admin/testimonial-submissions/${item.id}`)} onDelete={setDeleteTarget} loading={loading}
      />
      <AdminModal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        title="Delete Submission" message={`Delete submission from "${deleteTarget?.fullName}"? This cannot be undone.`} confirmLabel="Delete" loading={deleting}
      />
    </div>
  );
}
```

- [ ] **Step 2: Create the detail page** — `src/app/admin/(dashboard)/testimonial-submissions/[id]/page.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Trash2, CheckCircle2, XCircle } from "lucide-react";
import StatusBadge from "../../../components/StatusBadge";
import AdminModal from "../../../components/AdminModal";
import { useToast } from "../../../components/AdminToast";
import { adminGet, adminPatch, adminDelete } from "@/lib/admin-api";

interface Submission {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  businessName: string | null;
  governorate: string | null;
  program: string | null;
  quote: string;
  locale: string;
  consent: boolean;
  consentTextVersion: string | null;
  photoUrl: string | null;
  motivation: string | null;
  challenges: string | null;
  skillsGained: string | null;
  valuableLesson: string | null;
  lifeImpact: string | null;
  results: string | null;
  successStory: string | null;
  adviceToOthers: string | null;
  additionalComments: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  publishedTestimonialId: string | null;
  isRead: boolean;
  reviewedAt: string | null;
  createdAt: string;
}

const STATUS_VARIANT = { PENDING: "warning", APPROVED: "success", REJECTED: "danger" } as const;

const SURVEY_FIELDS: { key: keyof Submission; label: string }[] = [
  { key: "motivation", label: "Motivation to join" },
  { key: "challenges", label: "Challenges before participating" },
  { key: "skillsGained", label: "Skills / knowledge / support gained" },
  { key: "valuableLesson", label: "Most valuable lesson" },
  { key: "lifeImpact", label: "Impact on personal / professional life" },
  { key: "results", label: "Results or milestones achieved" },
  { key: "successStory", label: "Success story" },
  { key: "adviceToOthers", label: "Advice to others" },
  { key: "additionalComments", label: "Additional comments" },
];

export default function SubmissionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const [data, setData] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDelete, setShowDelete] = useState(false);
  const [showReject, setShowReject] = useState(false);

  useEffect(() => {
    adminGet<Submission>(`/testimonial-submissions/${id}`)
      .then((d) => {
        setData(d);
        if (!d.isRead) adminPatch(`/testimonial-submissions/${id}`, { isRead: true }).catch(() => {});
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const handleReject = async () => {
    try {
      const updated = await adminPatch<Submission>(`/testimonial-submissions/${id}`, { status: "REJECTED" });
      setData(updated);
      setShowReject(false);
      toast.success("Submission rejected");
    } catch { toast.error("Failed to reject"); }
  };

  if (loading) return <div className="text-gray-400 p-8">Loading...</div>;
  if (!data) return <div className="text-gray-400 p-8">Not found.</div>;

  const canApprove = data.consent && data.status !== "APPROVED";
  const surveyEntries = SURVEY_FIELDS.filter((f) => data[f.key]);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/admin/testimonial-submissions" className="p-2 text-gray-400 hover:text-white transition-colors"><ArrowLeft size={20} /></Link>
          <h1 className="text-2xl font-bold text-white">Testimonial Submission</h1>
        </div>
        <button onClick={() => setShowDelete(true)} className="p-2 text-gray-400 hover:text-red-400 transition-colors"><Trash2 size={20} /></button>
      </div>

      <div className="bg-[#1e293b] rounded-2xl border border-gray-700/50 p-6 space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <StatusBadge label={data.status} variant={STATUS_VARIANT[data.status]} />
            <StatusBadge label={data.consent ? "Consent: Yes" : "Consent: No"} variant={data.consent ? "success" : "danger"} />
            <StatusBadge label={data.locale === "ar" ? "Arabic" : "English"} variant="info" />
          </div>
          <span className="text-sm text-gray-400">{new Date(data.createdAt).toLocaleString()}</span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div><label className="text-xs text-gray-500 uppercase">Name</label><p className="text-white">{data.fullName}</p></div>
          <div><label className="text-xs text-gray-500 uppercase">Email (internal)</label><p className="text-white">{data.email}</p></div>
          {data.phone && <div><label className="text-xs text-gray-500 uppercase">Phone (internal)</label><p className="text-white">{data.phone}</p></div>}
          {data.businessName && <div><label className="text-xs text-gray-500 uppercase">Business / Project</label><p className="text-white">{data.businessName}</p></div>}
          {data.governorate && <div><label className="text-xs text-gray-500 uppercase">Governorate</label><p className="text-white">{data.governorate}</p></div>}
          {data.program && <div><label className="text-xs text-gray-500 uppercase">Program</label><p className="text-white">{data.program}</p></div>}
        </div>

        <div>
          <label className="text-xs text-gray-500 uppercase">Quote (for publication)</label>
          <p className="text-gray-200 whitespace-pre-wrap mt-1 text-lg leading-relaxed" dir={data.locale === "ar" ? "rtl" : "ltr"}>
            &ldquo;{data.quote}&rdquo;
          </p>
        </div>

        {data.photoUrl && (
          <div>
            <label className="text-xs text-gray-500 uppercase">Photo</label>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={data.photoUrl} alt={data.fullName} className="mt-2 w-32 h-32 object-cover rounded-xl border border-gray-700/50" />
          </div>
        )}

        {surveyEntries.length > 0 && (
          <div className="border-t border-gray-700/50 pt-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Impact Survey (internal)</h2>
            {surveyEntries.map((f) => (
              <div key={f.key}>
                <label className="text-xs text-gray-500 uppercase">{f.label}</label>
                <p className="text-gray-300 whitespace-pre-wrap mt-1" dir={data.locale === "ar" ? "rtl" : "ltr"}>{String(data[f.key])}</p>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="border-t border-gray-700/50 pt-5 flex items-center gap-3 flex-wrap">
          {canApprove ? (
            <Link
              href={`/admin/testimonials/new?fromSubmission=${data.id}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-blue text-white text-sm font-medium rounded-xl hover:bg-brand-blue/90 transition-colors"
            >
              <CheckCircle2 size={16} /> Approve &amp; Publish
            </Link>
          ) : (
            <span className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-700/40 text-gray-500 text-sm font-medium rounded-xl cursor-not-allowed" title={!data.consent ? "No publish consent" : "Already approved"}>
              <CheckCircle2 size={16} /> Approve &amp; Publish
            </span>
          )}
          {data.status === "PENDING" && (
            <button onClick={() => setShowReject(true)} className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-500/10 text-red-400 text-sm font-medium rounded-xl hover:bg-red-500/20 transition-colors">
              <XCircle size={16} /> Reject
            </button>
          )}
          {!data.consent && <p className="text-xs text-gray-500 w-full">Publishing is disabled — the beneficiary did not consent. The submission remains internal impact data.</p>}
          {data.status === "APPROVED" && data.publishedTestimonialId && (
            <Link href={`/admin/testimonials/${data.publishedTestimonialId}/edit`} className="text-sm text-brand-blue hover:underline">
              View published testimonial →
            </Link>
          )}
        </div>
      </div>

      <AdminModal isOpen={showReject} onClose={() => setShowReject(false)} onConfirm={handleReject}
        title="Reject Submission" message="The submission will be kept as internal impact data but cannot be published." confirmLabel="Reject"
      />
      <AdminModal isOpen={showDelete} onClose={() => setShowDelete(false)}
        onConfirm={async () => {
          try { await adminDelete(`/testimonial-submissions/${id}`); toast.success("Deleted"); router.push("/admin/testimonial-submissions"); }
          catch { toast.error("Failed to delete"); }
        }}
        title="Delete Submission" message="This permanently removes the submission, including its survey data. This cannot be undone." confirmLabel="Delete"
      />
    </div>
  );
}
```

- [ ] **Step 3: Type-check** — `npx tsc --noEmit`, no new errors. (If `AdminDataTable`'s `Column` type or `onView` prop differs, mirror exactly what `contacts/page.tsx` does.)

- [ ] **Step 4: Commit**

```bash
git add "src/app/admin/(dashboard)/testimonial-submissions"
git commit -m "feat: add admin testimonial submissions inbox and detail view"
```

---

### Task 11: Sidebar nav item + unread badge

**Files:**
- Modify: `src/app/admin/components/Sidebar.tsx`

- [ ] **Step 1: Add the nav item**

In the `Submissions` group of `navGroups`, after the "Service Requests" item, add (import `Quote` from lucide-react):

```ts
{ label: "Testimonials Inbox", href: "/admin/testimonial-submissions", icon: Quote },
```

- [ ] **Step 2: Add the unread badge**

There is no existing badge mechanism — add a minimal one. In the `Sidebar` component:

```tsx
import { useState, useEffect } from "react";
import { adminGet } from "@/lib/admin-api";
// inside component:
const [inboxCount, setInboxCount] = useState(0);
useEffect(() => {
  adminGet<{ count: number }>("/testimonial-submissions/unread-count")
    .then((d) => setInboxCount(d.count))
    .catch(() => {});
}, [pathname]); // refetch on navigation so it clears after reading
```

Then in the item render, after `{!collapsed && <span>{item.label}</span>}`:

```tsx
{item.href === "/admin/testimonial-submissions" && inboxCount > 0 && (
  collapsed ? (
    <span className="absolute top-1.5 end-1.5 w-2 h-2 bg-red-500 rounded-full" />
  ) : (
    <span className="ms-auto bg-red-500 text-white text-[11px] font-semibold rounded-full px-2 py-0.5 leading-none">
      {inboxCount}
    </span>
  )
)}
```

For the collapsed dot to position, add `relative` to the `Link`'s className.

- [ ] **Step 3: Verify in browser**

Log into `/admin` (with at least one unread submission in the DB — create one via the public form or curl). Sidebar shows "Testimonials Inbox" with a count badge. Open the submission → navigate elsewhere → badge decrements.

- [ ] **Step 4: Commit**

```bash
git add src/app/admin/components/Sidebar.tsx
git commit -m "feat: add Testimonials Inbox nav item with unread badge"
```

---

### Task 12: Full build + end-to-end manual verification

- [ ] **Step 1: Full production build**

Run: `npm run build`
Expected: build succeeds (warnings about middleware deprecation and lockfiles are pre-existing and fine).

- [ ] **Step 2: Execute the spec §10 manual checklist** (dev server)

Public form:
- [ ] EN locale: full valid submission → success screen; row PENDING in DB; (email only if RESEND_API_KEY set — otherwise console warning is the expected behavior).
- [ ] AR locale: submit → `locale="ar"` stored; RTL layout correct on form and CTA.
- [ ] Missing required field / bad email → inline error, no row.
- [ ] Photo: real JPEG uploads; fake `.jpg` (wrong magic bytes) rejected with image-type error; >5MB rejected client-side.
- [ ] Rate limit: 6th rapid POST via curl → 429.

Admin:
- [ ] Inbox lists the submission; unread dot + sidebar badge; opening marks read and badge clears on next navigation.
- [ ] Reject → REJECTED badge, `reviewedAt` set, Approve hidden/disabled appropriately.
- [ ] Submission with consent=No → Approve disabled with explanation.
- [ ] Approve & Publish on a consented PENDING submission → editor pre-filled; for an AR submission the EN fields are empty and saving is blocked until EN name+quote filled; save → submission APPROVED + linked; testimonial visible at `/en/media/testimonials` and `/ar/media/testimonials`.
- [ ] "View published testimonial →" link works on the approved submission.
- [ ] Delete a submission → gone from list.

- [ ] **Step 3: Clean up all manual-test rows** (submissions AND any test testimonial published during verification) via Prisma Studio (`npm run db:studio`) or node one-liners.

- [ ] **Step 4: Final commit (if any fixups were needed)**

```bash
git add <only-files-this-plan-touched>
git commit -m "fix: testimonial submission polish from end-to-end verification"
```
