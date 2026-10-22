# Aramex integration: source of truth and implementation plan

Updated 22 October 2026. This is the canonical project record for Aramex shipping of physical book orders within Lebanon. It combines the implementation, the read-only audit on 22 October, and the email chain supplied by the user. Update this document when evidence or implementation changes; do not treat proposed work as completed.

**Current milestone: local preparation and booking safeguards are built; real carrier integration is not operational.** Production account registration is confirmed by Nour, UAT registration is pending, and shipment submission remains disabled by its default-off UAT switch. Account registration is not launch approval.

**Latest account/IP update:** Manal told the user she did not receive the password-reset email. Access/password setup is therefore incomplete; Nour's earlier production-registration confirmation remains the latest evidence of account existence on the carrier side. Request a resend to the corrected email and UAT registration confirmation. Recommended outbound networking: Fixie HTTP/HTTPS proxy, starting on its free UAT tier; not provisioned. The user accepts a replaceable fixed-IP setup. Current app factories still need proxy routing implemented and tested; installing a proxy integration alone will not reroute native fetch. See [runbook](aramex-uat-runbook.md) for current prices, sources and activation steps. No paid service or IP has been activated.

**Latest database status — 22 October 2026, 21:59 UTC:** recovery and tracking migrations are now applied to the configured application database. This supersedes the pending-migration statements in earlier chronological entries below. All four Aramex tables have verified storage protections. The existing shipment count remained 1 and attempt count 0; new recovery/tracking counts are 0/0. Local authenticated inbox, recovery and tracking endpoints returned 200 after rollout; unauthenticated inbox returned 401. Label retrieval remains disabled and submission still returns 503 `SUBMISSION_DISABLED`. No website-code deployment or real carrier call occurred.

The additive rollout saved a schema-only restore reference and timestamped migration/hash record in the ignored local folder `.impeccable/aramex-storage-rollout/2026-10-22T21-59-33-394Z/`. This is not a customer-data backup. Runtime and direct connections were checked against the same database identity; both SQL storage verification and application-role reads passed. Scripts: `scripts/aramex-storage-rollout.mjs` (inspection by default; applying requires the inspected target fingerprint) and `scripts/aramex-storage-smoke.mjs` (local HTTP checks). The UAT submission endpoint is now wired behind a default-off gate; the staff review/send UI is now implemented, with actual sending still disabled by configuration.

**Gateway progress — 23 October:** Fixie deferred because it requires a card. User elected to use their existing Eventra VPS, with an explicit requirement to avoid disruption. Read-only checks confirmed spare resources, Python 3.12.3 and outbound IP 72.61.160.199. DNS and a separate Nginx HTTPS placeholder are now configured by the user; public HTTPS was verified and returns 503 intentionally. Prepared a separate loopback UAT relay, constrained systemd service and copy/paste installation file in `ops/aramex-gateway/`; nine mocked gateway tests passed. VPS service installation, public proxy activation, app gateway routing, certificate reload-hook review and real UAT verification are not yet complete. Current source/runbook details supersede the earlier Fixie recommendation. No actual Aramex request was made.

**VPS service installation update:** user reported `active` and successful loopback health after executing the install block. The separate relay is installed and running; public HTTPS forwarding is the next staged change. `ops/aramex-gateway/enable-https-in-putty.txt` is prepared with gateway-only configuration backup, Nginx validation, graceful reload, local TLS/auth checks and restore-on-failure. No public forwarding or real Aramex call is claimed yet.

**Application gateway wiring — 23 October:** the user confirmed gateway boot enablement and installation/syntax validation of its certificate-renewal hook. All three configured UAT factories now require the authenticated VPS gateway through `gateway-fetch.ts`. No direct-network fallback, automatic retry or caller-controlled destination is permitted. Required server-only settings are `ARAMEX_UAT_GATEWAY_URL` and `ARAMEX_UAT_GATEWAY_KEY`; the real secret remains on the VPS and has not been copied into this workspace or Vercel. No deployment or authorized real carrier request occurred. Vercel secret configuration and authenticated deployed-route verification are next.

Local validation: 314 tests passed across 24 files using isolated PostgreSQL and mocked carrier/gateway responses. TypeScript passed. New tests cover exact mapping of booking/tracking/label requests, gateway/secret validation, no credential/header forwarding beyond the intended headers, body/cancellation handling, production/arbitrary URL rejection, redirect refusal, sanitized errors and UNKNOWN/no-retry booking outcomes on HTTP 401/429/502. One older credential test fixture needed dummy gateway configuration so it could reach the intended credential-validation check; the corrected complete suite passed. Real local application smoke checks still returned 503 SUBMISSION_DISABLED, label unavailable, authenticated inbox/recovery/tracking 200 and unauthenticated inbox 401. Isolated test database stopped; dev server remains available.

## Evidence and verification

| Evidence | What it establishes | Limits |
| --- | --- | --- |
| Code and Git inspection, 22 October | Preparation, persistence and simulated booking flow exist; submission endpoint always returns `503 SUBMISSION_DISABLED`. Aramex files are still uncommitted/untracked. | Does not establish what is deployed on Vercel. |
| Read-only configured app database check, 22 October | `BookShipment` and `BookShipmentAttempt` exist; both have RLS enabled and no public policies. Zero shipment rows and zero booking attempts. | Applies to the configured database, not every environment or shipments booked outside this application. |
| Local configuration check, 22 October | All six Aramex credential fields have values; `FIXIE_URL` and `QUOTAGUARDSTATIC_URL` are absent. | Values were not printed or authenticated. Presence does not establish validity or environment; missing candidate variables alone does not prove external services do not exist. |
| Fresh checks, 22 October | `npx vitest run src/lib/aramex`: 71 passed, 25 skipped. `npx tsc --noEmit --incremental false`: passed. | Database tests skipped because the isolated test database was not configured. Browser checks and production build were not rerun in this audit. |
| Prior validation record, 20 October | 359 tests passed, including 25 isolated PostgreSQL shipping tests; mocked browser checks passed. | Historical evidence; all carrier outcomes were simulated. |
| User-supplied Aramex email chain | Production registration completed; reset link sent; UAT still processing; fixed IP required for UAT; future IP changes allowed within reasonable limits. | Latest reply has no visible timestamp in the pasted text. Password completion, UAT readiness and proxy acceptance are not confirmed. |

No live Aramex request, booking, deployment or customer-order mutation was performed during this audit. Earlier project notes report the application changes as undeployed; current Vercel deployment contents have not been independently verified.

The user has now authorized planning and coding while Aramex onboarding is pending. Local implementation and tests are authorized. Hosting changes, service purchases, live Aramex requests and deployment remain outside this stage.

## Current decisions and status

| Item | Status |
| --- | --- |
| Initial scope | Domestic Lebanese delivery of individual books and bundles; COD and orders paid before dispatch, including gifts. |
| Hosting | Currently Vercel. Pro has not been purchased. A possible Vercel account/project move was discussed; no migration decision is final. |
| Fixed outbound IP | Nour explicitly requires a fixed outbound IP for UAT and allows future changes within reasonable limits. Proxy acceptance, number of addresses and production whitelist scope remain unconfirmed. |
| Vercel Static IP add-on | No purchase authorized. Investigate a lower-cost proxy before considering the add-on or a hosting migration. |
| Onboarding reply | Latest email chain supplied by user on 22 October; resolved and open questions are recorded below. |
| API account holder | Manal Hassoun; corrected email `m.hassoun@theleeexperience.com`; supplied phone `70925607` (+961 70 925 607). Earlier email/mobile conflict was reported by Nour; do not infer whether an old account was deleted. |
| API access | Production registration confirmed and password-reset link sent to the corrected email. Password completion is unconfirmed. UAT registration is still processing, with a separate reset process to follow. Existing local credential values are unverified. |
| Tracking | Webhooks preferred with tracking API reconciliation; endpoint and authentication remain to be designed. |
| Production | Requires completed UAT and Aramex team approval. |
| Local development | Shipment preparation is implemented locally. No Aramex transport or shipment-creation endpoint is enabled. |
| Alternative hosting | Hostinger VPS KVM 2 was discussed, including SSH migration and automated maintenance. No purchase, migration or automation has been authorized. |

The existing `scripts/aramex-check.mjs` is a production tracking-only check. It does not create shipments or verify COD. The attachment review did not establish the cause of the previous failure. Do not run this production script as a UAT test.

## Supplied material

Attachments are in `C:\Users\Marketing Manager\Downloads\Aramex`.

| File | Use |
| --- | --- |
| Aramex Shipping API - Customer Collection UAT.postman_collection.json | UAT examples for locations, rates, shipments, labels, pickups, tracking and cancellation. |
| shipping-services-api-manual.pdf | Shipment fields, account authentication, payment/service codes and labels. |
| shipments-tracking-api-manual.pdf | Latest-event and full-history tracking requests. |
| Lebanon Cities List.xlsx | 408 distinct approved Lebanese city names. |
| PI Codes - Clients.xls | 310 status/reason rows, including delivery attempts and returns. |
| WebHook Tracking Update - Customer.pdf | Event payload and available authentication headers. |

