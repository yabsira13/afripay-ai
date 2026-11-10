# 0.9.2 verification

## Observed signed testnet payment

The founder supplied screenshots showing a paid saved invoice and a separate confirmed quick transfer. Public RPC was independently queried read-only for invoice transaction `55jZE7gnpLRzhUySa2NtqxMRp6PuxfqFcWhzmECiHWGa`.

It returned FINAL native transfer execution from `alephai.testnet` to `afripayai.testnet`, deposit `10000000000000000000000` yoctoNEAR (**0.01 test NEAR**). Its execution block hash was resolved independently to block **277068066**. The recorded transaction and successful receipts pass the app's exact transfer proof validator. Evidence is in `research/testnet-signed-transfer-2026-11-10.json`.

This is public evidence of the transfer. The founder-reported paid invoice is supported by their screenshot; this workspace did not query their private hosted invoice table. No assistant wallet signing, secret collection, funded mainnet swap or cross-chain settlement occurred.

## Automated checks

**338 unit/API/database tests passed across 34 files. All 114 desktop/mobile Chromium checks passed. TypeScript, optimized production build and 41-route production smoke passed. A final receipt-font improvement additionally passed 12 focused unit/evidence tests; all four final desktop/mobile PDF-download and receipt-gating checks passed. The PDF for the observed transfer was rendered and visually inspected with embedded fonts. Tests cover distinct navigation, sender and receiver activity, inline verification errors/progress, migration permissions, exact amounts, duplicate hash imports, public-only shared rows, PDF download, pending/failure rejection and private invoice isolation.

Browser accounts and activity services use fixtures. The recorded public RPC evidence is separately identified above; browser fixtures do not claim to be new on-chain transactions.
