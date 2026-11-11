# 0.9.5 — received NEAR history, real mainnet overview and network suppliers

## Install

1. Copy this full update into your existing repository root, preserving `.git` and `.env.local`.
2. Run the complete **`supabase/network-suppliers.sql`** file in Supabase SQL Editor. It adds separate mainnet/testnet supplier records and moderation. The existing `supplier-marketplace.sql` foundation and 0.9.4 mainnet migrations must already be installed. Existing registrations and payment records are preserved. Legacy supplier applications are copied to mainnet with their existing review status; invoice contacts and demo samples are not promoted. Do not rerun older migrations.
3. Commit **`Update AFRIPAY to 0.9.5: received history, dashboard and suppliers`**, Push origin, then wait for Vercel Ready.
4. Refresh AFRIPAY and check `/api/config` reports `0.9.5`. No new environment variable or secret is required.

## Your existing received payment

The old received list read published invoice payments only. Direct NEAR transfers could update the recipient's blockchain balance while being absent from that list.

Transactions now loads verified native NEAR transfers by the displayed public wallet address, across the sender's and receiver's AFRIPAY accounts. Only public chain facts are shared: hash, sender, receiver, exact native amount and verification time. The payer's private order, invoice reference/instructions, risk report and user ID remain private.

Previously saved successful native transfers appear automatically. **Refresh native NEAR activity** also checks up to three already-submitted saved native hashes through the existing final-execution verifier. It never creates a payment, requests wallet approval or sends again. Pending, failed, unavailable or mismatching execution evidence does not count as received. If a wallet submitted a payment but AFRIPAY never captured its hash, the sender must attach that existing hash through payment recovery; do not resend.

All/Sent/Received filters use the shared native list, with exact deduplicated totals, explorer links and public transfer PDF receipts for either participant. Native invoice settlements already in that list are not duplicated. Totals cover the latest 100 AFRIPAY-verified native NEAR transfers, not all historical transfers from every app, tokens on other chains or the current wallet balance. Saved public addresses can be viewed read-only; spending still requires a connected wallet.

## Mainnet Overview

The Overview uses the demo's card layout with real data: a purple native NEAR balance card, sent/received native totals, open published invoice count, saved risk checks, a seven-day native activity chart and recent transfers. Unknown/unavailable data stays unavailable rather than displaying invented balances. The chart groups by UTC verification date and offers exact daily amounts. BSC and cross-chain outputs are not added together as a fabricated USD balance.

Connect a wallet or view its saved public address, then use **Refresh overview** after a payment. Connecting and viewing data do not authorize spending.

## Mainnet and testnet suppliers

Choose **Live wallet** or **NEAR testnet**, then **Become a supplier**. Registrations are stored separately per owner and network. Mainnet supports the listed receiving chains; testnet accepts NEAR `.testnet` destinations only. Existing applications stay in their original directory and are also copied to mainnet with their existing review status. No testnet destination is inferred, and sample invoice contacts are never auto-approved.

An appointed administrator opens **Admin console → Application network** to choose Demo, Mainnet or NEAR testnet, independently verifies the supplier and destination, and approves or rejects it. Owners cannot approve themselves. Any owner edit resets approval to pending; the registration's network cannot be changed. Register separately for the other network.

Approved businesses appear in that network's **Suppliers** list. Selecting one prepares its destination for review on the correct network. It never bypasses recipient confirmation or wallet approval, proves ownership, or guarantees safety.

## Check after deployment

1. On the recipient account, connect the receiving NEAR mainnet wallet and open Transactions → Received. Click Refresh native NEAR activity. Your existing confirmed transfer should appear with its amount and explorer link; no second transfer is needed.
2. Open Overview and confirm its native balance, received amount and recent activity agree with the wallet and transaction record. Balance and activity totals have different scopes and need not match.
3. Register one mainnet supplier and a separate `.testnet` supplier. Have the administrator review each in its own network list.
4. Select an approved supplier from each network and check the destination before any deliberate payment approval.

User-reported mainnet transfer success is not independently claimed as verified development evidence without its public hash. No mainnet payment was signed by the assistant during this repair.
