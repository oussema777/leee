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
- **Resend** (`src/lib/email.ts`) — already wired for transactional email; extended here for broadcast sends.
- **Postgres + Prisma** — three new tables for contacts, campaigns, and tracking events.
- **Admin dashboard + JWT auth** — the tool lives behind the existing auth; no new auth work.

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
   ├── contact import/list/delete
   ├── campaign create + send  ──► Resend Broadcasts API
   └── webhook receiver        ◄── Resend events (delivered/open/click/bounce/unsub)
   │
   ▼
Postgres (Prisma): Contact, Campaign, CampaignEvent
```

## Data Model (Prisma)

Three new tables. Names/fields indicative; finalize during implementation.

### Contact
- `id` (cuid)
- `email` (string, unique, lowercased on import)
- `name` (string, nullable)
- `tag` (string) — e.g. `EN-partners`, `AR-alumni`. Single tag per contact in v1.
- `status` (enum: `subscribed` | `unsubscribed` | `bounced`) — default `subscribed`.
- `createdAt`, `updatedAt`

### Campaign
- `id` (cuid)
- `subject` (string)
- `html` (text) — the exact HTML sent, stored for the record.
- `targetTags` (string[]) — which group(s) this went to.
- `recipientCount` (int) — number actually sent (post-suppression).
- `resendBroadcastId` (string, nullable) — id returned by Resend, used to correlate webhook events.
- `status` (enum: `draft` | `sent`) — default `draft`.
- `sentAt` (datetime, nullable)
- `createdAt`

### CampaignEvent
- `id` (cuid)
- `campaignId` (FK → Campaign)
- `type` (enum: `delivered` | `opened` | `clicked` | `bounced` | `unsubscribed` | `complained`)
- `email` (string) — the recipient the event is about.
- `createdAt`

The per-campaign summary is **computed** from `CampaignEvent` rows (counts per type),
not stored as denormalized counters — keeps the data honest and simple.

## Screens

### 1. Contacts (`/admin/newsletter/contacts`)
- **CSV upload.** Expected columns: `email`, `name`, `tag`. On import:
  - Lowercase + trim emails; validate format.
  - Skip duplicates (by email) and invalid/empty rows.
  - Show a result summary: `"142 added, 8 duplicates skipped, 3 invalid"`.
- **List view.** Searchable, filterable by tag. Shows status.
- **Delete** a contact.
- Unsubscribed/bounced contacts are visibly marked and **auto-excluded from all sends**.

### 2. Compose & Send (`/admin/newsletter/compose`)
- **Subject** field.
- **HTML paste box** with a reminder note: *"Images must use full public URLs
  (e.g. https://theleeexperience.com/images/...). Use email-safe HTML — start from the
  last newsletter as a template."*
- **Live preview pane** with a **desktop / mobile width toggle**.
- **Group selector** (multi-select of tags) → live recipient count after suppression,
  e.g. `"Sending to 142 contacts (EN-partners)"`.
- **Send test** to 1–3 addresses (defaults to the logged-in admin). Real send through Resend.
- **Send to group** button — **gated: disabled until at least one test send has been made**
  for this draft. Confirmation step shows subject + recipient count before firing.
- Optional personalization: `{{name}}` merge tag in HTML is filled from the contact name.
  Plumbing built; usage optional.

### 3. Campaigns (`/admin/newsletter/campaigns`)
- List of all sent campaigns: date, subject, target group(s), recipient count.
- Click a campaign → **summary card**:
  - Delivered, **open rate**, **click rate**, unsubscribes, bounces.
  - Open rate carries a small caveat note (Apple Mail Privacy Protection inflates opens —
    treat clicks as the reliable signal).

## Sending & Tracking Flow

1. Admin composes, tests, and confirms a send.
2. Server resolves recipients: contacts matching selected tags **minus** any
   `unsubscribed`/`bounced`.
3. Server sends via **Resend Broadcasts** (purpose-built for audience sends; provides
   built-in unsubscribe handling and event tracking). Store `resendBroadcastId`.
4. Mark `Campaign.status = sent`, set `sentAt` and `recipientCount`.
5. Resend posts **webhook events** (delivered/opened/clicked/bounced/unsubscribed/complained)
   to a new API route. Each event is written to `CampaignEvent`, correlated by broadcast id.
6. On `unsubscribed`/`bounced` events, update the matching `Contact.status` so they are
   suppressed on future sends.
7. The summary card aggregates `CampaignEvent` counts on demand.

## Compliance & Deliverability

**Must-have (built in):**
- One-click unsubscribe link auto-injected in every email footer (Resend mechanics +
  status sync back to `Contact`).
- Suppression: unsubscribed/bounced contacts never receive future sends.

**One-time setup checklist (done in the Resend + DNS dashboards, documented in the spec/plan, not code):**
- Verify `theleeexperience.com` with **SPF + DKIM + DMARC** DNS records (Resend provides exact records).
- Configure the Resend **webhook endpoint** to point at the new API route, with signature verification.
- **Warm-up:** first large send goes out in smaller batches over a few days rather than all at once,
  to protect sender reputation.

## Error Handling

- **CSV import:** never hard-fail on a bad row; collect and report skipped/invalid rows. Reject
  non-CSV files with a clear message.
- **Send:** if Resend returns an error, the campaign stays `draft`, surface the error, do not
  mark as sent. Partial-send safety: rely on Resend's broadcast (single API call) rather than
  per-recipient loops to avoid half-sent states.
- **Webhooks:** verify Resend signature; ignore unrecognized/duplicate events idempotently
  (an event for an unknown broadcast id is logged and dropped, not an error).
- **Test-send gate:** the real-send button cannot be enabled without a prior successful test.

## Testing Strategy

- **Unit:** CSV parsing/validation (dedupe, invalid email handling), recipient resolution
  (tag matching + suppression), summary aggregation from events.
- **Integration:** import → compose → test-send → send flow with Resend mocked; webhook
  receiver writes correct `CampaignEvent` rows and updates `Contact.status`.
- **Manual (the real email test):** every newsletter is test-sent and opened in **Gmail and
  Outlook**, checked on mobile, with all images loading, all links working, and the
  unsubscribe footer present — before the real group send.

## Open Questions / Decisions for Implementation

- Single tag per contact (v1) vs. multiple tags — starting with single; revisit if needed.
- Exact Resend Broadcasts vs. batched `emails.send` — confirm Broadcasts covers the
  unsubscribe + audience model cleanly during planning.
