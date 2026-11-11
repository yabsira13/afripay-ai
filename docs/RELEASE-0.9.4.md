# 0.9.4 — clear tokens and correct signing networks

## Install on an existing 0.9.3 installation

1. Copy the full update into your GitHub repository root. Preserve `.git` and `.env.local`; do not put the update inside another `afripay-ai` folder.
2. In Supabase SQL Editor, run the **entire `supabase/mainnet-transfers.sql` file**. This atomic migration requires the existing mainnet invoice/payment-link migrations. It preserves existing records and may be rerun. Do not rerun older mainnet migrations afterward.
3. In GitHub Desktop, enter `Update AFRIPAY to 0.9.4: native NEAR and BSC payments` in **Summary**, commit and Push origin. Leave the accidental nested `afripay-ai` entry unchecked.
4. Wait for Vercel Ready. Refresh the app and check `/api/config` reports `0.9.4`.

No additional secret or wallet private key is needed. Existing mainnet operator settings and server-only Supabase configuration still apply. Funding remains disabled by default unless the operator enables it.

## What changed

Token menus show symbols such as **NEAR**, **USDT** and **USDC**. Networks have readable names; contracts are available under Token details. Different contracts with the same symbol on one network get a variant label so they cannot be silently confused. Asset discovery loads automatically. Native NEAR and the two pinned BSC tokens remain selectable when conversion discovery is unavailable; conversion quotes still require the provider.

**Sending network** determines which wallet signs:

| Selection | Wallet confirmation and settlement |
| --- | --- |
| NEAR source → native NEAR on NEAR | Exact native NEAR transfer approved by a NEAR mainnet wallet; no token storage registration |
| NEAR source → supported token on BSC or another network | NEAR funding approved on NEAR; Intents performs the destination conversion |
| BSC source → USDT or USDC on BSC | Compatible EVM wallet switches to BSC, chain ID 56, then signs the exact ERC-20 transfer |

A NEAR wallet cannot sign a direct BSC transfer. Wallet wording is controlled by the wallet provider; AFRIPAY checks the chain, account, recipient, contract and amount. BSC transfers use `transfer`, with no allowance approval. Direct BSC supports the pinned **Binance-Peg USDT and USDC**, both 18 decimals, and needs BNB for gas. On mobile, open AFRIPAY inside a compatible wallet browser. Regular Safari without an injected EVM wallet cannot sign this path. Tron and arbitrary source networks are not implemented.

Native NEAR invoices publish without the conversion catalog. Native receivers must already exist. NEAR contract tokens can still require the recipient to register storage; the error explains which asset needs it. AFRIPAY does not automatically spend on registration.

## Verification and limits

Native NEAR transfers share the existing Intents spending policy and duplicate-reference protection. Defaults remain 0.1 NEAR per transfer and 0.3 NEAR per UTC day, with hard ceilings of 0.5 and 2 NEAR. Fees require a balance buffer. BSC uses separate limits: 10 tokens per transfer and 30 tokens per asset per UTC day.

Each route requires explicit review and wallet approval. An uncertain signing result stays locked for hash recovery instead of offering another send. Native NEAR receipts require final successful execution and matching canonical block evidence. BSC receipts and paid invoices require a matching successful ERC-20 Transfer event and at least 12 confirmations. A wallet hash alone is not a paid receipt.

BSC has its own saved payment history and PDF receipts. The existing NEAR outgoing CSV does not combine BSC records. Incoming history covers AFRIPAY published invoice settlements, not every external wallet transfer.

No funded mainnet NEAR, BSC or Intents payment was signed during development. Automated checks use controlled fixtures. The founder's earlier real testnet payment remains independently verified; mainnet acceptance must be checked in the user's wallet after deployment.

## Check after deploying

1. Choose Live wallet → Pay → NEAR sending network. Confirm native **NEAR** appears and optional details describe native NEAR without a token contract.
2. Create a native NEAR invoice with a valid receiving account, reference, amount and publication consent. Open its public link.
3. Deliberately test a small payment in your wallet. Confirm NEAR mainnet, receiver and amount; then verify settlement and download the PDF. A cancelled wallet request must not become Paid.
4. For direct BSC, use a compatible wallet holding the supported token and a BNB gas balance. Select BSC sending network. Check BSC chain ID 56 and exact recipient/amount before approval. Verify after 12 confirmations.
5. To fund a cross-chain payment from NEAR, keep NEAR as the sending network and select the destination separately. Its approval correctly remains on NEAR.

See VERIFICATION-0.9.4.md for test results and scope.
