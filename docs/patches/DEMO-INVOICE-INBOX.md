# Focused Demo invoice inbox patch — AFRIPAY 0.9.5

Demo now has two distinct invoice workflows:

- **Create invoice:** bill another signed-in AFRIPAY account; it receives the request in its inbox and can pay with DUSD credits.
- **Upload invoice:** extract/review a supplier document in your private workspace. Uploading by itself does not send a bill to another account.

Mainnet/testnet modes keep their existing separate flows. DUSD has no cash value and this patch sends no blockchain transaction.

## Install on an existing deployment

1. Copy the included files into the matching locations in your project. Preserve `.git` and `.env.local`.
2. Open Supabase → SQL Editor. Run the complete **`supabase/demo-invoice-inbox.sql`** file once. The existing `final-payments.sql` foundation must already be installed. Do not rerun your older migrations or reset balances. This additive patch creates a separate invoice table/functions and preserves existing credit balances, transfers, uploaded documents and mainnet/testnet records.
3. Commit with summary **Add Demo invoice creation and account inbox**. Push origin, wait for Vercel Ready and reload the app.
4. No new environment variables, API keys, funding flag or version bump are required.

## Test using your two accounts

Use separate browser profiles, or one account on PC and the other on your phone. These must be different intended AFRIPAY accounts for this test.

1. **Customer — Account B:** choose Demo → Receive. Copy the full Receive code. Optionally save a receipt display name. Claim test credits if this account has not claimed its one-time grant and needs funds.
2. **Issuer — Account A:** choose Demo → Invoices → Create invoice. Enter B's Receive code, a unique reference such as `DEMO-BILL-001`, amount `200` DUSD and a description. Review the returned customer label and code. Check the confirmation and send.
3. **Account A:** the invoice appears under Issued demo invoices as Unpaid. Sending it has not transferred credits.
4. **Account B:** open Invoices → Received demo invoices. Refresh if needed; automatic checks run while the page is visible. Review the immutable issuer, amount and description. Check the approval box and approve the DUSD invoice payment.
5. Both accounts now see Paid (demo). B loses 200 DUSD and A receives 200 DUSD. Both can download the Demo invoice PDF and view/download the payment receipt. Transactions show the invoice reference and sent/received credit entry.

A Receive code identifies the account being billed; it is not the destination of a new transfer during invoice creation. The eventual DUSD payment goes from the customer back to the invoice issuer.

## Rules and recovery

- Demo invoices do not require supplier registration, administrator approval or a wallet. Existing supplier-directory payments still require approved recipients; sample invoice contacts do not gain payment privileges.
- An invoice reference is unique per issuer. Retry an uncertain request with the same approval, or refresh Issued/Received invoices to recover it. Do not create a replacement bill simply because a response was lost.
- Only the designated payer can approve payment. Amount and recipient are fixed by the database invoice. Payment, debit/credit entries and Paid status update are atomic. A Paid retry cannot debit again.
- Only the issuer can cancel an unpaid bill. Neither party can edit issued details or manually mark it paid. A cancellation prevents payment, and paid invoices cannot be cancelled.
- Only issuer and payer can read their invoice and receipt. Names are account-chosen, not identity certification. Descriptions are untrusted display text.
- Per-transfer and daily DUSD limits, available balance and saved spending policies remain enforced by the existing ledger coordinator.
- PDF labels explicitly state Demo/DUSD and that no real funds or blockchain settlement occurred.

## Verification

Database tests run the actual migration in embedded PostgreSQL, including atomic balances, retries, participant access, cancellation, policy rejection and additive reinstallation. Browser tests use the real SDK with isolated mocked account services, shared state across two browser accounts, desktop/mobile Chromium and PDF downloads. They do not establish acceptance on your hosted Supabase project or actual iOS Safari; perform the steps above after installation.
