# Whish production handoff — 2026-11-05

## Current checkpoint

- Worktree: sibling `leee-whish-live`; branch `whish-live-20261105`, based on bilingual release commit `5da0990`.
- All Whish production changes are local and uncommitted. User instructed **do not push**. Nothing deployed or enabled.
- Both supplied provider screenshots were reviewed. Live credentials successfully authenticated against the production balance endpoint (read-only, HTTP 200). No payment, refund or email was sent.
- Credentials exist only in ignored `.env.whish-live.local`. Do not copy their values into documentation, Git, output or screenshots.
- Previous reader language-picker improvements remain unpushed in `leee-manal-bilingual-release` and the original checkout; they are not included in this branch.
- Preserve the approved bilingual Manal ebook, both editions per purchase, and $9.99 price. Do not deploy the older original main checkout.

## Implemented locally

Separate live Whish configuration and fixed production API host; authenticated customer checkout for physical books and ebooks; persisted, idempotent payment requests; callback token validation followed by provider status verification; automatic reading access and order confirmation; inventory reservation and refund release; durable email queues; review handling for late or conflicting captures; staff status checks and gated refunds.

Live routes use `whish-live`, separate from the existing sandbox. Payment redirects never grant access. Uncertain requests reuse the original external ID and body. Disabling new payments still allows reconciliation of existing orders. No database schema migration is needed.

Checkout text supports Arabic and English and explains automatic Whish verification. Catalog/method flags retain the global payment-method switch.

## Verification

- Targeted payment suites: 80 passed, 16 existing gated sandbox tests skipped.
- New integration tests use only an isolated PostgreSQL database on localhost:55444 with mocked provider transport, including concurrency, duplicate callbacks, forged callbacks, uncertain retries, inventory, access revocation, late captures, ownership and method disabling.
- Production build passed with local font mocks; no remote font download was required.
- English desktop and Arabic mobile browser checks passed for pending, verified, review and refunded states with mocked payment APIs.
- Worker syntax/configuration checks passed. Secret scan and diff whitespace checks passed.
- Real-money end-to-end behavior and production refund permissions remain unverified.

## Deployment prerequisites — not executed

1. Review the local changes and combine any desired unpushed language-picker changes deliberately. Respect the user's no-push instruction until changed.
2. Set production environment variables securely: `WHISH_PAY_LIVE_CHANNEL`, `WHISH_PAY_LIVE_SECRET`, `WHISH_PAY_LIVE_WEBSITE_URL`, `WHISH_PAY_LIVE_PUBLIC_ORIGIN`. The issued website value is `theleeexperience.com`; canonical public origin is `https://www.theleeexperience.com`.
3. Keep `WHISH_PAY_LIVE_ENABLED=false` and `WHISH_PAY_LIVE_REFUNDS_ENABLED=false` through initial deployment. Configure the existing `CRON_SECRET` and email settings.
4. Arrange frequent reconciliation. Current Vercel team is Hobby; the checked-in Vercel cron is daily at 06:00 UTC. The prepared `ops/whish-worker` systemd timer calls the authenticated endpoint every five minutes; it is not installed. On a chosen Linux worker, place the script at `/opt/lee-whish/reconcile.py`, put the matching `CRON_SECRET` in root-readable `/etc/lee-whish-worker.env`, install the supplied service/timer, and enable the timer. Confirm successful requests before opening checkout.
5. When deployment/activation is authorized, enable live Whish plus the global WHISH payment method and perform a controlled real payment. Verify callback, order state, ebook access, notification delivery, and reconciliation without the browser open.
6. Refunds require Whish to allowlist the application's outgoing IP. Keep refund execution disabled until hosting egress is stable and provider permission is confirmed, then verify a controlled refund and resulting access/inventory state.

## References

- Provider documentation: https://whish-partners.pages.dev/whish-pay-9z366gc6922w/
- Production API: https://api.whish.money/itel-service/api
- Cron limits: https://vercel.com/docs/cron-jobs/usage-and-pricing
- Local UI screenshots: `.impeccable/whish-live/`
- Browser check: `scripts/whish-live-browser-check.mjs`

Never run the integration suite against a shared or production database.
