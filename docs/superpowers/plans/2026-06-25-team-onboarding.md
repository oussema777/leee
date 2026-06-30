# Team Self-Service Onboarding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let team members self-onboard via a private shareable link; a super-admin reviews each submission and, on approval, it becomes a real TEAM member on the About page.

**Architecture:** Mirror the existing Testimonial Submission feature. Pure, unit-tested logic lives in `src/lib/team/`; route handlers stay thin. A singleton `TeamInviteLink` row holds the active secret token (validated server-side everywhere). Approval runs in a Prisma `$transaction` and is gated to `SUPER_ADMIN`.

**Tech Stack:** Next.js 16 (App Router), React 19, Prisma + PostgreSQL, next-intl (EN/AR), Tailwind, Vitest. Spec: `docs/superpowers/specs/2026-06-25-team-onboarding-design.md`.

**Conventions to follow (read before starting):**
- Mirror admin inbox: `src/app/admin/(dashboard)/testimonial-submissions/` + `src/app/api/admin/testimonial-submissions/[id]/route.ts`.
- Mirror public form/API: `src/app/api/public/testimonials/route.ts`, `src/app/api/public/upload/route.ts`.
- Auth helper: `src/lib/api-utils.ts` (`withAdmin`), session shape in `src/lib/auth.ts` (`{ userId, email, role }`).
- Team rendering: `src/lib/data/members.ts` (`getTeamMembers` → `ShowcaseMember[]`), `src/components/sections/experts/MemberCard.tsx`.
- Tests: Vitest, files as `src/**/*.test.ts`, `import { describe, it, expect } from "vitest"`, `@` alias works.
- Run a single script against prod DB with `node --env-file=.env scripts/<file>.mjs`.

---

### Task 1: Prisma models + migration

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add models near the other submission models** (after `TestimonialSubmission`)

```prisma
model TeamSubmission {
  id           String  @id @default(cuid())
  name         String
  title        String
  locale       String   // "en" | "ar"
  photoUrl     String?
  linkedinUrl  String?
  twitterUrl   String?
  instagramUrl String?
  websiteUrl   String?
  status           TeamSubmissionStatus @default(PENDING)
  approvedMemberId String?
  isRead           Boolean   @default(false)
  reviewedAt       DateTime?
  createdAt        DateTime  @default(now())
}

enum TeamSubmissionStatus {
  PENDING
  APPROVED
  REJECTED
}

model TeamInviteLink {
  id        String   @id            // always "singleton"
  token     String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

- [ ] **Step 2: Create + apply migration**

Run: `npx prisma migrate dev --name team_onboarding`
Expected: migration created and applied; `npx prisma generate` runs automatically.

- [ ] **Step 3: Verify client types exist**

Run: `npx tsc --noEmit -p tsconfig.json 2>&1 | head` (no new errors referencing TeamSubmission).

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations
git commit -m "feat(team): add TeamSubmission + TeamInviteLink models"
```

---

### Task 2: Invite token generator (pure, TDD)

**Files:**
- Create: `src/lib/team/tokens.ts`
- Test: `src/lib/team/tokens.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { generateInviteToken } from "./tokens";

describe("generateInviteToken", () => {
  it("returns a URL-safe string of at least 32 chars", () => {
    const t = generateInviteToken();
    expect(t.length).toBeGreaterThanOrEqual(32);
    expect(t).toMatch(/^[A-Za-z0-9_-]+$/);
  });
  it("returns a different value each call", () => {
    expect(generateInviteToken()).not.toBe(generateInviteToken());
  });
});
```

- [ ] **Step 2: Run test, verify it fails**

Run: `npm test -- src/lib/team/tokens.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement**

```ts
import { randomBytes } from "crypto";

/** 32-byte URL-safe random token (base64url, no padding). */
export function generateInviteToken(): string {
  return randomBytes(32).toString("base64url");
}
```

- [ ] **Step 4: Run test, verify it passes**

Run: `npm test -- src/lib/team/tokens.test.ts` → PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/team/tokens.ts src/lib/team/tokens.test.ts
git commit -m "feat(team): invite token generator with tests"
```

