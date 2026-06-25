# Internal Newsletter Tool — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an internal newsletter tool in the `/admin` dashboard where the LEEE team manages CSV-imported contacts, pastes AI-generated HTML, tests it, sends it to tagged groups via Resend (duplicate-safe and resumable at scale), and reviews per-campaign stats.

**Architecture:** Five new Prisma models (`Contact`, `Suppression`, `Campaign`, `CampaignRecipient`, `CampaignEvent`). Postgres is the source of truth. "Send" *enqueues* a per-recipient ledger; a **Vercel Cron drainer** sends it in throttled, fixed batches with a single-flight advisory lock + stable-batch idempotency key, so a crash/timeout never double-sends or loses a recipient. Open/click/bounce/complaint tracking arrives via Resend webhooks; unsubscribe is our own tokenized endpoint. Pure logic (CSV, suppression, recipient resolution, idempotency, tokens, aggregation) is unit-tested with Vitest; screens follow existing admin patterns and are tested manually.

**Tech Stack:** Next.js 16 (App Router), React 19, Prisma + Postgres (Supabase), Resend, next-intl (EN/AR), Vitest (new), Vercel Cron.

**Spec:** `docs/superpowers/specs/2026-04-15-...` → this plan implements `docs/superpowers/specs/2026-06-25-internal-newsletter-tool-design.md`.

---

## Conventions discovered in this codebase (read before starting)

- **Prisma client:** `import { db } from "@/lib/db"`. Models accessed as `db.contact.*`.
- **Schema:** `prisma/schema.prisma`. IDs are `@id @default(cuid())`. Enums are `UPPER_SNAKE_CASE` at schema root. Array fields use `String[]`. Timestamps: `createdAt DateTime @default(now())`, `updatedAt DateTime @updatedAt`. **No migration files** — apply with `npm run db:push`.
- **Admin API auth:** every handler starts with `const auth = await withAdmin(request); if ("error" in auth) return auth.error;` from `@/lib/api-utils`. Helpers there: `getPaginationParams`, `paginatedResponse`, `errorResponse`.
- **Admin API location:** `src/app/api/admin/<resource>/route.ts` (+ `[id]/route.ts`). Public (no-auth) API: `src/app/api/public/<resource>/route.ts`.
- **Admin screens:** `src/app/admin/(dashboard)/<section>/page.tsx` (English-only, no locale). Mirror `blog/page.tsx`. Shared components: `AdminPageHeader`, `AdminDataTable`, `AdminFormPage`, `AdminFormField`, `AdminToast`, `BilingualTabs`. Client fetch helpers: `adminGet/adminPost/adminPut/adminDelete/adminPatch` from `@/lib/admin-api`, with `PaginatedResponse<T>`.
- **Sidebar nav:** hard-coded `navGroups` in `src/app/admin/components/Sidebar.tsx` — add the Newsletter section here.
- **Email:** `src/lib/email.ts` wraps Resend. Env: `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_TO`.
- **Public localized pages:** `src/app/[locale]/...`, `getTranslations({ locale, namespace })`, messages in `messages/{en,ar}.json`. RTL is driven by `locale === "ar"`.
- **Existing `NewsletterSubscriber` model** is the *public website signup* table — separate from this tool. Do **not** repurpose it; this tool's list is `Contact`. (A later, out-of-scope task could feed website signups into `Contact`.)

**New code lives under `src/lib/newsletter/` (pure logic) and the route/screen paths above.** Keep pure logic free of `db`/Next imports so it is unit-testable.

---

## Phase 0 — Foundation (test runner, schema, env)

### Task 0.1: Install and configure Vitest

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `src/lib/newsletter/__tests__/smoke.test.ts`

- [ ] **Step 1: Install Vitest**

Run: `npm install -D vitest`

- [ ] **Step 2: Create `vitest.config.ts`**

```typescript
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
```

- [ ] **Step 3: Add test script to `package.json`**

In `"scripts"`, add: `"test": "vitest run"` and `"test:watch": "vitest"`.

- [ ] **Step 4: Write a smoke test**

```typescript
// src/lib/newsletter/__tests__/smoke.test.ts
import { describe, it, expect } from "vitest";

describe("vitest setup", () => {
  it("runs", () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 5: Run it**

Run: `npm test`
Expected: PASS (1 test passed).

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json vitest.config.ts src/lib/newsletter/__tests__/smoke.test.ts
git commit -m "chore: add Vitest for newsletter core-logic tests"
```

### Task 0.2: Add Prisma models and enums

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Append enums and models** to `prisma/schema.prisma`

```prisma
enum ContactStatus {
  SUBSCRIBED
  UNSUBSCRIBED
  BOUNCED
  COMPLAINED
}

enum SuppressionReason {
  UNSUBSCRIBED
  HARD_BOUNCE
  COMPLAINED
}

enum CampaignLocale {
  EN
  AR
}

enum CampaignStatus {
  DRAFT
  SENDING
  SENT
  FAILED
}

enum RecipientStatus {
  PENDING
  SENT
  FAILED
}

enum CampaignEventType {
  DELIVERED
  OPENED
  CLICKED
  BOUNCED
  COMPLAINED
  UNSUBSCRIBED // written by our own unsubscribe endpoint (not a Resend webhook), for per-campaign attribution
}

model Contact {
  id        String        @id @default(cuid())
  email     String        @unique
  name      String?
  tags      String[]
  status    ContactStatus @default(SUBSCRIBED)
  deletedAt DateTime?
  createdAt DateTime      @default(now())
  updatedAt DateTime      @updatedAt
}

model Suppression {
  id        String            @id @default(cuid())
  email     String            @unique
  reason    SuppressionReason
  createdAt DateTime          @default(now())
}

model Campaign {
  id             String              @id @default(cuid())
  subject        String
  html           String              @db.Text
  locale         CampaignLocale      @default(EN)
  targetTags     String[]
  recipientCount Int                 @default(0)
  status         CampaignStatus      @default(DRAFT)
  lastTestedAt   DateTime?
  enqueuedAt     DateTime?
  sentAt         DateTime?
  createdAt      DateTime            @default(now())
  recipients     CampaignRecipient[]
  events         CampaignEvent[]
}

model CampaignRecipient {
  id                String          @id @default(cuid())
  campaignId        String
  campaign          Campaign        @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  email             String
  name              String?
  unsubToken        String          @unique
  batchIndex        Int
  status            RecipientStatus @default(PENDING)
  attempts          Int             @default(0)
  error             String?
  providerMessageId String?
  sentAt            DateTime?
  createdAt         DateTime        @default(now())

  @@unique([campaignId, email])
  @@index([campaignId, status])
}

model CampaignEvent {
  id              String            @id @default(cuid())
  campaignId      String
  campaign        Campaign          @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  type            CampaignEventType
  email           String
  providerEventId String?           @unique
  occurredAt      DateTime
  createdAt       DateTime          @default(now())

  @@index([campaignId, type])
}
```

- [ ] **Step 2: Push schema to the database**

Run: `npm run db:push`
Expected: "Your database is now in sync with your Prisma schema." and the Prisma client regenerates.

- [ ] **Step 3: Verify the client typechecks**

