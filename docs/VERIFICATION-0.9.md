# Version 0.9 verification

Final checks completed on November 10, 2026:

- **316 unit/API/database tests passed across 29 files.**
- **104 full browser regression checks passed**, desktop and mobile Chromium.
- **8 focused checks passed on the final production build**, covering testnet invoice creation, pending status/explorer link, slow startup navigation, footer, recovery and verified-receipt gating on desktop and mobile. Six repeat checks from the full run; two add recovery coverage.
- TypeScript and optimized production build passed.
- Production smoke: **41 routes**, receipt fonts, configuration, extraction and unauthenticated private-invoice rejection passed.
- Testnet invoice desktop/mobile screenshots inspected for layout; mobile horizontal-overflow assertion passed. Screenshots use labeled browser fixtures, not an actual blockchain transfer.
- Hosted public configuration was read and reported **0.8.0** with account configuration present. No deployment or private hosted database modification was performed by this update.

The tests use fixtures for browser account services and testnet RPC execution. Database tests run PostgreSQL through PGlite to check private reads, denied browser writes, one-time authorization claims, unique transaction hashes and paid-state evidence requirements.

Proof validation checks final transaction/receipt success, exact source/destination/atomic amount, post-creation block height and timestamp. The signing request is reconstructed in the browser from the reviewed invoice and explicit testnet network.

No actual wallet-signed invoice transfer or funded mainnet Intents settlement is asserted. The acceptance procedure is in RELEASE-0.9.md.