---

### Task 3: Submission validation (pure, TDD)

**Files:**
- Create: `src/lib/team/validation.ts`
- Test: `src/lib/team/validation.test.ts`

Photo-domain rule: accept a `photoUrl` only if it is a relative path on our site OR its host matches `NEXT_PUBLIC_SUPABASE_URL`'s host. Empty/undefined photo is allowed.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { validateSubmission } from "./validation";

const base = { name: "Sara", title: "Partnerships Manager", locale: "en" };

describe("validateSubmission", () => {
  it("accepts a minimal valid submission", () => {
    const r = validateSubmission(base);
    expect(r.ok).toBe(true);
  });
  it("rejects missing name or title", () => {
    expect(validateSubmission({ ...base, name: "  " }).ok).toBe(false);
    expect(validateSubmission({ ...base, title: "" }).ok).toBe(false);
  });
  it("rejects an invalid locale", () => {
    expect(validateSubmission({ ...base, locale: "fr" }).ok).toBe(false);
  });
  it("rejects malformed social URLs", () => {
    expect(validateSubmission({ ...base, linkedinUrl: "not a url" }).ok).toBe(false);
  });
  it("rejects a photoUrl outside our domain", () => {
    // allowedHost passed explicitly — Vitest does NOT load .env, so we never
    // rely on process.env in tests (verified: NEXT_PUBLIC_SUPABASE_URL is
    // undefined under `vitest run`).
    const host = "wqphvlzndbwqgcojipvn.supabase.co";
    expect(validateSubmission({ ...base, photoUrl: "https://evil.com/x.jpg" }, host).ok).toBe(false);
  });
  it("accepts a relative photo path with no allowedHost", () => {
    expect(validateSubmission({ ...base, photoUrl: "/uploads/programs/x.jpg" }, null).ok).toBe(true);
  });
  it("accepts a photoUrl on our supabase bucket", () => {
    const host = "wqphvlzndbwqgcojipvn.supabase.co";
    const url = `https://${host}/storage/v1/object/public/uploads/programs/x.jpg`;
    expect(validateSubmission({ ...base, photoUrl: url }, host).ok).toBe(true);
  });
  it("ignores unknown fields", () => {
    const r = validateSubmission({ ...base, evil: "x" } as any);
    expect(r.ok).toBe(true);
    if (r.ok) expect((r.value as any).evil).toBeUndefined();
  });
});
```

**Critical (verified):** `vitest run` does NOT load `.env`, so `process.env.NEXT_PUBLIC_SUPABASE_URL` is `undefined` in tests. Therefore tests MUST pass `allowedHost` explicitly (second arg) and never read it from env. The `allowedHost` param defaults to the env host for real runtime use, keeping `validateSubmission` pure and testable.

- [ ] **Step 2: Run test, verify it fails**

Run: `npm test -- src/lib/team/validation.test.ts` → FAIL

- [ ] **Step 3: Implement**

```ts
const LOCALES = ["en", "ar"] as const;

export type CleanSubmission = {
  name: string;
  title: string;
  locale: "en" | "ar";
  photoUrl?: string;
  linkedinUrl?: string;
  twitterUrl?: string;
  instagramUrl?: string;
  websiteUrl?: string;
};

type Result =
  | { ok: true; value: CleanSubmission }
  | { ok: false; error: string };

function isValidUrl(v: string): boolean {
  try { new URL(v); return true; } catch { return false; }
}