Run: `npx tsc --noEmit`
Expected: no new errors referencing the new models.

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat: add newsletter Prisma models (Contact, Suppression, Campaign, CampaignRecipient, CampaignEvent)"
```

### Task 0.3: Add environment variables

**Files:**
- Modify: `.env.example`
- Modify: `.env` / `.env.local` (locally, not committed)

- [ ] **Step 1: Document new env vars in `.env.example`**

```
# Newsletter tool
NEWSLETTER_FROM="The LEE Experience <newsletter@theleeexperience.com>"
NEWSLETTER_REPLY_TO="info@theleeexperience.com"
NEWSLETTER_UNSUB_SECRET=""      # HMAC secret for unsubscribe tokens (generate a random 32+ char string)
RESEND_WEBHOOK_SECRET=""        # Resend webhook signing secret
CRON_SECRET=""                  # shared secret to authorize the Vercel Cron drainer
NEWSLETTER_BATCH_SIZE="100"     # recipients per Resend batch call (confirm Resend's cap)
```

- [ ] **Step 2: Set real values in `.env.local`** (do not commit). Generate secrets with `openssl rand -hex 32` (or any random 32-byte hex).

- [ ] **Step 3: Commit the example only**

```bash
git add .env.example
git commit -m "chore: document newsletter env vars"
```

---

## Phase 1 — Contacts & CSV import (independently shippable)

### Task 1.1: CSV parsing + validation (pure, TDD)

**Files:**
- Create: `src/lib/newsletter/csv.ts`
- Test: `src/lib/newsletter/csv.test.ts`

Parses raw CSV text into normalized rows and an import report. Columns: `email`, `name`, `tags` (tags separated by `;` within the cell). No DB here.

- [ ] **Step 1: Write failing tests**

```typescript
// src/lib/newsletter/csv.test.ts
import { describe, it, expect } from "vitest";
import { parseContactsCsv } from "./csv";

describe("parseContactsCsv", () => {
  it("parses valid rows, lowercases + trims email, splits tags", () => {
    const csv = "email,name,tags\n  Alice@LEEE.com ,Alice,EN;partners\n";
    const r = parseContactsCsv(csv);
    expect(r.valid).toEqual([
      { email: "alice@leee.com", name: "Alice", tags: ["EN", "partners"] },
    ]);
    expect(r.invalid).toBe(0);
    expect(r.duplicates).toBe(0);
  });

  it("drops invalid and empty emails, counting them", () => {
    const csv = "email,name,tags\nnotanemail,Bob,EN\n,Empty,EN\ngood@x.com,Good,";
    const r = parseContactsCsv(csv);
    expect(r.valid.map((v) => v.email)).toEqual(["good@x.com"]);
    expect(r.invalid).toBe(2);
  });

  it("dedupes within the file by email (first wins), counting duplicates", () => {
    const csv = "email,name,tags\na@x.com,A1,EN\na@x.com,A2,AR";
    const r = parseContactsCsv(csv);
    expect(r.valid).toHaveLength(1);
    expect(r.valid[0].name).toBe("A1");
    expect(r.duplicates).toBe(1);
  });

  it("handles missing optional name and tags", () => {
    const csv = "email,name,tags\nc@x.com,,";
    const r = parseContactsCsv(csv);
    expect(r.valid[0]).toEqual({ email: "c@x.com", name: null, tags: [] });
  });

  it("rejects a file with no email column", () => {
    expect(() => parseContactsCsv("foo,bar\n1,2")).toThrow(/email column/i);
  });
});
```

- [ ] **Step 2: Run tests — verify they fail**

Run: `npx vitest run src/lib/newsletter/csv.test.ts`
Expected: FAIL ("parseContactsCsv is not a function" / module not found).

- [ ] **Step 3: Implement `csv.ts`**

```typescript
// src/lib/newsletter/csv.ts
export interface ParsedContact {
  email: string;
  name: string | null;
  tags: string[];
}

export interface CsvImportResult {
  valid: ParsedContact[];
  invalid: number;
  duplicates: number;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Minimal CSV: handles quoted fields and embedded commas. No external dep.
function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') inQuotes = false;
      else cur += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ",") { out.push(cur); cur = ""; }
    else cur += ch;
  }
  out.push(cur);
  return out;
}

export function parseContactsCsv(raw: string): CsvImportResult {
  const lines = raw.replace(/\r\n/g, "\n").split("\n").filter((l) => l.trim() !== "");
  if (lines.length === 0) throw new Error("Empty CSV");

  const header = splitCsvLine(lines[0]).map((h) => h.trim().toLowerCase());
  const emailIdx = header.indexOf("email");
  if (emailIdx === -1) throw new Error("CSV must have an 'email' column");
  const nameIdx = header.indexOf("name");
  const tagsIdx = header.indexOf("tags");

  const valid: ParsedContact[] = [];
  const seen = new Set<string>();
  let invalid = 0;
  let duplicates = 0;

  for (let i = 1; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i]);
    const email = (cols[emailIdx] || "").trim().toLowerCase();
    if (!EMAIL_RE.test(email)) { invalid++; continue; }
    if (seen.has(email)) { duplicates++; continue; }
    seen.add(email);
    const name = nameIdx >= 0 ? (cols[nameIdx] || "").trim() : "";
    const tagsRaw = tagsIdx >= 0 ? (cols[tagsIdx] || "") : "";
    const tags = tagsRaw.split(";").map((t) => t.trim()).filter(Boolean);
    valid.push({ email, name: name || null, tags });
  }

  return { valid, invalid, duplicates };
}
```

- [ ] **Step 4: Run tests — verify they pass**

Run: `npx vitest run src/lib/newsletter/csv.test.ts`
Expected: PASS (all 5).

- [ ] **Step 5: Commit**

```bash
git add src/lib/newsletter/csv.ts src/lib/newsletter/csv.test.ts
git commit -m "feat: CSV contact parser with dedupe + validation"
```

### Task 1.2: Import + suppression reconciliation (pure, TDD)

**Files:**
- Create: `src/lib/newsletter/import.ts`
- Test: `src/lib/newsletter/import.test.ts`

Given parsed rows and the set of suppressed emails, decide what to upsert as `SUBSCRIBED` vs keep suppressed. Pure function returning an action plan + counts; the API route applies it.

- [ ] **Step 1: Write failing tests**

```typescript
// src/lib/newsletter/import.test.ts
import { describe, it, expect } from "vitest";
import { planImport } from "./import";

const rows = [
  { email: "a@x.com", name: "A", tags: ["EN"] },
  { email: "sup@x.com", name: "S", tags: ["EN"] },
];

describe("planImport", () => {
  it("upserts non-suppressed rows as subscribed", () => {
    const plan = planImport(rows, new Set());
    expect(plan.toUpsert.map((r) => r.email)).toEqual(["a@x.com", "sup@x.com"]);
    expect(plan.suppressedKeptOff).toBe(0);
  });

  it("never re-subscribes a suppressed email", () => {
    const plan = planImport(rows, new Set(["sup@x.com"]));
    expect(plan.toUpsert.map((r) => r.email)).toEqual(["a@x.com"]);
    expect(plan.suppressedKeptOff).toBe(1);
  });
});
```

- [ ] **Step 2: Run — verify fail.** `npx vitest run src/lib/newsletter/import.test.ts` → FAIL.

- [ ] **Step 3: Implement `import.ts`**

```typescript
// src/lib/newsletter/import.ts
import type { ParsedContact } from "./csv";

export interface ImportPlan {
  toUpsert: ParsedContact[];
  suppressedKeptOff: number;
}

export function planImport(rows: ParsedContact[], suppressed: Set<string>): ImportPlan {
  const toUpsert: ParsedContact[] = [];
  let suppressedKeptOff = 0;
  for (const r of rows) {
    if (suppressed.has(r.email)) { suppressedKeptOff++; continue; }
    toUpsert.push(r);
  }
  return { toUpsert, suppressedKeptOff };
}
```

- [ ] **Step 4: Run — verify pass.** Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/newsletter/import.ts src/lib/newsletter/import.test.ts
git commit -m "feat: import planner that respects the suppression list"
```

### Task 1.3: Contacts API — import, list, soft-delete

**Files:**
- Create: `src/app/api/admin/newsletter/contacts/route.ts` (GET list, POST import)
- Create: `src/app/api/admin/newsletter/contacts/[id]/route.ts` (DELETE soft-delete)

Mirror `src/app/api/admin/blog/route.ts` for auth/pagination/error shape. Import accepts `{ csv: string }` in the JSON body.

- [ ] **Step 1: Implement the list + import route**

