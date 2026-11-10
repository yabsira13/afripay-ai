# 0.9.3 — persistent wallet sessions and clearer payment screens

## Install

Copy the full update into the existing repository root, preserving `.git` and `.env.local`. Commit `Improve wallet sessions, payment lists and mainnet tools`, then Push origin. Leave the accidental nested `afripay-ai` entry unchecked. Wait for Vercel Ready and check `/api/config` reports `0.9.3`.

**No new SQL or environment setting is required for this release.** Keep the 0.9.2 invoice and activity migrations already installed.

Reconnect your wallet once after this upgrade. New connector storage is isolated by account and network. Existing public wallet addresses and all payment/invoice records are preserved.

## Wallet behavior

- One connector per account/network is kept for the browser tab. Page navigation, switching workspace modes and idle time do not disconnect it.
- On reload, a supported provider session is restored and its actual accounts checked. A remembered public address alone says **Viewing saved address**, not Connected.
- **Disconnect wallet** is available in the wallet panel and header. Logout disconnects both networks and clears their displayed addresses/balances.
- Wallet provider sign-out is detected; account changes require payment review again. Transient provider failures show an issue while retaining the established connection. Every payment rechecks the wallet and account before requesting approval.
- AFRIPAY does not control an external wallet's own lock/expiry rules, collect seed phrases or grant unrestricted spending access.

## Lists and layout

Transactions now have **All / Sent / Received** filters, tracked totals, counterparties, dates, compact rows, expandable details, explorer links and receipt downloads. Invoice lists have All/Unpaid/Paid filters, a New invoice action and expandable details rather than repeating full blocks. Buttons, addresses, notices, balance text and PDF actions wrap properly on mobile.

Demo records use clearer spacing, contrast, cards and direction filters. New accounts remain empty until they choose a sample or create records; no balances or payments were invented for the design update.

## Mainnet

The hosted public configuration was checked during this repair: mainnet funding was already enabled. Public asset discovery also returned real assets. The old read-only overview/banner/footer wording was stale; it has been corrected.

The overview now links to mainnet Pay/Transfer via Intents, invoice publication, Receive, Transactions and public checks. Assets load automatically in Pay; guidance explains missing wallet/asset/confirmation requirements. Connecting a source wallet from Pay keeps the current form open. Mainnet history separates outgoing funding orders from verified incoming published-invoice settlements. The assistant is available for proposals and explanations in mainnet mode; it has no transaction execution tool.

These are the existing guarded mainnet capabilities. Funding uses **native NEAR on NEAR mainnet**, with supported destination assets/networks shown in the selector; same-asset native NEAR sends, arbitrary source-chain wallets and gas sponsorship are not implemented by this release. Default and hard spending limits, signed quotes, server verification and human wallet approvals remain in force. Incoming history covers paid published requests, not every external wallet transfer. CSV export remains the outgoing-order report.

No mainnet transaction was signed or sent during this update, and a funded end-to-end mainnet Intents settlement remains unproven. Testnet payment evidence is recorded in the 0.9.2 guide.

## Check after deploying

1. Connect testnet, open Transactions, then Settings and back. The same wallet should remain Connected. Leave the tab idle and return.
2. Check All/Sent/Received filters, expand a transaction and download its receipt.
3. Open Invoices, filter Paid and expand a row. Confirm readable dates and separated PDF/sync actions.
4. Disconnect explicitly: the account and balance should clear. Reconnect, then logout and confirm both networks clear.
5. Choose Live wallet. Confirm the enabled status, load assets in Pay, and inspect the source wallet and receiving network before requesting any quote. Only approve a real payment deliberately in your wallet.

Automated and browser results are recorded in VERIFICATION-0.9.3.md.
