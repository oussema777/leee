# Whish Pay sandbox integration

API source: https://whish-partners.pages.dev/whish-pay-9z366gc6922w/ (v2.0.0, reviewed 2026-10-30).

## Release

Deployed and promoted: dpl_Bi5FCzFWUb34UUx79vu7uH9NEFvF on 2026-10-30.
Admin diagnostics: https://www.theleeexperience.com/admin/whish-pay.
Rollback to the admin-only release: dpl_6XLLuof45Ykv7Ui6XJuYrSSowTkC.
Source branch: whish-pay-sandbox, based on 5ca0800, isolated from unrelated main-worktree changes.

## Current progress — 2026-10-30

Awaiting Whish's reply. The user will bring their response back; no further deployment or production activation is pending authorization in this handoff. The short email draft is saved at ../output/Whish_Email_Draft_2026-10-30.txt. The assistant has not sent it; user sending is not confirmed.

Sandbox integration commit: 9752d04. Review-button fix: 0a39a7b. Missing or malformed review codes now show recovery instructions; reviewers can paste the complete link, and hash changes are detected. Chrome testing on the live site passed malformed-link feedback, paste recovery, hash updates, whitespace normalization, actual synthetic-order creation, and mobile layout. TypeScript and the deployment build passed.

The current reviewer link expires on 2026-11-13 at 15:40 UTC. Its capability is stored outside Git in .vercel/whish-review-link.json and the saved email draft. If Whish reviews after expiry, renew access before sharing another link.

Resume when Whish replies: review their acceptance requirements and production credentials/process; resolve the refund auth.error and IP allowlisting requirements; confirm callback retry, polling and settlement expectations. Then implement and validate live stock reservation, shipping, notifications, refunds and reconciliation before a controlled real payment and customer rollout. Real Whish payments remain disabled.

Printed-book and ebook purchases offer Whish sandbox only to signed-in payment administrators. Ordinary public visitors and the global payment-method settings are unchanged. External reviewers use an expiring capability link at /en/whish-test#<token>, with no admin access and a maximum of 20 synthetic USD 1.00 orders.

## Payment handling

Server-calculated package totals/delivery charges or catalog ebook prices are persisted before provider I/O. Printed test orders use LEE-TEST-WHISH- references, do not reserve stock or send real-order notifications, and are blocked by existing shipping validation. Ebook orders use EB-TEST-WHISH- references and require the owning reader plus payment-admin access.

The exact request and externalId are saved before network I/O. Uncertain retries reuse both. Advisory locks make concurrent starts share the same attempt. A new ID is allowed only after a definitive failed state or rejected creation.

Whish calls GET /api/webhooks/whish-pay?id=<uuid>&token=<random-capability>. Both outcome callbacks run the same authenticated status lookup. Neither browser redirects nor callback parameters can establish payment. A forged capability is rejected before querying Whish.

Only verified success can finalize a matching sandbox order with unchanged amount, currency, reference and provider. Order locks prevent duplicate fulfillment. Existing paid ebook access cannot be reassigned. Manual receipt submission and manual payment verification are blocked for hosted Whish orders.

The customer page polls every ten seconds while visible, pauses after six minutes, and retains manual/focus recovery. The existing authenticated daily book-payment cron reconciles at most ten recent order attempts before reservation cleanup. This bounded fallback is not a production real-time settlement service.

## Storage and configuration

No schema migration was needed. BookWhishSettings stores:
- whish-sandbox:<uuid>: exact request, status, callback receipt, error, uncertainty, optional order context.
- whish-checkout:<BOOK|EBOOK>:<order-id>: latest attempt pointer.
- whish-reviewer:<sha256>: enabled flag, Sandbox environment, expiry.

Server variables: WHISH_PAY_SANDBOX_ENABLED, WHISH_PAY_CUSTOMER_TEST_ENABLED, WHISH_PAY_CHANNEL, WHISH_PAY_SECRET, WHISH_PAY_WEBSITE_URL, WHISH_PAY_PUBLIC_ORIGIN.
The issued website header is exactly theleeexperience.com. Callback origin: https://www.theleeexperience.com.
The provider API host is hardcoded to Sandbox.

To stop new customer/reviewer tests, set WHISH_PAY_CUSTOMER_TEST_ENABLED=false and redeploy. Existing checks remain available while Sandbox credentials stay enabled. To revoke a review link, set its exact whish-reviewer record to enabled:false.

Credentials and review-link material stay in ignored .env.whish.local and .vercel files or Vercel secrets. Never commit them. Next.js does not automatically load .env.whish.local; the connection-check script reads it explicitly.

## Validation

44 Whish tests passed, including real isolated PostgreSQL locking, concurrent starts/callbacks, retry recovery, ownership/tampering, cancelled/non-test orders, ebook access, and reviewer expiry/revocation. The integration suite requires WHISH_TEST_DATABASE=true and DATABASE_URL pointing to 127.0.0.1:55441/aramex_test; it rejects other database URLs.

185 selected existing payment, ebook, shipping and card-finalization regression tests passed; 11 other tests were skipped by existing environment gates. A global-row-count assertion initially raced another suite's fixture creation; the affected five-test file passed when rerun alone. TypeScript and Vercel production builds passed.

Real browser tests used purchase dialogs, the official Whish simulation controls, real callbacks, saved order records and protected reading pages. No hidden provider simulation endpoint was used. See whish-uat-report-2026-10-30.md.

## Production boundaries

This release is Sandbox only. Before real payments: obtain Whish acceptance and production credentials, agree settlement/reconciliation operations, and implement/validate production stock reservation, notification delivery and refund entitlement handling.

Refund initiation and automatic refund entitlement updates are not implemented. A sandbox refund probe returned HTTP 200 with status:false and code:auth.error. Its cause needs Whish confirmation; documentation says refund callers need allowlisted egress IPs. Do not describe that probe as a successful refund.