Use the email and collection's `ws.uat.aramex.net` testing host rather than copying older `ws.dev.aramex.net` URLs from the PDF. Examples contain blank account credentials, other countries, old dates and inconsistent shipment settings. Adapt them only after Aramex confirms our account's settings.

## Keeping Vercel without its Static IP add-on

Proposed request path: **Vercel server → fixed-IP HTTPS proxy → Aramex**.

The website stays on Vercel. Only outbound Aramex API requests use the proxy, whose IP addresses Aramex would whitelist. A later implementation must explicitly route those requests through the proxy; buying or connecting a proxy alone does not change application traffic. Incoming tracking webhooks can use a public HTTPS endpoint on the website and are a separate direction of traffic.

Fixie is a candidate because it documents [Vercel support](https://usefixie.com/documentation/vercel) and [HTTPS tunnelling](https://usefixie.com/documentation/http-and-https-requests). Its published HTTP/HTTPS plans checked on 20 October 2026 are:

| Monthly price | Request allowance | Data allowance |
| --- | --- | --- |
| $0 | 500 | 100 MB |
| $5 | 2,500 | 500 MB |
| $19 | 25,000 | 10 GB |

Source: [Fixie pricing](https://usefixie.com/pricing). These are API requests, not book orders. One order may require several requests; location lookup, labels and tracking also consume allowance. The free tier is a candidate for initial UAT within its limits. Select a production plan after estimating actual usage and confirming Aramex accepts the assigned addresses.

[QuotaGuard Static](https://www.quotaguard.com/products/pricing) is another candidate, starting at $19/month for 20,000 requests and 10 GB. No provider has been selected or connected.

[Vercel Pro](https://vercel.com/docs/plans/pro-plan) starts at $20/month with one deploying seat; its Static IP add-on is a separate $100/month per project plus private data transfer. Illustrative base costs are therefore $25/month for Pro plus Fixie's $5 plan, or $39/month with its $19 plan, before additional usage and taxes. These are not estimates of the entire platform bill. Vercel's [Hobby plan](https://vercel.com/docs/plans/hobby) is for personal non-commercial use, so avoiding the Static IP add-on does not remove the need for suitable commercial hosting.

Retaining the same external proxy may allow the IP arrangement to survive a Vercel move, but verify proxy ownership, assigned addresses and routing on the destination before relying on this.

## Question register: resolved answers and remaining actions

An unanswered question stays open until its answer is recorded with evidence. Do not guess credentials, product codes, fees or service behavior.

| ID | Question | Current answer / action | Owner | Needed by |
| --- | --- | --- | --- | --- |
| Q01 | Which account identity? | Resolved: Manal Hassoun, corrected email and phone above. | LEE / Nour | Recorded |
| Q02 | Is production registration complete? | Resolved: Nour confirms registration and reset-link delivery. | Nour | Recorded |
| Q03 | Has the production password been created? | Unknown. User has asked Manal and will report back. Manal completes reset if needed and confirms to Nour; never put password/reset link in this document. | Manal | Account setup |
| Q04 | Is UAT ready? | No, still processing per latest reply. Await readiness and separate password setup. | Nour / Manal | Real UAT requests |
| Q05 | Can we change hosting/IP later? | Resolved: another IP can be whitelisted within reasonable limits. | Nour | Recorded |
| Q06 | Is a separate fixed-IP HTTPS proxy accepted? | Not explicitly answered. Confirm acceptance, required IP count and UAT versus production whitelist scope. Then supply actual assigned IPs. | Nour / developer | Connection setup |
| Q07 | Which UAT account settings? | Partly answered: use the same account details/settings. Confirm the account number/PIN/entity/country through a secure channel and distinguish environment-specific login/passwords. Email subject reference `75816235` is not sufficient proof of the API account number. | Nour / Mohamad | Request mapping |
| Q08 | Which domestic service and payment codes? | Open: product group/type, payment type/options and service codes for prepaid and COD; COD activation and collection currency. | Mohamad Abboud | Shipment requests |
| Q09 | What are delivery/COD fees and settlement terms? | Open: obtain rate basis, surcharges, COD fees, remittance schedule/method and reconciliation references. Existing customer delivery price is not a carrier quote. | Mohamad / Finance | Commercial launch |
| Q10 | What is the dispatch and parcel information? | Open: exact approved city/address, sender contact/email/phone, pickup hours, single-book/bundle packed dimensions and weights. | LEE operations | Shipment payloads |
| Q11 | Which contacts and parcel limits are required? | Country-correct phone formats are required. Developer extracts exact fields/limits from supplied manuals; ask Aramex only about unresolved domestic email requirements, accepted phone representation and service-specific parcel constraints. | Developer / Nour | Mapper validation |
| Q12 | How do labels and pickup work? | Open: confirm printable format, URL/file handling and reprint method; scheduled/manual collection versus API pickup booking. | Nour / LEE operations | Pilot |
| Q13 | How do we reconcile an uncertain booking? | Open: verify supported lookup/reference method or support process and evidence required to establish no shipment exists. Local references are not assumed to provide carrier idempotency. | Developer / Nour | Enable sending |
| Q14 | How will tracking be delivered? | API or webhook offered; LEE prefers webhook plus API reconciliation. Extract documented authentication/payload contract, then confirm retry, acknowledgement and replay behavior where unspecified. Endpoint still to be built. | Developer / Nour | Tracking UAT |
| Q15 | What tests allow production? | Resolved principle: test every API request intended for use and obtain validation from both teams. Agree submission format for evidence and any additional required scenarios. | Developer / Nour | UAT sign-off |
| Q16 | Which hosting/proxy will we use? | Proposed: keep Vercel and route Aramex requests through a fixed-IP proxy. No provider/purchase/migration selected. Recheck current plans and routing compatibility before presenting a concrete spending decision. | Developer / user | Connection setup |
| Q17 | How will the new Audi integration prove payment? | Current shipping code requires `PAID` plus `whishPayment.state === VERIFIED` for Audi and Whish. Define the new provider-verified payment contract; preserve or replace this check deliberately with regression coverage. | Developer | Audi/shipping integration |
| Q18 | Are these changes deployed? | Prior notes say no; local files remain uncommitted. Verify deployed revision/configuration before claiming public availability. | Developer | Release |

## Existing application gaps

- Checkout area offers the 408 approved city suggestions while retaining free text and detailed street/building information. Custom areas carry into admin drafts and require review before carrier submission.
- Public checkout phone validation needs strengthening; admin preparation already validates Lebanese recipient numbers. Validate sender contacts as part of the real adapter.
- Recipient email is not guaranteed; the manual marks contact email mandatory. Confirm domestic requirements instead of inventing an address.
- Shipment/draft and booking-attempt records are implemented. Live carrier mapping, label retrieval and tracking events remain pending.
- Use the gift recipient's delivery details. Prepaid and gift orders must not accidentally collect money again from the recipient.
- Keep transport-charge billing separate from COD collection. The existing $4 single-book delivery fee is a customer pricing rule, not a verified Aramex tariff.
- Keep delivery status, COD collection and remittance to LEE separate. A delivered event does not establish that LEE received the money.
- Local duplicate-send prevention and uncertain-result blocking are implemented. Confirm carrier reconciliation, authenticated webhook handling and duplicate/out-of-order tracking events.

## Local implementation

Admin staff can open **Book Orders → order → Prepare Aramex delivery**. The preparation screen reads the current order, suggests cities from the attached list, validates a Lebanese recipient phone, and accepts packed parcels. City suggestions are optional for draft preparation: custom text is preserved and flagged for review before carrier submission. Gift recipients use their own contact details; the purchaser's email is never silently used for them.

Preparation requires a saved Confirmed, Preparing or Ready order. New orders show a disabled preparation button with an explanation and a shortcut to order status. Selecting Confirmed only unlocks preparation after Save changes succeeds. The server enforces the same rule, including direct requests to the preparation endpoint.

The screen and downloaded draft distinguish the order total from the amount the courier collects. Paid orders explicitly explain that nothing is due on delivery. The server derives collection amounts from the saved order. Pending COD collects the stored total once, including any customer delivery fee. Paid COD and verified prepaid orders collect zero. Unpaid gifts/cash arrangements, unverified prepaid payments, new/cancelled/dispatched/completed orders and non-delivery orders are blocked.

The authenticated preparation API rereads the order, checks its version and validates current staff privileges. It rejects client-controlled payment amounts, malformed requests and oversized bodies. GET loads preparation; POST reviews without writing; PUT explicitly saves a validated draft. There is no Aramex network transport. Downloaded drafts contain customer data but no credentials; they are internal review documents, not directly executable API payloads.

After review, **Save shipping draft** stores recipient corrections, parcels and the server-derived preparation in one `BookShipment` record per order. Reopening restores the form and requires a fresh review. The order card shows a saved draft and provides **Continue Aramex draft**. Drafts remain distinct from actual carrier bookings.

Saving shares the order/payment row lock, checks the order timestamp and uses an expected draft version to reject concurrent edits. The server recalculates collection under that lock and records the staff IDs and save times. A fingerprint of shipping/payment inputs flags saved drafts after material changes, while read receipts/internal notes do not cause false stale warnings. Ineligible orders retain their drafts but cannot save them. Only DRAFT and definitively REJECTED records can be edited; saving a rejected draft creates a new version and resets it to DRAFT without deleting prior attempts.

### Submission foundation (sending disabled)

`src/lib/aramex/submission.ts` implements the durable booking flow behind an internal transport interface. It rechecks eligibility, draft version and the material order fingerprint under the order lock, calculates the latest collection amount, saves a unique attempt/reference and request snapshot, and marks the record SUBMITTING before releasing the lock. Carrier I/O occurs outside the transaction. Repeated/in-flight requests cannot send twice. A completed booking returns its existing result. The unique reference is local evidence; it does not assume Aramex supports idempotent request replay.

Successful outcomes store the tracking number, safe HTTPS Aramex label URL (when available), booking time and attempt result. A missing/unsafe label does not undo shipment creation or permit another booking. Labels are opened through an authenticated admin page link; no label URL is fetched by the server. Binary label handling, retrieval/reprinting and actual approved label host behavior still need UAT confirmation.

Only a carrier response definitively confirming no shipment was created can produce REJECTED. Staff must review/save that draft before another attempt. Disconnects, timeouts, malformed/contradictory responses and unknown outcomes become UNKNOWN. If a worker crashes or fails to persist the result, its SUBMITTING claim remains blocked. Neither state can be overwritten or retried automatically. There is intentionally no public reset/retry/reconciliation action yet: Aramex lookup/support evidence and the corresponding reconciliation workflow must be agreed before real sending is enabled. A booking never automatically marks the book order dispatched, delivered or paid.

The admin screen supports created shipments, labels, missing labels, rejected requests and uncertain results; saved contact/parcel details become read-only after submission starts. Shipment details remain accessible from dispatched/completed orders. Test-environment results are explicitly labelled.

`POST /api/admin/book-orders/[id]/shipping/submit` requires current admin privileges and always returns `503 SUBMISSION_DISABLED` without mutations or outbound requests. There is no enabling environment variable and no web-accessible simulation mode. The real account-specific request mapper and network transport are not implemented. Simulated outcomes are injected only by isolated tests. The supplied shipping manual (printed pages 26 and 34) describes AWB IDs and URL/file label responses; the Postman collection contains no response examples, so the internal test contract is not claimed to be a validated Aramex JSON response mapper.

`prisma/changes/20261020_aramex_submission_records.sql` adds nullable tracking/label/booking fields, an environment-scoped tracking uniqueness constraint and private `BookShipmentAttempt` records. The SQL is transactional, limits lock/statement time, enables row-level security without public policies and does not rewrite existing drafts or orders. After local migration/tests, this exact additive patch was applied once to the app database on 20 October 2026. Both shipping tables have row-level security enabled with no public policies; there are zero booking attempts in that database. Simulated bookings exist only in the isolated local test database.

Storage activation: `prisma/changes/20261020_aramex_shipping_drafts.sql` is a transaction-wrapped additive change creating only `BookShipment`, its unique order index, restrictive foreign key and row-level security. No public policies are granted. The code and migration are tested against an isolated local PostgreSQL database. The exact change was applied once to the remote database used by the local app on 20 October 2026, after isolated tests. Verified that row-level security is enabled, there are no public policies, and the new table contains no records. Existing order/payment data was not changed. For other environments, apply this exact SQL once rather than a general schema push; regenerate Prisma and restart the server if it has the previous client cached. Before storage exists, the UI keeps review/download available and clearly disables saving.

Implementation locations:

- `src/lib/aramex/`: canonical city catalog, contact/parcel validation and collection policy.
- `src/app/api/admin/book-orders/[id]/shipping/route.ts`: private GET context/summary, POST preview and PUT draft save.
- `src/app/admin/(dashboard)/book-orders/[id]/shipping/page.tsx`: preparation form and draft download.
- `scripts/aramex-preparation-browser-check.mjs`: local browser checks using mocked API responses.

The city JSON preserves all 408 source names and includes the source workbook SHA-256. Phone validation uses `libphonenumber-js/max`; canonical international formatting is a local preparation convention until Aramex confirms the accepted request format. Preparation collects packed weights and sums them to obtain total shipment weight; parcel count is derived from the number of parcels entered. Dimensions are optional, but length/width/height must all be present if any is provided. The interface uses centimetres explicitly. See the documented limits and account-specific confirmations below.

Historical validation, 20 October: 359 tests passed, including 25 real PostgreSQL shipping persistence/submission tests; 23 unrelated database tests were skipped because their isolated databases were not configured. TypeScript passed. Tests cover concurrent requests, stale orders/drafts, success/rejection, timeout/late response, malformed outcomes, unsafe/missing labels, failure to persist a carrier result, and the permanently disabled app endpoint. All carrier responses are simulated and the test database is isolated locally. Desktop/mobile browser checks cover draft workflows and all booking result states using mocked API responses. No Aramex calls, customer-order changes or deployments were performed. See the evidence table for the narrower fresh checks on 22 October.

Run unit tests with `npx vitest run src/lib/aramex`. To include persistence tests, set `ARAMEX_TEST_DATABASE_URL` to a dedicated localhost PostgreSQL database named `aramex_test` with the project schema installed. Never point tests at the app's remote database. Run the browser script against an isolated local Next preview at port 3118 (or set `ARAMEX_PREVIEW_ORIGIN`). Its API traffic is mocked; use dummy database/email credentials for the preview. Screenshots are in `.impeccable/aramex-review/`.

## Parcel requirements: documentation correction — 22 October 2026

Reinspection after the user's challenge establishes that the supplied shipping manual already answers the basic mandatory-field question. Printed page 41 (PDF page 42), Table 22 marks `NumberOfPieces` and `ActualWeight` mandatory, but `Dimensions` optional. Printed page 44 (PDF page 45), Table 27 makes length, width, height and unit conditional: supplying any dimension requires the complete set. Printed page 42 marks shipment Items optional; the mandatory actual weight is shipment-level, not a blanket requirement for individual piece measurements. Several supplied Postman CreateShipments examples explicitly use `Dimensions: null` with actual weight and piece count populated. Examples are supporting evidence, not successful UAT results.

The earlier advice that we needed Aramex to answer whether all dimensions are generally mandatory was incorrect. That question is resolved by the supplied documents. Account-specific exceptions and operational limits can still be confirmed, but must not obscure the documented default. **Implementation correction completed locally:** the form and shared validation now allow all dimensions to be omitted, but reject incomplete sets, zero/negative dimensions and invalid types. Blank fields are omitted from serialized drafts rather than converted to zero. Previously saved measured drafts remain valid; dimension-free drafts reopen with blank fields, and read-only results say “Dimensions not provided.” No database migration is needed. The UI continues to collect individual packed weights as its method of computing the required shipment total; this is not a claim that Aramex mandates a separate weight for every piece.

Required markers now reflect the actual form rules: five required fields with one weight-only parcel; eight if that parcel has any dimensions entered. The three dimensional markers disappear when all three fields are cleared. Dimensions are entered in centimetres, so the unit is explicit without a separate selector. Future carrier mapping must include the unit when dimensions are supplied; sending remains disabled.

Verification after this correction: **85 tests passed, 25 isolated database tests skipped; TypeScript passed; the expanded mocked browser walkthrough passed.** Tests cover every partial dimension combination, malformed/zero dimensions, mixed measured/unmeasured parcels, JSON round-trip compatibility, old/new draft API reads and rejection before review/save. Browser checks verify conditional required fields, weight-only review/download/save/reopen, absent dimensions in read-only display, and existing payment/conflict/navigation scenarios. The fresh browser saves use mocked APIs; this does not claim a fresh real-database persistence run or live Aramex validation. Earlier eight-required-fields statements below are historical and superseded by this correction.

Source: `C:\Users\Marketing Manager\Downloads\Aramex\shipping-services-api-manual.pdf`, Tables 22 and 27; supplied UAT Postman collection, including CreateShipments with Additional Properties and attachment examples.

## UX and visual review — 22 October 2026

The user requested a challenge of the existing workflow before extending the carrier adapter. This review used a local Next preview with dummy database/email configuration and intercepted API responses containing simulated orders. No real carrier calls or customer mutations were made. This is a developer-led scenario review, not observed staff usability research or a complete accessibility certification.

### Findings and changes

| Finding | Implemented improvement |
| --- | --- |
| A server error appeared above a long form without taking staff to it; field paths were technical. | Focus the error summary, use human field names, link errors to their fields and mark invalid inputs for assistive technology. Save validation errors also retain field information. |
| Review focus was scheduled before React had necessarily rendered the panel, producing an intermittent browser-test failure. | Focus the review after its render commits; verify focus in the browser walkthrough. |
| The Back to order link warned about unsaved edits, but sidebar links could discard them. | Capture in-app link exits and allow staff to cancel them. Preserve the existing page-unload warning and prevent link exits during review/save requests. |
| Checked, saved and booked could be confused; Save appeared before the information being reviewed and remained actionable after success. | Explain that checking/downloading does not save. Place Save below the review, disable it after success, show “Draft saved — not booked” and provide Return to order. Editing clears that saved state and requires a new review. |
| A test booking looked too similar to an operational shipment. | Explicit draft-only status and test-sending-unavailable badge; created UAT shipments warn against dispatching a customer order. Uncertain/rejected summaries use warning styling rather than success green. |
| A booked shipment displayed current order collection as though it necessarily matched the carrier booking. | Label it as the current order collection amount and require checking the carrier booking, particularly after payment changes. The UI still does not expose a verified booked-collection snapshot; do not infer one. |
| Form controls and parcel measurements could be awkward on phones. | Larger mobile input text and touch targets, visible focus rings, single-column parcel measurements below 380px, and a concrete grams-to-kilograms example. |
| Primary button labels had weak contrast; setup details distracted from preparation. | Use dark text on blue review/save buttons, retain the existing admin palette/card structure, and collapse the setup checklist under an explanatory disclosure. |

### Verification

- `npx vitest run src/lib/aramex`: **71 passed, 25 skipped**. The isolated database tests were not configured for this review; no new database validation is claimed.
- TypeScript passed, including a final `npx tsc --noEmit` after the review-focus correction.
- Final `node scripts/aramex-preparation-browser-check.mjs` run passed. Scenarios include saved/reopened/stale drafts, order confirmation, paid and unpaid gifts, payment totals, concurrent-save conflict preserving input, created/missing-label/uncertain/rejected shipment states, linked field-error focus, cancelled sidebar exit preserving edits, review/save completion, initial-load recovery, unavailable draft storage, and document overflow checks at 320/390/768/1440px.
- Visually inspected desktop and mobile screenshots for preparation, booked shipment, field errors and saved review. Evidence is under `.impeccable/aramex-review/`; all depicted customers and shipments are simulated. The legacy filename `validation-desktop.png` currently contains the narrow-screen validation scenario.
- Cold compilation and development hot reload interrupted earlier browser runs. The final steady-code run passed; the intermittent review-focus failure found during reruns was fixed rather than bypassed.
- Local preview stopped after verification. No deployment, carrier activation, production build, real-device Safari test or external email send was performed.

### Remaining human-use checks

User review follow-up, 22 October: screenshots exposed a self-order summary displaying blank gift-recipient fields. The order summary now displays the purchaser name/phone for SELF orders, consistent with shipping preparation; gift orders retain separate recipient fields. The example area was `test`, which cannot map to an approved city, and its purchaser phone used +216, which does not satisfy the current Lebanese delivery-phone rule. Added city and phone explanations, a clear packed-parcel explanation, and red markers on all eight required preparation fields. No existing order records were altered or cities guessed. TypeScript passed during this update, and a targeted mocked browser check verified the self-order display, help text and all eight markers. Corresponding display/marker checks were added to the main browser script; the full suite was not rerun for this small follow-up. Exact service-specific parcel requirements still await Aramex confirmation.

1. Have an actual operations staff member prepare a COD order, a prepaid gift, correct an address/phone, reopen a saved draft, and interpret an uncertain booking without coaching. Ask them what was saved, whether Aramex has booked anything, what the recipient owes and what they would do next.
2. Browser Back/Forward navigation within the single-page application is not covered by the new link guard. Do not claim universal unsaved-navigation protection. Keep this as a follow-up before broad staff rollout; saved drafts remain the durable recovery mechanism.
3. Confirm practical packed measurements and city selection with staff. Real-device keyboard behavior, screen-reader use and long real addresses still need observation. City entry now uses native datalist suggestions; popup presentation and filtering depend on the browser. The supplied city catalog uses Latin spellings; Arabic aliases have not been invented.
4. Recovery for an actual uncertain carrier result, a verified booked-collection snapshot, real labels and carrier delivery events remain implementation/UAT work. Mocked screens do not validate those integrations.

The carrier request mapper was not implemented during this UX review. M1–M6 below retain their previous completion status.

## Implementation backlog and acceptance criteria

All unchecked items below are planned, not implemented. Local work can progress while UAT provisioning is pending. External activation retains the scope stated at the top of this document; the request for this plan does not itself request a purchase, email send or deployment.

- [x] Admin recipient/city/parcel preparation and server-derived collection policy.
- [x] Draft persistence, version checks, stale-order detection and access controls.
- [x] Internal booking state machine and simulated success/failure coverage.
- [x] Offline CreateShipments mapping with separate credential attachment and regression tests (22 October). Transport/parser progress is recorded below; real UAT validation remains part of M2.
- [x] Bounded UAT HTTP adapter and correlated response parser implemented (22 October follow-up). Verified with mocked HTTP and isolated PostgreSQL; actual UAT remains unverified and the application send endpoint remains closed.
- [x] Shipping storage installed in the configured app database.
- [ ] **M1 — Confirm integration contract and connection (0.5–1 development day).** Resolve Q03–Q08, Q10 and Q16 sufficiently for UAT; prepare an environment-specific configuration checklist and fixed-IP routing. Completion evidence: UAT registration/password confirmed, assigned IP accepted, credentials verified without logging secrets, and intended traffic demonstrably uses the whitelisted route. Provider provisioning/waiting is extra.
- [ ] **M2 — Real shipment adapter and labels (2–3 days).** Map confirmed sender, recipient, parcels, services and payment/collection fields; parse actual carrier responses; use bounded network timeouts and safe logging. Implement label retrieval/reprint as required. Completion evidence: UAT COD/prepaid/gift/bundle shipments yield valid tracking numbers and printable labels; reprinting never creates a second booking. Missing label does not discard a successful booking. Production remains unavailable during UAT.
- [ ] **M3 — Operator recovery (1–2 days).** Resolve Q13; implement authenticated, audited reconciliation for UNKNOWN and stranded SUBMITTING attempts. Recover an existing AWB when verified; permit a new attempt only after definitive no-booking evidence and renewed review. Completion evidence: double click, timeout, process failure, late result and persistence-failure scenarios do not create duplicate shipments. M3 is a prerequisite for exposing M2 sending to operators.
- [ ] **M4 — Tracking, returns and pickup operations (2–3 days).** Resolve Q12/Q14; implement authenticated ingestion, event history/deduplication, out-of-order handling and tracking API reconciliation. Agree a status mapping from supplied PI codes before changing order states. Implement pickup API only if selected; otherwise document the agreed manual/scheduled process. Completion evidence: delivery/attempt/return events update the appropriate shipment state, stale events cannot incorrectly reverse progress, and delivered does not automatically mean COD remitted.
- [ ] **M5 — End-to-end acceptance (1–2 days).** Run the matrix below and resolve defects; test Audi payment compatibility when its verified-payment contract is available. Define a basic Finance reconciliation procedure for collection/remittance. Completion evidence: passing local/database/browser checks plus real UAT evidence for every intended carrier operation and written Aramex sign-off. Approval waiting is extra.
- [ ] **M6 — Production release and controlled launch (1–2 days).** Review and commit the relevant changes without bundling unrelated work. Verify target database/schema, production credentials, outbound IPs and webhook configuration; deploy the reviewed revision when authorized. Completion evidence: agreed controlled order produces exactly one shipment and a usable label, tracking is received, and operations knows how to handle failures. Record deployed revision and launch approval. Provide a way to disable new sends while retaining shipment history/tracking; never roll back by deleting booking evidence.

**Estimate: approximately 8–13 focused developer days remaining**, rounded from the work packages above. A booking pilot is approximately 4–6 focused days with M1–M3 completed and a tested, agreed manual tracking/pickup procedure. Neither estimate includes external waiting, Audi implementation itself, hosting migration, or a full automated remittance/accounting system. The pilot is not broad production approval. Re-estimate after actual UAT responses and Q08/Q12/Q13 are resolved. At half-time allocation, plan roughly 3–5 calendar weeks plus external waiting.

Public checkout city/phone improvements can follow the pilot because admin correction already exists. Full automated COD settlement and optional rate/cancellation/pickup APIs are separately scoped if selected; they are not implicitly promised in the estimate. Every selected API must enter the UAT matrix.

### UAT acceptance matrix

Each row needs a dated result, environment, safe order/reference identifiers, observed outcome and reviewer. Keep raw customer data/credentials out of this document. No row is yet marked as passed against Aramex.

| Scenario | Expected evidence |
| --- | --- |
| UAT authentication and fixed-IP routing | Correct account/environment and accepted outbound address; no production fallback. |
| Unpaid COD order | One shipment; correct stored total collected once in the approved currency. |
| Verified prepaid order, including Audi when integrated | One shipment; zero recipient collection; unverified/failed payment blocked. |
| Gift order | Recipient details used; zero collection; unpaid gift blocked. |
| Bundle / multiple parcels | Accurate piece count and total weight; omitted or complete optional dimensions; service acceptance. |
| Invalid city/phone/contact/service | Clear rejection without misleading success; no assumed booking where outcome is uncertain. |
| Duplicate click / concurrent send | One carrier booking and one consistent final record. |
| Timeout / late response / database save failure | Sending remains blocked until reconciled; no blind retry. |
| Labels and reprinting | Correct printable document; missing label recoverable without new shipment. |
| Webhook authentication / duplicate and out-of-order events | Invalid authentication rejected; repeated events handled safely; status chronology preserved. |
| Missed webhook / tracking lookup | Reconciliation retrieves and applies the correct carrier history. |
| Failed delivery / return | Correct operational status; no automatic claim of refund or COD remittance. |
| Pickup / rates / cancellation, if selected | Each intended request validated with Aramex, including failure handling. |
| Final acceptance | Nour/team confirms the submitted evidence before production activation. |

## Immediate actions and communication

1. **Developer:** use this backlog as the baseline; inspect supplied contracts for Q11–Q14, design the Audi verified-payment interface, and prepare the adapter/recovery work locally without enabling sending.
2. **Manal:** confirm whether the production password reset was completed. Complete it if needed and tell Nour; do not share the password in email or chat.
3. **LEE operations:** supply dispatch details and measured parcel configurations (Q10); agree pickup responsibilities.
4. **Developer/user:** prepare and choose a concrete fixed-IP option after proxy acceptance is confirmed; record assigned addresses and whitelist confirmation when available.
5. **Nour/Mohamad:** finish UAT provisioning and answer the remaining account, domestic-service and COD questions below.

### Draft reply to Aramex — prepared, not sent

Subject: RE: Shipping API Integration: The Lee Experience - 75816235

Dear Nour and Mohamad,

Thank you for confirming production registration for m.hassoun@theleeexperience.com. We will confirm separately once the production password has been successfully created. We understand that UAT registration and its password setup are still pending.

Thank you also for confirming that a fixed outbound IP is required for UAT, that it can be updated later within reasonable limits, and that the same account details/settings should be used for testing. We will test every API operation we intend to use and obtain your team's validation before production launch.

To complete our implementation plan, could you please confirm the following:

1. Can we whitelist fixed outbound IPs supplied by an HTTPS proxy service while keeping the website on Vercel? Can more than one assigned IP be whitelisted, and does production require a separate whitelist?
2. Once UAT is ready, please confirm through the appropriate secure channel the account number, PIN, entity and country code to use, and the environment-specific login setup.
3. Mohamad, which domestic product/service and payment codes should we use for prepaid and COD book deliveries? Is COD enabled, in which currency, and who can confirm delivery charges, COD fees and remittance/reconciliation arrangements?
4. Which label format/reprint method and pickup arrangement should we use? We also need to confirm whether recipient email is mandatory for domestic delivery.
5. If a shipment request times out after reaching Aramex, how should we look it up by our order/request reference to determine whether a shipment was created before attempting again?
6. For tracking webhooks, please confirm the supported authentication arrangement and retry/acknowledgement behavior. We will share our endpoint when ready. Please also advise how you would like us to submit UAT evidence and whether you require additional test cases beyond the API requests we intend to use.

We are gathering our dispatch contact/address and packed book/bundle measurements in parallel.

Best regards,
Oussama Lamine
The LEE Experience

Before sending, replace the password paragraph with a completion confirmation only if Manal has actually completed the reset. Do not attach credentials or customer shipment data.

## Maintenance rule

For every milestone, record what changed, the verification performed, unresolved limitations and the commit/deployment reference where applicable. Keep local implementation, database activation, UAT validation and production deployment as separate statuses. Resolved email questions should be updated in the question register, not repeatedly requested in later replies.

Communicate the next step in plain language and ask the user only for business details or decisions that cannot be resolved from the project or Aramex's response.


## City entry follow-up - 22 October 2026

Customer physical-book checkout and admin shipping drafts now share a city text input with 408 native datalist suggestions. Selecting a suggestion is optional; custom text such as `test` remains valid, and unmatched order areas prefill the draft instead of disappearing. Nonempty city/area remains required and marked with a red asterisk. Checkout help is available in English and Arabic, with Latin spelling explained.

Draft validation preserves custom cities and includes a review warning. The internal submission service rejects an unrecognized city before creating an attempt or calling the carrier. This does not enable live shipping: the HTTP submission endpoint remains disabled. No existing records were migrated.

Validation: 99 tests passed; 25 database-dependent tests skipped. Coverage includes custom checkout areas, preserved custom drafts and the carrier boundary with no mutation or transport call. TypeScript passed. This remains a local change, not a deployment or UAT approval.

Browser verification for city changes: the full mocked admin walkthrough passed city entry, review, save and reopen, then timed out on a later rejected-shipment screen while the dev page still showed Loading order details. The whole run is not recorded as passing. Customer checkout schema and TypeScript are verified; a complete customer browser order was not exercised in this follow-up.

The focused mocked browser check passed: 408 suggestions linked to the city input, arbitrary text accepted, and a draft with city 'test' saved and reopened unchanged. Run with ARAMEX_CITY_ONLY=1 and ARAMEX_PREVIEW_ORIGIN pointing to the local dev server.


### Styled city suggestions - 22 October 2026

Replaced the native datalist above with a shared styled combobox, using dark admin and light checkout themes and Arabic interface text. Results filter as the user types, prioritize prefix matches, and show up to 30 choices with a prompt to narrow longer lists. Arrow keys move through results, Enter chooses the highlighted city, Escape dismisses suggestions, and leaving the field preserves custom text. The supplied catalog and draft/submission validation are unchanged. TypeScript passed.

Styled combobox verification: focused mocked browser check passed keyboard selection, pointer selection, Escape dismissal, mobile-width rendering and saving/reopening custom text. Desktop and mobile screenshots were inspected. The carrier catalog spells Tripoli as Trablous; the check uses that supplied name.

Custom city confirmation: the combobox now offers a Use [typed area] option with a Press Enter or tap instruction. Enter confirms typed text and closes suggestions without submitting the form; IME composition is left untouched. English and Arabic copy updated. Free-text entry remains optional to confirm, with no new checkout blocker.


## Offline shipment mapper and connection setup - 22 October 2026

Implemented `src/lib/aramex/shipment-request.ts`. This is an offline request builder, not an enabled adapter. No network requests, account changes, paid services or shipments were created. M1 and M2 remain incomplete.

### Mapping evidence and choices

| Input | CreateShipments field / behavior | Evidence |
| --- | --- | --- |
| Order reference / attempt key | Shipment Reference1 / Reference2, plus Transaction references. These are correlation fields, not a carrier idempotency guarantee. | Manual Tables 17/18 |
| Sender / recipient | PartyAddress and Contact; individual recipient name also fills CompanyName. Lebanese phone normalization is retained. | Tables 19-21 |
| Packed parcels | NumberOfPieces derived from array length; ActualWeight recomputed in KG. Book count is not piece count. | Table 22 |
| No measurements | Dimensions null; no invented dimensions. | Supplied Postman examples |
| One measured parcel | Dimensions with CM units. | Tables 22/27 |
| Several measured parcels | PieceDimensions, one entry per parcel, each NumberOfPieces = 1 and its own weight. | Postman CreateShipments - With MPS Dimensions |
| Mixed measured/unmeasured parcels | Draft stays saveable; mapping requires review rather than silently discarding measurements or inventing the missing ones. Confirm partial MPS behavior in UAT. | Local conservative boundary, not an asserted Aramex rule |
| Unpaid COD | Services contains COD; CashOnDeliveryAmount is the stored order total in USD, converted from cents. | Table 22 |
| Paid order | No COD service and null CashOnDeliveryAmount. | Table 22 |
| Transport charges | Initial scope uses explicitly configured P billing, independently of COD; no CollectAmount or third-party billing. Confirm account compatibility. | Table 22 |
| Shipping and due dates | Explicit ISO inputs converted to Postman /Date(milliseconds)/ format. Due date cannot precede shipping date. | Postman; Tables 18/23 disagree about due-date optionality, so no delivery promise is invented |
| Labels | URL report type with explicitly configured report ID; no assumed default template. | Table 26 and Postman show different sample report IDs |
| Authentication | Separate server-side attachment sets ClientInfo and matching Shipper.AccountNumber. Source defaults to documented 24. Secrets never belong in draft exports or attempt records. | Table 16 and Postman |

Configuration is deliberately explicit: UAT, actual sender contact/address, goods origin (not inferred from dispatch country), label report ID, recipient-email policy, and separate prepaid/COD service settings. Fixture codes are examples only, not approval for this account. CompanyName and EmailAddress are mandatory in the generic manual. Missing recipient email is allowed at mapping only when an explicit confirmed domestic policy permits it; it is never replaced with the purchaser/sender email. USD COD requires Aramex account confirmation; conversion to another currency is not implemented.

The authenticated body must only exist inside the future server transport and must not be logged, returned to the browser or persisted. This module does not read environment variables, attach the locally present credentials automatically, or modify the closed submission route. Configuration validation is not proof of account activation or approved settings.

### Fixed-IP setup ready for implementation

The earlier proxy proposal remains unselected. A native Vercel path is also available: Pro/Enterprise Static IPs uses a shared pair per configured region. Current Pro pricing is $100/project/month plus regional private data transfer. It applies across project environments and to function traffic, not middleware; build routing is separately optional. Source checked 22 October: [Vercel Static IPs](https://vercel.com/docs/networking/static-ips).

Concrete provisioning sequence once a hosting option is selected:

1. Verify the actual Vercel team plan, project, deployment region and budget. These have not been inspected or changed in this task. Compare the native add-on with the previously proposed fixed-IP proxy before purchase.
2. For the native path, enable Static IPs in the project's networking settings and record both assigned addresses for every region used by shipping functions. Keep build routing off unless a build genuinely needs allowlisted access. Do not use the website's DNS IP or this developer machine's IP.
3. Give Nour the actual assigned addresses and ask for UAT whitelist confirmation, plus clarification of production whitelist scope. Do not send credentials. No email has been sent.
4. Verify outbound source addresses from the deployed Node shipping runtime using a controlled diagnostic receiver; record deployment, region, observed IP and timestamp. A local request does not verify Vercel routing. Confirm observed addresses match those allowlisted.
5. Only then test the approved UAT endpoint from the same runtime. The supplied collection uses https://ws.uat.aramex.net/ShippingAPI.V2/Shipping/Service_1_0.svc/json/CreateShipments. Keep credentials scoped to UAT and retain the operator submission gate until response handling and recovery are implemented.
6. If choosing a proxy instead, provision its assigned addresses and verify Node HTTPS routing through that proxy. Merely setting HTTPS_PROXY is not sufficient evidence that the selected HTTP client uses it. Verify there is no direct fallback and obtain Aramex acceptance of that arrangement.

No IP has been assigned, observed or whitelisted by this work. Next code work is the bounded UAT transport and response parser, then operator reconciliation before exposing sending. Labels, tracking and real UAT remain open.

Mapper verification: 112 tests passed across the Aramex and book-order validation suites; 25 database-dependent tests skipped. This includes 13 mapper cases, credential attachment, prepaid/COD behavior, dimensional mapping, invalid settings, and the unchanged disabled submission endpoint. No real carrier test is included.
Final TypeScript check passed (npx tsc --noEmit). No deployment was performed.


## UAT transport and database verification - 22 October 2026

Implemented `uat-transport.ts` and `shipment-response.ts`, using the supplied UAT endpoint and the shipping manual's Table 10 and Table 12/Figure 23. The response diagram was inspected to verify ID, Reference1/2, HasErrors, Notifications and ShipmentLabel. The supplied Postman collection did not contain saved response examples for these requests, so exact live JSON behavior must still be confirmed in UAT.

The transport uses one POST to the fixed UAT endpoint, explicit credentials/settings and dates, no redirects, no retries, no response logging, a default 15-second deadline (maximum configurable 20 seconds) covering headers and body, caller cancellation, and a 256 KiB response limit. The authenticated request exists only in memory. A custom fetch implementation can support a later verified proxy; no proxy or static IP was provisioned. The default Node fetch does not itself establish fixed egress.

The parser requires the transaction's attempt reference plus the shipment's order and attempt references, and exactly one shipment row. A successful per-shipment result with an AWB is retained even when the label is missing/unsafe or a top-level error exists. Label URLs pass the existing HTTPS Aramex host check. This does not implement label reprinting or prove a label is printable.

A correlated error row, explicit HasErrors flags, an empty/null ID and notifications becomes a rejection. VALIDATION is the current generic internal rejection category; account/service subcategories are not inferred from message text. Generic request errors with no correlated shipment row, unexpected JSON, mismatched references, conflicting ID/error evidence, HTTP errors, redirects, disconnections, oversized bodies and timeouts remain UNKNOWN and require reconciliation. No automatic retry is permitted. If UAT omits the echoed references, resolve that contract deliberately before relaxing correlation checks.

Submission now calls synchronous transport preflight before recording an attempt. Invalid local settings, credentials or required fields therefore leave the draft untouched. After an attempt is recorded, the existing transaction/row lock protects concurrent calls, completed requests return the existing booking, uncertain attempts block resend, and failure to save the carrier result leaves the SUBMITTING claim in place. Operator reconciliation for uncertain or stranded attempts still needs an authenticated workflow and Aramex's agreed lookup procedure; this is not implemented by the transport.

Verification: 166 tests passed across all nine Aramex/book-order validation test files, with no skips in this run. A fresh isolated PostgreSQL 18 cluster on 127.0.0.1:55441/aramex_test was initialized under the ignored `.impeccable/aramex-transport-db/` folder; Prisma schema was applied only there. Tests exercised draft persistence, concurrent clicks, timeouts and late results, rejected requests, failed result persistence, adapter-to-database success/unknown handling, preflight with no mutation and credential-free persisted evidence. HTTP was mocked throughout; application database and Aramex were not contacted.

The public/admin send endpoint remains a tested authenticated 503 SUBMISSION_DISABLED response, regardless of environment flags. No deployment, account activation, label download, pickup or real shipment was performed. Next: operator reconciliation and agreed UAT account/service/egress configuration, then real UAT evidence before enabling operators. Tracking remains a separate unfinished milestone.

Final TypeScript check passed. The isolated test database was stopped after verification; the user development server was left running.


## Staff recovery workflow - 22 October 2026

Implemented an authenticated UAT recovery API and admin form for UNKNOWN and stranded SUBMITTING attempts. Staff can record a confirmed existing shipment (tracking required, safe label URL optional) or a definitive no-booking confirmation. Both paths require an evidence source/reference, a written explanation and explicit acknowledgement. The UI states that this records independently verified findings, not an automatic Aramex lookup; a timeout or empty search is not proof of no booking. Generic manual recovery is therefore ready, but the account-specific lookup/support procedure in Q13 still requires Aramex agreement.

The server checks current admin privileges, locks the order, compares the reviewed shipment timestamp and latest attempt ID, and refuses attempts younger than five minutes. This cooldown is a local safeguard, not a carrier guarantee. Production recovery is refused. A confirmed existing AWB transitions to CREATED without changing order/payment status or its fingerprint. A no-booking result transitions to REJECTED and requires draft correction/review/save before another attempt; it cannot directly trigger a retry. Sending remains disabled.

Added BookShipmentReconciliation with one unique audit entry per attempt: actor, time, outcome, previous shipment/attempt states, evidence source/reference, notes and any tracking/label. Original attempt identity, request preparation and fingerprint are retained. The application exposes no audit update/delete endpoint. This is application-level append-only behavior, not database-superuser tamper protection. The latest attempt's audit is visible through View shipment attempt; a full historical recovery browser across older attempts is not yet implemented.

The additive migration is `prisma/changes/20261022_aramex_reconciliation.sql` and enables RLS without public policies. It was applied and tested only on isolated localhost:55441/aramex_test, not on the configured application database. Until that migration is deployed there, opening recovery returns a clear storage-not-installed error. No automatic migration runs in the app.

Verification: all 182 tests passed with no skips across eleven Aramex/book-order validation suites, including PostgreSQL concurrency, duplicate-AWB rollback, stale/recent/production guards, preservation of order/payment data, mandatory draft review after no-booking confirmation, authorization, request size limits and safe API errors. A prior adapter test reused a fixed AWB on database reruns; its fixture now generates a unique number, and the rerun passed. The focused mocked browser check passed cooldown messaging, evidence/checkbox requirements, mobile rendering, tracking recovery and the no-booking path. The mobile screenshot was inspected and select labels shortened for narrow screens. No real Aramex request was made.

Local dev server restarted briefly to release Prisma's Windows engine lock and regenerate the client; it is back on port 3000. No application data was changed. Next work: agree recovery evidence with Aramex, deploy the additive schema as part of the reviewed release, and implement tracking ingestion/reconciliation while UAT/IP/account settings remain pending. Real carrier approval, printable label/reprint verification and production launch remain incomplete.


## Tracking receiver, inbox and admin history - 22 October 2026

Implemented a UAT-only webhook receiver at `/api/webhooks/aramex/uat`, using the supplied webhook document's `x-api-key` header and `{ Key, Value: { WaybillNumber, UpdateCode, UpdateDateTime, UpdateLocation, Comments, ProblemCode, OrderNumber } }` payload. The document explicitly lists this authentication option; HMAC format/encoding is not guessed. Receiving is disabled unless ARAMEX_UAT_TRACKING_ENABLED=true and a server-side ARAMEX_UAT_WEBHOOK_KEY of at least 32 characters is configured. No real key was created, shared or configured, and the endpoint was not registered with Aramex. Shipment sending remains independently disabled.

The receiver checks the secret in constant time, requires matching Key/WaybillNumber and a timezone-qualified timestamp, bounds request size to 16 KiB and individual text lengths, and rejects timestamps more than five minutes ahead of server time. It acknowledges only after storage: 200 for an associated event, 202 for a durably stored unmatched event, 400 for invalid data, 401 for bad authentication, and 503 for disabled/storage-unavailable cases. Aramex must confirm acknowledgement, retry and replay arrangements before activation; these are local implemented choices, not a proven carrier agreement. No raw webhook payload or secret is logged.

Added AramexTrackingEvent with environment-specific deduplication, event/receipt timestamps and preserved code/subcode/location/comments/order number. An SHA-256 fingerprint over normalized event fields deduplicates retries, including equivalent timestamp offsets; different comments remain separate evidence. Unknown AWBs stay in a durable inbox without creating orders or asserting bookings. Events link only to a confirmed CREATED Aramex shipment in UAT with the same tracking number. Linking also occurs on later redelivery or when staff opens that shipment's received history, covering events arriving before booking persistence. No automated inbox maintenance or retention job is implemented yet. OrderNumber is preserved as evidence, not treated as a trusted order identifier.

Imported all 310 rows of the supplied PI Codes - Clients.xls into `data/tracking-codes.json`, retaining its SHA-256. Descriptions require an unambiguous exact code/subcode match applicable to DOM. The initial progress projection explicitly distinguishes pickup, full/partial out-for-delivery, full/partial delivery, verified return and delivery exceptions. SH007 (postal handoff), SH247 (supporting document returned), SH239 (charges collected), and SH539 (delivery review) are not misclassified as full delivery or financial settlement. Unknown events are retained and flagged. Older arrivals do not regress newer event-time progress; same-time contradictory statuses and later contradictions of delivered/returned states require review. This projection is a local interpretation of the workbook pending UAT evidence, not a carrier-approved order-state transition map.

The admin shipment page now provides View received updates / Refresh received updates for confirmed bookings. It shows carrier progress, dated history, location/comments and unknown/conflicting warnings. It explicitly distinguishes refreshing stored events from querying Aramex. Displays are HTML-escaped. The response shows the newest 100 events, computes progress from at most 500 events, and marks larger histories for review instead of claiming a complete projection. Tracking never changes BookOrder status, payment, stock, COD remittance or booking status.

The additive migration `prisma/changes/20261022_aramex_tracking.sql` enables RLS without public policies. It was applied only to the isolated localhost test database. Both tracking and recovery storage migrations remain pending in the application database, so these features are not operational there yet.

Verification: all 199 tests passed across thirteen Aramex/book-order test files with no skips, including isolated PostgreSQL event persistence, concurrent duplicates, early/unmatched events, late linking, environment isolation, timezone-normalized deduplication and unchanged booking/order/payment records. Webhook authorization, disabled mode, payload limits, error responses and admin access were also checked. The focused mocked browser walkthrough passed empty history, unknown-code review, escaped comment text, mobile layout and storage-error handling; its mobile screenshot was inspected. No actual Aramex callback or tracking request was used.

Remaining tracking work: agree and configure the UAT webhook secret and retry/acknowledgement contract; deploy the additive schema; validate actual callbacks and selected status/substatus behavior; add outbound tracking API history reconciliation for missed webhooks and an unmatched-inbox operations/retention workflow. Automatic order completion, COD settlement and production webhook activation remain out of scope until separately verified. No public tracking page or real API lookup is claimed by this update.
Final TypeScript check passed. The isolated test database was stopped; the local dev server remains available on port 3000.


## Direct UAT tracking history recovery - 22 October 2026

Implemented a full-history lookup adapter, atomic synchronization service, authenticated admin POST at `/api/admin/book-orders/[id]/shipping/tracking/sync`, and a separate Check Aramex for missed updates action. Refresh received updates continues to read saved history only. Neither action creates or retries a shipment. The lookup action is unavailable by default.

Source: the supplied Postman TrackShipment / TrackShipment - With Time Zone examples specify the UAT Tracking/Service_1_0.svc/json/TrackShipments endpoint, GetLastTrackingUpdateOnly=false and GetUpdateTimeZone=true. The tracking manual's response diagram was inspected for WaybillNumber, UpdateCode, UpdateDateTime, UpdateLocation, Comments and ProblemCode. The adapter sends all five Transaction reference fields; the existing local connection-check script notes that the live JSON serializer requires them. That production script was read for context and was not executed. The collection contains no saved tracking responses. The expected TrackingResults Key/Value JSON envelope follows the existing local parser and must still be verified against actual UAT responses.

The new adapter sends one bounded request, prohibits redirects, limits responses to 256 KiB / 500 events, enforces a 15-second default deadline (maximum 20 seconds), supports cancellation and does not retry automatically. It requests only the server-saved AWB of a confirmed UAT booking. It requires a matching transaction reference, matching result key and matching AWB on every event. Carrier errors, missing result groups, malformed dates and mismatched/partial histories are rejected as a whole. ISO dates must include timezone; .NET JSON millisecond dates are normalized to UTC without applying the optional offset twice. Naive local timestamps are not guessed. An explicit matching empty result is accepted as zero events, never as proof that no shipment exists.

All events are validated before persistence. After network I/O, the service locks/rechecks the booking and atomically inserts only missing events, linking early inbox entries for that AWB. Concurrent lookups converge through uniqueness constraints. No order/payment/stock/booking state or booking timestamp changes. A caller cannot supply an alternate AWB, endpoint, credentials or event batch through the admin endpoint.

The shared event fingerprint now excludes optional OrderNumber metadata so the same event arriving by webhook and history API does not duplicate merely because the API omitted that field. OrderNumber remains preserved on the first stored event. The tracking schema has not been deployed to the application database; no live event fingerprints were migrated. If an environment already contains rows from the earlier implementation, reconcile/re-key those rows before activation rather than assuming old and new digests match. Different comments or locations remain separate evidence, not silently overwritten corrections.

Configuration is separate from both webhook reception and existing production environment variables: ARAMEX_UAT_LOOKUP_ENABLED defaults false; ARAMEX_UAT_USERNAME, PASSWORD, ACCOUNT_NUMBER, ACCOUNT_PIN, ACCOUNT_ENTITY, ACCOUNT_COUNTRY_CODE and VERSION must be set explicitly. No fallback to production credentials exists. Native fixed-IP egress must be verified before enabling the manual endpoint; a separately verified proxy fetch can be injected at adapter level, but the application factory currently uses native fetch. Configuration presence is not proof of working credentials, whitelisting or UAT approval. No credentials or flags were activated by this task.

Verification: 231 tests passed across sixteen Aramex/book-order files, no skips, including isolated PostgreSQL full/empty-history recovery, concurrent duplicates, webhook/API metadata differences, changed-booking rejection, all-or-nothing validation and unchanged financial/order state. Transport tests cover full-history request flags, correlation, supported timestamps, HTTP failures, body limits, stalled headers/body, cancellation and disabled UAT configuration. The admin API tests verify current-role checks and refusal to use client-supplied AWBs/credentials. The focused mocked browser check passed unavailable/enabled lookup states, new-event feedback, empty-history wording and preservation of existing timeline data. Carrier HTTP was mocked throughout.

No new schema migration was needed for this step. The earlier recovery and tracking migrations remain pending in the application database. No real UAT lookup, webhook registration, hosting change or deployment occurred. Next development gap: safe label retrieval/reprinting for an already confirmed AWB, followed by the unmatched-inbox operations/retention workflow and account-specific UAT evidence. Scheduled polling is not implemented; this recovery is an explicit staff action.
Final TypeScript check passed after preserving the validated AWB as a non-null local value across the transaction callback. The isolated database was stopped and the user dev server remains running.


### Existing-shipment label retrieval (22 October 2026)

Implemented admin-only UAT PrintLabel retrieval, using the saved confirmed shipment AWB. Source: supplied Postman PrintLabel request and Shipping Services manual, printed page 15 (request/response), printed page 34 (ShipmentLabel). The response must echo the transaction reference and ShipmentNumber and return an HTTPS Aramex LabelURL. No label PDF is fetched by our server. No CreateShipments call is involved.

Separate default-off switch `ARAMEX_UAT_LABEL_ENABLED`, with explicit `ARAMEX_UAT_ORIGIN_ENTITY` and positive `ARAMEX_UAT_LABEL_REPORT_ID`; uses the existing separate UAT credentials. These values need account-specific confirmation, not the Postman sample values. Fixed UAT endpoint, no redirects/retries, bounded response and timeout, sanitized errors. Database write rechecks the unchanged booking under the order lock after network I/O; stores only the label URL and updating actor. Existing label survives invalid responses/failures; stale concurrent responses cannot overwrite a newer change. No booking, payment, stock or order status changes.

UI provides a disabled configuration state, retrieval progress, a saved printable link, and recoverable errors on desktop/mobile. Successful retrieval also refreshes the shipment summary, removing the missing-label warning.

Validation: 251 tests passed across 19 files, including isolated PostgreSQL label persistence, unchanged order/payment state, wrong environment/status rejection and stale-response protection. Mocked browser check covers disabled configuration, success, failure retaining the recovered link, mobile overflow and no shipment submission. TypeScript passed before the final UI summary-refresh change; final recheck recorded below. No real Aramex request, migration or deployment was performed. Isolated test database stopped; local dev server remains on port 3000.

Still pending: UAT access/password and fixed-IP whitelisting; approved service/COD settings and label configuration; recovery/tracking migrations in the application database; real end-to-end UAT validation and Aramex sign-off. Next independent work: staff visibility of unmatched tracking updates and an operational review procedure. Label reprint works by reopening the saved printable link; retrieving again requests a fresh URL for the same shipment.

Final verification: TypeScript and the targeted label browser check passed after the summary-refresh fix. git diff --check passed (existing CRLF normalization warnings only).


### Unmatched tracking inbox (22 October 2026)

Added Book Orders > Unmatched tracking updates at `/admin/book-orders/tracking-inbox`, backed by the current-admin-only, private/no-store GET `/api/admin/aramex/tracking-inbox`. Displays saved UAT events with no shipment link, newest received first, 25 per page, with exact full-tracking-number search. Production and already linked events are excluded. Viewing/searching/refreshing does not contact Aramex or change shipment, order or payment records.

Each update explains its current reason and next action:
- No matching test shipment: verify the AWB against carrier records; use existing shipment recovery only after obtaining booking evidence.
- Booking needs verification: open the matching order and investigate its uncertain result.
- Matching shipment now available: open the order shipping page and choose View received updates to run the existing exact-AWB linking flow, then refresh the inbox.

Carrier order references remain explicitly unverified metadata, never matching authority. Carrier notes are escaped text; unknown codes are marked for review. Event and receipt timestamps use explicit UTC. This is an event list, not a count of shipments. No arbitrary manual association, deletion or dismissal is implemented. Unknown events remain retained until a valid matching shipment is available. A retention policy remains to be agreed before production.

Validation: 261 tests passed across 21 files with an isolated PostgreSQL database and two Vitest workers. Initial unrestricted-worker run encountered a Windows spawn EPERM/worker failure; the clean two-worker rerun passed all tests. Tests cover current-role authorization, invalid query rejection, safe storage errors, exact matching, cross-environment isolation, read-only behavior, linking lifecycle and deterministic pagination. Mocked browser check passed reasons, pagination/search, escaped notes, empty versus unavailable states, retry and 390px mobile layout. The browser assertion was narrowed to the inbox error because Next also supplies an alert announcer. No real carrier request was made.

No schema changes, application database migration or deployment in this step. The earlier tracking migration is still required in the application database; until installed the inbox intentionally shows an unavailable message rather than a false empty result. Isolated test database stopped; dev server remains on port 3000. Real UAT access, IP whitelisting, confirmed account/service/COD/label settings and Aramex approval remain pending.

Final inbox verification: npx tsc --noEmit passed. git diff --check passed with existing CRLF normalization warnings. Mobile search field widened after visual review; targeted browser check passed again.

### Migration rehearsal and UAT checklist (22 October 2026)

Current rollout/checklist: [Aramex UAT runbook](aramex-uat-runbook.md). It includes pending SQL files, prerequisites, storage/runtime-role verification, failure recovery, pending account questions, UAT evidence cases and production exit criteria. The submission route remains hard-disabled and must be wired to the existing UAT service/transport with verified configuration before application-driven booking tests.

Added `prisma/changes/aramex-verify-storage.sql` and `scripts/aramex-migration-rehearsal.ps1`. Read-only verification checks required columns, RLS/no policies, named index validity/uniqueness and foreign-key delete/update behavior. The rehearsal creates a disposable database only on localhost:55441, applies the exact four shipping SQL files, verifies storage, refuses duplicate tracking migration application and verifies the schema again. Rehearsal passed; disposable database removed and isolated cluster stopped. Its parent order table is a minimal foreign-key fixture. The prior 261-test suite provides separate full-schema application evidence; it was not rerun for this SQL/docs-only step.

Pending file SHA-256 hashes (current bytes; line-ending changes affect these):
- `20261022_aramex_reconciliation.sql`: 1215CF5F130C5B9CCF95FB12DA3D81F33F75B11441D1DB357838622E159A913E
- `20261022_aramex_tracking.sql`: 5C9C0EF40DF97FE7C375B9C02F6211D8166DBB75337E2F7BE34CE035FD3B94F7

No application database migration, credential activation, hosting change, carrier call or deployment occurred. Both recovery/tracking application migrations remain pending. Updated planning estimate in the runbook: 4–8 developer days plus 1–2 hours for storage rollout, with external waiting time additional; dependent on account/service confirmation and real UAT findings.


### Gated UAT submission endpoint (22 October 2026)

Connected POST `/api/admin/book-orders/[id]/shipping/submit` to `submitSavedShipment` and the existing fixed-endpoint UAT transport. Default is still disabled; no environment flags or credentials were activated. Requires current database admin role, `ARAMEX_UAT_SUBMISSION_ENABLED=true`, validated separate UAT credentials and strict `ARAMEX_UAT_SHIPMENT_SETTINGS_JSON`. No production credentials, endpoint or configuration fallback. Mapping validation runs before an attempt is created. Existing duplicate-booking, stale-order/draft, unknown-result and evidence-recovery safeguards remain in effect.

Request accepts only saved draft version, explicit UAT confirmation and timezone-qualified shipping/due timestamps. Application bounds are future shipping within 7 days and due time within 30 days after shipping, not carrier SLA claims. Body is bounded at 4 KiB; client credentials, amounts, arbitrary endpoints and other extra fields are rejected. Result exposes only status/environment/AWB/safe label/review flag. The configured server continues existing result persistence after claim even if the caller disconnects, rather than treating client cancellation as proof no booking exists.

The existing staff Create Aramex test shipment button intentionally remains disabled; a dedicated review/send UI is next. Backend activation still depends on verified account/service/egress settings. Local tests are not Aramex approval, and no real carrier booking was sent.

Validation: 287 tests passed across 23 files with two workers and isolated PostgreSQL. New cases cover enabled-route authorization, strict payload/dates/size, failed configuration before claim, safe CREATED/UNKNOWN/REJECTED output, mapping/recovery errors, default-off activation and no production fallback. Existing transport/DB integration tests cover idempotency and ambiguous outcomes. Current runbook updated with activation contract and remaining UI work.

Final route verification: TypeScript passed. Real local HTTP smoke check against the configured application database passed inbox/recovery/tracking reads and unauthenticated rejection; label availability remained false and submission returned 503 SUBMISSION_DISABLED. Isolated test database stopped; dev server remains running. No application schema changes in this step.


### Staff UAT review-and-send UI (22 October 2026)

Added a separate Send a test shipment section to the shipping preparation page. Availability is read through authenticated GET on the submission endpoint; this checks configuration only and performs no network request to Aramex. The section reviews the persisted draft version, recipient/address, parcel count/packed weight and server-provided collection amount. Staff enter shipping/due dates in the clearly identified browser timezone and tick an explicit UAT confirmation. Required inputs have red markers. Dates are validated locally and server-side; payload contains only version, confirmation and ISO timestamps.

Unsaved changes, stale drafts, custom/unapproved cities, unavailable configuration and ineligible states prevent sending. Draft saving resets a rejected shipment to DRAFT in the local view consistently with the saved server result. Editing/save actions and navigation are guarded during sending. An immediate request ref prevents duplicate clicks. Known CREATED/UNKNOWN/REJECTED/SUBMITTING results reload the persisted shipment UI, exposing labels or recovery guidance as appropriate. Any failed/lost response or 60-second browser timeout locks the send action until authoritative reload; no automatic retry. Server-side idempotency remains the final protection.

Removed the obsolete permanently disabled creation button from the status card and clarified the distinction between draft preparation and the separate UAT sending step. No environment flag, credential, application schema or deployment changed; no real carrier request occurred. The application database migrations remain installed from the previous step.

Verification: 288 tests passed across 23 files with isolated PostgreSQL, including authenticated configuration availability checks. Mocked browser walkthrough passed disabled configuration, unsaved edits, review/version/dates/confirmation, mobile layout, lost-response lock and authoritative CREATED/UNKNOWN/REJECTED outcomes. Mobile screenshot reviewed. The isolated test database was stopped; dev server stays available on port 3000. Remaining external work is still UAT registration/credentials, approved account settings and verified outbound IP routing, followed by real end-to-end tests and carrier sign-off.

Final UI verification: TypeScript and git diff --check passed. Extended browser walkthrough also passed custom-city blocking and invalid date ordering without a submission request, then the full outcome flow again.
