# Live native NEAR balance — 5 November 2026

When a NEAR mainnet wallet connects, the dashboard now replaces the illustrative dollar card with that account's actual native NEAR balance. It reads a final account state through documented public RPC providers. No signing or transfer methods are called. Existing wallet sessions are restored through NEAR Connect when available.

## What appears

- Connected account ID and NEAR mainnet label.
- Exact NEAR balance using all 24 token decimals; no floating-point conversion.
- Final block height, lookup time and a refresh button.
- A clear loading/error state. A connected wallet never falls back to the $24,860 demo amount.
- A note explaining that the account amount includes the storage reserve, so this is not a spendable-balance estimate.
- Validator-locked amounts separately when present. Staking-pool deposits and other tokens, including USDC, are not included.

No USD price or total portfolio valuation is guessed. Payment activity, invoices and receipts remain labeled simulations. A live balance does not enable funded payments.

## Install the full updated ZIP on Windows

1. Stop the running app with Ctrl+C.
2. Extract the new full project ZIP into a new folder.
3. Open the extracted `afripay-ai` folder containing `package.json` in VS Code.
4. If you configured `.env.local`, copy your own file from the old project into the new one. It is never included in these downloads.
5. Run `npm.cmd ci`, then `npm.cmd run dev`.
6. Open the same http://localhost:3000 address, refresh with Ctrl+Shift+R, and reconnect your wallet if needed.
7. On Overview, the card should say Connected wallet and NEAR MAINNET. If public RPC is unavailable, use the refresh button after checking your internet connection. Do not send funds to test a read-only balance lookup.

## Sources and verification limits

RPC methods/providers follow https://docs.near.org/api/rpc/contracts and https://docs.near.org/api/rpc/providers. Public providers are fixed server-side: `https://free.rpc.fastnear.com` and `https://near.drpc.org`.

Automated tests verify correct RPC request shape, exact conversion, confirmed zero, provider fallback, unknown accounts, wrong networks, malformed upstream data and failure without a demo substitution. A live provider lookup did not complete successfully from the managed executor. The actual wallet/browser balance must be checked on the user's PC; a passing mocked integration test is not a confirmed live balance.
