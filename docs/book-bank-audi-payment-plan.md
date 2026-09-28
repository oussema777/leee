# Bank Audi QR: book checkout preparation

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