function supabaseHost(): string | null {
  try { return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").host; }
  catch { return null; }
}

/** Photo must be a relative path on our site, or hosted on our supabase bucket. */
function isOwnPhoto(url: string, allowedHost: string | null): boolean {
  if (url.startsWith("/")) return true;
  try { return !!allowedHost && new URL(url).host === allowedHost; }
  catch { return false; }
}

export function validateSubmission(
  input: Record<string, unknown>,
  allowedHost: string | null = supabaseHost()
): Result {
  const name = String(input.name ?? "").trim();
  const title = String(input.title ?? "").trim();
  const locale = String(input.locale ?? "");
  if (!name) return { ok: false, error: "Name is required" };
  if (!title) return { ok: false, error: "Role/title is required" };
  if (!LOCALES.includes(locale as any)) return { ok: false, error: "Invalid locale" };

  const socials: Record<string, string | undefined> = {};
  for (const key of ["linkedinUrl", "twitterUrl", "instagramUrl", "websiteUrl"] as const) {
    const raw = input[key];
    if (raw == null || raw === "") continue;
    const s = String(raw).trim();
    if (!isValidUrl(s)) return { ok: false, error: `Invalid ${key}` };
    socials[key] = s;
  }

  let photoUrl: string | undefined;
  if (input.photoUrl != null && input.photoUrl !== "") {
    const p = String(input.photoUrl).trim();
    if (!isOwnPhoto(p, allowedHost)) return { ok: false, error: "Invalid photo URL" };
    photoUrl = p;
  }

  return {
    ok: true,
    value: { name, title, locale: locale as "en" | "ar", photoUrl, ...socials },
  };
}
```

- [ ] **Step 4: Run test, verify it passes** → `npm test -- src/lib/team/validation.test.ts` PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/team/validation.ts src/lib/team/validation.test.ts
git commit -m "feat(team): submission validation with tests"
```

---

### Task 4: Submission → BoardMember mapping (pure, TDD)

**Files:**
- Create: `src/lib/team/mapping.ts`
- Test: `src/lib/team/mapping.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { buildBoardMemberData } from "./mapping";

const sub = {
  name: "Sara", title: "Partnerships Manager", locale: "en" as const,
  photoUrl: "/img/sara.jpg", linkedinUrl: "https://linkedin.com/in/sara",
  twitterUrl: null, instagramUrl: null, websiteUrl: null,
};

describe("buildBoardMemberData", () => {
  it("submitted EN + admin AR fills both languages", () => {
    const d = buildBoardMemberData(sub, { name: "سارة", title: "مديرة الشراكات" }, 5);
    expect(d).toMatchObject({
      nameEn: "Sara", nameAr: "سارة",
      titleEn: "Partnerships Manager", titleAr: "مديرة الشراكات",
      imageUrl: "/img/sara.jpg", linkedinUrl: "https://linkedin.com/in/sara",
      memberType: "TEAM", isActive: true, order: 6,
    });
  });
  it("submitted AR + admin EN mirrors correctly", () => {
    const arSub = { ...sub, name: "سارة", title: "مديرة الشراكات", locale: "ar" as const };
    const d = buildBoardMemberData(arSub, { name: "Sara", title: "Partnerships Manager" }, 0);
    expect(d).toMatchObject({ nameEn: "Sara", nameAr: "سارة", order: 1 });
  });
  it("blank second language leaves the other side empty (render falls back)", () => {
    const d = buildBoardMemberData(sub, { name: "", title: "" }, 0);
    expect(d.nameAr).toBe("");
    expect(d.nameEn).toBe("Sara");
  });
});
```

- [ ] **Step 2: Run test, verify it fails** → FAIL

- [ ] **Step 3: Implement**

```ts
import type { CleanSubmission } from "./validation";

type SecondLang = { name: string; title: string };
type SubmissionLike = CleanSubmission & {
  twitterUrl?: string | null; instagramUrl?: string | null;
  websiteUrl?: string | null; linkedinUrl?: string | null;
};

export function buildBoardMemberData(
  submission: SubmissionLike,
  secondLang: SecondLang,
  maxTeamOrder: number
) {
  const en = submission.locale === "en"
    ? { name: submission.name, title: submission.title }
    : { name: secondLang.name, title: secondLang.title };
  const ar = submission.locale === "ar"
    ? { name: submission.name, title: submission.title }
    : { name: secondLang.name, title: secondLang.title };

  return {
    nameEn: en.name, nameAr: ar.name,
    titleEn: en.title, titleAr: ar.title,
    imageUrl: submission.photoUrl ?? null,
    linkedinUrl: submission.linkedinUrl ?? null,
    twitterUrl: submission.twitterUrl ?? null,
    instagramUrl: submission.instagramUrl ?? null,
    websiteUrl: submission.websiteUrl ?? null,
    memberType: "TEAM" as const,
    isActive: true,
    order: maxTeamOrder + 1,
  };
}
```

- [ ] **Step 4: Run test, verify it passes** → PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/team/mapping.ts src/lib/team/mapping.test.ts
git commit -m "feat(team): submission->BoardMember mapping with tests"
```

---

### Task 5: Invite link DB helpers (singleton)

**Files:**
- Create: `src/lib/team/inviteLink.ts`

- [ ] **Step 1: Implement singleton helpers**

```ts
import { db } from "@/lib/db";
import { generateInviteToken } from "./tokens";

const SINGLETON_ID = "singleton";

/** Returns the active link, creating it lazily on first call. */
export async function getOrCreateInviteLink() {
  return db.teamInviteLink.upsert({
    where: { id: SINGLETON_ID },
    update: {},
    create: { id: SINGLETON_ID, token: generateInviteToken() },
  });
}

/** Overwrites the token, invalidating any previously shared link. */
export async function regenerateInviteLink() {
  return db.teamInviteLink.upsert({
    where: { id: SINGLETON_ID },
    update: { token: generateInviteToken() },
    create: { id: SINGLETON_ID, token: generateInviteToken() },
  });
}

/** True if the provided token matches the single active link. */
export async function isValidInviteToken(token: string): Promise<boolean> {
  if (!token) return false;
  const row = await db.teamInviteLink.findUnique({ where: { id: SINGLETON_ID } });
  return !!row && row.token === token;
}

export function buildInviteUrl(locale: string, token: string): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  return `${base}/${locale}/join-team/${token}`;
}
```

- [ ] **Step 2: Typecheck** → `npx tsc --noEmit | head` (no new errors)

- [ ] **Step 3: Commit**

```bash
git add src/lib/team/inviteLink.ts
git commit -m "feat(team): singleton invite-link DB helpers"
```

---

### Task 6: Super-admin auth helper

**Files:**
- Modify: `src/lib/api-utils.ts`

- [ ] **Step 1: Add `withSuperAdmin` after `withAdmin`**

```ts
// Authenticate AND require SUPER_ADMIN role
export async function withSuperAdmin(request: NextRequest) {
  const auth = await withAdmin(request);
  if ("error" in auth) return auth;
  if (auth.session.role !== "SUPER_ADMIN") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return auth;
}
```

- [ ] **Step 2: Typecheck** → no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/api-utils.ts
git commit -m "feat(team): withSuperAdmin auth guard"
```

