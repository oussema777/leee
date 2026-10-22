# Aramex storage rollout and UAT checklist

Prepared 22 October 2026. This is an execution checklist, not evidence of carrier approval.
Current implementation history: [integration report](aramex-integration-preparation.md).

## Where we are

Local implementation supports shipping drafts, submission orchestration and UAT transport, uncertain-booking recovery, saved tracking history, missed-update lookup, existing-shipment label retrieval, and an unmatched tracking inbox. The last application test run passed 261 tests across 21 files; carrier requests were mocked. TypeScript and targeted mobile browser checks passed.

**The admin shipment-submit endpoint and staff review/send UI are implemented, but sending remains disabled in this environment.** The endpoint returns `503 SUBMISSION_DISABLED` unless `ARAMEX_UAT_SUBMISSION_ENABLED=true`. Activation also requires strict verified shipment settings and separate UAT credentials. No flag was enabled in this work. Staff see an unavailable state until server configuration is ready.

Recovery and tracking SQL migrations were applied to the configured application database on 22 October 2026 at 21:59 UTC. The storage verification and runtime-role reads passed. Existing shipment/attempt counts remained 1/0; new recovery/tracking tables were empty. A schema-only restore reference and migration hashes are saved locally in the ignored `.impeccable/aramex-storage-rollout/2026-10-22T21-59-33-394Z/` folder. This was a database rollout, not a website-code deployment or carrier activation.

Latest user update: Manal says she did not receive the reset email, so password setup/access is not complete. This does not overturn Nour's earlier confirmation that the production account was registered on Aramex's side. UAT registration remains unconfirmed. Request a new reset email to `m.hassoun@theleeexperience.com` and separate confirmation of UAT registration. Fixed outbound IP whitelisting, account settings and carrier sign-off remain pending.

### Selected fixed-IP approach (updated 23 October)

Fixie is deferred: signup requires a payment card and the user does not want to use a personal card. The user instead authorized investigating an existing Eventra VPS without disrupting Eventra. Read-only checks confirmed Ubuntu 24.04.3, Python 3.12.3, spare resources and public outbound IPv4 `72.61.160.199`. DNS `aramex-gateway.theleeexperience.com` resolves there. The user installed a separate Nginx virtual host and obtained a dedicated Let's Encrypt certificate; Public HTTPS health now returns 200 and unauthenticated tracking requests return 401. Existing Eventra sites, PM2 processes and MongoDB were not edited by our instructions.

A separate loopback-only UAT relay in `ops/aramex-gateway/` has a constrained systemd unit and nine passing local mocked-transport tests. The user confirmed successful installation and an active service on 23 October. Public HTTPS proxying and automatic startup are confirmed. A certificate-renewal reload hook was installed and syntax checked. Full staged instructions/status: [gateway README](../ops/aramex-gateway/README.md). All three configured application operations now require the authenticated gateway transport in local code. The user reported saving the gateway URL and key in Vercel Production and Preview on 23 October; the values remain unverified. Deployment, authenticated verification, UAT access and Aramex whitelisting remain pending. No additional subscription is needed for this relay, but it shares VPS availability and resources with Eventra.

### Earlier Fixie alternative (deferred)