```typescript
// src/app/api/admin/newsletter/contacts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withAdmin, getPaginationParams, paginatedResponse, errorResponse } from "@/lib/api-utils";
import { parseContactsCsv } from "@/lib/newsletter/csv";
import { planImport } from "@/lib/newsletter/import";

export async function GET(request: NextRequest) {
  const auth = await withAdmin(request);
  if ("error" in auth) return auth.error;
  try {
    const { page, limit, search, skip } = getPaginationParams(request);
    const tag = new URL(request.url).searchParams.get("tag") || "";
    const where: Record<string, unknown> = { deletedAt: null };
    if (search) where.email = { contains: search, mode: "insensitive" };
    if (tag) where.tags = { has: tag };
    const [data, total] = await Promise.all([
      db.contact.findMany({ where, orderBy: { createdAt: "desc" }, skip, take: limit }),
      db.contact.count({ where }),
    ]);
    return paginatedResponse(data, total, page, limit);
  } catch {
    return errorResponse("Failed to fetch contacts");
  }
}

export async function POST(request: NextRequest) {
  const auth = await withAdmin(request);
  if ("error" in auth) return auth.error;
  try {
    const { csv } = await request.json();
    if (typeof csv !== "string" || !csv.trim()) return errorResponse("Missing CSV", 400);

    let parsed;
    try { parsed = parseContactsCsv(csv); }
    catch (e) { return errorResponse((e as Error).message, 400); }

    const suppressedRows = await db.suppression.findMany({ select: { email: true } });
    const suppressed = new Set(suppressedRows.map((s) => s.email));
    const plan = planImport(parsed.valid, suppressed);

    let added = 0;
    for (const r of plan.toUpsert) {
      await db.contact.upsert({
        where: { email: r.email },
        update: { name: r.name, tags: r.tags, deletedAt: null },
        create: { email: r.email, name: r.name, tags: r.tags },
      });
      added++;
    }

    return NextResponse.json({
      added,
      duplicates: parsed.duplicates,
      invalid: parsed.invalid,
      suppressedKeptOff: plan.suppressedKeptOff,
    });
  } catch {
    return errorResponse("Failed to import contacts");
  }
}
```

- [ ] **Step 2: Implement soft-delete route**

```typescript
// src/app/api/admin/newsletter/contacts/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withAdmin, errorResponse } from "@/lib/api-utils";

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await withAdmin(request);
  if ("error" in auth) return auth.error;
  const { id } = await params;
  try {
    await db.contact.update({ where: { id }, data: { deletedAt: new Date() } });
    return NextResponse.json({ success: true });
  } catch {
    return errorResponse("Failed to delete contact");
  }
}
```

- [ ] **Step 3: Manual check** — with the dev server (`npm run dev`) and logged into `/admin`, POST a small CSV to `/api/admin/newsletter/contacts` (via the screen in the next task, or a REST client). Confirm the report counts and that a re-POST of the same emails reports duplicates handled and does not create duplicates.

- [ ] **Step 4: Typecheck + commit**

Run: `npx tsc --noEmit` (expect no new errors).

```bash
git add src/app/api/admin/newsletter/contacts
git commit -m "feat: contacts API (CSV import, list, soft-delete)"
```

### Task 1.4: Contacts admin screen + sidebar entry

**Files:**
- Create: `src/app/admin/(dashboard)/newsletter/contacts/page.tsx`
- Modify: `src/app/admin/components/Sidebar.tsx`

Mirror `src/app/admin/(dashboard)/blog/page.tsx` (uses `AdminPageHeader`, `AdminDataTable`, `adminGet`). Add: a file input that reads the CSV text and `adminPost("/newsletter/contacts", { csv })`, then shows the returned report via `AdminToast`. Columns: email, name, tags (joined), status. Row action: delete (calls `adminDelete`). Add a tag filter (`?tag=`).

- [ ] **Step 1: Build the page** following the blog page structure; wire import + list + delete.

- [ ] **Step 2: Add a "Newsletter" nav group** in `Sidebar.tsx` `navGroups` with items: `Contacts` (`/admin/newsletter/contacts`), `Compose` (`/admin/newsletter/compose`), `Campaigns` (`/admin/newsletter/campaigns`).

- [ ] **Step 3: Manual check** — upload a CSV, confirm the report toast, list renders, tag filter works, delete hides the row.

- [ ] **Step 4: Commit**

```bash
git add "src/app/admin/(dashboard)/newsletter/contacts/page.tsx" src/app/admin/components/Sidebar.tsx
git commit -m "feat: newsletter Contacts admin screen + sidebar nav"
```

---

## Phase 2 — Compose, recipient resolution, test-send

### Task 2.1: Recipient resolution (pure, TDD)

**Files:**
- Create: `src/lib/newsletter/recipients.ts`
- Test: `src/lib/newsletter/recipients.test.ts`

Given candidate contacts, selected tags, and suppressed emails, return the final recipient list. "Match any selected tag". Excludes non-`SUBSCRIBED`, soft-deleted (caller already filters), and suppressed.

- [ ] **Step 1: Write failing tests**

```typescript
// src/lib/newsletter/recipients.test.ts
import { describe, it, expect } from "vitest";
import { resolveRecipients } from "./recipients";

const contacts = [
  { email: "en@x.com", name: "EN", tags: ["EN", "partners"], status: "SUBSCRIBED" as const },
  { email: "ar@x.com", name: "AR", tags: ["AR"], status: "SUBSCRIBED" as const },
  { email: "off@x.com", name: "Off", tags: ["EN"], status: "UNSUBSCRIBED" as const },
];

describe("resolveRecipients", () => {
  it("matches any selected tag", () => {
    const r = resolveRecipients(contacts, ["EN"], new Set());
    expect(r.map((c) => c.email)).toEqual(["en@x.com"]);
  });
  it("matches multiple tags as a union", () => {
    const r = resolveRecipients(contacts, ["EN", "AR"], new Set());
    expect(r.map((c) => c.email).sort()).toEqual(["ar@x.com", "en@x.com"]);
  });
  it("excludes non-subscribed contacts", () => {
    const r = resolveRecipients(contacts, ["EN"], new Set());
    expect(r.find((c) => c.email === "off@x.com")).toBeUndefined();
  });
  it("excludes suppressed emails even if subscribed + tagged", () => {
    const r = resolveRecipients(contacts, ["EN"], new Set(["en@x.com"]));
    expect(r).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run — verify fail.**

- [ ] **Step 3: Implement `recipients.ts`**

```typescript
// src/lib/newsletter/recipients.ts
export interface RecipientCandidate {
  email: string;
  name: string | null;
  tags: string[];
  status: "SUBSCRIBED" | "UNSUBSCRIBED" | "BOUNCED" | "COMPLAINED";
}

export function resolveRecipients(
  contacts: RecipientCandidate[],
  selectedTags: string[],
  suppressed: Set<string>
): RecipientCandidate[] {
  const tagSet = new Set(selectedTags);
  return contacts.filter(
    (c) =>
      c.status === "SUBSCRIBED" &&
      !suppressed.has(c.email) &&
      c.tags.some((t) => tagSet.has(t))
  );
}
```

- [ ] **Step 4: Run — verify pass. Step 5: Commit**

```bash
git add src/lib/newsletter/recipients.ts src/lib/newsletter/recipients.test.ts
git commit -m "feat: recipient resolution (tag union minus suppression)"
```

### Task 2.2: Unsubscribe token sign/verify (pure, TDD)

**Files:**
- Create: `src/lib/newsletter/token.ts`
- Test: `src/lib/newsletter/token.test.ts`

HMAC-signed, **non-expiring** token encoding the recipient id (and campaign id). Uses Node `crypto`. Secret from `NEWSLETTER_UNSUB_SECRET` (passed in, not read inside, to keep it pure/testable).

- [ ] **Step 1: Write failing tests**

```typescript
// src/lib/newsletter/token.test.ts
import { describe, it, expect } from "vitest";
import { signUnsubToken, verifyUnsubToken } from "./token";