---

### Task 7: Public submission API

**Files:**
- Create: `src/app/api/public/team-submissions/route.ts`

- [ ] **Step 1: Implement** (mirror `src/app/api/public/testimonials/route.ts` for shape)

```ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isValidInviteToken } from "@/lib/team/inviteLink";
import { validateSubmission } from "@/lib/team/validation";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const token = String(body.token ?? "");
    if (!(await isValidInviteToken(token))) {
      return NextResponse.json({ error: "Invalid or expired link" }, { status: 403 });
    }
    const result = validateSubmission(body);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    await db.teamSubmission.create({ data: { ...result.value, status: "PENDING" } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Submission failed" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Manual check** — with the dev server running, generate a token (Task 9 panel) and POST a valid body; confirm a `PENDING` row is created and a bad token returns 403. (Until Task 9 exists, temporarily create a link row via `node --env-file=.env` calling `getOrCreateInviteLink`.)

- [ ] **Step 3: Commit**

```bash
git add src/app/api/public/team-submissions/route.ts
git commit -m "feat(team): public submission API with server-side token + validation"
```

---

### Task 8: Public join-team page + form + i18n

**Files:**
- Create: `src/app/[locale]/join-team/[token]/page.tsx`
- Create: `src/components/sections/join-team/JoinTeamForm.tsx`
- Modify: `messages/en.json`, `messages/ar.json` (add `joinTeam` namespace)

- [ ] **Step 1: Add i18n strings** under a new `"joinTeam"` key in both files (title, intro, fields: name, role, photo, linkedin, x, instagram, website, submit, success, inactiveTitle, inactiveBody). Keep EN + AR parallel.

- [ ] **Step 2: Page (server component) — token gate + noindex**

```tsx
import type { Metadata } from "next";
import { isValidInviteToken } from "@/lib/team/inviteLink";
import { JoinTeamForm } from "@/components/sections/join-team/JoinTeamForm";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function JoinTeamPage({
  params,
}: { params: Promise<{ locale: string; token: string }> }) {
  const { locale, token } = await params;
  const t = await getTranslations({ locale, namespace: "joinTeam" });
  const valid = await isValidInviteToken(token);
  if (!valid) {
    return (
      <main className="max-w-xl mx-auto px-6 py-24 text-center">
        <h1 className="font-serif text-2xl mb-3">{t("inactiveTitle")}</h1>
        <p className="text-text-secondary">{t("inactiveBody")}</p>
      </main>
    );
  }
  return <JoinTeamForm locale={locale} token={token} />;
}
```

- [ ] **Step 3: Client form** — fields per spec; reuse `ImageUploader` (`src/app/admin/components/ImageUploader.tsx`) **only if it works outside admin**; otherwise post the file to `/api/public/upload` directly. Submit posts `{ token, name, title, locale, ...socials, photoUrl }` to `/api/public/team-submissions`. On success show the `success` string. (Model markup on an existing public form, e.g. `src/components/forms/JoinUsForm.tsx`.)

- [ ] **Step 4: Manual verify** — visit `/en/join-team/<valid-token>` (form shows) and `/en/join-team/wrong` (inactive state); submit and confirm a row appears.

- [ ] **Step 5: Commit**

```bash
git add "src/app/[locale]/join-team" src/components/sections/join-team messages/en.json messages/ar.json
git commit -m "feat(team): public join-team page, form, and i18n"
```

---

### Task 9: Admin invite-link API + copy panel

**Files:**
- Create: `src/app/api/admin/team-invite-link/route.ts` (GET)
- Create: `src/app/api/admin/team-invite-link/regenerate/route.ts` (POST)
- Create: `src/components/admin/TeamInviteLinkPanel.tsx`
- Modify: `src/app/admin/(dashboard)/members/page.tsx` (render the panel)

- [ ] **Step 1: GET route** (super-admin only)

```ts
import { NextRequest, NextResponse } from "next/server";
import { withSuperAdmin } from "@/lib/api-utils";
import { getOrCreateInviteLink, buildInviteUrl } from "@/lib/team/inviteLink";

