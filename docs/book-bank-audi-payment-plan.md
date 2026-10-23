# Bank Audi card integration: implementation status

## Cancelled-order message fix - 23 October 2026

The user's reference `LEE-BK-2026-065072CD` is CANCELLED with payment PENDING. It has no test attempt. The production inspect action correctly rejected it, but returned an unhelpful generic message. Split the cancelled/currency/awaiting-payment errors and mapped known checkout errors to actionable messages. Eligibility rules remain unchanged. Reference `LEE-BK-2026-6171CF66` is an eligible USD 9.00 printed-book order; a read-only production inspect returned 200 with no test attempt. No order was reopened or otherwise changed. Targeted sandbox tests: 28 passed, one opt-in database test skipped.

## Deployed staff TEST checkout - 23 October 2026, 21:48 UTC

Release commit `5df31c608fa1a995ba7c0abddd95591e2a13bcf5` is pushed to main and deployed READY in Production as `dpl_CsDGmAXTDdzJDSVstGpC5WGsptip` (`https://leee-enc7oaqv3-oussema777s-projects.vercel.app`), aliased to the approved www website. Build duration: 2m 9s. The three Cybersource TEST credentials are configured as server-only Production secrets; `CYBERSOURCE_TEST_CHECKOUT_ENABLED` is exactly `true`. No customer card routes were shipped or enabled. Aramex settings were preserved.

Authenticated live GET `/api/admin/book-bank-audi` returned 200 with `configured:true`, `testCheckoutAvailable:true`, `customerCheckoutEnabled:false`. Public Audi availability remains false; unauthenticated test-checkout POST returned 401. The real admin page loaded on desktop/mobile with no browser page errors or horizontal overflow. Deployment-scoped runtime error scan returned zero records through 21:48:48 UTC. No card transaction was submitted; actual success/decline/3DS tests remain pending. User can open `https://www.theleeexperience.com/admin/book-bank-audi`, load an eligible saved unpaid book/ebook order and use official sandbox cards. The TEST ledger never marks real orders paid or grants ebook access.

Vercel agent setup requested by user is complete: global CLI 65.2.0 authenticated as `oussema777`; existing `leee` project linked; `vercel@openai-curated` plugin installed/enabled user-wide (version `11c74d6b`, plugin manifest 0.21.3). The generic plugin installer failed to spawn Codex on Windows; native `codex plugin add` succeeded. Shared MCP `https://mcp.vercel.com` is configured in the user's `.codex/config.toml`, OAuth login succeeded, and write confirmation is enabled. Read-only MCP `search_vercel_documentation` and `list_teams` calls succeeded via an authenticated direct client using the CLI credential. New native tools/commands may need a fresh session to appear; this running session's tool catalog has not refreshed. No credentials were printed or committed.

Next: actual sandbox checkout through the approved website, verify provider transaction response shape and outcomes, then separately complete customer payment finalization and Areeba production activation. The underlying test session had already passed real signature, amount, origin and attempt-reference verification. Local release verification: 400 tests passed, 61 opt-in database tests skipped; production build and mocked production-mode browser checks passed. The isolated local PostgreSQL test instance was stopped.

## Staff TEST release preparation - 23 October 2026 evening

Prepared a focused release in `../leee-audi-release`, branch `audi-staff-test`, based on deployed Aramex commit `44dcd80`. It includes staff-only card testing and manual-transfer retirement. Unfinished customer card routes/finalization and unrelated donation/inventory changes are excluded. Public card checkout remains unavailable regardless of customer-test flags in this release.

Real provider session verification passed for signature, USD amount, approved www origin and attempt reference. Local browser checks passed for explicit test confirmation, interrupted SDK checkout, refresh recovery without a new start, rejected transaction lookup, independently verified result display, mobile overflow and disabled availability. Provider/API responses in browser checks were mocked. The isolated local database test passed for concurrent starts, refresh reuse, duplicate verification and leaving the real order unpaid. Broader payment, ebook and Aramex checks: 400 passed, 61 opt-in database tests skipped. TypeScript and the production build passed. The same browser checks also passed against the focused release running in production mode on localhost:3119.

