# AFRIPAY AI 0.9 — saved testnet invoices and startup fixes

## Install in the existing Windows repository

1. Extract `AFRIPAY-AI-v0.9.0-Full.zip` to a temporary folder.
2. Copy its contents into the existing repository root — where `package.json`, `app` and `components` already are. Replace matching files. Keep the existing `.git` and `.env.local`. Do not copy into a nested `afripay-ai` folder.
3. In Supabase SQL Editor, run `supabase/testnet-invoices.sql` once. It adds a separate testnet table; no existing demo/mainnet rows are changed.
4. The server needs the existing public Supabase settings and server-only `SUPABASE_SERVICE_ROLE_KEY`. No new wallet secret or mainnet flag is required.
5. In GitHub Desktop, leave the accidental nested `afripay-ai` entry unchecked. Commit the source changes with summary `Add saved testnet invoice payments and improve startup`, then Push origin.
6. Wait for Vercel Ready. `/api/config` must show version `0.9.0`. Reload the app.

## First actual testnet acceptance run — human wallet approval required

This checklist is not a claim that a payment has already been made.

1. Sign in to AFRIPAY. Choose **NEAR testnet** in the mode bar.
2. Obtain two different named `.testnet` wallets through the official NEAR account/faucet guide linked in the app. Keep their seed phrases private. Fund the sending wallet with test tokens.
3. Click **Connect testnet wallet** and select the sending wallet. Verify its network says Testnet.
4. In **Saved testnet invoices**, enter a unique reference such as `TEST-001`, the second wallet's full `.testnet` address, a description and `0.01` test NEAR. Click **Create testnet invoice**.
5. Review the saved invoice's recipient and amount. Tick its confirmation checkbox. Click **Pay testnet invoice in wallet**.
6. Read the wallet's network, recipient, amount and fee, then approve only if correct. AFRIPAY cannot approve this for you.
7. If the result remains SUBMITTED, click **Verify invoice payment**. PAID requires final RPC execution and successful receipts. Unavailable evidence stays unpaid.
8. Click **View transaction in testnet explorer**. Check sender, recipient, amount and success. Download the verified testnet JSON receipt. Refresh the receiver's wallet to check receipt of the tokens.
9. Reload AFRIPAY and confirm the invoice stays PAID. Save the actual explorer URL as submission evidence. Do not paste a wallet secret into chat.

Repeat with another unique invoice to check consistency. This uses test tokens, not real money. Never reuse an old transaction as proof for another invoice.

## Recovery and limits

An authorization is claimed once before the wallet opens. Cancellation, redirect, disconnection or an uncertain wallet result does not unlock it for another send. Inspect wallet activity. If a transfer exists, paste its hash into **Recover transaction hash** and attach it, then verify. If no transfer exists, keep the locked invoice unpaid; after checking wallet activity, use a new invoice reference for a later deliberate attempt. Never retry a possibly funded invoice blindly.

The owner must be signed in. Testnet invoice records are private, not a public checkout link. Named `.testnet` accounts only; more than zero and at most one test NEAR per invoice. Native transfer fees use test NEAR. No mainnet calls, cross-chain route or sponsored gas are implied. Existing quick-transfer history remains separate and does not settle demo invoices.

## Startup and footer

Configuration fetch aborts after 4 seconds; initial account session has a 3-second deadline. Cloud demo loading has a 6-second abort deadline and a labeled local fallback. Database clients use a captured account token without creating competing auth clients. Private data remains account-scoped. Public NEAR checks are usable during startup; mainnet/testnet views do not wait for demo storage.

The footer says `Published 2026-11-07`, including the landing page. Live Invoices now opens the same shareable-mainnet-invoice form as Live Receive, rather than the old demo-only notice.

## Verification evidence

See `VERIFICATION-0.9.md`. Automated RPC/wallet fixtures are not an on-chain transaction. A real signed testnet invoice and a funded mainnet Intents swap remain separate human acceptance checks.
