# Payment completion and mainnet invoice inbox patches

These are focused patches for the existing AFRIPAY 0.9.5 installation plus its separate-payment fix. The version stays 0.9.5. No package installation, new secret or app-wide replacement is required.

## Install both patches

1. Extract **Patch A — Payments and notifications**. Copy its `app`, `components`, `hooks`, `lib`, `supabase` and `tests` contents into the matching folders of your existing repository. Preserve `.git` and `.env.local`.
2. Extract **Patch B — Invoice inbox and supplier dashboard**. Copy its contents into the same repository **after A**, allowing the included files to replace A's navigation. This adds the invoice screens to the payment/notification foundation.
3. In Supabase SQL Editor, run the entire **`supabase/business-inbox.sql`** file from Patch A. It requires the existing network-suppliers and mainnet/separate-payment migrations. It preserves registrations, payments and receipts. Do not rerun older mainnet or separate-payment SQL afterward.
4. GitHub Desktop Summary: **`Add invoice inbox, supplier dashboard and payment notifications`**. Commit, Push origin and wait for Vercel Ready, then refresh AFRIPAY.

You can copy A and B, run SQL and push once. No payment is sent by installing or refreshing the patches.

## What changed

### Payment completion and repeating a payment

After verified settlement, the payment page shows **Paid**, its receipt and explorer link. It no longer displays the previous-payment warning or pre-payment risk panel automatically.

To pay again deliberately, choose **Make a new payment**. Only then does the previous-payment warning appear. Checking **I checked the previous payment. This is a separate new payment, not a retry** immediately opens `/payments/new`, with a separate reference and the destination ready for review. There is no second Prepare button. Recipient confirmation is cleared, and normal review and wallet approval remain required.

Pending, authorizing and uncertain payments stay in recovery. Every transfer still counts against the existing spending caps. Distinct published invoices have distinct payment identities even when two businesses use the same human invoice number; the same invoice cannot be paid twice.

### Invoice status

Published requests and the private inbox refresh every 15 seconds while visible and on window focus. They show **Unpaid → Processing → Paid**, based on the bound order's verified settlement. Refresh can reconcile up to three already-submitted hashes; it never signs or sends another payment.

A matching amount, reference or wallet alone does not mark an invoice paid. An older separate unbound transfer does not automatically pay an unrelated open request. If a submitted payment's hash was never captured, recover the existing hash through the saved payment rather than resending it.

### Notifications

Use the header bell in Live wallet mode. Notifications cover payment sent, payment received, invoice received, invoice delivered and invoice completed. They are private to the account, deduplicated and marked read when opened. Completion requires verified settlement. Existing verified records are backfilled once; rerunning the migration does not duplicate messages or reset read status.

Registered receiving businesses receive settlement notices. A viewed public NEAR wallet also supplies public transfer observations, explicitly labeled as a viewed address; this is not proof of wallet ownership. The list shows the latest 100 notifications.

### Upload and check a supplier bill

Choose **Live wallet → Invoices → Upload supplier bill**. Upload PDF, PNG/JPEG/WebP or TXT, or paste text. PDF text and English OCR are read in the browser; extraction sends text to AFRIPAY. Optional AI must be explicitly selected and already configured. Original files are not automatically published or delivered.

Review extracted fields, optionally compare the destination with an approved supplier, then select **Check invoice security**. Edits invalidate the previous review. The checks explain address changes, invalid fields, duplicate matching account records, unsafe instructions and missing evidence. Critical risk cannot proceed. The payment review accepts at most 12,000 characters of complete invoice text; longer documents need a shorter review document rather than silently omitted instructions.

After independent confirmation, **Review payment proposal** opens Pay with the fields prefilled. It does not quote, authorize or send money automatically. Selecting a different token does not convert the numeric amount. A selected registered supplier's current destination is checked again by the server when preparing payment.

### Send an invoice inside AFRIPAY

Choose **Invoices → Create invoice**, or open **Supplier dashboard**. Issuing an invoice means requesting payment from the selected business to **your** registered receiving address.

Your mainnet business must be registered and administrator-approved to issue invoices. Choose another approved registered business, enter the reference, amount, token and description, confirm the recipient and select **Send invoice to business inbox**. Requests inherit the seven-day expiry and a limit of 20 active unpaid requests. The invoice appears in the recipient's Received invoices and your Issued invoices, with private in-app notifications. No link needs to be copied or sent. Optional payment links remain available.

The recipient opens **Received invoices → Review and pay invoice**. The amount and payee destination are locked to the issued invoice. Their wallet still approves the payment. Verified settlement updates both parties to Paid. Both can download an invoice PDF; a paid PDF includes settlement references.

The dashboard displays recent issued/received invoices and their states. It covers the latest 100 invoices, not lifetime account totals. Unavailable data is shown as unavailable. A customer who is not listed in the approved business directory can still pay through an optional payment link.

## Check after deployment

1. Open a completed payment: confirm Paid and its receipt, with no automatic repeat warning.
2. Choose Make a new payment, then tick the separate-payment checkbox: it should open the new payment page without signing anything.
3. Sign in as an approved mainnet supplier, select a second registered business and issue an invoice. Confirm it appears in Issued invoices without copying a link.
4. Sign in as that business: check the notification and Received invoices. Review the locked payment details, then deliberately approve a small test in your wallet if you want to verify real settlement.
5. Refresh both accounts. After genuine verification, both must show Paid and the receipt references. An unverified hash must not show Paid.
6. Upload a supplier bill and check that changing any extracted field clears confirmation and requires another security review.

## Verification and limits

408 automated checks pass, including real embedded PostgreSQL permissions, invoice delivery atomicity/idempotency, destination validation, invoice identity, one-payment binding, private notifications, notification deduplication, unchanged financial caps, settlement checks and Unicode invoice PDF generation. The production build, TypeScript and 44-route HTTP smoke check pass. All 154 desktop/mobile regression checks passed, followed by 8 focused checks of the final document-change safeguard. The standalone payment/notification navigation also passes TypeScript. Browser verification uses isolated auth/API/wallet fixtures; no new funded mainnet payment was signed by the assistant. Optional OCR/model availability and the user's live database/deployment configuration require normal post-deploy checking.
