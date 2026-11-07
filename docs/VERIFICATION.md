# Verification record

Checked in the managed workspace on 2026-11-04.

| Check | Result |
| --- | --- |
| `npm run typecheck` | Passed |
| `npm test` | 41 tests passed across 3 files |
| `npm run build` | Passed, Next.js 16.4.5 with Webpack |
| `npm run test:smoke` | Passed; production server started, 22 page routes returned rendered HTML, configuration and invoice extraction APIs passed |
| `npm audit --omit=dev` | Zero known production dependency vulnerabilities after PDF.js upgrade |
| Live 1Click token request from this executor | HTTP 403; genuine live quotes not verified in this environment |
| Live quote request formatting | Tested with mocked official API responses; not a live market quote |
| Browser end-to-end journeys | Authored for desktop and mobile, NOT RUN; supported browser tool unavailable |
| Visual/mobile layout inspection | NOT RUN in a browser; responsive CSS implemented |
| Image OCR / PDF parsing in a browser | Implemented; NOT browser-verified in this environment |
| Supabase auth against an account | NOT RUN; no configured project credentials |
| SQL migration / RLS enforcement | Foundation written; NOT applied or verified against PostgreSQL |
| Wallet connection against an installed wallet | Implemented; NOT browser-verified |
| Live funding / real settlement | Disabled, NOT implemented as an executable funded flow |
| Container build/run | Dockerfile prepared; NOT RUN |
| GitHub publishing | Authentication check failed for available CLI credential |
| Hosting publication | NOT completed; Sites helper files absent |

## Fixes made during verification

- Switched from Turbopack to supported Webpack because the sandbox denied Turbopack's worker listener.
- Used TypeScript compiler API instead of the CLI subprocess whose detached stdout was unavailable in this runtime.
- Upgraded PDF.js from an audited vulnerable transitive resolution to fixed version 6.5.438 and updated its loading-task cleanup API.
- Bound demo approval to the reviewed invoice details, reevaluated the latest state, and blocked duplicate invoice payments even across separate imports.
- Added terminal-state protections and failure/refund lifecycle tests.
- Corrected same-origin checking for Next's internal hostname versus the browser Host header. A regression test covers this case.
- Used the standalone Next server with public/static assets copied beside it for production startup.

These are observed results and limits, not a security certification.

## Receipt update — 2026-11-05

51 tests pass after adding branded browser-generated PDF receipts, including refusal to issue a receipt for processing, failed, refunded or non-demo payments, receipt-ID binding, exact amount preservation and multi-page wrapping. The generated sample PDF was rendered and inspected and its wallet/reference text checked. Typecheck passed; production dependency audit reports zero known vulnerabilities. The actual browser download interaction is awaiting user verification.

## Native NEAR wallet balance update — 2026-11-05

Added a read-only mainnet account-balance endpoint and connected-wallet card. New tests exercise integer precision, confirmed zero, provenance, provider fallback, missing accounts, malformed data, network validation and honest unavailability. Live provider probing did not complete in the managed environment; actual wallet/browser integration remains user verification. No transaction is signed or sent.

The updated suite passes 64 tests, TypeScript checking and the production build.

## Mode separation and registration — 2026-11-05

70 automated tests pass, including static rendering of the read-only mode, absence of sample balances/records in live view and registration readiness without credential disclosure. Browser mode/registration journey specifications were added but not executed here. Real registration remains unverified until a Supabase project is configured.

## Signup, receiving and supplier administration — 2026-11-05

90 automated tests pass. The new supplier migration is tested against embedded PostgreSQL using emulated Supabase JWT identity and real row-level policies; this is not a hosted Supabase deployment test. Confirmation UI, no-fake-address receiving and local demo account separation are covered. Browser email/signup/copy/administrator interaction and actual Supabase migration remain user verification. No money was transferred.

The final signup/supplier update passes 92 tests after adding regressions for invoice banners incorrectly extracted as invoice numbers. The parser now leaves ambiguous headings blank for review.

## Signup and recovery corrections — 2026-11-05

108 tests pass after adding auth-provider response and recovery-state tests. The new cases use mocked provider data; they did not send email or modify a real account password. Full browser callbacks and the founder’s Supabase settings remain manual verification.

