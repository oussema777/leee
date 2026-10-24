# Live card-payment operations

## Production deployment completed - 24 October 2026

User authorized deployment. Clean release branch audi-production-20261024, application commit 9d000b3, deployed as dpl_4nM6NqeZAKSdVzHZP6cznqtgkgoJ (https://leee-6pw9iu8bm-oussema777s-projects.vercel.app) and promoted to https://www.theleeexperience.com. The six parked packing-slip files were excluded. Original development application files remain unchanged; use the release branch as the deployed source baseline.

Before migration, a custom-format public-schema data/schema backup was created and its archive index checked for BookOrder and EbookOrder data. Private backup and SHA-256/migration evidence: leee-audi-release/.impeccable/audi-production-rollout-20261024/. All five reviewed SQL scripts applied atomically; four tables have RLS and runtime access checks passed. No existing orders, books, inventory or payment records were altered by this deployment.

Clean Vercel build passed on Node 22 with Prisma 7.10.1. First staged build caught an existing asset script assumption that Git metadata exists; scripts/optimize-images.mjs now scans uploaded public images on Vercel when Git is absent. Both Git and no-Git checks passed; retry compiled, type-checked and deployed successfully. This fix was also copied back to leee-audi-release.

Staged and live smoke checks each passed nine page/API checks: homepage, printed books, ebooks, public payment methods, ebook catalog, anonymous admin denial, authenticated method settings, card operations and admin settings page. Live browser checks confirmed Whish OFF in desktop/mobile admin and absent from printed checkout. Public methods: cash available, Whish hidden, live card unavailable; staff TEST access remains separately gated. No orders/payments submitted or settings toggled during smoke tests. Runtime error query returned no matching errors at verification.

Whish OFF is the default central policy; no settings row was inserted. Both admin operations flags liveEnabled and jobsEnabled were false. Audi/Areeba production activation and scheduling remain deferred. No VPS or billing change. Rollback must retain method gating or intentionally pause checkout; earlier code ignores the central switch. Leave additive tables intact.

Evidence: .impeccable/deploy-smoke-staged.json, deploy-smoke-live.json, live-payment-methods.png, live-payment-methods-mobile.png, live-checkout-whish-off.png; clean release build logs under leee-audi-deploy-20261024/.impeccable/.


## Payment switches and deployment-readiness review - 24 October 2026

**Completed locally, not deployed.** Admin > Book Restore > Payment Methods (/admin/payment-methods) now has immediate-save On/Off switches for Whish, Bank Audi cards and cash. Whish defaults OFF when no central settings row exists; cash and Bank Audi switches default ON, subject to their existing readiness/activation restrictions. No hosted settings row was created or changed. The live website's payment options are therefore unchanged until a reviewed deployment.

### Switch behavior and validation

The central policy uses the existing BookWhishSettings table, id checkout-payment-methods; no new migration is required. Admin saves require a signed-in current database administrator, valid origin, bounded strict JSON and the current saved version. Updates serialize and reject stale concurrent saves; updatedBy records the server-authenticated actor. Saved account/QR details are untouched.

Whish OFF removes it from printed-book and ebook checkout, suppresses receiving instructions and QR-test messaging, and prevents new Whish orders. Ebook management testing cannot bypass the switch. ON restores eligibility using saved setup; provider readiness checks still apply. Bank Audi OFF prevents new orders and new checkout sessions, including TEST sessions, but existing result/status verification and recovery remain available. Cash OFF removes cash on delivery/pickup/arrangement. When no eligible method remains, ordering is disabled with a visible paused message. Already-open dialogs refresh on focus and every 15 seconds; server submission checks reject stale choices immediately. Existing order history, stock/access state and reports of money already sent are retained.

Validation: **772 tests passed across 93 files, zero skipped**, including all configured payment, ebook and Aramex local integrations. The final npm production build (assets, Prisma generation, TypeScript and webpack) passed. The new browser script exercised real local admin saves and printed checkout, ebook hide/restore using real method availability with fixture identity/content, all-methods-off blocking, no disabled card placeholder, and mobile layout. Previous TEST/live checkout and staff-operations browser regressions also passed. Screenshots inspected. Tests created no customer payment/order; local settings and temporary UI fixture records were restored/removed.

Evidence: .impeccable/payment-switch-tests-final.log, payment-switch-build.log, payment-switch-browser.log, payment-switch-live-regression.log, payment-switch-test-regression.log, payment-switch-ops-regression.log, payment-methods-off-desktop.png and payment-methods-mobile.png. Reproduce switch UI coverage with scripts/payment-methods-browser-check.mjs against the dedicated local database/preview. The browser harness supplies the canonical Origin through its local request proxy; application origin protection was not weakened.

### Certificate packaging resolved

The earlier NODE_EXTRA_CA_CERTS deployment-path requirement is superseded: src/lib/supabase-ca.mjs bundles the verified public Supabase Root 2021 CA, and prisma-adapter.mjs supplies it only for recognized Supabase database/pooler hostnames. Chain and hostname verification remain enabled; insecure SSL mode is refused for this automatic trust configuration. Certificate identity is fingerprint-tested and the certificate is present in the built server chunks. Both hosted pooler endpoints passed five read-only probes again with NODE_EXTRA_CA_CERTS unset. No private certificate/key was copied into source; this is a public root CA. Track its 26 April 2031 expiry and Supabase rotation notices.

### Deployment review findings

- Hosted read-only schema metadata confirms BookWhishSettings is present with the fields needed by the switches. The four new live-payment tables are not installed: CybersourceLiveAttempt, CardPaymentOutbox, CardPaymentOpsNote and CardPaymentJobStatus. They must be installed before operating the complete live-payment features. No remote SQL migration was run.
- Rehearsed all five additive Audi SQL files, in this exact order, in a disposable local database: live_settlement, background_jobs, live_sessions, submitted_session, operations (all prefixed prisma/changes/20261024_cybersource_). RLS on four tables, operations field and SUBMITTED session constraint passed. scripts/audi-migration-rehearsal.ps1 creates/drops only its guarded local rehearsal database. Evidence: .impeccable/audi-final-migration-rehearsal.log.
- Required runtime: Node 22.x, reviewed DATABASE_URL and DIRECT_DATABASE_URL, sufficiently long JWT_SECRET and CRON_SECRET; separate live merchant/key/secret only after bank activation; configured sender/recipient and Resend key for live email. Local environment copies passed secret-length checks and contain a mail key; live credentials are absent and all seven live flags are off. These are not a fresh audit of Vercel's environment values. Do not print or paste secret values during rollout. Sanitized metadata evidence: .impeccable/audi-rollout-readiness.json.
- Vercel Hobby and any move to Pro/VPS remain user decisions. No hosting change, billing change or minute scheduler was activated. Existing vercel.json is unchanged. Do not merge the separate Pro scheduler proposal while that choice is deferred.
- Review file inventory: ops/audi-release-review.json lists 135 candidate files relative to the deployed-base commit and six parked packing-slip/label files to exclude. Build a clean release checkout from that inventory and test it before publishing; do not deploy the entire dirty worktree. Existing .vercelignore excludes local evidence, private source ebooks, docs and media artifacts. Original leee-experience application files/dependencies are unchanged; only progress documentation is synchronized.

### Rollout order and rollback decisions

1. Select hosting/scheduling, confirm bank activation and review the release scope. Keep live customer gates OFF. Verify the target runtime configuration without revealing secret values.
2. Take and verify a database backup, inspect migration state, then apply the five reviewed additive scripts once in dependency order under separate rollout authorization. Do not run prisma db push against production. Confirm RLS, application access and required columns.
3. Build the clean reviewed release, deploy it with live gates OFF, and check admin authentication, public content, both checkout types, payment switches and database TLS from the deployed runtime. First-use Whish remains OFF by default. Enable only approved methods whose setup is ready.
4. Activate the approved scheduler/alerts and bank gates only after their checks and authorized real transaction verification. A method switch alone must never activate an unconfigured live gateway.
5. For an incident, disable the affected method/new checkout and keep existing payment recovery available where safe. Preserve ledgers, audit data, ciphertext, already-paid orders and secrets used to decrypt existing sessions. Prefer a forward fix. Earlier code predating these switches ignores the central row: do not blindly roll back to it and assume Whish remains hidden. Use a version retaining the switch or intentionally pause checkout during rollback. Additive tables stay in place; do not drop them or restore an old database snapshot over new orders as a routine code rollback.

Remaining external gates: Audi/Areeba activation and production validation; hosting/scheduling choice and alert destination; approval for production migrations/deployment. This review does not claim an independent penetration test or authorize those actions.


## Hosted database connection check - PASS, 24 October 2026

User authorized a read-only hosted database check after the local upgrade. Both configured endpoints passed with Prisma 7.10.1 and certificate/hostname verification enabled (verify-full): runtime transaction pooler on port 6543, and the configured migration/session pooler on port 5432. The latter is a session pooler, not a separate direct database hostname.

Initial attempts correctly refused the untrusted certificate chain (P1011 / SELF_SIGNED_CERT_IN_CHAIN), before executing queries. Obtained the public Supabase Root 2021 CA from the HTTPS download URL identified in Supabase's official Studio source, checked its CA identity and validity, and supplied it using NODE_EXTRA_CA_CERTS only to the local checking process. No global certificate store, application environment file, Vercel setting, database setting or deployed application was changed. Verification was never disabled.

Five read-only transactions passed: four runtime checks including concurrent/reused pooled connections, plus one session-pooler check. Each explicitly set READ ONLY and checked SELECT 1/current transaction mode. Runtime checks also selected zero rows from BookOrder and EbookOrder to verify table access without retrieving customer/order data. No migrations, records, schema changes, payments or emails were performed.

Evidence: .impeccable/prisma-hosted-readonly-result.json and .impeccable/prisma-hosted-readonly.mjs. Public certificate saved as ops/certificates/supabase-prod-ca-2021.crt, valid until 26 April 2031; SHA-256 fingerprint 80:70:25:AD:50:D4:ED:21:9D:2C:9C:7D:29:9C:00:4F:82:4E:B0:0C:F7:F6:5A:FE:F6:07:D0:7B:72:E6:CA:FA.

**Deployment requirement:** package this public certificate and set NODE_EXTRA_CA_CERTS to its absolute runtime path before Node starts, or configure equivalent explicit database CA trust. Its presence in the repository alone does not activate trust or guarantee inclusion in Vercel function bundles. Validate the packaged path and rerun the read-only check from the chosen hosting runtime before exposing the upgraded deployment. This workstation check resolves database/driver compatibility with the supplied CA; it does not prove a future hosting environment is correctly configured. The website remains unchanged and deployment still requires its own review.

Certificate provenance: [official Supabase Studio certificate URL configuration](https://github.com/supabase/supabase/blob/master/apps/studio/hooks/custom-content/custom-content.json), [official download](https://supabase-downloads.s3-ap-southeast-1.amazonaws.com/prod/ssl/prod-ca-2021.crt), [Supabase SSL instructions](https://supabase.com/docs/guides/platform/ssl-enforcement).


## Current Prisma upgrade review - 24 October 2026

**Local acceptance: PASS. Deployment: HOLD pending production connection/runtime validation.** This update supersedes the three deferred tooling advisories below. Prisma CLI, client and PostgreSQL adapter are pinned to 7.10.1. Both full and production npm audits now report zero known vulnerabilities. The prior three warnings were three affected packages in one deepmerge-ts vulnerability chain, not three independent root causes.

The upgrade is retained only in leee-audi-release. Original leee-experience source and installed dependencies were not upgraded, so its existing development setup is preserved. Documentation is updated in both workspaces. No deployment, push, production database query/write, production migration, live charge, refund or outbound message occurred.

### Changes and compatibility review

- Adapted all 58 existing client-construction files, including the application, maintenance/seed/export scripts and integration tests, to the PostgreSQL driver adapter. Existing Prisma model/type imports and the supported prisma-client-js generator are retained to avoid unrelated import/module changes; that generator should be revisited before a future Prisma major upgrade.
- Moved the CLI datasource configuration into prisma.config.ts using DIRECT_DATABASE_URL only. Application clients use DATABASE_URL only; explicitly missing direct/script URLs cannot silently select runtime credentials. Generation works without contacting a database.
- Preserved the configured connection_limit=5 and schema option. Set bounded connection acquisition and idle timeouts. The adapter uses unnamed queries by default, compatible with transaction poolers; actual hosted pooler compatibility remains a rollout check.
- Remote URLs without an explicit TLS mode now default to verify-full. No certificate-verification bypass was added. The actual hosted database certificate/CA was not tested; configure the correct CA if required, rather than disabling validation.
- Kept environment-loading behavior explicit: standalone scripts that previously relied on Prisma loading .env now load it themselves. Scripts already using Next's environment loader retain their precedence. Local-only scripts do not load remote credentials through the adapter.
- Declared Node 22.x for the application (tested on 22.20.0). Confirm deployment/build runtime before rollout.
- Verified the data models are byte-identical to the pre-upgrade schema after removing the two relocated datasource URL fields. **This Prisma upgrade requires no database schema migration.** Earlier Audi feature SQL migrations are separate and still pending production rollout.

### Evidence and acceptance checks

| Check | Result |
| --- | --- |
| Pre-upgrade full suite with all dedicated local DB flags | 761 passed, zero skipped |
| Post-upgrade full suite including adapter safeguards | 763 passed across 92 files, zero skipped |
| Final TLS/default-connection safeguard tests | Two passed after final adapter adjustment |
| All generated models against isolated PostgreSQL | 73 model reads passed; parameterized SQL and rollback passed |
| Real built-app HTTP/database regression | Eight admin list APIs, anonymous access denial, blog create/update/delete passed |
| Browser regression | TEST checkout, prepared live checkout and staff operations/map passed; gateway responses mocked |
| Prisma validation, TypeScript and full npm production build | Passed; assets check and client generation included |
| Standalone changed JavaScript syntax | 26 modules parsed successfully |
| Dependency audits | Full zero; production zero known vulnerabilities |

The HTTP harness initially used a nonexistent team endpoint and an insufficient fixture role; correcting the harness to the real team-submissions route and local SUPER_ADMIN fixture passed without weakening application authorization. Test fixture users/posts were cleaned up. No application defect was hidden by changing an assertion.

Evidence: .impeccable/prisma-before-tests.log, prisma-final-tests.log, prisma-adapter-final.log, prisma-final-build.log, prisma-validate.log, prisma-runtime-check.log, prisma-live-browser.log, prisma-test-browser.log, prisma-ops-browser.log, prisma-audit-full.json and prisma-audit-production.json. Reproducible additional checks: scripts/prisma-upgrade-check.mjs and scripts/prisma-runtime-check.mjs; both refuse nonlocal test targets.

### Release gate and rollback

Before deployment: validate the real hosted database TLS trust and transaction pooler connection with the new driver in an approved staging/read-only check, confirm Node 22.x, and deploy this upgrade as a reviewed change. Local success does not prove the real provider connection or certify the complete website against every possible regression. Historical maintenance scripts were adapted/type- or syntax-checked, not executed against real content. Bank activation, genuine live payment/refund verification and scheduler/alert activation remain separate gates.

Pre-upgrade snapshot: ../.audi-prisma-upgrade-backup (780 source/config/doc files, including package manifests; no secrets or node_modules). Changed-file inventory: .impeccable/prisma-upgrade-changed.json. To undo only this upgrade in the release workspace, restore existing files from that snapshot, remove only the newly added adapter/config/check files named in the inventory, then npm ci to restore Prisma 6 and regenerate its client. Do not reset unrelated Audi work or parked packing-slip changes. No data rollback is required for this library upgrade.

Official references: [Prisma 7 migration guide](https://www.prisma.io/docs/guides/upgrade-prisma-orm/v7) and [the original deepmerge-ts advisory](https://github.com/advisories/GHSA-ggr8-5vv4-36mx).


This runbook prepares operations; it does not authorize deployment, gateway activation, customer emails, charges or refunds.

## Staff workflow

Open **Bank Audi Payments → Review live payments and email delivery**. Only current database ADMIN/SUPER_ADMIN accounts can use the API. Review the order, transaction reference, gateway result and email state. Add a factual note (minimum five characters); never include card numbers, CVV, private keys, access tokens or customer login codes.

**Save note** adds an immutable audit entry identifying the signed-in staff member. **Queue payment check** schedules the existing attempt for the background verifier, with a note and stale-record check. It preserves the session, payment proof, stock and order status. It cannot start another charge. Refresh after the next successful background run.

| Situation | Procedure |
| --- | --- |
| Captured payment, order still payable | Verifier applies payment atomically and queues confirmation. Do not manually mark paid. |
| Capture after cancellation/expiry, duplicate capture or changed order | Keep fulfillment on hold. Compare the exact merchant, reference, amount, currency and transaction in Cybersource. Record findings; contact Audi/Areeba if uncertain. |
| Failed authentication, decline, unknown result or interrupted checkout | Recheck first. A missing reporting result is not evidence that no money moved. Do not reopen or create a replacement payment automatically. |
| Refund needed | Obtain authorized bank-side refund instructions and human approval. Record the actual bank transaction and outcome only after verification. This screen does not issue refunds. |
| Pending email | Worker retries the frozen payload with the same Resend key. Do not manually duplicate it. |
| Email DELIVERY_WINDOW_EXPIRED | Verify provider delivery before any resend: the original idempotency window has passed. The application deliberately refuses automatic resend. |
| Scheduler alert / failed heartbeat | Check configuration, secret, plan, route logs and database availability. Fix the cause and verify a successful heartbeat. |

Automatic payment retry after a definitive decline is intentionally not enabled. Before implementing it, confirm Areeba's production reporting/retry behavior and test that no authorization/capture remains. Existing customer routes enforce one saved intent per order. An operator note is not permission to bypass that invariant. These unresolved financial decisions remain for the user's return.

## Scheduler preparation

Run `node scripts/prepare-card-schedule.mjs --plan=pro` only after confirming Pro (or `--plan=enterprise`). This generates a reviewable alternate config at `ops/vercel.card-payments.prepared.json`; it does not change `vercel.json` or deploy. Retain the other existing schedules when merging it during rollout.

Target: `GET https://www.theleeexperience.com/api/cron/card-payments`, once per minute, with `Authorization: Bearer <CRON_SECRET>`. Store the secret in the scheduler's secret store, not the URL or source files. The app requires at least 32 characters. No request body or payment data is needed. Vercel supplies this header from CRON_SECRET for its own scheduler.

[Vercel allows minute-level cron on Pro/Enterprise; Hobby is limited to daily runs.](https://vercel.com/docs/cron-jobs/usage-and-pricing) Daily scheduling is unsuitable for timely payment recovery. If remaining on Hobby, approve an external HTTPS scheduler with secret storage and monitoring; no service/account/billing change has been made. The available team response did not expose billing plan, so plan confirmation is a return item.

The worker claims a three-minute run lease and per-payment/mail leases, so overlapping delivery cannot duplicate settlement. A crashed run is reclaimed after the lease. Staff see the last run, failures and a stale warning after five minutes. This in-app monitoring does not replace an external uptime alert if the entire site is down. Customer status checks remain at ten seconds and do not depend on the cron interval.

## Rollout and rollback

1. Review the security report and return checklist. Confirm Audi/Areeba production activation, merchant identity, credential scopes and refund/retry process.
2. Back up the application database. Apply the additive SQL changes in chronological dependency order: live_settlement, background_jobs, live_sessions, submitted_session, operations. Verify RLS and the existing server database role. No migration runs automatically during builds.
3. Configure separate live merchant/key/secret, JWT storage secret, CRON_SECRET, sender and email credentials through secret management. Never put them in NEXT_PUBLIC variables, source control, shell logs or review notes. Preserve existing storage keys until encrypted sessions are safely retired.
4. Deploy only reviewed Audi/security files; exclude parked packing-slip changes and local artifacts. Configure the approved scheduler. Initially keep CYBERSOURCE_LIVE_CUSTOMER_ENABLED=false.
5. Enable backend gates as approved: LIVE_ORDER_CREATION, LIVE_SESSION, LIVE_LOOKUP, LIVE_FULFILLMENT, LIVE_JOBS and LIVE_EMAIL (all prefixed CYBERSOURCE_ and suffixed _ENABLED). Verify heartbeat and authorized small real purchase/refund checks for printed books and ebooks, with inventory and access checks. Provider API credentials/session payload must be validated against actual production responses.
6. Enable CYBERSOURCE_LIVE_CUSTOMER_ENABLED only after checks pass. Monitor unresolved payments and email delivery.

To stop new charges, turn off CYBERSOURCE_LIVE_CUSTOMER_ENABLED. Authenticated status reads and backend recovery remain available. Keep recovery/mail gates active unless those systems themselves are unsafe; stopping all recovery during a bank incident can hide late captures. Do not roll back to code that cannot recognize existing live snapshots. Prefer the checkout kill switch and a forward fix; preserve ledger/audit tables and ciphertext. Vercel rollback does not automatically remove cron schedules; check scheduling explicitly.

## External alert requirement

The new dashboard provides operational alerts. External downtime notifications and escalation recipients still require a selected service/recipient and authorization. No email or message was sent during local engineering. Add external monitoring of endpoint success/heartbeat at rollout, without exposing CRON_SECRET in public probes.

## Autonomous engineering and security review - 24 October 2026

### Review layers and results

1. **Payment correctness:** server-owned amounts, merchant/reference/currency bindings, one saved intent, encrypted session resume, submitted/uncertain-session holds, atomic settlement and stock/access handling remain enforced. Contradictory capture statuses now require review. Existing and new integration tests exercise concurrency, stale writes, late capture and duplicate handling using isolated PostgreSQL.
2. **Access and input security:** staff APIs re-read current database roles, enforce exact origin on mutations, bound streamed JSON, reject forged actors/actions, and use optimistic concurrency. Removed the shared fallback JWT signing secret; authentication now fails closed without a 32-character secret, restricts HS256 and validates required claims. Existing installations with missing/short JWT_SECRET must configure a strong secret before rollout; do not deploy this change blindly. Customer checks now use a persisted ten-second throttle across instances; printed-order creation also has a persistent limit.
3. **Operational resilience:** overlapping job runs are leased, crashed jobs can be reclaimed, errors are sanitized and staff see failed/stale heartbeats. Queueing a check cannot charge, refund, mark paid or clear uncertain payment evidence. Turning off new customer payments still permits authenticated status reads and recovery.
4. **Browser review:** TEST checkout, prepared live checkout and staff operations Playwright scripts passed. Checks include visible waiting feedback, automatic success, ebook access link, Arabic/mobile layout, stale-note conflicts and escaped HTML in staff notes. Patched D3 color dependencies were checked against the map. Provider responses were mocked; this is not bank certification.
5. **Dependency review:** production audit decreased from 12 advisories (one critical, eight high, two moderate, one low) to zero known advisories. Next is 16.4.3; Sharp 0.35.5 and d3-color override 3.1.0 were included with other lockfile fixes. Full audit still reports three high advisories through development tooling Prisma 6 / @prisma/config / deepmerge-ts. npm's proposed remediation requires a Prisma major upgrade; this is explicitly deferred rather than forced into payment changes. Zero production advisories is not proof of complete security.

Full suite: **700 tests passed; 61 skipped**, 85 files passed and six skipped. Separate Aramex/ebook integration suites lacking their dedicated configuration were skipped; the configured Cybersource database tests ran. Final TypeScript check and production webpack build passed. Existing middleware-convention deprecation warning remains. No independent penetration test or production provider end-to-end validation was performed.

Evidence in the release worktree: .impeccable/audi-full-suite-final.log, audi-typecheck-final.log, audi-security-build.log, audi-security-production-final.json, audi-security-installed.json, card-operations-desktop.png and card-operations-mobile.png. Browser scripts: scripts/cybersource-customer-browser-check.mjs, cybersource-live-browser-check.mjs and cybersource-operations-browser-check.mjs. Only the isolated local database was migrated. The original development server and production website were left untouched.

### Decisions and checks for the user's return

- Obtain Audi/Areeba production activation and credentials, confirm actual signed-session/reporting statuses and refund/decline retry rules, then authorize controlled live verification. No automatic uncertain-payment retry was added.
- Confirm hosting plan or choose an external minute scheduler. The generated Pro schedule is only a proposal; it does not establish the actual plan. Choose an external alert service and recipients; dashboard alerts are implemented, outbound alerts are not.
- Review additive migrations and production secret readiness, particularly JWT_SECRET. Approve deployment separately, excluding parked packing-slip work. No secrets or production settings changed in this session.
- Schedule the remaining development-tool vulnerability remediation as a separate Prisma major upgrade with migration testing.
- The release worktree has an isolated updated dependency installation. Source/manifests are synchronized with backups; the original workspace still has its old installed dependencies. Stop its development server and run npm ci before testing there. Do not reuse the old shared node_modules junction for the release build.

References used for dependency assessment: [Next Windows advisory](https://github.com/advisories/GHSA-p293-qw3h-jr36), [Sharp advisory](https://github.com/advisories/GHSA-f88m-g3jw-g9cj), and [Zod advisory](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5). Audit evidence reflects the registry results during this session and should be refreshed before deployment.
