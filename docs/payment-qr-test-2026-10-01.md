# Book payment QR retest — 1 October 2026

## Evidence received

- Whish screenshot: `C:\Users\Marketing Manager\Downloads\FireShot\WhatsApp Image 2026-10-01 at 13.59.51.jpeg`. It shows a Whish Pay page for The LEE Experience with empty payment and total fields. It does not show a completed payment.
- Three voice notes received on 1 October 2026. The speakers report that the Whish route was not usable for payment, required manual recipient entry in the app, and was not user friendly. For Bank Audi, scanning led to a page with the IBAN but did not allow the tester to copy it. These are summaries of automated Arabic transcripts, not a transaction record.
- No successful transfer, receipt, receiving-wallet/bank confirmation, or replacement QR was supplied.

## Findings

- The screenshot establishes a failed Whish test on the supplied device. It does not establish whether the failure is caused by the QR's destination, an expired invoice, merchant configuration, app support, or a temporary Whish issue. A website change cannot repair an invalid provider destination.
- The Bank Audi QR contains account identifiers, not an amount or order reference. A scan that displays an IBAN does not initiate or confirm a bank transfer. The website can offer a copyable IBAN and order reference, but the receiving account, USD terms and a controlled transfer still need verification.
- Whish describes **Whish Me** QR transfers and **Whish Pay** merchant checkout as distinct services. LEE needs a provider-confirmed working collection method and a completed test before re-enabling Whish checkout. See [Whish FAQ](https://www.whish.money/faq) and [Whish Wallet](https://www.whish.money/whish-app).
- Bank Audi's [mobile instructions](https://www.bankaudi.com.lb/lebanon/adc/bank-audi-mobile-application) describe entering a beneficiary IBAN. They do not establish that this supplied JSON QR works in the intended banking apps.

## Containment and website changes

- On 1 October, the configured database had both book payment methods enabled and QR-verified. Both were set to `enabled: false` and `qrVerified: false` in one transaction. Saved receiving details were retained. A follow-up read confirmed the disabled state. Cash checkout was not changed.
- The customer payment page now shows the amount, recipient details and copy controls before an optional QR section. Bank Audi instructions direct customers to copy the IBAN and enter the order reference; Whish instructions explain manual recipient entry and a blank QR destination. No payment is labelled complete without staff verification.
- The payment loading screen no longer claims to create a Whish QR. Admin verification text now requires a controlled payment and confirmation of actual receipt before either QR can be marked verified again.

## Re-enable checks

1. Confirm the exact receiving wallet or bank account, currency, fees and intended customer payment route with its owner/provider.
2. Test from a customer's device through a completed low-value transaction. Check the displayed beneficiary and amount before sending; confirm the exact receipt in the receiving account.
3. For Whish, confirm whether the QR can be reused, whether it expires, and whether LEE has merchant Whish Pay enabled or should use another provider-approved transfer route. Replace the QR if needed.
4. For Bank Audi, confirm whether the QR starts a usable transfer in the intended app. If manual IBAN entry is the supported route, decide whether to offer bank transfer without a QR and test that complete flow.
5. Only after the tested route is agreed should an admin re-verify and enable the method in checkout. Do not infer success from opening a QR page or from a customer screenshot alone.
