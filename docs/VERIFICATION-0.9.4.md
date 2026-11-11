# 0.9.4 verification — 11 November 2026

## Completed checks

- **373 tests in 38 files passed** with Vitest, including native NEAR builders/proof, exact BSC calldata and canonical receipt checks, database RLS, server-only authorization, shared spending limits, duplicate hashes/references, competing invoice payers, cancellation, uncertain authorization and migration reruns preserving records.
- TypeScript and the optimized production build passed.
- Production HTTP smoke check passed across **41 page routes**, receipt fonts, config, extraction and protected endpoints.
- **130 desktop/mobile browser checks passed** against the final production build, including clean token labels, native NEAR selection, automatic invoice assets/publication, BSC chain switching with a single exact transfer request, existing demo/testnet flows, auth and reporting.

Read-only public BSC observations returned chain ID `0x38` and 18 decimals for the pinned USDT contract. These observations confirm network/token metadata, not a funded transfer. No secrets were available in the development environment.

## What the tests establish

Native NEAR requests contain one exact Transfer on mainnet. Success requires matching final execution, successful receipt outcomes and canonical block evidence after review. BSC requests use the pinned contract, zero native value and exact `transfer` calldata. Wallet network/account checks run before signing. Matching successful event evidence and 12 confirmations are required for BSC paid status. A wallet hash, pending outcome, failed receipt or wrong account/chain does not expose a verified paid receipt.

Payment review and once-only authorization are distinct. Database tests cover owner isolation, client write denial, cross-route published invoice locking, per-asset BSC caps, shared native/Intents NEAR caps and recovery without a second authorization. Public request projections exclude private payer/order details. The BSC provider evidence is saved in `research/bsc-metadata-2026-11-11.json`.

## Limits of this evidence

After a final connection-label clarification, the six focused network/payment browser checks were repeated against the rebuilt app. Mobile checks also assert no horizontal overflow. Screenshots under `research/0.9.4/` use controlled fixture accounts and transactions.

Browser checks use isolated auth, API and EIP-1193 fixtures. They do not prove a live wallet's own confirmation wording, mobile wallet compatibility, RPC uptime or delivery of real mainnet funds. No native NEAR mainnet, BSC or Intents payment was signed or sent during development. Mainnet funded acceptance is pending deployment, required SQL migration and the user's explicit wallet approval.

The founder's previously demonstrated testnet invoice transfer remains independently verified; see VERIFICATION-0.9.2.md and the public RPC evidence. BSC history is separate from the NEAR outgoing CSV, and incoming history covers AFRIPAY invoice settlements rather than every external wallet transfer. No gas sponsorship, arbitrary source-chain wallet support or Tron signing is claimed.