export async function GET(request: NextRequest) {
  const auth = await withSuperAdmin(request);
  if ("error" in auth) return auth.error;
  const link = await getOrCreateInviteLink();
  return NextResponse.json({ token: link.token, url: buildInviteUrl("en", link.token) });
}
```

- [ ] **Step 2: regenerate route** — same guard, calls `regenerateInviteLink()`, returns new `{ token, url }`.

- [ ] **Step 3: Panel component** — fetches `/api/admin/team-invite-link`, shows the URL read-only, a **Copy** button (`navigator.clipboard.writeText`), and a **Regenerate** button (confirm dialog → POST regenerate → refresh shown URL). Render it on the members admin page, but only when the panel's GET succeeds (non-super-admins get 403 and the panel hides itself).

- [ ] **Step 4: Manual verify** — as super-admin the panel shows a link and copy works; regenerate changes it. As a regular admin (`admin@theleeexperience.com`) the endpoints 403 and the panel is hidden.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/admin/team-invite-link src/components/admin/TeamInviteLinkPanel.tsx "src/app/admin/(dashboard)/members/page.tsx"
git commit -m "feat(team): admin invite-link API + copy/regenerate panel"
```

---

### Task 10: Admin submissions inbox (list) + sidebar

**Files:**
- Create: `src/app/api/admin/team-submissions/route.ts` (GET list)
- Create: `src/app/api/admin/team-submissions/[id]/route.ts` (GET one; PATCH isRead)
- Create: `src/app/admin/(dashboard)/team-submissions/page.tsx`
- Modify: `src/app/admin/components/Sidebar.tsx`

