# AFRIPAY 0.5 — clean accounts, real observations and two-account test credits

## Install safely

Keep your existing project as a backup and stop its server with Ctrl + C. Extract the complete 0.5 ZIP into a new folder and open its `afripay-ai` folder in VS Code. Copy your own `.env.local` beside `package.json`, or run `npm.cmd run setup` to recreate it with your project URL and publishable key.

### One new Supabase step

Open `supabase/demo-accounts-feedback.sql` in VS Code. Copy ALL of it into a new query in your EXISTING Supabase project's SQL Editor (`>_`) and click Run. Expect Success. No rows returned.

Keep the previous `account-profiles.sql`, `supplier-marketplace.sql` and `workspace-sync.sql` migrations installed. The new migration adds a separate test-credit ledger and private feedback; it does not delete your profiles, supplier approvals or demo invoices. Run it again safely if needed.

Then run these commands one at a time:

```powershell
npm.cmd ci
npm.cmd run dev
```

Open the exact Local URL printed by the terminal. Refresh with Ctrl + Shift + R.

## New users and existing data

New guest and signed-in workspaces start with NO invoices, suppliers, payments or alerts. No illustrative $24,860 balance is displayed. Invoices and payments appear only after the user creates them. The clean/suspicious example buttons load an illustrative supplier record only after the user chooses a sample scenario. An extracted wallet is still unverified.

Existing users' saved demo records are preserved. To intentionally remove your old simulation invoices/payments, use Settings → reset/clear demo records and confirm. This does not reset the separate test-credit ledger, supplier application or account profile.

## Sign-in rules

Guests may upload an invoice, use local extraction, review security evidence and run public NEAR lookups. Account sign-in is required before approving an invoice demo payment or downloading files. Optional paid AI still requires sign-in and provider setup. A guest invoice is preserved through the sign-in flow and reopened for review, with recipient verification cleared. The continuation expires after 30 minutes; saved guest records also remain in their separate local workspace.

Previewing or settling an invoice payment in the legacy simulation does NOT move test credits or real tokens. Its screen/receipt remains labeled demo. Use **Demo transfers** for the two-account debit/credit experiment below.

## Two-account test: 1,000 → 800 and 0 → 200

DUSD is a valueless database test credit. It is NOT USDC, NEAR, a stablecoin, a bank balance or a blockchain asset. Two email accounts do not create two blockchain wallets.

1. Sign in as receiver Account B. Open **Demo transfers**. Its balance starts at 0. Copy its **demo receive code**. This code is not a wallet address.
2. In another browser/incognito window sign in as payer Account A. Open **Demo transfers**. Its balance also starts at 0.
3. In A click **Claim 1,000 test credits**. This explicit grant can be claimed only once per account.
4. Paste B's receive code, enter `200`, and click **Review demo transfer**.
5. Confirm the recipient/amount checkbox and click **Approve test-credit transfer**.
6. A should show **800.00 DUSD**. In B click **Refresh balance and history**; B should show **200.00 DUSD** and a received transfer.
7. Both accounts should see the same transfer reference in their own history. Reload to verify the values remain.

The database debits and credits in ONE transaction. It checks the available balance and rejects self transfers, invalid amounts, transfers above 1,000 DUSD and daily outgoing totals above 5,000 DUSD. Retrying the same approval ID cannot debit twice; changing details under an existing approval ID is rejected. There is no redemption or cash withdrawal. Account users cannot directly edit balances or ledger entries.

These server-ledger operations are simulated account transfers, separate from the native NEAR testnet lab and the unfinished funded Intents coordinator. A real wallet balance changes only through an actual blockchain transaction, including its network fees.

## Public NEAR wallet and transaction checks

Open **NEAR explorer**, available in Demo or via the check button in Live Wallet. No wallet connection is required for a read-only lookup.

- Wallet: select mainnet/testnet and enter an account ID. The tool retrieves final account state, native NEAR balance, locked balance, block information, provider and check time.
- Transaction: select the correct network and enter the transaction hash AND sender account ID. The tool verifies matching provider evidence and displays confirmed/pending/failed/unknown status. Native amounts describe Transfer actions only; contract token transfers are not decoded.
- Missing data or provider errors are unavailable/unknown, never simulated success. No external scam feed or full historical movement analysis is claimed. A wallet's activity or a confirmed transaction does not guarantee legitimacy.
- Sign in to download a fresh observation report. These lookups never sign, send, credit or debit a blockchain transaction, nor mark a real invoice paid.

## Credits, publication and feedback

The footer credits **Yabsera Teklemariyam** and publishes **yabsiratekle@gmail.com** for contact, as requested. Privacy, prototype Terms & rules, Contact and Ideas & feedback pages are available publicly. The publication field stays **not published yet** until the actual website is deployed. Policy date is November 6, 2026; this is not a claimed deployment date.

Guests can write a feedback draft; sign-in is needed to submit it. Drafts are scoped by account and the explicit guest continuation. Submitted feedback is private to its author and authorized administrators. The admin console includes a private feedback panel. Nothing is automatically emailed or published on a social network.

## Still to finish externally

Apply this migration and verify two actual Supabase accounts/devices, inbox authentication and optional real AI. Native NEAR testnet sends still need your wallet authorization. Funded mainnet cross-chain invoice payments remain unfinished. Hosting, a public GitHub repository, the X video/post and final submission are separate steps requiring the agreed human approvals. Resend still requires a verified sender domain for public recipients.


## Verification summary

212 automated tests, 64 desktop/mobile Chromium browser journeys, TypeScript and the optimized build passed. Production smoke covered 36 page routes. The app performed real read-only queries for a testnet wallet and an already-existing public mainnet transaction. It did not send that transaction. Account browser flows use a mock service; PostgreSQL tests execute the actual migration separately. Apply the SQL and verify two actual accounts on your own Supabase project before recording a public demonstration.

Official RPC references used: https://docs.near.org/api/rpc/transactions and https://docs.near.org/api/rpc/providers .
