# 0.9.2 — testnet pages, shared activity and PDF receipts

## Install

1. Extract the full ZIP into a temporary folder, then copy its contents into your existing repository root. Replace matching files. Preserve `.git` and `.env.local`; do not copy into a nested `afripay-ai` folder.
2. Run **`supabase/testnet-activity.sql`** once in Supabase SQL Editor. It adds an immutable shared table of verified public testnet transfers. Existing invoice, credit and payment records are preserved.
3. If upgrading directly from 0.8, also install `supabase/testnet-invoices.sql`. Keep your existing server-only `SUPABASE_SERVICE_ROLE_KEY`. No new secret or mainnet setting is required.
4. In GitHub Desktop, commit `Fix testnet navigation, shared activity and PDF receipts`, then Push origin. Leave the accidental nested `afripay-ai` entry unchecked.
5. Wait for Vercel Ready. `/api/config` must show `0.9.2`, then reload the site.

## Pages

- **Overview:** wallet balance and tracked sent/received totals.
- **Invoices:** create saved testnet invoices and download invoice PDFs.
- **Pay:** choose a saved invoice, review and authorize it in your testnet wallet.
- **Transfer:** send native test NEAR without an invoice; see verification progress and a checked time directly beside the transfer.
- **Receive:** receiving address and confirmed incoming transfers with PDF receipts.
- **Transactions:** both sent and received records, explorer links, PDF receipts and existing-transaction import.
- **Analytics:** tracked sent/received totals and recent verified transfers. No USD values are invented.

Reconnect the appropriate testnet wallet on each AFRIPAY account. The app remembers a public address for read-only history after reload; reconnection is required before signing. Connecting a wallet does not prove the email account's identity or automatically give access to another account's private invoice descriptions.

## Recover payments already sent — do not resend

For an earlier paid invoice, open **Pay** or **Invoices** and click **Sync payment to Transactions** on its PAID card. This checks the existing transaction, saves its public facts and does not create another transfer.

For an older quick transfer, open **Transfer** and click **Verify on testnet** beside the existing hash. Alternatively, open **Transactions → Earlier transfers in this browser → Verify and save existing transfer**.

If a transfer is missing from this browser, use **Transactions → Find an existing transfer**. Enter its transaction hash and original sender account, then **Verify and import transaction**. The server reads the actual recipient/amount, requires successful final execution and a matching execution block, and records its public facts once.

The founder's screenshot transaction can be imported using:

- Hash: `55jZE7gnpLRzhUySa2NtqxMRp6PuxfqFcWhzmECiHWGa`
- Original sender: `alephai.testnet`
- Actual recipient: `afripayai.testnet`
- Amount: **0.01 test NEAR**

Public RPC independently confirmed this transaction and final successful receipts at block **277068066**. The founder showed the linked invoice as PAID; private hosted database state was not independently read. [Explorer](https://testnet.nearblocks.io/txns/55jZE7gnpLRzhUySa2NtqxMRp6PuxfqFcWhzmECiHWGa).

After syncing, open **Transactions** with the sending wallet and **Receive** with the receiving wallet (including in a second AFRIPAY account). Refresh activity. Both views show the same public hash, parties and amount, with the correct sent/received direction. Download a PDF receipt from either view.

## Boundaries

Shared activity includes only final native testnet transfers verified and saved by AFRIPAY: at most 1 test NEAR per transfer and the latest 100 matching records. It does not automatically index every external wallet transaction. Totals cover those tracked records, not lifetime volume. An error shows unavailable activity rather than an invented zero balance.

Shared rows contain only public chain fields; no account emails, invoice descriptions, invoice owner IDs or private invoice references. Looking up an address does not prove wallet ownership. Invoice PDFs remain available to their owner; receiving wallets get public payment receipts. Test tokens have no cash value; no real FX, tax calculation, gas sponsorship or mainnet/cross-chain settlement is claimed.

A failed history sync does not undo a paid invoice and never offers an automatic resend. Retry verification or import its existing hash after correcting the migration/provider issue.