- [ ] **Step 1: List + detail GET routes** — gate with `withSuperAdmin`; mirror `src/app/api/admin/testimonial-submissions`. List supports status filter; detail marks `isRead=true`.

- [ ] **Step 2: List page** — mirror `testimonial-submissions/page.tsx`: table of submissions (photo thumb, name, title, locale, status, submitted date), filter by status, link to detail.

- [ ] **Step 3: Sidebar** — add a "Team Submissions" item linking `/admin/team-submissions`, rendered only when the session role is `SUPER_ADMIN`. **Wiring note (verified):** `Sidebar.tsx` and the dashboard `layout.tsx` are both client components with no direct access to the JWT session, so you canNOT pass the role as a layout prop. Instead fetch the role client-side the same way the sidebar already fetches `adminGet("/testimonial-submissions/unread-count")` — add a small `GET /api/admin/me` (or reuse an existing session endpoint if present) that returns `{ role }`, and hide the item unless `role === "SUPER_ADMIN"`. This nav gate is cosmetic only — every endpoint is independently enforced by `withSuperAdmin`, so security never depends on the sidebar.

- [ ] **Step 4: Manual verify** — super-admin sees the inbox + nav item; regular admin does not (403 on API, nav item hidden).

- [ ] **Step 5: Commit**

```bash
git add src/app/api/admin/team-submissions "src/app/admin/(dashboard)/team-submissions/page.tsx" src/app/admin/components/Sidebar.tsx
git commit -m "feat(team): super-admin submissions inbox + sidebar entry"
```

---

### Task 11: Approve / reject (transactional, idempotent)

**Files:**
- Create: `src/app/api/admin/team-submissions/[id]/approve/route.ts`
- Create: `src/app/api/admin/team-submissions/[id]/reject/route.ts`
- Create: `src/app/admin/(dashboard)/team-submissions/[id]/page.tsx` (review UI)

- [ ] **Step 1: Approve route** — super-admin only; transactional; idempotent via status re-check.

```ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withSuperAdmin } from "@/lib/api-utils";
import { buildBoardMemberData } from "@/lib/team/mapping";

export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const auth = await withSuperAdmin(request);
  if ("error" in auth) return auth.error;
  const { id } = await ctx.params;
  const body = await request.json(); // { secondName, secondTitle, ...optional edited fields }

  try {
    const member = await db.$transaction(async (tx) => {
      const sub = await tx.teamSubmission.findUnique({ where: { id } });
      if (!sub) throw new NotFound();
      if (sub.status !== "PENDING") throw new Conflict();
      const maxOrder = (await tx.boardMember.aggregate({
        where: { memberType: "TEAM" }, _max: { order: true },
      }))._max.order ?? 0;
      const data = buildBoardMemberData(
        sub as any,
        { name: String(body.secondName ?? ""), title: String(body.secondTitle ?? "") },
        maxOrder
      );
      const created = await tx.boardMember.create({ data });
      await tx.teamSubmission.update({
        where: { id },
        data: { status: "APPROVED", approvedMemberId: created.id, reviewedAt: new Date() },
      });
      return created;
    });
    return NextResponse.json({ ok: true, memberId: member.id });
  } catch (e) {
    if (e instanceof Conflict) return NextResponse.json({ error: "Already processed" }, { status: 409 });
    if (e instanceof NotFound) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ error: "Approve failed" }, { status: 500 });
  }
}
class Conflict extends Error {}
class NotFound extends Error {}
```