## Version 0.2.0 — private profiles and native testnet

142 tests pass. Profile RLS is tested in embedded PostgreSQL, including cross-user read/write denial, immutable owner, complete-field constraints and rejection of admin metadata. Native testnet tests cover exact atomic requests, testnet-only addresses/network, amount limits, review expiry, finality, receipt execution, mismatched proof, provider outages and history re-verification. A real read-only query to test.rpc.fastnear.com returned valid account/balance/final-block data. No wallet transaction was signed or sent from this environment. Browser wallet prompts, an actual authorized testnet transfer and the founder’s hosted profile migration remain unverified here.

Production startup and HTTP smoke checks passed for 30 page routes, fonts, extraction/config APIs, and rejection of a mainnet account at the testnet endpoint. Mainnet signing remains disabled.


## Version 0.3.0 — 2026-11-05

- **177 automated unit, API, security and embedded PostgreSQL tests passed**. New cases cover owner-only simulation storage, anonymous/direct-write denial, migration repeatability, optimistic concurrency conflicts, serialized rapid edits, account disconnect, model session requirements, strict response validation, invented recipient/amount/authority rejection, invoice prompt-injection indicators and decimal-equivalent duplicate payments.
- **Production build and TypeScript checks passed.** Production startup/HTTP smoke passed all **30 page routes**, receipt fonts, extraction/config APIs and wrong-network rejection.
- **28 browser journeys passed in Chromium 155**, with desktop and iPhone-sized mobile emulation. They cover clean invoice → explicit verification → approval → simulated settlement → actual PDF download/load, changed-wallet blocking, real PDF file upload/text extraction, verification reset after recipient edits, local assistant provenance/no-execution output, mode separation, guest identity, auth entry/recovery guards and viewport overflow. Mobile emulation is not Safari or a physical iPhone test.
- PDF upload testing exposed a label-selector issue after a textarea received extracted text. An explicit accessible label fixes it, and the full suite passed after the change. Actual desktop/mobile dashboard screenshots are preserved in `docs/screenshots/`.
- Model API tests use mocked authentication/model responses. **No live model inference, email delivery, real Supabase cloud save or wallet signing was performed for this release.** These need founder-owned credentials/accounts. PostgreSQL policies were executed against embedded PostgreSQL, not the founder's hosted database.
- Mainnet Intents remains dry-quote only; no new funded transfer or cross-chain settlement is claimed. Simulation documents remain editable, not immutable financial audit logs.

To reproduce browser checks with the system Chromium used here, run a production server and set `E2E_BASE_URL` to it and `E2E_CHROMIUM_PATH=/usr/bin/chromium`. On a normal PC, install Playwright Chromium with `npx playwright install chromium` and omit that path variable.


## Version 0.4.0 — November 6, 2026

- **188 automated tests passed**, including existing security/payment/PostgreSQL policies, public-key validation, runtime configuration, secret-key rejection, setup-file preservation and admin console rendering.
- **50 Chromium desktop/mobile browser journeys passed** against the production build. New account tests exercise the real Supabase browser SDK with a mock service: successful/failed sign-in, persistent signup confirmation, password-reset request, verified recovery callback/password update/new-password login, denial of recovery from an ordinary session, private demo save/refresh, account switching and admin authorization/navigation/separate layout. These do not send actual emails or change a real password.
- TypeScript, optimized production build and production smoke across **30 page routes** passed. The local setup CLI was exercised interactively in an isolated temporary folder and created the intended `.env.local`. Setting preservation and key restrictions are separately tested.
- A read-only request to the founder-provided Supabase public Auth settings returned **HTTP 200**, with email signup enabled and signup not disabled. This verifies accepted public settings, not the founder's password, confirmation delivery or cloud writes.
- Intents token discovery was rechecked and returned **HTTP 403**. No quote, funding, wallet signing or settlement was fabricated.
- No real email, Supabase account change, domain/SMTP configuration, wallet signing, hosting deployment, repository publication or submission was performed. Live model inference and real hosted two-device verification remain outstanding.
- An initial browser assertion matched both the visible login error and Next's route-announcer alert. The test now selects the actual visible error; the final full 50-test run passed. App authentication did not pretend to succeed for invalid credentials.