The additive `CybersourceTestAttempt` migration was applied to the configured application database at `2026-10-23T21:37:50.261Z`. Runtime-role read and row-level-security checks passed; the new table is empty. Target fingerprint `80b88930fdcc2839`; migration SHA-256 `b5b8785b431c61f826bf842b3d7ecee4bef7203226819176354eb83ea7423c91`. A schema-only restore reference and rollout record are in the release's ignored `.impeccable/audi-storage-rollout/` directory. No order/payment/access/stock records were changed.

Vercel CLI is not authenticated. Requested device login to configure the existing server-only TEST credentials and staff-only switch on the approved website. Authentication, deployment, actual sandbox card payments and production activation remain pending. No credentials were printed or added to Git.

## Session resumed - 23 October 2026

Recovered the saved handoff at the user's request. Ran `npx --no-install tsx scripts/cybersource-verify-session.ts` against the real TEST provider: session signature, USD 1.00 amount, approved website origin and newly generated attempt reference all verified successfully. No card payment was submitted and no credentials or session tokens were printed. This completes resume step 1 below. Browser review of the new checkout panel and the focused staff-only TEST release remain pending; no deployment or application-database migration occurred during this recovery.

## Session handoff - 23 October 2026, paused until tomorrow

User requested saving progress and continuing tomorrow. No further deployment or integration work should be inferred from this pause. All Audi implementation changes remain local and uncommitted; no Audi deployment or application-database migration has occurred.

Latest user-facing finding: the local admin page at `http://localhost:3000/admin/book-bank-audi` loads, but its test action returned "Test card checkout is not available yet." The TEST flag is disabled, and this implementation restricts card-form starts to the approved www origin. Sending that link as if it were ready for card testing was premature. Updated the setup GET API to expose non-secret availability and a reason, and the admin page now hides unusable test controls and explains local limitations. TypeScript passed after this change. This is an availability-message fix, not a working local card-payment test.

### Resume here

1. Verify a real TEST session with the new attempt reference; validate the signed reference, amount and origin. Do not submit a payment during this diagnostic or print credentials/session tokens.
2. Review the new admin panel in a browser, including mobile, interrupted form handling and status recovery. Earlier mocked browser checks covered the setup page only, not the newly built checkout panel.
3. Prepare a focused release containing Audi work while preserving unrelated dirty donation/inventory changes and the already deployed Aramex release. Main workspace is behind remote main; do not reset it or stage everything. Prior Aramex release worktree: `../leee-aramex-release`, deployed commit `44dcd80fc44a282b7aa65002bc18b1e5ac2f4107`.
4. Apply the reviewed additive payment-attempt SQL to the application database, deploy the staff-only TEST tooling directly to the approved website, configure server-only test credentials and enable `CYBERSOURCE_TEST_CHECKOUT_ENABLED` only when prerequisites pass. User prefers direct deployment over previews. Customer card checkout must remain disabled.
5. Give the user the working admin link and official sandbox-card instructions. Test success, decline, 3DS, interrupted checkout and repeated callbacks against Cybersource. Then implement/validate customer payment finalization and ebook access before production activation with Areeba.

Credentials are already in ignored local environment configuration; do not ask the user to paste keys again or put them in notes. The dashboard merchant ID is lowercase `lb1472770101`. Actual TEST session creation and signature verification previously succeeded, but no actual card payment has been made. Final targeted session tests: 28 passed, one opt-in database test skipped in that run; the earlier full payment suite passed 146 tests, including the local database test, with 10 unrelated database tests skipped. The isolated PostgreSQL cluster on port 55441 was stopped after testing. Its new table exists locally only.

Aramex remains awaiting Nour: fixed outbound IP `72.61.160.199` whitelisting, Manal's password-reset email and UAT account readiness, plus outstanding COD/commercial confirmations. VPS gateway and prior Aramex deployment are separate completed work; gateway operation does not prove end-to-end Aramex API validation. Keep submission disabled until UAT acceptance.