Use Fixie HTTP/HTTPS outbound proxy for Aramex requests while retaining Vercel hosting. Start with its free UAT tier (500 requests and 100 MB/month); consider Commuter ($5/month, 2,500 requests and 500 MB) or Cruiser ($19/month, 25,000 requests and 10 GB) based on measured usage. These are current listed prices checked on 22 October 2026: [Fixie pricing](https://usefixie.com/pricing). Provider states plan changes retain assigned addresses. Native Vercel Static IPs are another option, but currently cost $100/project/month plus regional private transfer on Pro: [Vercel documentation](https://vercel.com/docs/networking/static-ips).

Provision Fixie through its [Vercel integration](https://usefixie.com/documentation/vercel), retain credentials in secret environment configuration, and obtain every assigned outbound IP from its dashboard. Ask Aramex to whitelist the complete assigned set and confirm shared proxy IPs are accepted. Route only the server's Aramex HTTP requests through HTTPS CONNECT tunneling, with no fallback to changing native egress if the proxy fails. This Fixie alternative is not implemented; current local app factories use the VPS gateway instead. Merely installing Fixie or setting FIXIE_URL does not reroute native fetch automatically.

Verify egress from the deployed Vercel runtime before carrier testing. Keep all Aramex flags off until UAT access and whitelisting are confirmed. No proxy subscription, IP assignment, secrets or hosting change was performed when recording this recommendation. Future provider/hosting changes require verifying the replacement IPs and obtaining Aramex whitelist confirmation before switching.

Post-rollout local HTTP smoke check against the real configured database passed: authenticated inbox/recovery/tracking GETs returned 200; unauthenticated inbox returned 401; label lookup remained unavailable; shipment submission returned 503 `SUBMISSION_DISABLED`. Inbox contained zero unmatched events. The test used an existing admin with an in-memory short-lived local session; no user/customer records or credentials were emitted or changed. No carrier call occurred. This verifies the local application, not a deployed website build.

## 1. Storage rollout procedure (completed for the configured application database)

Executor: developer/database operator. No Aramex account access is needed for this step. The following procedure is retained for other environments and recovery reference; do not rerun the apply-once migrations on the completed target.

1. Identify the intended database/environment privately. Confirm the actual connection destination; a local dev server may use a shared database. Do not print connection URLs or passwords into logs.
2. Confirm a current backup/restore point and the runtime server role. Check that `public."BookShipment"` and `public."BookShipmentAttempt"` already exist and whether either pending table already exists. Check the deployment/change log rather than assuming a previous failed command rolled back every file.
3. Keep `ARAMEX_UAT_TRACKING_ENABLED`, `ARAMEX_UAT_LOOKUP_ENABLED`, `ARAMEX_UAT_LABEL_ENABLED` and `ARAMEX_UAT_SUBMISSION_ENABLED` false during storage rollout.
4. Apply each absent migration once, in order, using the intended direct database connection and a role allowed to create tables/indexes and enable RLS:

   - [Recovery audit storage](../prisma/changes/20261022_aramex_reconciliation.sql)
   - [Tracking storage](../prisma/changes/20261022_aramex_tracking.sql)

   The older `20261020` draft and submission files are prerequisites, not files to rerun when already installed. Do not use `prisma db push` or `prisma migrate dev` against the shared database for this rollout.

5. Run [read-only verification SQL](../prisma/changes/aramex-verify-storage.sql). It checks required columns, enabled RLS with no policies, valid named indexes and restricted-delete/cascading-update foreign keys. It is a targeted check, not a full schema-drift comparison or a runtime permission test.
6. Validate access through the application's actual runtime role. An owner/superuser passing the SQL check does not prove runtime access. Use authenticated admin reads of the inbox and an existing shipment's recovery/history. Confirm unauthenticated/non-admin requests are rejected. Do not solve runtime access failures by adding public RLS policies.
7. Record migration filenames, SHA-256 hashes, target environment, executor, UTC time and verification outcome in the deployment record. These standalone SQL scripts do not register themselves in Prisma's migration ledger.

For an operator who has already configured their connection securely through libpq environment variables or a service definition:

```powershell
# No connection URL is embedded here. Check the configured destination first.
$psql = 'C:/Program Files/PostgreSQL/18/bin/psql.exe'
& $psql -X -v ON_ERROR_STOP=1 -f prisma/changes/20261022_aramex_reconciliation.sql
if ($LASTEXITCODE -ne 0) { throw 'Recovery migration failed; inspect before continuing' }
& $psql -X -v ON_ERROR_STOP=1 -f prisma/changes/20261022_aramex_tracking.sql
if ($LASTEXITCODE -ne 0) { throw 'Tracking migration failed; inspect before continuing' }
& $psql -X -v ON_ERROR_STOP=1 -f prisma/changes/aramex-verify-storage.sql
if ($LASTEXITCODE -ne 0) { throw 'Storage verification failed' }
```

Each migration has its own transaction, 5-second lock timeout and 30-second statement timeout. If the first succeeds and the second fails, the first remains installed. Stop, inspect and apply only the missing migration. These scripts intentionally fail on repeated application rather than silently accepting an unknown existing schema.

If application verification fails, leave carrier switches off and repair forward. Preserve audit/tracking records; do not drop tables as an operational rollback. Earlier application code can continue without using these additive tables. This step makes storage available; it does not deploy code or activate carrier integration.

### Rehearsal evidence

`scripts/aramex-migration-rehearsal.ps1` uses only PostgreSQL at `127.0.0.1:55441`, creates a uniquely named disposable database, applies all four SQL files, verifies storage, deliberately attempts a duplicate tracking migration, verifies the schema again and removes its own database. It never reads application connection variables. It requires the dedicated local PostgreSQL cluster to be running.

The rehearsal passed on 22 October 2026. Its parent `BookOrder` table contains only the referenced key; full-schema behavior is covered separately by the 261-test application suite. An initial rehearsal-harness failure was caused by PowerShell stripping quoted SQL identifiers; using standard input fixed the harness. No migration SQL change was needed. No application database was modified.

## 2. Close the account and operating questions

Suggested owners below are handoff roles, not confirmation that anyone has accepted the task.

| Needed evidence | Suggested owner | Current status |
| --- | --- | --- |
| Production password successfully created for the corrected email | Manal / Aramex | Manal reports reset email not received; resend needed |
| UAT registration complete and UAT password created | Aramex / Manal | Pending confirmation |
| Dedicated UAT account number, PIN, entity, country and API version | Aramex / developer | Must be verified; no production fallback |
| Fixed outbound IP provisioned and whitelisted; actual deployed runtime uses it | Developer / Aramex | Pending; no proxy is wired into the app factory |
| Lebanon domestic product/payment codes and services for prepaid and COD | Aramex | Pending account-specific approval |
| COD enabled, rates, COD fees, currency and settlement arrangements | Aramex commercial/finance contact | Pending; local COD amount is not settlement evidence |
| Sender address/contact, dispatch/pickup process and goods origin | Operations / Aramex | Confirm before booking tests |
| Origin entity, label ReportID and required parcel/recipient fields | Aramex | Verify actual account settings; do not copy sample values |
| Webhook endpoint, shared-secret delivery, acknowledgement and retry expectations | Developer / Aramex | Agreement and registration pending |
| Required test cases, sample AWBs and explicit UAT approval | Aramex | Pending |

Documentation already supports: matching approved city names, appropriate country phone formats, testing intended requests on UAT, PrintLabel for existing AWBs and obtaining Aramex confirmation before production. The remaining questions concern this account and actual behavior, not whether those APIs exist.

## 3. Configure the implemented UAT submission path

The authenticated route now calls the existing submission service and UAT transport behind a default-off UAT-only gate. It preserves idempotency, preflight validation, order/draft checks and UNKNOWN/SUBMITTING recovery protections. Configure `ARAMEX_UAT_SHIPMENT_SETTINGS_JSON` with the strict `shipmentSettingsSchema` shape in `src/lib/aramex/shipment-request.ts`: environment UAT, complete sender/contact/address, goods origin, label ReportID, explicit recipient-email requirement, and approved prepaid/COD product/payment/service settings. It rejects unknown fields, production environment and arbitrary endpoints. Separate UAT credentials and `ARAMEX_UAT_GATEWAY_URL` / `ARAMEX_UAT_GATEWAY_KEY` are required; there is no production or direct-network fallback. The URL must be https://aramex-gateway.theleeexperience.com and the key must be the 64-character secret generated on the VPS. Keep it server-only. Verify deployed gateway authentication and infrastructure egress independently before enabling.

The POST body contains only `expectedDraftVersion` (positive integer), `confirmedUat: true`, `shippingAt` and `dueAt` (ISO timestamps with timezone). Shipping must be in the future and within 7 days; due time must be on/after shipping and within 30 days of it. These are application input bounds, not carrier delivery promises. The route uses the saved order/draft and the current admin actor, ignores no extra fields (it rejects them), and caps request bodies at 4 KiB. It returns only safe result fields, not preparation or carrier payloads. Once an attempt is claimed, browser disconnects must not trigger a duplicate send; server result handling continues under the existing timeout.

The staff review/send screen now shows saved recipient/address, parcel count/weight and collection amount before requesting explicit dates and UAT confirmation. It uses the browser timezone and sends ISO timestamps; required fields have red markers. Unsaved changes, stale drafts, unapproved cities and ineligible booking states block sending. A rejected draft must be reviewed and saved again. Editing and in-app navigation are guarded while sending. Known outcomes reload the authoritative shipment state; a failed/lost/60-second timed-out browser response locks sending until reload, because client failure does not prove the carrier did not book. The server remains the authority for eligibility and duplicate prevention. Do not enable the route until account/service settings and test routing are verified.

Initial carrier connectivity/contract checks may use Aramex's supplied UAT Postman collection with synthetic test recipients. Capture the resulting AWBs and responses securely. Postman success alone does not establish the application's database, UI, retry or routing behavior. `scripts/aramex-check.mjs` is an older production-oriented check and must not be used as the UAT checklist command.

## 4. Execute UAT and record evidence

Use approved test contact/address data and test parcels. For each case record date, operator, build/commit, environment, order reference, AWB where applicable, expected result, actual result, sanitized request/response evidence and Aramex review outcome. Never put credentials or full customer data into this document. Mark each case NOT RUN until actual carrier evidence exists.

| Case | Expected outcome | Current evidence |
| --- | --- | --- |
| UAT authentication through deployed outbound IP | Account accepted from the whitelisted address | NOT RUN |
| Approved city + Lebanese phone; unmatched city/invalid phone | Valid request accepted; invalid values prevented before booking | Local tests only |
| Prepaid SELF order | Exactly one shipment; no recipient COD collection | Local tests only |
| COD SELF order | Agreed COD service/currency and server-derived collect amount | Local tests only |
| Paid gift vs unpaid gift | Recipient details used; no gift-recipient charge; unpaid gift blocked | Local tests only |
| One parcel, multiple parcels, packed weight and dimensions | Correct piece count/weight and carrier-accepted optional dimension behavior | Local tests only |
| Repeat submit / stale order / edited draft | No duplicate booking; stale input blocked | Local tests only |
| Carrier validation rejection | Safe actionable error; review/save required before another attempt | Local tests only |
| Timeout or lost response after possible booking | UNKNOWN/SUBMITTING remains protected; verify carrier result before retry | Local tests only; coordinate fault test |
| Recorded CREATED / NOT_CREATED recovery | Evidence and actor retained; no automatic rebooking | Local tests only |
| PrintLabel and repeat print | Label matches existing AWB; no new shipment; readable agreed label format | Local tests only |
| Webhook auth, valid event, replay and unknown AWB | Authenticated receipt, deduplication, durable unmatched inbox | Local tests only |
| Event before booking, then confirmed booking | Exact UAT AWB links history; inbox clears after linking | Local tests only |
| Direct tracking lookup after missed callback | Missing events added; webhook/API overlap deduplicated | Local tests only |
| Older, unknown, partial, returned or contradictory events | Accurate timeline and review flag; no false full-delivery claim | Local tests only; mapping needs carrier review |
| Unauthorized admin/API access | No customer tracking data disclosed | Local tests only |
| Shipment/tracking actions | Order payment, stock and COD settlement remain unchanged | Local tests only |
| Actual test pickup/dispatch process if required by Aramex | Agreed operational handoff demonstrated | NOT RUN; scope to confirm |

Do not induce ambiguous carrier bookings repeatedly to test recovery. Coordinate fault scenarios and reconcile every AWB before continuing. An empty tracking response is not proof that a shipment was never created.

The webhook adapter currently returns 200 for linked events and 202 for durably stored unmatched events. Validate Aramex's acceptance/retry behavior for both. Tracking and label parsers require response correlation; validate real UAT response shapes before relaxing or changing assumptions.

## 5. Daily handling and production exit criteria

Operations checks the unmatched inbox during UAT sessions. Investigate each AWB using carrier evidence; do not link by free-text order reference or dismiss an unexplained event. Unknown/conflicting tracking codes require review. Agree a retention period and operational owner before production; no deletion job exists today.

Production requires all agreed UAT cases passed, Aramex's written approval, account/fees/COD terms confirmed, production-specific credentials/configuration reviewed, deployed egress verified, operational dispatch/label handling ready, and a documented disable-and-reconcile procedure. Current code does not provide a verified production shipment transport rollout. Removing `uat` from a URL is not the complete application release process.

## Working estimate

These are planning ranges, not a commitment or a percentage complete:

- Storage rollout and runtime verification: 1–2 hours after the target/backup/runtime role are confirmed.
- Staff UAT review/send UI and backend route wiring are implemented; account configuration and real-path verification remain. Keep the earlier 1–2 day allowance provisional until verified settings and first UAT responses are available.
- Real carrier UAT execution, evidence review and likely adjustments: 2–4 developer days after access and whitelisting work.
- Production configuration, operational handoff and controlled release: 1–2 developer days after Aramex approval, subject to UAT findings.

Approximate remaining effort: 4–8 developer days plus storage rollout. Aramex/account/hosting waiting time is additional and cannot be estimated from the current evidence. Earlier report estimates were made before the recovery/tracking/label work; this range reflects the present implementation and still carries uncertainty until the first real UAT response.


## Isolated release verification - 23 October 2026

Prepared local branch `aramex-uat-gateway` in sibling checkout `leee-aramex-release` from `7b5f426`. It contains the Aramex implementation and documentation only; unrelated donation and inventory edits remain in the original workspace. No production secrets were copied into the checkout.

`npm ci --no-audit --no-fund` and `npm run build` passed, including asset budgets, Prisma generation, TypeScript and 127 static pages. The isolated checkout's Aramex/book-order test run passed 263 tests; 51 database integration tests were skipped because no test database was configured there. Earlier full-workspace database test results remain separate evidence. Git whitespace checks passed.

This is local release preparation, not a deployment. Vercel settings are user-reported saved; their values and authenticated routing are unverified. Keep all carrier operation flags disabled. Next: deploy the release as a preview and verify gateway authentication without creating a shipment, then complete carrier account and whitelist prerequisites.