- [ ] **Step 2: Reject route** — super-admin only; re-check `PENDING`, set `REJECTED` + `reviewedAt`; return 409 if not pending.

- [ ] **Step 3: Review page** — shows submitted values (with photo + socials), pre-fills the submitted language, asks for the opposite-language name/title, and has Approve / Reject buttons calling the routes. On approve success, redirect to the inbox.

- [ ] **Step 4: Manual verify (end-to-end):** submit via the public form → appears in inbox → open → fill second language → Approve → confirm a TEAM `BoardMember` is created and the person shows on `/en/about` (and `/ar/about`). Approve again → 409. Reject a fresh one → no member, status REJECTED.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/admin/team-submissions "src/app/admin/(dashboard)/team-submissions/[id]/page.tsx"
git commit -m "feat(team): transactional approve/reject + review UI"
```

---

### Task 12: Remove dead static mock data

**Files:**
- Modify: `src/components/sections/about/aboutData.ts`

- [ ] **Step 1: Delete** the unused `teamMembers` array and the `TeamMember` type. First confirm nothing imports them:

Run: `rg "teamMembers|TeamMember" src` — expect only the definitions in `aboutData.ts` (no imports).

- [ ] **Step 2: Typecheck + build** → `npx tsc --noEmit | head` and `npm run build` (or dev compile) succeed.

- [ ] **Step 3: Commit**

```bash
git add src/components/sections/about/aboutData.ts
git commit -m "chore(team): remove dead static team mock data"
```

---

### Task 13: Verification + placeholder removal (prod data)

**Files:**
- Create (temp): `scripts/remove-placeholder-team.mjs`

- [ ] **Step 1: Full test + build**

Run: `npm test` → all pass. Run: `npm run build` → succeeds.

- [ ] **Step 2: Write the placeholder-removal script** (run only AFTER the feature is verified and at least the real flow works). It deletes the 6 placeholder TEAM `BoardMember` rows by their known names, prints a dry-run first.

```js
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
const NAMES = ["Rana", "Karim", "Nour", "Ahmad", "Lama", "Sara"];
const rows = await db.boardMember.findMany({
  where: { memberType: "TEAM", nameEn: { in: NAMES } },
  select: { id: true, nameEn: true, titleEn: true },
});
console.log(`Matched ${rows.length} placeholder rows:`);
for (const r of rows) console.log(`  • ${r.nameEn} — ${r.titleEn}`);
if (process.argv.includes("--apply")) {
  const res = await db.boardMember.deleteMany({ where: { id: { in: rows.map(r => r.id) } } });
  console.log(`Deleted ${res.count}.`);
} else {
  console.log("Dry run. Re-run with --apply to delete.");
}
await db.$disconnect();
```

- [ ] **Step 3: Dry run, confirm exactly the 6 placeholders**

Run: `node --env-file=.env scripts/remove-placeholder-team.mjs`
Expected: lists exactly Rana, Karim, Nour, Ahmad, Lama, Sara (and nothing else). **If the count is not 6 or includes a real member, STOP and review.**

- [ ] **Step 4: Apply** (stakeholder go-ahead) → `node --env-file=.env scripts/remove-placeholder-team.mjs --apply`, then delete the script.

- [ ] **Step 5: Final manual check** — `/en/about` Team section hides while empty, then shows real approved members. Commit any remaining changes.

```bash
git add -A
git commit -m "chore(team): remove placeholder team members + final verification"
```

---

## Done criteria
- A super-admin can copy/regenerate the invite link from the members admin page.
- A team member with the link submits name/role/photo/socials (no login); it lands as PENDING.
- Only super-admins see the inbox and can approve/reject; regular admins get 403.
- Approving creates a TEAM member (both languages) shown on `/en/about` and `/ar/about`.
- All Vitest unit tests pass; `npm run build` succeeds.
- The 6 placeholders (DB rows + dead static array) are gone.