## Latest implementation - admin sandbox checkout

Local code now includes an admin-only card test panel, persistent order-bound test attempts, encrypted session storage, and independently signed transaction lookup. It distinguishes test authorization, test capture, decline and unresolved results. Duplicate starts reuse the saved attempt; expired or interrupted attempts do not automatically create another payment. Browser completion supplies only a transaction ID: the server independently checks merchant, attempt reference, USD amount and transaction service results. TEST outcomes never update real order payment, stock or ebook access.

The additive migration `prisma/changes/20261023_cybersource_test_attempts.sql` was applied successfully to the isolated local PostgreSQL test database only. It has NOT been applied to the application database. `CYBERSOURCE_TEST_CHECKOUT_ENABLED` defaults to false. The hosted form requires the approved `https://www.theleeexperience.com` origin. No deployment or customer activation has occurred.

Validation: 146 tests passed, including a real local database test for concurrent starts, refresh reuse, duplicate results, transaction substitution rejection and keeping the real order unpaid. Ten unrelated opt-in database tests were skipped. Provider responses in these payment tests are simulated: an actual card transaction, decline and 3DS challenge have not been tested. The previously successful real session request did not include the new attempt reference; that binding still needs provider verification. The new panel still needs browser review.

Next: verify the reference-bearing session against the TEST provider, review the panel in a browser, deploy the additive table and disabled test tooling, then enable staff-only tests on the approved origin. Complete sandbox success/decline/3DS/interruption tests before implementing and activating real customer payment finalization. Production credentials, bank approval and capture/settlement behavior remain separate release requirements. The earlier entries below are chronological history.

## Current direction - replace manual transfers with card checkout

On 23 October the user explicitly requested removing the old Bank Audi manual-transfer offering now that gateway access exists. Local code retires transfer availability for physical books and ebooks, including ebook management test overrides. The bank setup page/API no longer edits or enables receiving-bank/QR settings. Customer receipt submission and staff manual payment review reject old Audi transfers; historical records and evidence are preserved. Physical-book customer labels now describe online card payment. Whish remains a separate manual-payment flow.

Implemented a bounded TEST session transport and RSA signature verification using the fixed Cybersource `/flex/v2/public-keys/{kid}` endpoint. Token-supplied key URLs are ignored. Session expiry, saved expected amount, USD currency, exact approved origin and the script origin/integrity fields are checked before returning a session. Real signed response evidence established `ctx[0].data.orderInformation` and the `https://testup.cybersource.com/uc/` script host. A subsequent real USD 1.00 TEST session passed all these checks; no card or payment was submitted. Session verification is not payment-result verification.

Validation: 134 offline tests passed with 10 database tests skipped; TypeScript passed. Mocked browser check verified the new Audi setup page, absent transfer activation controls, mobile width and no page errors. The ebook test-mode retirement was additionally rechecked after tightening its settings override.

These changes are local, not deployed. Customer card checkout is not active. Remaining implementation: persistent order/payment attempts and idempotency, hosted checkout UI, independently verified payment results, authorization/capture handling, expiry/interruption/reconciliation, ebook access rules, real sandbox success/decline/3DS tests, and production activation. No order status, stock, reading access, database schema or real transaction was changed in this step. Earlier QR instructions below are historical context, not the current implementation plan.

## Unified Checkout start - 23 October 2026

### Actual test session result - 23 October

**Latest result: test session creation succeeds (HTTP 201).** User saved and published the test Unified Checkout payment options (Card Payment, Visa, Mastercard and Click to Pay selected). The first retry still returned the profile error. Inspection found the configured merchant ID followed the email's uppercase spelling, while the dashboard Transacting ID is `lb1472770101`. Updated only the local merchant ID to match the dashboard exactly; the next request returned a session JWT with client library and integrity fields. Keys were unchanged. Both publication and ID correction preceded success; their individual necessity was not isolated. No card/payment was submitted, no session token persisted, and no JWT signature verification is claimed. Next: verified session handling and an order-bound checkout interface.

