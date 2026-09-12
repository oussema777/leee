# Book Restore · manual Whish payments

Prepared 11 September 2026. Code and supplied QR assets are integrated locally. **Whish remains disabled by default. No production database migration, deployment, payment or email was performed during this work.**

## What is confirmed

The five original files were decoded and copied unchanged into `public/payments/whish/`. Each QR contains a Whish payment URL with an opaque identifier. **The amount labels come from the filenames; decoding does not verify the receiving account, USD amount, reuse or expiry.** Opening the destinations with the research browser did not establish those details.

The user reports that Whish's team said online Whish Pay is not active for LEE. Whish's current [official app listing](https://apps.apple.com/us/app/whish-money/id1284243483) describes QR payments and online payments at participating websites. That does not establish LEE's activation, credentials or eligibility for an automated gateway.

This implementation uses manual wallet verification. It does not call a Whish API, infer payment success from opening a link, or automatically charge or refund anyone.

## QR amounts

| Package | Books received | Pickup | Delivery | LEE distribution |
| --- | ---: | ---: | ---: | ---: |
| Single | 1 | $5 | $9 | $5 |
| Five | 5 | $25 | $25 | $25 |
| Ten + one free | 11 | $50 | $50 | $50 |
| Twenty + two free | 22 | $80 | $80 | $80 |

All amounts are USD. Only single-book delivery adds the $4 delivery fee. The current gift flow uses delivery; sponsored books use LEE distribution.

| Labelled amount | Original file | Imported asset | Exact decoded link |
| --- | --- | --- | --- |
| $5 | `05 dollars.jpeg` | `/payments/whish/usd-5.jpeg` | [Whish $5 slot](https://whish.money/pay/e0vYXCNFW) |
| $9 | `09 dollars.jpg` | `/payments/whish/usd-9.jpg` | [Whish $9 slot](https://whish.money/pay/D0UYaCfKs) |
| $25 | `25 dollars.jpg` | `/payments/whish/usd-25.jpg` | [Whish $25 slot](https://whish.money/pay/x0rYcCeVF) |
| $50 | `50 dollars.jpeg` | `/payments/whish/usd-50.jpeg` | [Whish $50 slot](https://whish.money/pay/B0fYkCf1I) |
| $80 | `80 dollars.jpeg` | `/payments/whish/usd-80.jpeg` | [Whish $80 slot](https://whish.money/pay/90QYYC870) |

The server calculates the total and selects an exact match. It never substitutes another QR when the amount is unsupported.

## Message to Fatima

> Please confirm the exact Whish account name and phone number receiving these five QR payments. Can different customers reuse each QR, including after a successful payment? Does any code expire, and if so when? Please also check that each opens with the correct USD amount: $5, $9, $25, $50 and $80.

The user has **not** asked about reuse or expiry yet. These remain unconfirmed. No additional codes are needed unless verification finds an issue. If a code accepts only one payment, do not enable this shared-code checkout; it needs a per-order code workflow instead.

Payment-help WhatsApp is prefilled from the website's existing contact fallback, `+961 3 600 747`. This is a support contact, **not an assumed Whish receiving account**. Receiving name and number stay blank until provided.

## Customer experience implemented

1. The existing book, package, purpose and fulfilment steps remain. Cash remains available.
2. Whish appears only when all five slots and receiving details are verified and enabled. Setup failures hide the method. The cash/Whish selector is inside the order card below the books. On mobile the card appears before contact fields; consent and submission remain after the fields.
3. Checkout records explicit consent, calculates the amount on the server and reserves custom-selected books inside a database transaction.
4. Whish checkout goes directly to a private payment page in English or Arabic, with a neutral loading/fallback link instead of a success screen. It shows the pending order reference, total, fulfilment method, deadline, saved receiving details and matching original QR. The initial purchaser email also says payment is pending. Order confirmation appears only after staff verify receipt.
5. Payment is a three-stage flow: transfer, submit transaction details (with an optional screenshot), then await verification. The original QR is visible by default, followed by copyable receiving account details. Payment options use icon cards with a clear selected state; the mandatory consent label has a red asterisk. Both checkout transition and initial payment loading show an animated QR indicator with reduced-motion support. The external payment-link shortcut was removed after the user reported an expired-link message, probably for $5; scanning that QR inside Whish remains unverified.
6. Customers can copy receiving details and their private return link. The browser saves a return link; an optional purchaser email also receives it. Payment links are not sent to gift recipients.
7. After transferring, the customer submits the Whish transaction reference and sender's phone number. The state becomes **awaiting verification**, never automatically paid. The submitted screen now shows selected book covers, titles and authors, free extras, book count, transaction reference and expected amount. LEE-choice orders explain that the team will select books. A team-call message explains verification and fulfilment confirmation; closed orders describe resolving the next step. The authenticated recap selects only public book fields for that order.
8. The page refreshes on return to the browser and periodically while visible. It explains corrections, confirmed receipt, refund records and expired/closed orders.

Order retries with the same token and unchanged details return the existing order. Duplicate clicks are blocked. Retrying within the same checkout keeps the token. Reloading before any successful response is not a complete recovery mechanism; the purchaser's email or staff reconciliation may be needed.

Optional JPG, PNG and WebP receipt screenshots are accepted up to 2 MB. The server limits multipart size, decodes images with a 16-megapixel limit, strips metadata by re-encoding to WebP, and stores them in the private `book-whish-receipts` Supabase bucket. The bucket is created on first upload using the existing service credentials; a public bucket is rejected. Audit events store a private object path. Only authenticated payment administrators can read images through the order-scoped receipt route, with no-store headers. Failed database submissions attempt to remove orphan uploads; cleanup failures are logged. Storage delivery still needs verification in the running environment. The private API omits purchaser names, gift-recipient details and addresses. A 32-byte random token authorizes access; only its SHA-256 hash is stored. The token is in the link fragment, not a query parameter. Anyone holding the complete link can access the payment page.

## Staff workflow implemented

Payment configuration is at `/admin/book-whish`; review is within `/admin/book-orders`.

- ADMIN and SUPER_ADMIN can configure payments, verify incoming funds and record refunds. These actions recheck the user's current database role.
- The order list can filter Whish orders by payment state and search submitted/verified transaction references.
- Staff inspect the **actual receiving wallet**, compare the sender and receipt, enter the actual received USD amount and reference, and explicitly confirm the wallet check.
- Verification requires the exact order amount. Confirmed transaction references are normalized and unique across orders.
- A customer assertion, screenshot or generic “Paid” field cannot bypass verification. Whish fulfilment is blocked until receipt is verified.
- Corrections require a customer-facing explanation. Active orders receive a fresh configured correction window; closed orders stay closed.
- Confirmation, correction and refund updates are emailed to the purchaser when an email was supplied. Delivery failures do not reverse a saved order or payment review.
- A refund action records a refund already completed outside the website. It does not send money. This action currently applies to verified payments; unmatched, partial or excess payments need staff reconciliation.
- Reviews, reports, expiry and cancellation are audited. Stale reviews/settings are rejected so one staff session cannot silently overwrite another.

## Reservation and late-payment behaviour

The default payment window is 24 hours; staff can set 1–168 hours. A new order's deadline cannot exceed its QR's confirmed expiry.

Unreported or correction-requested orders expire. Stock release and cancellation use order locks and transactions to prevent double release. Submitted payments awaiting staff review do **not** expire automatically.

Cleanup runs when book pages, checkout or a private payment page are accessed, and a protected daily cron is configured at `/api/cron/book-payments` (`0 4 * * *`, UTC). Each sweep handles up to 50 candidates. Actual background stock release can lag the deadline; the private page stops showing instructions after the deadline. Monitor backlog and review payments daily.

The daily schedule is compatible with [Vercel's documented Hobby scheduling limits](https://vercel.com/docs/cron-jobs/usage-and-pricing); more frequent scheduling requires checking the deployment plan. Set `CRON_SECRET` so authorized cron calls can run.

Customers who paid after expiry or cancellation can still report the transaction. Staff can record receipt, but the order stays closed and inventory is not reserved again. LEE must arrange fulfilment separately or refund. Dispatched/completed Whish orders cannot be restocked simply by cancelling them.

## Activation steps remaining

1. Receive Fatima's answers and verify all five codes in Whish: receiving account, USD amount, repeat use and exact expiry/no expiry. Verify real same-phone behaviour on the phones customers use.
2. Review and apply [the additive database patch](../prisma/patches/20260911_book_whish.sql) to the intended environment **before deploying this build**. It creates three tables, indexes, foreign keys and a state enum, with RLS enabled on the new tables. It does not enable Whish or alter cash-order data. Admin queries in this build require the new tables.
3. Deploy to an isolated staging environment first. Use test recipients for emails and an isolated database. No test should create orders against the current production database.
4. In payment setup, save the receiving account details first. Verify the five slots against that saved account; mark confirmed repeat use and expiry. Enter an expiry in UTC where applicable. Save with Whish disabled until the checks are complete.
5. Check the existing email configuration (`RESEND_API_KEY`, `EMAIL_FROM`, team `EMAIL_TO`), `NEXT_PUBLIC_SITE_URL` and `CRON_SECRET`. A private link must use the deployed site's origin.
6. Check cash checkout; both single-book pickup/delivery totals; larger packs; gift and LEE-distribution flows; stock contention; expiry/cancellation; a late receipt; duplicate transaction rejection; and two staff members reviewing simultaneously on staging.
7. Once the receiving account and codes are verified, enable Whish in setup. If verification requires real transfers, arrange them explicitly with the account owner.

To pause collection, disable Whish in setup. This hides new payment instructions, including on existing pending pages, while preserving reports for already-sent money and staff review. Do not delete payment records or undo stock updates by hand.

Treat this QR batch as immutable. Replacing an image or link requires disabling collection, using new versioned asset paths, updating the manifest, and clearing/repeating verification. Previously issued payment snapshots must not silently point to changed assets.

## Verification completed locally

- 172 automated tests passed after the UI refinement, including order-scoped recap projection and LEE-choice handling, including the existing suite, exact package totals, disabled setup, consent, private access, retries, inventory expiry, review guards, image decoding/size limits, private storage restrictions, screenshot authorization, and cleanup after failed or concurrent submissions.
- TypeScript and Prisma schema validation passed.
- 51 checks passed in headless Chrome using actual customer/admin components with simulated APIs. Coverage includes English/Arabic mobile/desktop layouts, the five QR mappings, card placement, no premature success screen, separate payment/proof steps, screenshot preview/submission, deadline handling, retries, private links, cash fallback, Whish pickup, setup and staff review.
- All five imported asset copies are byte-for-byte identical to the originals. The originals and their 320px renderings decode to the exact links in the manifest.
- Browser checks use a local fixture, not a Whish wallet, live Next server or real PostgreSQL database. They do not establish provider-side QR validity or real database concurrency.
- Full Next.js production compilation could not be validated in this Windows environment. The compile attempt returned EACCES/EPERM errors, including an inaccessible parent directory selected by Next.js because of another lockfile. The build used an isolated localhost database URL and disabled email. Run the full build and database acceptance checks in staging before deployment; passing the isolated component bundle is not a substitute for that check.

## Later automated Whish Pay integration

Keep manual payment records and their audit history. When LEE receives merchant activation, official integration documentation and credentials, add the provider's supported checkout/session flow and verified server-side payment notifications. Require amount/currency/order matching, unique provider references and retry-safe callbacks. A browser redirect alone must never mark an order paid. No endpoint, signature format, fee or activation date is assumed in this implementation.