The account SDK mock provides predictable test responses; independent embedded PostgreSQL tests verify database policies. Neither replaces final verification on the founder's Supabase project and real inboxes. Chromium mobile emulation is not physical Safari/wallet testing.


## Version 0.5.0 — November 6, 2026

- **212 automated unit, API, security and embedded PostgreSQL tests passed.** New ledger tests cover zero initial balance, explicit once-only grant, matching debit/credit and balanced entries, insufficient funds, idempotent retries, altered approval rejection, self/amount/daily limits, rollback of a debit when recipient credit fails, direct-write/anonymous denial and account isolation. Feedback tests cover private owner/admin reads, ownership/timestamp forgery denial and repeated submissions. Continuation and empty-default tests passed.
- **64 desktop/mobile Chromium browser journeys passed** in the final full run, including the actual SDK against a mock account service for DUSD transfers, preservation of a guest invoice through login, download/sign-in gates, empty accounts, private feedback, account switching and legal/contact credits. The mock two-account scenario explicitly claims 1,000 DUSD, sends 200, observes sender 800 and receiver 200, and persists through account switching. Embedded PostgreSQL tests independently exercise the actual migration; neither substitutes for running it in the founder's real Supabase project.
- TypeScript and optimized production build passed. Production startup and HTTP smoke passed **36 page routes** and existing font/config/extraction/wrong-network checks.
- Real read-only checks through the app API returned HTTP 200 for `faucet.testnet` account state and for an existing public mainnet transaction found in a finalized public block. The latter returned matching final successful execution. **The reference transaction was NOT initiated by AFRIPAY or the assistant.** No wallet was signed or funded and no invoice was marked paid. Observation details are in `docs/research/near-readonly-v0.5.json`; an actual wallet-result screenshot is in `docs/screenshots/near-wallet-live-testnet.png`.
- This managed runtime needs its configured HTTP proxy for outbound Node fetch. The initial plain server reported unavailable rather than substituting data; starting Node with `NODE_USE_ENV_PROXY=1` successfully used the existing proxy/CA trust. TLS verification was not disabled. On normal hosting/PCs, verify provider access in that environment.
- The first guest continuation test exposed a missing invoice binding when sign-in started from the approval page. Continuation now captures the invoice linked to that payment; both desktop/mobile cases and the final full suite passed. Verification is cleared on resume.
- DUSD is a valueless database simulation, not NEAR/USDC, and legacy invoice previews do not move it. Mainnet Intents funding remains unfinished. Actual emails, founder-hosted migrations/accounts/devices, optional model inference and authorized native testnet sends still need external verification.
- New dashboard screenshots were captured and visually inspected. Chromium phone emulation is not physical Safari/wallet testing. No new deployment, SMTP change, repository publication, external message, mainnet send or hackathon submission was performed.


## Version 0.6.0 — November 6, 2026

- 234 automated unit, API, security and embedded PostgreSQL tests passed. Actual migrations cover atomic supplier/friend payments, lower spending policies, duplicate invoice reimports, immutable receipt snapshots, participant-only receipt access, idempotent retries and preservation of existing 0.5 balances/grant history when the additive migration is run twice.
- 74 desktop/mobile Chromium browser journeys passed against the final production build. New cases cover navigation, matching participant receipts/PDFs, names/totals, lost-response retry, approved supplier invoice payments and insufficient balance. Browser account-service responses are mocked; independent database tests execute actual SQL in embedded PostgreSQL. Neither verifies the founder's hosted Supabase project.
- TypeScript, optimized production build and startup smoke across 40 page routes passed. The downloaded receipt PDF was rendered and visually inspected; a sample and screenshots are included. Sample participant names are test fixtures.
- Mobile tests use Chromium viewport emulation, not physical Safari or wallet apps. No real hosted database migration, email delivery, wallet signature, mainnet payment, deployment, repository publication or submission was performed. Funded Intents execution remains unfinished. All DUSD activity is valueless database simulation.