Ran `node scripts/cybersource-test-session.mjs` against the supplied TEST `/uc/v1/sessions` endpoint, with USD 1.00 session amount and the approved www origin. Two explicit session requests were made: first returned 404; a second diagnostic request extracted the provider message: `Profile for merchant not found or profile is still in draft state`. No session JWT, card submission or payment was created by these checks; no order/database state changed. Keys, signatures and raw responses were not printed or persisted. Do not treat this response as proof that the complete payment credentials/configuration are accepted. Resolve the merchant Unified Checkout profile publication/availability in Business Center or with Areeba before repeating session testing.

The probe uses a fixed test endpoint, 20-second deadline, bounded response, no redirects and no automatic retries. It remains a local diagnostic, not a customer route. A successful future response will be structurally inspected only; JWT signature verification remains a separate implementation task.

The new Areeba email supplies a Cybersource TEST outlet and directs us to Unified Checkout. The user completed test Business Center account setup. This is a separate card gateway integration from the historical manual transfer flow documented below.

Source: user-saved `C:/Users/Marketing Manager/Downloads/Unified Checkout Integration.html`, originating at https://www.areeba.com/projects/cybersource/Unified-Checkout . Official reference: https://developer.cybersource.com/docs/cybs/en-us/unified-checkout/developer/all/rest/unified-checkout.html .

Server-only variables: `CYBERSOURCE_TEST_MERCHANT_ID`, `CYBERSOURCE_TEST_KEY_ID`, `CYBERSOURCE_TEST_SECRET_KEY`. User filled `.env.local`; all three load successfully and both local environment files are Git-ignored. Never copy values to documentation, browser code or logs.

Started `src/lib/cybersource/test-session-request.ts`: validates test configuration, prepares a USD session request for the approved www origin, and signs the exact JSON bytes with a base64-decoded HMAC key, following Areeba's supplied instructions. Nine offline tests pass. This is request preparation only: no gateway transport, public checkout route, schema changes, deployment or payment calls yet. Credential loading/format does not prove carrier acceptance.

Next: implement bounded test session transport and validate a session; add persistent order/payment-attempt binding, hosted UI and server-verified payment reconciliation. Never mark paid from decoded browser JWT/query parameters alone. Distinguish authorization from capture, preserve idempotency and handle interrupted/duplicate callbacks. Review official session/result verification and merchant auto-processing settings before checkout activation. Current platform documentation marks HTTP Signature as deprecating; verify the migration requirements against Areeba's HMAC instructions before production rollout.

Prepared 28 September 2026 from the supplied QR image, 15-second WhatsApp voice note, and current book checkout code. The Bank Audi option is implemented locally and disabled by default. The additive payment enum patch was applied to the configured Supabase database on 28 September 2026. No deployment, bank transfer, or activation was performed.

## What the supplied material establishes

- The QR decodes to JSON with two fields, `accountNumber` and `iban`. The IBAN begins `LB47` and ends `0002`; its 28-character structure passes the mod-97 IBAN check. This checks transcription, not account ownership or payment acceptance. Keep the full banking details in a verified private configuration workflow rather than in this document.
- The voice note says this is a Bank Audi QR, that LEE now has Bank Audi and Whish QR codes, and that Manal suggested putting both on the website to try payments. The recording does not specify account holder, currency, fees, bank app compatibility, or verification procedure.
- The QR does not contain an amount, order ID, payment URL, or callback. Scanning it alone cannot tell the website that a transfer succeeded. A customer must enter the exact amount and an order reference; staff must confirm receipt in the bank account before marking the order paid.
- Bank Audi's [mobile app instructions](https://www.bankaudi.com.lb/lebanon/adc/bank-audi-mobile-application) describe transfers using a beneficiary IBAN, amount, and currency. They do not establish that this JSON QR is scannable by every bank app. Its [External Account terms](https://www.bankaudi.com.lb/externalaccount) show that incoming transfer charges can apply to some accounts; the actual account type and charges need confirmation.