const SECRET = "test-secret-please-change";

describe("unsubscribe token", () => {
  it("round-trips a payload", () => {
    const tok = signUnsubToken({ rid: "r1", cid: "c1" }, SECRET);
    expect(verifyUnsubToken(tok, SECRET)).toEqual({ rid: "r1", cid: "c1" });
  });
  it("rejects a tampered token", () => {
    const tok = signUnsubToken({ rid: "r1", cid: "c1" }, SECRET);
    expect(verifyUnsubToken(tok + "x", SECRET)).toBeNull();
  });
  it("rejects a wrong secret", () => {
    const tok = signUnsubToken({ rid: "r1", cid: "c1" }, SECRET);
    expect(verifyUnsubToken(tok, "other")).toBeNull();
  });
});
```

- [ ] **Step 2: Run — verify fail.**

- [ ] **Step 3: Implement `token.ts`**

```typescript
// src/lib/newsletter/token.ts
import crypto from "crypto";

export interface UnsubPayload { rid: string; cid: string; }

function b64url(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function signUnsubToken(payload: UnsubPayload, secret: string): string {
  const body = b64url(Buffer.from(JSON.stringify(payload)));
  const sig = b64url(crypto.createHmac("sha256", secret).update(body).digest());
  return `${body}.${sig}`;
}

export function verifyUnsubToken(token: string, secret: string): UnsubPayload | null {
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = b64url(crypto.createHmac("sha256", secret).update(body).digest());
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try { return JSON.parse(Buffer.from(body.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString()); }
  catch { return null; }
}
```

- [ ] **Step 4: Run — verify pass. Step 5: Commit**

```bash
git add src/lib/newsletter/token.ts src/lib/newsletter/token.test.ts
git commit -m "feat: HMAC unsubscribe token sign/verify"
```

### Task 2.3: Email assembly — footer injection + send wrappers

**Files:**
- Create: `src/lib/newsletter/render.ts` (+ test `render.test.ts`)
- Modify: `src/lib/email.ts` (add `sendNewsletterBatch`)

`render.ts`: pure functions — `applyMergeTags(html, { name })` replaces `{{name}}`; `injectUnsubscribeFooter(html, unsubUrl, locale)` appends a localized footer and returns the final HTML. `email.ts`: add a batch sender using `resend.batch.send` with per-call idempotency key and `List-Unsubscribe` headers.

- [ ] **Step 1: Write failing tests for `render.ts`**

```typescript
// src/lib/newsletter/render.test.ts
import { describe, it, expect } from "vitest";
import { applyMergeTags, injectUnsubscribeFooter } from "./render";

describe("render", () => {
  it("replaces {{name}} (and falls back to empty)", () => {
    expect(applyMergeTags("Hi {{name}}", { name: "Sam" })).toBe("Hi Sam");
    expect(applyMergeTags("Hi {{name}}", { name: null })).toBe("Hi ");
  });
  it("injects a footer containing the unsubscribe URL", () => {
    const out = injectUnsubscribeFooter("<p>Body</p>", "https://x/u?token=abc", "EN");
    expect(out).toContain("https://x/u?token=abc");
    expect(out).toContain("Unsubscribe");
  });
  it("uses Arabic footer + RTL for AR", () => {
    const out = injectUnsubscribeFooter("<p>Body</p>", "https://x/u?token=abc", "AR");
    expect(out).toContain('dir="rtl"');
  });
});
```

- [ ] **Step 2: Run — verify fail.**

- [ ] **Step 3: Implement `render.ts`**

```typescript
// src/lib/newsletter/render.ts
export function applyMergeTags(html: string, vars: { name: string | null }): string {
  return html.replace(/\{\{\s*name\s*\}\}/g, vars.name ?? "");
}

export function injectUnsubscribeFooter(html: string, unsubUrl: string, locale: "EN" | "AR"): string {
  const isAr = locale === "AR";
  const label = isAr ? "إلغاء الاشتراك" : "Unsubscribe";
  const line = isAr
    ? "أنت تتلقى هذه الرسالة لأنك مشترك في نشرة The LEE Experience."
    : "You are receiving this because you subscribed to The LEE Experience newsletter.";
  const footer = `<div dir="${isAr ? "rtl" : "ltr"}" style="font-family:Arial,sans-serif;font-size:12px;color:#9CA3AF;text-align:center;padding:24px 16px;">
    <p style="margin:0 0 6px;">${line}</p>
    <p style="margin:0;"><a href="${unsubUrl}" style="color:#6B7280;text-decoration:underline;">${label}</a></p>
  </div>`;
  return `${html}\n${footer}`;
}
```

- [ ] **Step 4: Run — verify pass.**

- [ ] **Step 5: Add `sendNewsletterBatch` to `src/lib/email.ts`**

```typescript
// append to src/lib/email.ts
export interface BatchEmail {
  to: string;
  subject: string;
  html: string;
  headers?: Record<string, string>;
}

const NEWSLETTER_FROM = process.env.NEWSLETTER_FROM || FROM;
const NEWSLETTER_REPLY_TO = process.env.NEWSLETTER_REPLY_TO;

/**
 * Sends a batch of distinct newsletter emails in one request.
 * `idempotencyKey` makes a retried identical batch a no-op at Resend.
 * Returns Resend's per-email ids, or throws so the drainer can mark the batch failed.
 */
export async function sendNewsletterBatch(
  emails: BatchEmail[],
  idempotencyKey: string,
  campaignId: string
): Promise<{ id: string }[]> {
  if (!resend) throw new Error("RESEND_API_KEY not set");
  const payload = emails.map((e) => ({
    from: NEWSLETTER_FROM,
    to: e.to,
    subject: e.subject,
    html: e.html,
    replyTo: NEWSLETTER_REPLY_TO,
    headers: e.headers,
    tags: [{ name: "campaignId", value: campaignId }],
  }));
  // NOTE: confirm exact Resend SDK signature for batch + idempotency during implementation.
  const { data, error } = await resend.batch.send(payload, { idempotencyKey });
  if (error) throw new Error(typeof error === "string" ? error : JSON.stringify(error));
  return (data?.data ?? []) as { id: string }[];
}
```

> **Verify during implementation:** the exact `resend.batch.send` signature, how to pass an idempotency key (header vs option), and the shape of the returned ids in the installed `resend` version. Adjust this wrapper accordingly — the rest of the plan only depends on its documented behavior (send N emails, dedupe on key, return ids or throw).

- [ ] **Step 6: Commit**

```bash
git add src/lib/newsletter/render.ts src/lib/newsletter/render.test.ts src/lib/email.ts
git commit -m "feat: newsletter render (merge + localized unsub footer) and batch sender"
```

### Task 2.4: Campaign draft + test-send API

**Files:**
- Create: `src/app/api/admin/newsletter/campaigns/route.ts` (GET list, POST create draft)
- Create: `src/app/api/admin/newsletter/campaigns/[id]/route.ts` (GET one, PUT update draft, DELETE)
- Create: `src/app/api/admin/newsletter/campaigns/[id]/test/route.ts` (POST test-send)
- Create: `src/app/api/admin/newsletter/recipients/preview/route.ts` (POST: returns recipient count for given tags)

- [ ] **Step 1: Implement campaigns list/create + get/update/delete** mirroring blog routes. On **PUT** (edit subject/html), set `lastTestedAt = null` (editing clears the test gate). Store `subject`, `html`, `locale`, `targetTags`.

- [ ] **Step 2: Implement recipient preview** — resolve count server-side:

```typescript
// src/app/api/admin/newsletter/recipients/preview/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withAdmin, errorResponse } from "@/lib/api-utils";
import { resolveRecipients } from "@/lib/newsletter/recipients";

export async function POST(request: NextRequest) {
  const auth = await withAdmin(request);
  if ("error" in auth) return auth.error;
  try {
    const { tags } = await request.json();
    if (!Array.isArray(tags) || tags.length === 0) return NextResponse.json({ count: 0 });
    const [contacts, suppressedRows] = await Promise.all([
      db.contact.findMany({
        where: { deletedAt: null, status: "SUBSCRIBED", tags: { hasSome: tags } },
        select: { email: true, name: true, tags: true, status: true },
      }),
      db.suppression.findMany({ select: { email: true } }),
    ]);
    const suppressed = new Set(suppressedRows.map((s) => s.email));
    const count = resolveRecipients(contacts as never, tags, suppressed).length;
    return NextResponse.json({ count });
  } catch {
    return errorResponse("Failed to preview recipients");
  }
}
```

- [ ] **Step 3: Implement test-send** — sends 1–3 addresses immediately, sets `lastTestedAt`:

```typescript
// src/app/api/admin/newsletter/campaigns/[id]/test/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withAdmin, errorResponse } from "@/lib/api-utils";
import { applyMergeTags, injectUnsubscribeFooter } from "@/lib/newsletter/render";
import { sendNewsletterBatch } from "@/lib/email";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await withAdmin(request);
  if ("error" in auth) return auth.error;
  const { id } = await params;
  try {
    const { addresses } = await request.json();
    const list: string[] = Array.isArray(addresses) ? addresses.slice(0, 3) : [];
    if (list.length === 0) return errorResponse("Provide 1–3 test addresses", 400);
    const c = await db.campaign.findUnique({ where: { id } });
    if (!c) return errorResponse("Campaign not found", 404);

    const emails = list.map((to) => {
      const merged = applyMergeTags(c.html, { name: "Test" });
      const html = injectUnsubscribeFooter(merged, "#", c.locale === "AR" ? "AR" : "EN");
      return { to, subject: `[TEST] ${c.subject}`, html };
    });
    await sendNewsletterBatch(emails, `test:${id}:${Date.now()}`, id);
    await db.campaign.update({ where: { id }, data: { lastTestedAt: new Date() } });
    return NextResponse.json({ success: true });
  } catch {
    return errorResponse("Failed to send test");
  }
}
```

> `Date.now()` is fine in a route handler (only forbidden inside workflow scripts).

- [ ] **Step 4: Manual check** — create a draft via REST/screen, POST a test to your own email, confirm it arrives and `lastTestedAt` is set; PUT an edit and confirm `lastTestedAt` clears.

- [ ] **Step 5: Typecheck + commit**

```bash
git add src/app/api/admin/newsletter/campaigns src/app/api/admin/newsletter/recipients
git commit -m "feat: campaign draft CRUD, recipient preview, and gated test-send"
```

### Task 2.5: Compose & Send screen

**Files:**
- Create: `src/app/admin/(dashboard)/newsletter/compose/page.tsx`

Single screen: subject input; **EN/AR locale toggle**; HTML textarea with the image-URL reminder note; **live preview** in a `<iframe sandbox srcDoc={html}>` with a desktop/mobile width toggle; **tag multi-select** that calls `/newsletter/recipients/preview` (debounced) to show the live count; **test-send** box (1–3 addresses) → `POST .../test`; **Send to group** button **disabled until `lastTestedAt` is set**, with a confirm dialog showing subject + count, which calls the enqueue endpoint (Task 3.1). Saving the draft uses campaigns POST/PUT.

- [ ] **Step 1: Build the screen** (client component, `adminPost/adminPut`). Keep `lastTestedAt` from the saved draft to drive the gate; clear it locally when subject/html change and on PUT.

- [ ] **Step 2: Manual check** — paste one of the existing `Newsletter/*.html` files, preview renders, count updates, test arrives, gate unlocks only after a test.

- [ ] **Step 3: Commit**

```bash
git add "src/app/admin/(dashboard)/newsletter/compose/page.tsx"
git commit -m "feat: newsletter Compose & Send screen with preview, gate, and live count"
```

---

## Phase 3 — Send engine (enqueue + resumable drainer)

### Task 3.1: Enqueue endpoint (materialize the ledger)

**Files:**
- Create: `src/app/api/admin/newsletter/campaigns/[id]/send/route.ts`

Resolves recipients, creates `CampaignRecipient` rows (status `PENDING`) with a signed `unsubToken` and a fixed `batchIndex = floor(ordinal / BATCH_SIZE)`, sets `Campaign.status = SENDING`, `enqueuedAt`, `recipientCount`. Returns immediately. Requires `lastTestedAt` set.

- [ ] **Step 1: Implement**

```typescript
// src/app/api/admin/newsletter/campaigns/[id]/send/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withAdmin, errorResponse } from "@/lib/api-utils";
import { resolveRecipients } from "@/lib/newsletter/recipients";
import { signUnsubToken } from "@/lib/newsletter/token";

const BATCH_SIZE = parseInt(process.env.NEWSLETTER_BATCH_SIZE || "100");
const SECRET = process.env.NEWSLETTER_UNSUB_SECRET || "";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await withAdmin(request);
  if ("error" in auth) return auth.error;
  const { id } = await params;
  try {
    const c = await db.campaign.findUnique({ where: { id } });
    if (!c) return errorResponse("Campaign not found", 404);
    if (!c.lastTestedAt) return errorResponse("Send a test before sending to a group", 400);
    if (c.status !== "DRAFT") return errorResponse("Campaign already enqueued", 400);

    const [contacts, suppressedRows] = await Promise.all([
      db.contact.findMany({
        where: { deletedAt: null, status: "SUBSCRIBED", tags: { hasSome: c.targetTags } },
        select: { email: true, name: true, tags: true, status: true },
      }),
      db.suppression.findMany({ select: { email: true } }),
    ]);
    const suppressed = new Set(suppressedRows.map((s) => s.email));
    const recipients = resolveRecipients(contacts as never, c.targetTags, suppressed);

    // Pre-generate each row id with crypto.randomUUID() so the signed unsubToken can be set in
    // a SINGLE create (no placeholder, no second pass, no cross-campaign collisions). The token
    // signs against the row's own id, so it's globally unique by construction.
    await db.$transaction(async (tx) => {
      for (let i = 0; i < recipients.length; i++) {
        const r = recipients[i];
        const rid = crypto.randomUUID();
        await tx.campaignRecipient.create({
          data: {
            id: rid,
            campaignId: id,
            email: r.email,
            name: r.name,
            batchIndex: Math.floor(i / BATCH_SIZE),
            unsubToken: signUnsubToken({ rid, cid: id }, SECRET),
          },
        });
      }
      await tx.campaign.update({
        where: { id },
        data: { status: "SENDING", enqueuedAt: new Date(), recipientCount: recipients.length },
      });
    });

    return NextResponse.json({ enqueued: recipients.length });
  } catch {
    return errorResponse("Failed to enqueue campaign");
  }
}
```

Add `import crypto from "crypto";` at the top of the file. (`crypto.randomUUID()` is a stable, dependency-free id — Prisma accepts an explicit string `id`. No need for cuid2.)

> For very large lists, this per-row loop inside one transaction is acceptable for v1 (the enqueue request is fast relative to the actual send). If it ever feels slow, batch the inserts with `createManyAndReturn` after pre-computing ids — but keep the campaign status flip in the same transaction so a failed enqueue leaves the campaign `DRAFT`.

- [ ] **Step 2: Manual check** — enqueue a draft targeting a small tag; confirm rows exist with distinct `unsubToken`, correct `batchIndex` grouping, and campaign `status = SENDING`.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/admin/newsletter/campaigns/[id]/send
git commit -m "feat: enqueue endpoint materializes the recipient ledger"
```

### Task 3.2: Batch selection logic (pure, TDD)

**Files:**
- Create: `src/lib/newsletter/drain.ts`
- Test: `src/lib/newsletter/drain.test.ts`

Pure helpers the drainer uses: `nextBatchIndex(rows, retryBudget)` returns the lowest `batchIndex` that still has an un-sent row (`PENDING`, or `FAILED` with `attempts < retryBudget`), or `null` if none; `idempotencyKeyFor(campaignId, batchIndex)`; `isCampaignDrained(rows, retryBudget)`.

- [ ] **Step 1: Write failing tests**

```typescript
// src/lib/newsletter/drain.test.ts
import { describe, it, expect } from "vitest";
import { nextBatchIndex, idempotencyKeyFor, isCampaignDrained } from "./drain";

type R = { batchIndex: number; status: "PENDING" | "SENT" | "FAILED"; attempts: number };
const B = 3;

describe("drain helpers", () => {
  it("returns lowest batch with un-sent rows", () => {
    const rows: R[] = [
      { batchIndex: 0, status: "SENT", attempts: 1 },
      { batchIndex: 1, status: "PENDING", attempts: 0 },
      { batchIndex: 2, status: "PENDING", attempts: 0 },
    ];
    expect(nextBatchIndex(rows, B)).toBe(1);
  });
  it("treats FAILED under retry budget as un-sent, but not when exhausted", () => {
    expect(nextBatchIndex([{ batchIndex: 5, status: "FAILED", attempts: 2 }], B)).toBe(5);
    expect(nextBatchIndex([{ batchIndex: 5, status: "FAILED", attempts: 3 }], B)).toBeNull();
  });
  it("returns null when everything is sent", () => {
    expect(nextBatchIndex([{ batchIndex: 0, status: "SENT", attempts: 1 }], B)).toBeNull();
  });
  it("derives a deterministic idempotency key", () => {
    expect(idempotencyKeyFor("c1", 2)).toBe("c1:2");
  });
  it("isCampaignDrained mirrors nextBatchIndex === null", () => {
    expect(isCampaignDrained([{ batchIndex: 0, status: "SENT", attempts: 1 }], B)).toBe(true);
  });
});
```

- [ ] **Step 2: Run — verify fail.**

- [ ] **Step 3: Implement `drain.ts`**

```typescript
// src/lib/newsletter/drain.ts
export interface DrainRow { batchIndex: number; status: "PENDING" | "SENT" | "FAILED"; attempts: number; }

function isUnsent(r: DrainRow, retryBudget: number): boolean {
  return r.status === "PENDING" || (r.status === "FAILED" && r.attempts < retryBudget);
}

export function nextBatchIndex(rows: DrainRow[], retryBudget: number): number | null {
  const unsent = rows.filter((r) => isUnsent(r, retryBudget)).map((r) => r.batchIndex);
  return unsent.length ? Math.min(...unsent) : null;
}

export function idempotencyKeyFor(campaignId: string, batchIndex: number): string {
  return `${campaignId}:${batchIndex}`;
}

export function isCampaignDrained(rows: DrainRow[], retryBudget: number): boolean {
  return nextBatchIndex(rows, retryBudget) === null;
}
```

- [ ] **Step 4: Run — verify pass. Step 5: Commit**

```bash
git add src/lib/newsletter/drain.ts src/lib/newsletter/drain.test.ts
git commit -m "feat: drainer batch-selection helpers"
```

### Task 3.3: Drainer cron route + advisory lock + vercel.json

**Files:**
- Create: `src/app/api/cron/newsletter-drain/route.ts`
- Create: `vercel.json`

The drainer: authorize via `CRON_SECRET`; for each `SENDING` campaign, take a **non-blocking** advisory lock (`pg_try_advisory_xact_lock`) inside a transaction; process a bounded number of batches this tick (re-send the *whole* `batchIndex` with idempotency key `campaignId:batchIndex`); mark rows `SENT`/`FAILED`; flip campaign to `SENT` when drained (or `FAILED` if only exhausted-`FAILED` remain). Resends already-`SENT` rows within a re-sent batch — Resend dedupes via the key.

- [ ] **Step 1: Implement the drainer**

```typescript
// src/app/api/cron/newsletter-drain/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { applyMergeTags, injectUnsubscribeFooter } from "@/lib/newsletter/render";
import { idempotencyKeyFor, nextBatchIndex } from "@/lib/newsletter/drain";
import { sendNewsletterBatch } from "@/lib/email";

// Route-segment config (App Router): force dynamic + extend the timeout for this handler.
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const RETRY_BUDGET = 3;
const BATCHES_PER_TICK = 5;      // tune under the function timeout
const INTER_BATCH_MS = 600;      // small pause between batches to respect Resend's API rate limit
const SITE = process.env.NEXT_PUBLIC_SITE_URL || "";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  const header = req.headers.get("authorization");
  return !!secret && header === `Bearer ${secret}`;
}

// Hash a campaign id to a stable bigint key for pg advisory locks.
function lockKey(id: string): bigint {
  let h = 0n;
  for (const ch of id) h = (h * 131n + BigInt(ch.charCodeAt(0))) % 9223372036854775783n;
  return h;
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sending = await db.campaign.findMany({ where: { status: "SENDING" }, select: { id: true } });
  let processed = 0;

  for (const { id: campaignId } of sending) {
    await db.$transaction(async (tx) => {
      // Non-blocking single-flight lock: skip this campaign if another tick holds it.
      const locked = await tx.$queryRawUnsafe<{ pg_try_advisory_xact_lock: boolean }[]>(
        `SELECT pg_try_advisory_xact_lock($1)`, lockKey(campaignId)
      );
      if (!locked[0]?.pg_try_advisory_xact_lock) return;

      const campaign = await tx.campaign.findUnique({ where: { id: campaignId } });
      if (!campaign || campaign.status !== "SENDING") return;

      for (let n = 0; n < BATCHES_PER_TICK; n++) {
        const rows = await tx.campaignRecipient.findMany({ where: { campaignId } });
        const drainRows = rows.map((r) => ({ batchIndex: r.batchIndex, status: r.status, attempts: r.attempts }));
        const bi = nextBatchIndex(drainRows, RETRY_BUDGET);
        if (bi === null) {
          // Drained: SENT only if no row is permanently FAILED; otherwise FAILED.
          const hasFailed = rows.some((r) => r.status === "FAILED");
          await tx.campaign.update({
            where: { id: campaignId },
            data: hasFailed ? { status: "FAILED" } : { status: "SENT", sentAt: new Date() },
          });
          break;
        }
        const batch = rows.filter((r) => r.batchIndex === bi);
        const emails = batch.map((r) => {
          const merged = applyMergeTags(campaign.html, { name: r.name });
          const url = `${SITE}/api/public/newsletter/unsubscribe?token=${encodeURIComponent(r.unsubToken)}`;
          const html = injectUnsubscribeFooter(merged, url, campaign.locale === "AR" ? "AR" : "EN");
          return {
            to: r.email,
            subject: campaign.subject,
            html,
            headers: {
              "List-Unsubscribe": `<${url}>`,
              "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
            },
          };
        });

        try {
          const sent = await sendNewsletterBatch(emails, idempotencyKeyFor(campaignId, bi), campaignId);
          // Sequential writes: Prisma interactive transactions run on one connection — no Promise.all.
          for (let i = 0; i < batch.length; i++) {
            await tx.campaignRecipient.update({
              where: { id: batch[i].id },
              data: { status: "SENT", sentAt: new Date(), providerMessageId: sent[i]?.id ?? null },
            });
          }
        } catch (e) {
          const msg = (e as Error).message.slice(0, 500);
          // updateMany is a single statement — safe and avoids per-row round-trips for the failure path.
          await tx.campaignRecipient.updateMany({
            where: { id: { in: batch.map((r) => r.id) } },
            data: { status: "FAILED", attempts: { increment: 1 }, error: msg },
          });
        }
        processed++;
        await sleep(INTER_BATCH_MS);
      }
    }, { timeout: 55_000 });
  }

  return NextResponse.json({ processed });
}
```

> **Verify during implementation:** Supabase pooled connections sometimes disallow advisory locks / long transactions — use `DIRECT_DATABASE_URL` for this route if needed, and confirm the `pg_try_advisory_xact_lock` raw query runs. Tune `BATCHES_PER_TICK` and the transaction `timeout` to stay under the Vercel function `maxDuration`. If a single campaign's batches can't fit one tick, the next tick resumes it (idempotency-safe).

- [ ] **Step 2: Create `vercel.json`** registering the cron (every minute). The function timeout is set via route-segment config (`export const maxDuration = 60` in the route), not here.

```json
{
  "crons": [{ "path": "/api/cron/newsletter-drain", "schedule": "* * * * *" }]
}
```

> **Plan note:** an every-minute cron requires a Vercel **Pro** plan (Hobby allows once-daily crons). If you're on Hobby, either upgrade or change the schedule to the allowed cadence and trigger the drainer manually/externally for now. Vercel Cron sends the configured `CRON_SECRET` as the `Authorization: Bearer` header automatically when set in project env.

- [ ] **Step 3: Manual check (local)** — with a `SENDING` campaign and a real `RESEND_API_KEY` (or a mock), hit `GET /api/cron/newsletter-drain` with `Authorization: Bearer $CRON_SECRET`. Confirm rows flip to `SENT`, campaign reaches `SENT`, and a second call is a no-op.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/cron/newsletter-drain vercel.json
git commit -m "feat: resumable cron drainer with single-flight lock + batch idempotency"
```

### Task 3.4: Drainer integration test (resumability/idempotency)

**Files:**
- Create: `src/lib/newsletter/drain.integration.test.ts`

Unit-level simulation of the drainer's decision loop over a mutable in-memory ledger using the pure helpers, asserting the guarantees without a real DB or Resend.

- [ ] **Step 1: Write the test** — simulate: (a) a batch send "succeeds" → rows SENT, `nextBatchIndex` advances; (b) a batch "fails" → rows FAILED, retried until `RETRY_BUDGET`, then skipped; (c) re-running after a partial send does not re-pick `SENT` batches; (d) `isCampaignDrained` true only when all batches are SENT or exhausted-FAILED.

- [ ] **Step 2: Run — verify pass.** `npx vitest run src/lib/newsletter/drain.integration.test.ts`

- [ ] **Step 3: Commit**

```bash
git add src/lib/newsletter/drain.integration.test.ts
git commit -m "test: drainer resumability + idempotency simulation"
```

---

## Phase 4 — Tracking & analytics

### Task 4.1: Webhook receiver

**Files:**
- Create: `src/app/api/public/newsletter/webhook/route.ts`

Verifies the Resend signature; maps event → `CampaignEventType`; correlates campaign via the `campaignId` tag; writes `CampaignEvent` (deduped on `providerEventId`); updates suppression on hard bounce / complaint (unsubscribe handled elsewhere). Soft bounces are logged only, **not** written as events.

- [ ] **Step 1: Implement** (signature verification per Resend's webhook docs — `svix`-style headers; confirm exact scheme during implementation):

```typescript
// src/app/api/public/newsletter/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Map Resend event type → our enum, or null to ignore (e.g. soft bounce).
function mapType(evt: string, bounceType?: string): "DELIVERED" | "OPENED" | "CLICKED" | "BOUNCED" | "COMPLAINED" | null {
  switch (evt) {
    case "email.delivered": return "DELIVERED";
    case "email.opened": return "OPENED";
    case "email.clicked": return "CLICKED";
    case "email.complained": return "COMPLAINED";
    case "email.bounced": return bounceType === "hard" ? "BOUNCED" : null;
    default: return null;
  }
}

export async function POST(request: NextRequest) {
  const raw = await request.text();
  // TODO: verify signature using RESEND_WEBHOOK_SECRET and the svix headers before trusting `raw`.
  let payload: any;
  try { payload = JSON.parse(raw); } catch { return NextResponse.json({ ok: true }); }

  const evt: string = payload?.type ?? "";
  const data = payload?.data ?? {};
  const email: string | undefined = data?.to?.[0] ?? data?.email;
  // The webhook delivery's own event id (NOT email_id, which repeats across event types for one email).
  const providerEventId: string | undefined = payload?.id;
  const campaignId: string | undefined = (data?.tags ?? []).find((t: any) => t.name === "campaignId")?.value;
  const bounceType: string | undefined = data?.bounce?.type;
  const occurredAt = data?.created_at ? new Date(data.created_at) : new Date();

  const type = mapType(evt, bounceType);
  if (!type || !campaignId || !email) return NextResponse.json({ ok: true });

  // Idempotency: dedupe on providerEventId when present, else on the composite
  // (campaignId, email, type, occurredAt) — never on email_id.
  const dup = providerEventId
    ? await db.campaignEvent.findUnique({ where: { providerEventId } })
    : await db.campaignEvent.findFirst({ where: { campaignId, email, type, occurredAt } });
  if (dup) return NextResponse.json({ ok: true });

  try {
    await db.campaignEvent.create({
      data: { campaignId, type, email, providerEventId, occurredAt },
    });
  } catch {
    // Lost a race on the unique providerEventId → already recorded, ignore.
    return NextResponse.json({ ok: true });
  }

  if (type === "BOUNCED" || type === "COMPLAINED") {
    const reason = type === "BOUNCED" ? "HARD_BOUNCE" : "COMPLAINED";
    const status = type === "BOUNCED" ? "BOUNCED" : "COMPLAINED";
    await db.suppression.upsert({ where: { email }, update: {}, create: { email, reason } });
    await db.contact.updateMany({ where: { email }, data: { status } });
  }

  return NextResponse.json({ ok: true });
}
```

> **Verify during implementation:** exact Resend webhook event names, payload field paths (`to`, `tags`, `bounce.type`, event id), and the signature-verification scheme. Reconcile this mapping before relying on it. Without signature verification this endpoint must still never trust the body for anything destructive beyond suppression upserts keyed by the provided email.

- [ ] **Step 2: Manual check** — POST sample Resend payloads (from their docs) and confirm `CampaignEvent` rows appear, duplicates are ignored, and hard bounce/complaint create `Suppression` + flip `Contact.status`.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/public/newsletter/webhook
git commit -m "feat: Resend webhook receiver (events + suppression, deduped)"
```

### Task 4.2: Summary aggregation (pure, TDD) + campaign summary API

**Files:**
- Create: `src/lib/newsletter/summary.ts` (+ test)
- Create: `src/app/api/admin/newsletter/campaigns/[id]/summary/route.ts`

`summary.ts`: given event counts and `sent`/`delivered`, compute the card numbers (rates over delivered, guarded against divide-by-zero). API: aggregate `CampaignEvent` counts (unique by email for opens/clicks) and return the card.

- [ ] **Step 1: Write failing tests for `summary.ts`**

```typescript
// src/lib/newsletter/summary.test.ts
import { describe, it, expect } from "vitest";
import { computeSummary } from "./summary";

describe("computeSummary", () => {
  it("computes rates over delivered", () => {
    const s = computeSummary({ sent: 100, delivered: 80, uniqueOpens: 40, uniqueClicks: 8, unsubscribes: 2, bounces: 5 });
    expect(s.openRate).toBeCloseTo(0.5);
    expect(s.clickRate).toBeCloseTo(0.1);
  });
  it("guards divide-by-zero", () => {
    const s = computeSummary({ sent: 0, delivered: 0, uniqueOpens: 0, uniqueClicks: 0, unsubscribes: 0, bounces: 0 });
    expect(s.openRate).toBe(0);
    expect(s.clickRate).toBe(0);
  });
});
```

- [ ] **Step 2: Run — verify fail.**

- [ ] **Step 3: Implement `summary.ts`**

```typescript
// src/lib/newsletter/summary.ts
export interface SummaryInput {
  sent: number; delivered: number; uniqueOpens: number; uniqueClicks: number;
  unsubscribes: number; bounces: number;
}
export interface Summary extends SummaryInput { openRate: number; clickRate: number; }

export function computeSummary(i: SummaryInput): Summary {
  const d = i.delivered || 0;
  return {
    ...i,
    openRate: d > 0 ? i.uniqueOpens / d : 0,
    clickRate: d > 0 ? i.uniqueClicks / d : 0,
  };
}
```

- [ ] **Step 4: Run — verify pass.**

- [ ] **Step 5: Implement the summary API** — derive each input for `computeSummary` from this campaign's rows:
  - `sent` = `db.campaignRecipient.count({ where: { campaignId, status: "SENT" } })`
  - `delivered` = count of `CampaignEvent` `DELIVERED`
  - `uniqueOpens` = distinct `email` among `OPENED` events (e.g. `groupBy` by email, or `findMany` distinct)
  - `uniqueClicks` = distinct `email` among `CLICKED` events
  - `bounces` = count of `BOUNCED` events (hard only — soft bounces are never written)
  - `unsubscribes` = count of `UNSUBSCRIBED` events for this campaign (written by the unsubscribe endpoint)

  Feed those to `computeSummary`. Set a `finalizing: true` flag when `campaign.status !== "SENT"` (still sending) or `sentAt` is within ~the last few minutes, so the screen can show the "still finalizing" note.

- [ ] **Step 6: Commit**

```bash
git add src/lib/newsletter/summary.ts src/lib/newsletter/summary.test.ts src/app/api/admin/newsletter/campaigns/[id]/summary
git commit -m "feat: per-campaign summary aggregation + API"
```

### Task 4.3: Campaigns list + summary screen

**Files:**
- Create: `src/app/admin/(dashboard)/newsletter/campaigns/page.tsx`
- Create: `src/app/admin/(dashboard)/newsletter/campaigns/[id]/page.tsx`

List mirrors blog list (status badge: draft/sending/sent/failed; `sending` shows `sent ÷ recipientCount`). Detail page shows the **summary card** (sent, delivered, open rate, click rate, unsubscribes, bounces) with the APMP caveat and the "still finalizing" note.

- [ ] **Step 1: Build list page** (`adminGet` campaigns, status badges, link to detail).
- [ ] **Step 2: Build detail page** (`adminGet .../summary`, render card).
- [ ] **Step 3: Manual check** — after a real/mocked send, the card populates as webhooks arrive.
- [ ] **Step 4: Commit**

```bash
git add "src/app/admin/(dashboard)/newsletter/campaigns"
git commit -m "feat: campaigns list + per-campaign summary screen"
```

---

## Phase 5 — Unsubscribe (public, localized)

### Task 5.1: Unsubscribe API + localized confirmation page

**Files:**
- Create: `src/app/api/public/newsletter/unsubscribe/route.ts` (GET — one-click + POST for `List-Unsubscribe-Post`)
- Create: `src/app/[locale]/unsubscribe/page.tsx`
- Modify: `messages/en.json`, `messages/ar.json` (add `unsubscribe` namespace)

GET verifies the token, suppresses the recipient, then redirects to `/[locale]/unsubscribe?done=1`. POST (one-click) does the same and returns 200 without a redirect. Page renders a localized confirmation (RTL for `ar`).

- [ ] **Step 1: Implement the API**

```typescript
// src/app/api/public/newsletter/unsubscribe/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyUnsubToken } from "@/lib/newsletter/token";

const SECRET = process.env.NEWSLETTER_UNSUB_SECRET || "";
const SITE = process.env.NEXT_PUBLIC_SITE_URL || "";

async function suppress(token: string): Promise<boolean> {
  const payload = verifyUnsubToken(token, SECRET);
  if (!payload) return false;
  const r = await db.campaignRecipient.findUnique({ where: { id: payload.rid } });
  if (!r) return false;
  await db.suppression.upsert({ where: { email: r.email }, update: {}, create: { email: r.email, reason: "UNSUBSCRIBED" } });
  await db.contact.updateMany({ where: { email: r.email }, data: { status: "UNSUBSCRIBED" } });
  // Record a campaign-scoped UNSUBSCRIBED event so the summary card can attribute it.
  // Idempotent: skip if this recipient already has one (a recipient can click twice).
  const existing = await db.campaignEvent.findFirst({
    where: { campaignId: payload.cid, email: r.email, type: "UNSUBSCRIBED" },
  });
  if (!existing) {
    await db.campaignEvent.create({
      data: { campaignId: payload.cid, type: "UNSUBSCRIBED", email: r.email, occurredAt: new Date() },
    });
  }
  return true;
}

export async function GET(request: NextRequest) {
  const token = new URL(request.url).searchParams.get("token") || "";
  const c = await db.campaignRecipient.findUnique({
    where: { unsubToken: token }, select: { campaign: { select: { locale: true } } },
  }).catch(() => null);
  await suppress(token);
  const locale = c?.campaign.locale === "AR" ? "ar" : "en";
  return NextResponse.redirect(`${SITE}/${locale}/unsubscribe?done=1`);
}

export async function POST(request: NextRequest) {
  const token = new URL(request.url).searchParams.get("token") || "";
  await suppress(token);
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: Add the localized page** under `src/app/[locale]/unsubscribe/page.tsx` using `getTranslations({ locale, namespace: "unsubscribe" })`; RTL when `locale === "ar"`.

- [ ] **Step 3: Add `unsubscribe` strings** to `messages/en.json` and `messages/ar.json` (title + confirmation body).

- [ ] **Step 4: Manual check** — click an unsubscribe link from a test send; confirm the email is suppressed (`Suppression` row + `Contact.status = UNSUBSCRIBED`), the confirmation page renders in the right language/direction, and a later send to that tag excludes them.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/public/newsletter/unsubscribe "src/app/[locale]/unsubscribe" messages/en.json messages/ar.json
git commit -m "feat: tokenized localized unsubscribe (endpoint + EN/AR RTL page)"
```

---

## Phase 6 — End-to-end verification & docs

### Task 6.1: Full manual run-through

- [ ] **Step 1:** Run the whole suite: `npm test` → all green. `npx tsc --noEmit` → clean. `npm run lint` → clean.
- [ ] **Step 2:** End-to-end on a staging/local DB: import a CSV (mixed valid/invalid/dupes) → verify report; compose a small EN newsletter pasting an existing `Newsletter/*.html`; preview; test-send to yourself; open in **Gmail and Outlook**, check images + links + unsubscribe footer; enqueue to a small tag; let the drainer (or a manual cron hit) send; verify no duplicates; unsubscribe one recipient; re-enqueue and confirm they're excluded; open the summary card and confirm counts populate as webhooks arrive.
- [ ] **Step 3:** Confirm the one-time setup checklist is done (DNS SPF/DKIM/DMARC, Resend webhook → `/api/public/newsletter/webhook`, open+click tracking enabled, `CRON_SECRET`/secrets set in Vercel, cron registered).

### Task 6.2: Update project memory & docs

- [ ] **Step 1:** Add a short "Newsletter Tool" section to memory/MEMORY.md pointing at the spec + plan and the key env vars + the one-time setup checklist.
- [ ] **Step 2:** Commit.

```bash
git add docs/superpowers
git commit -m "docs: newsletter tool e2e verification notes"
```

---

## Notes for the implementer

- **Keep pure logic pure.** Everything in `src/lib/newsletter/*.ts` (except `email.ts`) must avoid importing `db`/`next` so Vitest stays fast and DB-free.
- **Resend specifics are the main unknowns.** Three spots are flagged "verify during implementation": the batch-send/idempotency SDK signature, the webhook event names/payload/signature, and advisory locks over Supabase pooling. Resolve each against the installed `resend` version and Resend's current docs before depending on it — the surrounding design doesn't change, only these adapters.
- **DRY/YAGNI/TDD/frequent commits.** Don't build scheduling, A/B, per-contact analytics, or a visual editor — all explicitly out of scope.
