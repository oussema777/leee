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
   ├── campaign create + send  ──► Resend batch emails.send (campaignId tag, unsub link/header)
   ├── unsubscribe endpoint    ◄── recipient clicks tokenized link → Suppression
   └── webhook receiver        ◄── Resend events (delivered/open/click/bounce/complaint)
   │
   ▼
Postgres (Prisma): Contact, Suppression, Campaign, CampaignEvent
```

## Data Model (Prisma)

Four new tables. Names/fields indicative; finalize during implementation.

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
- `targetTags` (string[]) — which group(s) this was sent to.
- `recipientCount` (int) — number actually sent (post-suppression).
- `status` (enum: `draft` | `sent`) — default `draft`. A draft row is created the first time a
  compose is saved or test-sent (see test-send gate).
- `lastTestedAt` (datetime, nullable) — set when a test send succeeds; the real-send gate
  requires this to be non-null. Persisted, not ephemeral client state.
- `sentAt` (datetime, nullable)
- `createdAt`

(We correlate webhook events to a campaign via Resend email **tags/metadata** carrying the
`campaignId`, set at send time — not via a broadcast id, since we use batch `emails.send`.)

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
- **HTML paste box** with a reminder note: *"Images must use full public URLs
  (e.g. https://theleeexperience.com/images/...). Use email-safe HTML — start from the
  last newsletter as a template."*
- **Live preview pane** with a **desktop / mobile width toggle**.
- **Group selector** (multi-select of tags; "match any selected tag") → live recipient count
  after suppression, e.g. `"Sending to 142 contacts (EN + partners)"`.
- **Send test** to 1–3 addresses (defaults to the logged-in admin). Real send through Resend.
  A successful test persists `Campaign.lastTestedAt` on the draft.
- **Send to group** button — **gated: disabled until `lastTestedAt` is set** on this draft
  (persisted, survives reload). Confirmation step shows subject + recipient count before firing.
- **Sender identity:** From/Reply-To come from env (`NEWSLETTER_FROM`, default reuses the
  verified `EMAIL_FROM` sender; `NEWSLETTER_REPLY_TO` for replies, e.g. info@theleeexperience.com).
- Optional personalization: `{{name}}` merge tag in HTML is filled from the contact name.
  Plumbing built; usage optional.
- Preview is rendered in a **sandboxed iframe** (`sandbox`, no script execution). Input HTML is
  team-authored and trusted, so this is defense-in-depth, not untrusted-content sanitization.

### 3. Campaigns (`/admin/newsletter/campaigns`)
- List of all sent campaigns: date, subject, target group(s), recipient count.
- Click a campaign → **summary card**:
  - Delivered, **open rate**, **click rate**, unsubscribes, bounces.
  - Open rate carries a small caveat note (Apple Mail Privacy Protection inflates opens —
    treat clicks as the reliable signal).

## Sending & Tracking Flow

1. Admin composes, tests, and confirms a send.
2. Server resolves recipients: contacts matching any selected tag, `status = subscribed`,
   `deletedAt = null`, **minus** any email present in `Suppression`.
3. Each email is built with:
   - a per-recipient **tokenized unsubscribe URL** (signed token → our `/api/newsletter/unsubscribe`
     route) plus a `List-Unsubscribe` header (and `List-Unsubscribe-Post` for one-click),
   - `{{name}}` merge resolved,
   - Resend **tags/metadata** carrying `campaignId` (for webhook correlation).
4. Server sends via Resend **batch `emails.send`** (single batched API call to avoid half-sent
   states). Mark `Campaign.status = sent`, set `sentAt` and `recipientCount`.
5. Resend posts **webhook events** (delivered/opened/clicked/bounced/complained) to a new API
   route. Each is written to `CampaignEvent`, correlated by the `campaignId` metadata tag,
   deduped via `providerEventId`.
6. **Suppression updates:**
   - **Unsubscribe** is driven by our own endpoint (recipient clicks the link) → set
     `Contact.status = unsubscribed` and add to `Suppression`. Not webhook-dependent.
   - **Hard bounce** webhook → `Contact.status = bounced` + `Suppression`. **Soft/transient
     bounces are ignored** (logged only), not suppressed.
   - **Complaint** webhook → `Contact.status = complained` + `Suppression`.
7. The summary card aggregates `CampaignEvent` counts on demand.

> **Verify during implementation:** confirm exact Resend webhook event names/payloads
> (`email.delivered`, `email.opened`, `email.clicked`, `email.bounced` with bounce
> sub-type, `email.complained`) and that our `campaignId` tag + recipient email are present
> on each. The data model assumes this; reconcile before building the receiver.

## Compliance & Deliverability

**Must-have (built in):**
- One-click unsubscribe: a tokenized link auto-injected in every email footer, plus
  `List-Unsubscribe` / `List-Unsubscribe-Post` headers. Handled by our own endpoint, recorded
  in `Contact` + `Suppression`.
- Suppression: unsubscribed, hard-bounced, and complained emails never receive future sends,
  and survive contact deletion and re-import.

**One-time setup checklist (done in the Resend + DNS dashboards, documented in the plan, not code):**
- Verify `theleeexperience.com` with **SPF + DKIM + DMARC** DNS records (Resend provides exact records).
- Configure the Resend **webhook endpoint** to point at the new API route, with signature verification.
- **Warm-up (manual for v1):** the first large send is split by the operator across tag/group
  batches over a few days — each batch is still a single batched `emails.send` call (preserving
  partial-send safety); we do not auto-throttle within one send. This protects sender reputation
  without building a scheduler (out of scope).

## Error Handling

- **CSV import:** never hard-fail on a bad row; collect and report skipped/invalid rows. Reject
  non-CSV files with a clear message.
- **Send:** if Resend returns an error, the campaign stays `draft`, surface the error, do not
  mark as sent. Partial-send safety: rely on a single batched `emails.send` call rather than
  per-recipient loops to avoid half-sent states.
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
- **Integration:** import → compose → test-send gate → send flow with Resend mocked; webhook
  receiver writes correct `CampaignEvent` rows, dedupes on `providerEventId`, and updates
  `Contact.status` + `Suppression` (hard bounce suppresses, soft bounce does not); unsubscribe
  endpoint suppresses and survives re-import.
- **Manual (the real email test):** every newsletter is test-sent and opened in **Gmail and
  Outlook**, checked on mobile, with all images loading, all links working, and the
  unsubscribe footer present — before the real group send.

## Open Questions / Decisions for Implementation

- **Resolved:** multiple independent tags per contact (was single composite tag).
- **Resolved:** batch `emails.send` with Postgres as source of truth + our own unsubscribe
  (was Resend Broadcasts/Audiences).
- **Verify before building the webhook receiver:** exact Resend event names/payload fields and
  presence of our `campaignId` tag + recipient email + bounce sub-type (see Sending flow note).
- Resend batch-size limit per `emails.send` call — confirm and, if a single group exceeds it,
  chunk into multiple batched calls within one campaign send.