## Fit with the current site

The site has cash checkout plus a prepared, disabled manual Whish flow. Bank Audi now appears as a distinct `BANK_AUDI` order method and has a separate admin configuration row and customer/admin labels. The reviewed-payment table and private payment routes are shared internally with Whish to preserve the existing stock, expiry, token, proof, and audit safeguards. Existing Whish orders remain distinct through `BookOrder.paymentMethod`.

## Proposed customer flow

1. Customer chooses **Bank transfer (Bank Audi)** at checkout. The server creates a pending order with the calculated USD total and a private payment link.
2. The payment page shows the exact total, unique order reference, receiving account name, copyable IBAN/account number, and the original QR. It tells the customer to enter the amount and put the order reference in the bank transfer description. It offers manual IBAN entry because QR scanning support is unverified and customers may be viewing the page on the same phone used for banking.
3. Customer submits the bank transaction reference and optional proof. The page says **Awaiting verification**; it does not claim payment succeeded.
4. Admin checks the actual receiving account and verifies beneficiary, currency, net amount, and reference before confirming the order. Partial, excess, wrong-currency, duplicate, or late transfers go to manual reconciliation.

## Implemented locally

1. The original QR is copied unchanged to `/payments/bank-audi/20260928.jpeg`. The decoded account number and IBAN are prefilled in disabled admin setup at `/admin/book-bank-audi`; the exact beneficiary name remains blank. Setup rejects an IBAN with a bad checksum or details that differ from this versioned QR. Replacing the QR requires a reviewed code and asset change.
2. The additive patch `prisma/patches/20260928_book_bank_audi.sql` adds `BANK_AUDI` to the payment-method enum. Apply the earlier Whish patch first. Bank Audi uses the existing reviewed-payment table and a separate configuration row in its settings table, so no existing payment rows are changed.
3. Checkout shows Bank Audi below Whish as unavailable until staff have saved and verified its account/QR and USD transfer terms, then explicitly enabled it. Server pricing, order reservation, private links, QR/IBAN/reference instructions, receipts, English/Arabic messages, payment expiry, staff review, duplicate verified references, and refunds use the existing guarded flow.
4. Local verification: Prisma schema validation, TypeScript checking, 203 automated tests, and a full Next.js production build pass, including new Bank Audi activation, pending order creation, and exact-amount bank review checks. These tests do not exercise a real banking app, live bank account, or production database.

## Activation steps

1. The earlier Whish database setup and additive Bank Audi enum patch are present in the configured Supabase database. Check the target deployment database before deploying this code elsewhere.
2. Deploy to isolated staging with test email recipients and database. Check cash and Whish regression, $5/$9/$25/$50/$80 Bank Audi totals, pickup, delivery, gift/donation, retries, receipt upload, expiry, review, and cancellation. Confirm the QR can be scanned in the intended app; use the copyable IBAN path on the same phone.
3. At `/admin/book-bank-audi`, confirm the exact beneficiary name, account number and IBAN against the account owner; verify the QR and USD transfer terms. Save setup, then enable Bank Audi only after an authorized test transfer is reconciled in the actual bank account.

## Decisions required before activation

- Confirm the account holder's exact name and that this account belongs to LEE and accepts **fresh USD** transfers for these book orders. Confirm whether local and international transfers are allowed.
- Have the account owner confirm that the decoded IBAN/account number match the bank's own app or statement, and test the QR with the banking apps customers will use. Confirm whether this static QR can be reused.
- Confirm transfer and incoming fees, expected settlement time, any minimum amount, and whether the customer must cover charges so the received amount matches the order total. This matters especially for $5 and $9 orders.
- Confirm what reference or proof the bank exposes to staff, who will review payments, and how unmatched/partial/late payments and refunds will be handled.
