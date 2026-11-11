# 0.9.5 verification — 11 November 2026

- **388 automated tests in 42 files passed**, including shared native transfer projection, exact totals, wrong-account/network rejection, pending/failed evidence exclusion, read-only settlement reconciliation, UTC chart aggregation and PostgreSQL supplier isolation/moderation.
- The final production build and TypeScript passed. The **41-route production smoke check** also passed, including authenticated GET/POST requirements for shared activity.
- New desktop/mobile checks exercise receiver history without ownership of the sender's private order, totals/filtering, duplicate invoice suppression, real-data Overview, unavailable activity, mainnet registration and unsigned proposals, and wrong-network testnet validation.
- **142 full desktop/mobile regression checks passed**. **14 final targeted desktop/mobile checks passed** after the last build, including receiver PDF downloads and the testnet directory-to-transfer shortcut.

Database tests verify separate per-owner/per-network registrations, pending-record privacy, no self-approval or anonymous access, explicit administrator verification, owner edits resetting approval, immutable networks, stale review rejection and preservation of existing records on migration rerun, copying legacy administrator approval to mainnet and re-enabling the write guard afterward.

Browser tests use isolated auth/API/wallet fixtures, not funded payments. The mainnet activity verifier reuses the existing exact final NEAR execution checks; no wallet signing or payment authorization is available through the activity endpoint. Only saved submitted native hashes are reconciled, up to three per refresh. The transfer feed exposes a whitelist of public blockchain facts rather than private order fields.

The founder reports a successful mainnet NEAR transfer and increased recipient balance. Its public hash has not been supplied for independent confirmation during this repair. No mainnet funds were moved by the development assistant. External wallet history completeness, live deployment configuration and actual administrator reviews are not established by browser fixtures.
