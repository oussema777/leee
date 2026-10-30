# Whish Pay sandbox acceptance report

Date: 30 October 2026. Website: theleeexperience.com. Test channel: 15467873. No real funds collected.

## Results

| Check | Result |
| --- | --- |
| Supplied credentials | Accepted by sandbox API. |
| Admin USD 1.00 diagnostic | Hosted success, callback received, persisted success verified. |
| Printed-book browser purchase | Correct USD 5.00 total; order automatically confirmed. |
| Stock and shipping isolation | Stock unchanged (1 before/after); test references blocked from shipping. |
| Ebook browser purchase | Catalog USD 5.00 total; no access before payment, access granted after verified success. |
| Protected reading | Page-image API returned HTTP 200/image content; reader navigation enabled. |
| Duplicate callbacks | Exactly one confirmation event for both book and ebook orders. |
| Failed simulation | Pending immediately after failure, failed after expiry. |
| Unused link expiry | Pending then failed after expiry. |
| Concurrent starts/finalization | Passed with PostgreSQL locks; same attempt, one fulfillment. |
| Timeout recovery | Fault-injection test reused exact externalId/request. |
| Ownership and tampering | Private token, admin/reader ownership, changed totals and cancelled/non-test orders checked. |
| Mobile, Arabic and refresh | 390px layout, Arabic confirmation and saved-order recovery passed. |
| Reviewer expiry/revocation | Passed in database tests; no admin session is granted. |
| Reviewer failure-to-expiry-to-retry | Passed on deployed site without admin login: pending after failure; retry withheld until failed; fresh externalId; successful retry automatically confirmed. |
| Refund | Not passed: HTTP 200, status:false, code:auth.error. Provider follow-up needed. |

44 Whish automated tests passed. 185 selected regression tests passed, with 11 additional environment-gated tests skipped. TypeScript and production builds passed.

## Provider references

- Diagnostic success: LEE-W-SBX-a7908470-4576-4870-9f6e-b2cd7969ac3c.
- Printed-book success: LEE-W-SBX-1047767b-9e53-4424-9692-66f245b8e48f.
- Ebook success: LEE-W-SBX-7451890c-9ed4-4dcf-940c-bc8ab1cb58c9.
- Failed simulation probe: LEE-W-UAT-5c1a8a1b-7bdd-4a7f-803d-d2f781b3328b.
- Expired unused link: LEE-W-UAT-576a8f62-73a0-4693-b9e3-b599366c399f.

The two standalone negative probes had no customer-order association and could not fulfill anything. Actual purchase and reviewer tests use persisted callback capabilities and linked sandbox orders.

## Review access

Admin: https://www.theleeexperience.com/admin/whish-pay.
External review: use the complete private link in the handoff. It grants no admin permissions, allows at most 20 synthetic USD 1.00 orders and expires 13 November 2026 at 15:40 UTC.

## Questions for Whish

1. Please review the sandbox integration and confirm any additional acceptance/certification cases.
2. What are the next steps for production credentials and activation for theleeexperience.com?
3. Please confirm refund permissions and egress-IP allowlisting for Sandbox and Production. Our sandbox refund probe returned auth.error.
4. Please confirm callback retries, recommended polling frequency/rate limits, and production settlement/reconciliation procedures.

This report does not claim validation of real payments, production inventory/email fulfillment, or automated refunds.


Reviewer failed attempt: LEE-W-SBX-244ba11e-114a-4bfa-b902-822ded5cc45d.
Reviewer successful retry: LEE-W-SBX-54af1277-a7df-449d-93d1-4befd8446fa7.
