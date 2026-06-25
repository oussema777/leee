# LEEE Internal Newsletter Tool — Design Spec

**Date:** 2026-06-25
**Status:** Approved for planning
**Author:** LEEE team (brainstormed with Claude)

## Summary

An internal email-newsletter tool built into the existing `/admin` dashboard. The LEEE
team manages a contact list, pastes AI-generated HTML newsletters, tests them, sends them
to targeted groups via Resend, and reviews per-campaign performance. There is no public
signup, no visual editor, and no multi-user/role system — it is a single-team internal tool.

This reuses infrastructure already in the project:
- **Resend** (`src/lib/email.ts`) — already wired for transactional email; extended here for batch sends.
- **Postgres + Prisma** — new tables for contacts, campaigns, tracking events, and suppression.
- **Admin dashboard + JWT auth** — the tool lives behind the existing auth; no new auth work.

### Key architecture decision: Postgres is the source of truth (not Resend Audiences)

Resend offers two send models: **Broadcasts** (which send to a Resend-hosted *Audience* and
handle unsubscribe internally) and **`emails.send` / batch send** (which send to an
arbitrary recipient list we supply). We deliberately choose **batch `emails.send`** because:

- Our contact list, tags, and suppression state live in **Postgres** and that is the single
  source of truth. Mirroring them into a Resend Audience would create a sync problem and two
  competing suppression lists.
- Flexible tag-based group selection (select "all EN", "all partners", or a combination) is
  trivial against our own DB and awkward against Resend Audiences.
- We therefore own the **unsubscribe link** (a tokenized URL → our own API route) and inject a
  `List-Unsubscribe` header ourselves. This is well-trodden and keeps suppression in one place.

Consequence: open/click/bounce/complaint tracking comes from Resend **webhooks**, correlated
to a campaign via Resend email **tags/metadata** we attach at send time. Unsubscribe is *not*
webhook-dependent — it is our own endpoint.

## Goals

- Upload and manage a contact list from CSV (the list lives in Excel today).
- Group contacts by tag (EN/AR language plus audience groups like partners, alumni).
- Paste AI-generated HTML, preview it, and send a test before the real send.
- Send a newsletter to one or more selected groups via Resend.
- See a per-campaign summary: delivered, open rate, click rate, unsubscribes, bounces.
- Comply with email law: working one-click unsubscribe, suppression of unsubscribed/bounced contacts.

## Non-Goals (explicitly out of scope — YAGNI)

- Visual drag-and-drop email editor (we paste HTML).
- Per-contact and per-link analytics (per-campaign summary only).
- A/B testing, scheduling/automation, recurring sends.
- Public-facing newsletter signup form.
- Multi-user accounts or role-based permissions.

## Architecture

```
Admin user (JWT)
   │
   ▼
/admin/newsletter  (new section, 3 screens)
   ├── Contacts        → CSV import, list, tags, suppression
   ├── Compose & Send  → paste HTML, preview, test-send, send to group(s)
   └── Campaigns       → history + per-campaign summary card
   │
   ▼
Next.js API routes (server)
   ├── contact import/list/(soft)delete
   ├── campaign create + enqueue  → builds CampaignRecipient ledger, status=sending
   ├── send drainer (Vercel Cron) ─► Resend batch emails.send, throttled chunks, resumable
   ├── unsubscribe endpoint       ◄── recipient clicks tokenized link → Suppression
   └── webhook receiver           ◄── Resend events (delivered/open/click/bounce/complaint)
   │
   ▼
Postgres (Prisma): Contact, Suppression, Campaign, CampaignRecipient, CampaignEvent
```

### Key architecture decision #2: sends are enqueued and drained, not sent inline

A single HTTP request **cannot** reliably send to a large list on Vercel: Resend's batch
endpoint caps at ~100 emails/call (so thousands of recipients = many calls), serverless
functions time out (10–60s), and Resend enforces API rate limits. Sending inline would risk
a half-finished blast with no way to resume.

