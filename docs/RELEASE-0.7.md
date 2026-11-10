# AFRIPAY 0.7 — guarded mainnet payment pilot

This adds the application code for real payments funded by a NEAR wallet through official 1Click quotes. It does not mean a real payment has already succeeded. Funding is OFF until configured. Final wallet/provider/device verification is still required.

## Install the files

1. Back up your working project. Keep its `.env.local` and `.git` folder.
2. Extract the 0.7 full ZIP. Copy its project files into the working repository folder, replacing matching files. Do not copy your old inner nested repository into the new files. The ZIP excludes `.env.local`, `.git`, `node_modules` and `.next`.
3. Run `npm.cmd ci` after replacing `package.json` and `package-lock.json`.
4. In your EXISTING Supabase SQL Editor, run all of `supabase/live-payments.sql`. Earlier demo migrations remain installed; do not replace or delete demo tables.

## Server settings — never public keys for these two settings

In Vercel → your AFRIPAY project → Settings → Environment Variables:

| Name | Value / purpose |
| --- | --- |
| Existing `NEXT_PUBLIC_SUPABASE_URL` | Keep your existing project URL |
| Existing `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Keep the public publishable/anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase's SERVER secret/service-role key. It permits protected payment database writes. Never put it in a `NEXT_PUBLIC_` variable, GitHub, chat or a screenshot. |
| `LIVE_PAYMENTS_ENABLED` | Start with `false`. Set to `true` only after the migration and server settings are installed and the pilot is ready for review. This enables the app to REQUEST wallet authorization; it does not grant keys or approve any transaction. |
| Optional `ONECLICK_API_TOKEN` | Partner JWT, if supplied by 1Click |
| Optional `ONECLICK_API_KEY` | X-API-Key credential, if supplied by the current partner dashboard. Do not invent a value. |

Find the server credential in Supabase Project Settings → API Keys (or the legacy service_role key section). Copy it privately into Vercel. Gmail SMTP remains configured in Supabase; do not change it for this release.

A service key is powerful: keep it server-only. Browser clients have SELECT-only access to their own records. The coordinator checks each authenticated user and calls restricted database functions. No wallet keys are stored anywhere.

GitHub Desktop: commit the reviewed code changes, keeping the old nested `afripay-ai` entry unchecked; push only the intended working project files. Vercel builds the pushed commit. Environment setting changes require a redeployment.

## What the first route supports

- Source: NEAR mainnet native NEAR through NEAR Connect. It is not an arbitrary wallet/action runner.
- Destination: currently discovered supported assets on the explicitly supported NEAR/EVM/Solana networks. Choices come from the token API. NEAR tokens require the recipient's existing token storage registration.
- EXACT_OUTPUT: enter the amount the recipient should receive. The quote supplies the required NEAR input and minimum output.
- Invoice/payment reference: recorded privately in a separate immutable-to-browser live order. This is not an existing DUSD invoice and does not silently mark a demo invoice paid.
- Default principal limits: 0.1 NEAR per payment / 0.3 NEAR per UTC day. Save lower or higher pilot limits in the live form, within hard ceilings of 0.5 NEAR and 2 NEAR. Network fees are additional. Pending/uncertain older orders continue to reserve budget conservatively.
- An additional 0.02 NEAR fee buffer plus account storage reserve is required by preflight. The wallet shows the actual network fee; the buffer is not a fee quote.
- No live portfolio valuation, automatic destination registration or other source-chain wallet integration is claimed.

## Review flow before any funds move

1. Sign in. Select **Live wallet → Pay** and connect your mainnet NEAR wallet.
2. Click **Load supported assets and networks**. Select destination network/asset and enter the full recipient address, exact output amount and unique invoice/payment reference. Optionally paste invoice instructions for security review.
3. Independently verify recipient details, then tick the confirmation. This is real money, not DUSD. Test only between wallets you control.
4. Click **Get genuine dry quote**. The server verifies the official signature, request binding, output minimum and expiration, runs deterministic checks, verifies balance and reserves a private order. Critical risk is blocked. No deposit address or wallet signature is requested here.
5. Read NEAR input, output/minimum, fees/data gaps, slippage, expiry and risk evidence. Quotes are additionally capped to a two-minute local review window.
6. Explicitly approve the dry quote. The server requests `dry:false`, verifies its signature and unchanged parameters, and rejects a higher input or lower minimum than approved. It saves the unique deposit address before returning it.
7. Review the committed details and tick the second confirmation. **Only then** click **Authorize exact payment in wallet**. Check account, Mainnet network, deposit address and amount inside your wallet. You can reject it. AFRIPAY never signs for you.
8. The wallet result is not a paid invoice. The server checks final native NEAR funding against the exact sender/address/amount, then polls official status tied to the same signed quote and origin hash.
9. SUCCESS needs matching input/output amounts, minimum output and destination transaction references. Only that verified live order becomes paid and enables a mainnet receipt. Pending, failed, incomplete and refunded states stay unpaid.

Do not click wallet authorization as a test until you have reviewed an exact amount/recipient and are ready to spend. No real transaction was authorized by the assistant during development.

## Refresh, rejection and failure recovery

- Refresh live history and select the saved order. One user can never read another user's orders or audit events.
- A dry quote can be discarded before commitment. After commitment/authorization, do not generate replacement deposits or resend blindly.
- Commit/authorization steps are claimed once under database locks. Concurrent tabs cannot issue a second wallet request for the same order.
- A lost wallet response or cancelled wallet leaves authorization reserved. Check the wallet's activity, copy its actual funding hash and use **Attach and verify funding hash**. Recovery attaches to the same order; it does not send again.
- Redirect-style wallets may require this manual hash recovery. No automatic retry after wallet rejection is implemented.
- A lost committed-quote response may leave NEEDS_RECONCILIATION or COMMITTING. No second commitment/authorization is automatically issued. Review the provider's state and database record before operator intervention. Do not delete rows to force a retry.
- Provider or RPC unavailability remains an error/pending state, never simulated settlement.
- Refund reporting is bound to the same quote/origin and requires a positive provider-reported refunded amount. It is not a fresh independent refund-chain transaction verification. Destination settlement is provider-confirmed; independent destination-chain execution decoding is not implemented in this pilot.
- The reference cannot be reused with a changed recipient. Recent matching payments under new references are also blocked. A failed or uncertain record stays reserved until resolved; this is deliberately conservative.

## Verification boundary

Automated checks use embedded PostgreSQL and mocked wallet/account/provider flows. Real token discovery and an actual signed dry quote were retrieved through the already-hosted app on November 10, 2026. The official SDK verified that dry quote. It used synthetic recipient data and contained no deposit address; no funds moved.

The new EXACT_OUTPUT commit/funding path has not yet been exercised against the founder's actual hosted database, production wallet or funded swap. Do not describe funded execution as demonstrated until those checks succeed. See VERIFICATION.md for the final test counts and remaining checks.
