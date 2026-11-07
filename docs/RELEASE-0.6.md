# AFRIPAY AI 0.6 — final payment experience update

## Install without losing your work

1. Stop the old app with Ctrl + C. Keep that folder as a backup.
2. Extract the full 0.6 ZIP into a new folder and open its `afripay-ai` folder in VS Code.
3. Copy your existing `.env.local` beside `package.json`. If missing, run `npm.cmd run setup` and enter your Supabase project URL and publishable key.
4. Open `supabase/final-payments.sql`, copy ALL of it into a new query in your EXISTING Supabase SQL Editor (`>_`) and click Run. Expect Success. No rows returned.
5. Keep the earlier account-profiles.sql, supplier-marketplace.sql, workspace-sync.sql and demo-accounts-feedback.sql migrations installed. This new migration goes LAST; do not replace it by rerunning only an older ledger migration. It can itself be rerun safely.
6. Run these one at a time:

```powershell
npm.cmd ci
npm.cmd run dev
```

Open the exact Local URL printed by the terminal and refresh with Ctrl + Shift + R.

The migration PRESERVES your existing balances, grant status, transfers, invoices and supplier approvals. It adds receipt snapshots, supplier payment support and summaries. You cannot claim test credits again merely by installing this update.

## Navigation

- **Pay** — send DUSD test credits to an approved supplier's registered AFRIPAY account, optionally linked to an invoice.
- **Transfer** — send DUSD to a friend's receive code after reviewing the resolved recipient name.
- **Receive** — your receive code, receipt display name, total received and incoming payments with sender names.
- **Transactions** — recorded incoming/outgoing friend transfers and supplier payments, with receipts. Invoice workflow previews are separately labeled on the same page and do not affect ledger totals.

The old `/demo/transfers` address remains an alias for Transfer. There is no separate Demo transfers navigation item. Demo mode is selected at the top; amounts and receipts still explicitly identify valueless DUSD credits. Live wallet and native testnet tools remain separate.

## First test: names and shared receipts

1. In each account open Receive. Set **Name shown on future receipts** and click **Save receipt name**. This name is shared with payment counterparties; it does not expose the private email/profile.
2. Copy the recipient's receive code. In the payer account open Transfer, paste it and enter an amount.
3. Click Review transfer. Check BOTH the resolved recipient name and the entered code/amount.
4. Tick confirmation, then Approve transfer. You should reach Transactions with a recorded payment and receipt.
5. Open View receipt if it is not already open. Download PDF receipt.
6. In the recipient account open Receive and refresh. It shows the incoming amount and sender name. Open its receipt: both sides have the SAME reference, amount, recorded names/date and PDF details.
7. Check the dashboard, Receive and Transactions: their balance and received/sent totals all come from the same ledger summary.

If your previous test left A with 800 DUSD and B with 200 DUSD, this update keeps those values. Another 200 transfer gives A 600 and B 400. For two NEW accounts, start at zero, explicitly claim 1,000 in A, then send 200 to get A 800/B 200. A test grant does not count as money received from another user.

Older transfers are preserved and get stable account-code labels because no receipt name was recorded at their creation. New receipts snapshot names at transfer time; later name edits do not rewrite historical receipts. Names are account-chosen, not identity certification.

## Supplier payment test

The supplier must register through Become a supplier, pass administrator review and open Receive to activate their AFRIPAY demo credit account. No account is inferred from a saved blockchain wallet address.

In Pay, select the approved supplier. For an optional linked invoice, first upload/review it and verify the destination. Its supplier business name, wallet, chain and amount must match the approved supplier, and the cloud-save banner must finish saving. Supported linked simulation currencies are USD, USDC, USDT and DUSD with at most two decimal places; this is a one-for-one DEMO illustration, not a live FX quote or transfer of those assets.

Review and approve. The server derives the recipient from the approved supplier's owner, checks the current approval/version, saved invoice/revision, amount, destination, unsafe instructions, duplicate invoice number and spending limits. Only after atomic debit/credit succeeds does the linked invoice become Paid (demo), with the credit-transfer reference. A stale or changed invoice/supplier must be reviewed again. A failed request leaves balances and invoice state unchanged.

## Previews versus recorded payments

Open invoice preview preserves the earlier route comparison, approval, simulated settlement/failure/refund, PDF receipts and live dry-quote tools. Those previews do NOT debit or credit DUSD. They are clearly grouped separately in Transactions and cannot be used to claim a real blockchain payment. An invoice already paid through the credit ledger cannot be paid again through a new preview.

A recorded supplier credit payment is still DUSD simulation, NOT settled USDC/NEAR. Funded mainnet Intents execution remains unfinished. Actual wallet balances change only through authorized blockchain execution and network fees.

## Safety and retries

- Available funds, fixed maximums (1,000 DUSD per payment / 5,000 per day) and any saved lower spending policy are checked by the database.
- Duplicate clicks and same-approval retries cannot debit twice. Reusing an approval ID for different details is rejected.
- If a response is lost, the form freezes its details and offers Retry same approval. Check Transactions rather than starting a new payment.
- A receipt is readable only by the sender or receiver. An administrator who was not a participant cannot use the receipt RPC to inspect it.
- Summaries read balance, totals and recent activity from one database snapshot. Totals include all records; history displays the newest 100.

## Submission work still outside this update

Verify this migration and both real accounts on your Supabase project. Verify actual signup/recovery emails, optional live AI and an authorized native testnet transfer. Prepare the public repository, hosting, true publication date, X video/post and final submission. No repository was published, website deployed, real funds sent or submission made by this update.