Instead, **"Send to group" enqueues**: it materializes one `CampaignRecipient` row per intended
recipient (status `pending`) and flips the campaign to `sending`. A **Vercel Cron drainer**
(runs every minute) then processes the campaign's un-sent rows in throttled, ~100-email batched
`emails.send` calls, marks each row `sent`, and flips the campaign to `sent` when the ledger is
drained.

Two safeguards make this **resumable and duplicate-safe**, which matters because Vercel Cron does
not deduplicate overlapping invocations:

- **Single-flight per campaign.** Before working a campaign, the drainer takes a Postgres
  transaction-level **advisory lock** keyed on `campaignId` using the **non-blocking**
  `pg_try_advisory_xact_lock` (returns immediately: got-it / didn't). A second overlapping tick
  that can't get the lock skips that campaign this minute rather than blocking the function open.
  So two ticks never process the same ledger rows concurrently — the row-status check alone is not
  relied on for concurrency.
- **Stable batches + request-level idempotency key.** Resend's idempotency key is **per request**,
  not per email, and we send in batches — so the key is **chunk-level**, and chunks must have a
  fixed identity that survives retries. At enqueue we assign each `CampaignRecipient` a permanent
  `batchIndex` (ordinal ÷ batch size). The drainer always re-sends the *whole* batch for a given
  `batchIndex` with the deterministic key `{campaignId}:{batchIndex}`. If the drainer crashes after
  Resend accepted a batch but before rows were committed `sent`, the next tick re-sends that exact
  same batch with the same key and Resend returns the cached result instead of re-delivering. Net
  effect: a recipient receives the email **exactly once** in practice; a crash/timeout/rate-limit
  mid-blast costs at most a batch re-attempt, never a lost recipient and never a duplicate delivery.
  *(Confirm Resend's idempotency-key semantics and TTL during implementation — see Open Questions.)*

No external queue or scheduler product needed — Vercel Cron + the ledger + an advisory lock is the
whole mechanism, which keeps it within scope.

## Data Model (Prisma)

Five new tables. Names/fields indicative; finalize during implementation.

### Contact
- `id` (cuid)
- `email` (string, unique, lowercased on import)
- `name` (string, nullable)
- `tags` (string[]) — independent tags, e.g. `["EN", "partners"]`. Multiple per contact so
  the group selector can target "all EN", "all partners", or a combination. (Replaces the
  earlier single composite `tag`, which couldn't express overlapping groups.)
- `status` (enum: `subscribed` | `unsubscribed` | `bounced` | `complained`) — default `subscribed`.
  Only `subscribed` contacts are eligible to receive a send.
- `deletedAt` (datetime, nullable) — **soft delete**. A deleted contact is hidden from the
  list but its email remains (or is mirrored into `Suppression`) so a future re-import cannot
  silently re-subscribe someone who unsubscribed or hard-bounced.
- `createdAt`, `updatedAt`

### Suppression
A permanent do-not-send list keyed by email, independent of `Contact` lifecycle. Populated
on unsubscribe, hard bounce, or spam complaint. Re-import and send-resolution both check it.
- `id` (cuid)
- `email` (string, unique)
- `reason` (enum: `unsubscribed` | `hard_bounce` | `complained`)
- `createdAt`

### Campaign
- `id` (cuid)
- `subject` (string)
- `html` (text) — the exact HTML sent, stored for the record.
- `locale` (enum: `en` | `ar`) — drives the unsubscribe page/footer language and RTL.
- `targetTags` (string[]) — which group(s) this was sent to.
- `recipientCount` (int) — size of the materialized recipient ledger (post-suppression).
- `status` (enum: `draft` | `sending` | `sent` | `failed`) — default `draft`. A draft row is
  created the first time a compose is saved or test-sent (see test-send gate). `sending` while
  the drainer works the ledger; `sent` once drained; `failed` only if recipients remain `failed`
  after the retry budget is exhausted.
- `lastTestedAt` (datetime, nullable) — set when a test send succeeds; the real-send gate
  requires this to be non-null. Persisted, not ephemeral client state.
- `enqueuedAt`, `sentAt` (datetime, nullable)
- `createdAt`

(We correlate webhook events to a campaign via Resend email **tags/metadata** carrying the
`campaignId`, set at send time — not via a broadcast id, since we use batch `emails.send`.)

### CampaignRecipient
The per-recipient send ledger that makes a blast idempotent and resumable. One row per
intended recipient, materialized at enqueue time (a snapshot — later contact edits don't change
an in-flight campaign).
- `id` (cuid)
- `campaignId` (FK → Campaign)
- `email` (string), `name` (string, nullable) — snapshotted for the merge + the record.
- `unsubToken` (string, unique) — the signed, **non-expiring** unsubscribe token for this
  recipient+campaign.
- `batchIndex` (int) — fixed at enqueue (recipient ordinal ÷ batch size). Defines which Resend
  batch this row ships in; stable across retries so the batch's idempotency key is deterministic.
- `status` (enum: `pending` | `sent` | `failed`) — default `pending`. The drainer works **un-sent
  batches**: a `batchIndex` is processed while it contains any row that is `pending`, or `failed`
  with `attempts < retryBudget`. `sent` rows are never re-delivered (Resend dedupes the re-sent
  batch). A batch whose rows exhaust `retryBudget` stays `failed` permanently.
- `attempts` (int, default 0), `error` (string, nullable) — retry count + last error.
- `providerMessageId` (string, nullable) — Resend message id, links this row to its events.
- `sentAt` (datetime, nullable)
- Unique on `(campaignId, email)` — a recipient cannot be enqueued twice in one campaign.

(The send idempotency key is **derived**, not stored: `{campaignId}:{batchIndex}`, passed as the
request-level key on the batch `emails.send` call.)

### CampaignEvent
- `id` (cuid)
- `campaignId` (FK → Campaign)
- `type` (enum: `delivered` | `opened` | `clicked` | `bounced` | `complained`)
  — note: unsubscribe is handled by our own endpoint and recorded on `Contact`/`Suppression`,
  not as a webhook event here.
- `email` (string) — the recipient the event is about.
- `providerEventId` (string, nullable, unique) — Resend's event id when present; used to
  **dedupe** redundant webhook deliveries idempotently. When absent, dedupe on
  `(campaignId, email, type, occurredAt)`.
- `occurredAt` (datetime) — event timestamp from Resend.
- `createdAt`

The per-campaign summary is **computed** from `CampaignEvent` rows (counts per type),
not stored as denormalized counters — keeps the data honest and simple.

## Screens

### 1. Contacts (`/admin/newsletter/contacts`)
- **CSV upload.** Expected columns: `email`, `name`, `tags` (tags as a separated list within
  the cell, e.g. `EN;partners`). On import:
  - Lowercase + trim emails; validate format.
  - Skip duplicates (by email) and invalid/empty rows.
  - **Never re-subscribe a suppressed email** — rows whose email is in `Suppression` are
    imported as already-suppressed (or skipped), never as `subscribed`.
  - Show a result summary: `"142 added, 8 duplicates skipped, 3 invalid, 2 suppressed (kept off)"`.
- **List view.** Searchable, filterable by tag. Shows status.
- **Delete** a contact — **soft delete** (`deletedAt`); if the contact was unsubscribed/bounced/
  complained, the email stays in `Suppression` so it can never be re-emailed.
- Unsubscribed/bounced/complained contacts are visibly marked and **auto-excluded from all sends**.

### 2. Compose & Send (`/admin/newsletter/compose`)
- **Subject** field.
- **Locale toggle (EN / AR)** — sets `Campaign.locale`, which selects the language and RTL
  direction of the unsubscribe footer and the unsubscribe confirmation page the recipient lands on.
- **HTML paste box** with a reminder note: *"Images must use full public URLs
  (e.g. https://theleeexperience.com/images/...). Use email-safe HTML — start from the
  last newsletter as a template."*
- **Live preview pane** with a **desktop / mobile width toggle**.
- **Group selector** (multi-select of tags; "match any selected tag") → live recipient count
  after suppression, e.g. `"Sending to 142 contacts (EN + partners)"`.
- **Send test** to 1–3 addresses (defaults to the logged-in admin). Real send through Resend.
  A successful test persists `Campaign.lastTestedAt` on the draft.
- **Send to group** button — **gated: disabled until `lastTestedAt` is set** on this draft
  (persisted, survives reload). Editing the subject or HTML **clears `lastTestedAt`**, so the gate
  guarantees the *current* content was tested, not just that some earlier version was. Confirmation
  step shows subject + recipient count before firing.
- **Sender identity:** From/Reply-To come from env (`NEWSLETTER_FROM`, default reuses the
  verified `EMAIL_FROM` sender; `NEWSLETTER_REPLY_TO` for replies, e.g. info@theleeexperience.com).
- Optional personalization: `{{name}}` merge tag in HTML is filled from the contact name.
  Plumbing built; usage optional.
- Preview is rendered in a **sandboxed iframe** (`sandbox`, no script execution). Input HTML is
  team-authored and trusted, so this is defense-in-depth, not untrusted-content sanitization.

### 3. Campaigns (`/admin/newsletter/campaigns`)
- List of all campaigns with **status** (draft / sending / sent / failed): date, subject, target
  group(s), recipient count. A `sending` campaign shows live progress (`sent ÷ recipientCount`).
- Click a campaign → **summary card**:
  - Sent, delivered, **open rate**, **click rate**, unsubscribes, bounces (hard).
  - Rates are computed over **delivered**, with raw `sent`/`delivered` shown so the denominator
    is explicit.
  - Open rate carries a small caveat note (Apple Mail Privacy Protection inflates opens —
    treat clicks as the reliable signal).
  - For a `sending` or just-`sent` campaign, delivered/open/click are marked **"still finalizing"**
    until webhook events settle, so early under-counts aren't misread as poor performance.

## Sending & Tracking Flow

**Enqueue (one synchronous request, fast):**
1. Admin composes, tests, and confirms a send.
2. Server resolves recipients: contacts matching any selected tag, `status = subscribed`,
   `deletedAt = null`, **minus** any email present in `Suppression`.
3. Server **materializes the ledger**: one `CampaignRecipient` (status `pending`) per resolved
   recipient, each with a signed `unsubToken` and a fixed `batchIndex` (ordinal ÷ batch size);
   sets `Campaign.status = sending`, `enqueuedAt`, and `recipientCount`. Returns immediately — no
   emails sent in this request.

**Drain (Vercel Cron, every minute, resumable):**
4. For each campaign in `sending` status, the drainer takes the per-campaign **non-blocking
   advisory lock** (`pg_try_advisory_xact_lock`; skips the campaign if another tick holds it).
   Under the lock it works the next few **un-sent batches** by `batchIndex` (a batch is un-sent if
   it holds any `pending` row, or any `failed` row with `attempts < retryBudget`), capped by the
   per-tick budget so it never nears the function timeout, pausing between batches to stay under
   Resend's API rate limit.
5. For each recipient in the batch it builds the email with: the per-recipient **tokenized
   unsubscribe URL** (→ our `/api/newsletter/unsubscribe`) plus `List-Unsubscribe` /
   `List-Unsubscribe-Post` headers; `{{name}}` merge resolved; Resend **tags/metadata** carrying
   `campaignId`. It sends the whole batch via Resend **batch `emails.send`** with the request-level
   idempotency key `{campaignId}:{batchIndex}`, stores each `providerMessageId`, and marks the
   batch's rows `sent` (or `failed` + increment `attempts` on error).
6. When no un-sent rows remain, set `Campaign.status = sent` and `sentAt`. If rows remain `failed`
   with `attempts ≥ retryBudget`, set `failed` and surface the count on the campaign. A
   zero-recipient campaign (everyone suppressed) drains on the first tick and goes straight to
   `sent` with `recipientCount = 0`. Because of the advisory lock + idempotency key, a
   timeout/crash/rate-limit mid-blast is harmless — the next tick resumes where it stopped, with
   **no lost recipients and no duplicate deliveries**.

**Tracking (webhooks, independent):**
7. **Open and click tracking must be enabled** on the Resend send (open pixel + link rewriting);
   without it no open/click events are produced. Resend posts **webhook events**
   (delivered/opened/clicked/bounced/complained) to a new API route. Each is written to
   `CampaignEvent`, correlated by the `campaignId` tag (and `providerMessageId` → recipient),
   deduped via `providerEventId`.
8. **Suppression updates:**
   - **Unsubscribe** is driven by our own endpoint (recipient clicks the link) → set
     `Contact.status = unsubscribed` and add to `Suppression`. Not webhook-dependent.
   - **Hard bounce** webhook → `Contact.status = bounced` + `Suppression`. **Soft/transient
     bounces are ignored** (logged only), not suppressed.
   - **Complaint** webhook → `Contact.status = complained` + `Suppression`.
9. The summary card aggregates `CampaignEvent` counts on demand. **Rates are computed over
   `delivered`** (open rate = unique opens ÷ delivered, click rate = unique clicks ÷ delivered);
   `sent` and `delivered` are both shown so the denominator is never ambiguous.

> **Verify during implementation:** confirm exact Resend webhook event names/payloads
> (`email.delivered`, `email.opened`, `email.clicked`, `email.bounced` with bounce
> sub-type, `email.complained`) and that our `campaignId` tag + recipient email are present
> on each. The data model assumes this; reconcile before building the receiver.

## Compliance & Deliverability

**Must-have (built in):**
- One-click unsubscribe: a tokenized, **non-expiring** link auto-injected in every email footer,
  plus `List-Unsubscribe` / `List-Unsubscribe-Post` headers. Handled by our own endpoint, recorded
  in `Contact` + `Suppression`. The link works indefinitely (legally required) and never needs auth.
- **Localized unsubscribe** — the footer text and the confirmation page the recipient lands on
  follow `Campaign.locale`: English LTR or Arabic RTL.
- Suppression: unsubscribed, hard-bounced, and complained emails never receive future sends,
  and survive contact deletion and re-import.

**One-time setup checklist (done in the Resend + DNS dashboards, documented in the plan, not code):**
- Verify `theleeexperience.com` with **SPF + DKIM + DMARC** DNS records (Resend provides exact records).
- Configure the Resend **webhook endpoint** to point at the new API route, with signature verification.
- Enable **open + click tracking** on the sending domain/config (required for open/click events).
- Register the **Vercel Cron** schedule for the send drainer (every minute) in `vercel.json`.
- **Warm-up (manual for v1):** to protect sender reputation on the first large send, the operator
  splits the audience into smaller groups (by tag) and enqueues them as separate campaigns across
  a few days. Within each campaign the drainer already throttles its chunks; warm-up is just the
  operator spacing campaigns out — no auto-ramp scheduler is built (out of scope).

## Error Handling

- **CSV import:** never hard-fail on a bad row; collect and report skipped/invalid rows. Reject
  non-CSV files with a clear message.
- **Enqueue:** materializing the ledger and flipping to `sending` is one transaction — if it
  fails, the campaign stays `draft` and no recipients are created.
- **Send (drainer):** safety comes from the ledger + advisory lock + stable-batch idempotency key,
  not from atomicity of one call. A batch failure marks its rows `failed` (with `attempts`/`error`);
  the campaign stays `sending` and later ticks re-send that batch while `attempts < retryBudget`,
  then leave it `failed`. A drainer crash/timeout leaves rows un-sent → resumed next tick; the
  non-blocking advisory lock prevents two ticks racing the same batches, and re-sending the
  identical batch with key `{campaignId}:{batchIndex}` makes an accepted-but-uncommitted send a
  no-op at Resend. No half-sent blast is unrecoverable; no recipient is delivered twice.
- **Bounce counting:** soft/transient bounces are logged only and are **not** written as
  `CampaignEvent` rows, so the summary card's "bounces" count reflects hard bounces (the ones
  that actually suppress) and is not diluted by transient failures.
- **Webhooks:** verify Resend signature; dedupe on `providerEventId` (fallback
  `(campaignId, email, type, occurredAt)`) so redundant deliveries are idempotent; an event
  for an unknown/missing `campaignId` is logged and dropped, not an error.
- **Bounces:** only **hard** bounces suppress; soft/transient bounces are logged, never flip status.
- **Test-send gate:** the real-send button cannot be enabled without a persisted prior
  successful test (`Campaign.lastTestedAt`).

## Testing Strategy

- **Unit:** CSV parsing/validation (dedupe, invalid email, suppressed-email handling),
  recipient resolution (tag matching + suppression filtering), unsubscribe token sign/verify,
  summary aggregation from events.
- **Integration:** import → compose → test-send gate → enqueue → drain with Resend mocked.
  Critically test the **drainer's resumability and concurrency**: a batch failure mid-blast leaves
  the rest un-sent, the next tick completes them, and **no recipient is delivered twice**; two
  overlapping ticks on the same campaign — the non-blocking advisory lock makes the second skip;
  a re-attempt after an accepted-but-uncommitted batch — re-sending the identical batch with key
  `{campaignId}:{batchIndex}` is deduped by Resend; a `failed` batch retries up to `retryBudget`
  then stops. Webhook receiver writes
  correct `CampaignEvent` rows, dedupes on `providerEventId`, and updates `Contact.status` +
  `Suppression` (hard bounce suppresses, soft bounce does not); unsubscribe endpoint suppresses
  and survives re-import.
- **Manual (the real email test):** every newsletter is test-sent and opened in **Gmail and
  Outlook**, checked on mobile, with all images loading, all links working, and the
  unsubscribe footer present — before the real group send.

## Open Questions / Decisions for Implementation

- **Resolved:** multiple independent tags per contact (was single composite tag).
- **Resolved:** batch `emails.send` with Postgres as source of truth + our own unsubscribe
  (was Resend Broadcasts/Audiences).
- **Resolved:** sends are enqueued to a `CampaignRecipient` ledger and drained by a Vercel Cron
  job in throttled, resumable chunks (was an unscalable single inline send).
- **Confirm exact values during implementation (don't block design):** Resend webhook event
  names/payload fields (incl. `campaignId` tag, recipient email, bounce sub-type), the batch-size
  cap per `emails.send` call, the API rate limit, the safe per-tick work budget under the Vercel
  function timeout, and **Resend's idempotency-key semantics + TTL** (the duplicate-safety
  guarantee assumes a re-sent identical batch with the same request-level key is deduped within a
  window comfortably longer than our retry cadence). These tune chunk size / cron cadence /
  retryBudget; they don't change the design. **If Resend's idempotency window proves too short**
  (so a legitimate sequential resume could re-deliver an already-accepted batch), the fallback is
  to switch from stable-batch sends to **per-recipient (or small sub-chunk) sends that skip rows
  already `status = sent`** — making DB row-status, not Resend's cache, the dedupe authority, with
  a per-recipient idempotency key `{campaignId}:{recipientId}` covering only the narrow
  crash-after-accept window. This trades batch efficiency for TTL-independence; the ledger and
  drainer loop are otherwise unchanged.
