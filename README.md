# AFRIPAY AI

**Intelligent Payments. Borderless Business.**

NEAR Hackathon 2026 prototype for African businesses: invoice extraction, explainable transaction protection, a human-approved payment simulation, and optional genuine NEAR Intents dry quotes.

**Version 0.6.0: functional prototype; funded mainnet payments remain disabled.** Demo invoices/payments stay simulated, including cloud-backed records. A separate native NEAR testnet lab requires wallet authorization and checks actual final execution on testnet. Private profiles and supplier applications use Supabase after their migrations are installed; signed-in demo invoice/payment records can sync privately to Supabase after installing `supabase/workspace-sync.sql`; guest records stay browser-local. No private keys, fabricated blockchain hashes or timer-based real confirmations are used.

## Start in two commands

Install Node.js 24 LTS, then in this folder:

```sh
npm ci
npm run dev
```

Open http://localhost:3000. No credentials are required. See [deployment instructions](docs/DEPLOYMENT.md) for accounts, environment variables and hosting.

## Judge's walkthrough

1. Open **Invoices → Upload invoice**, choose **Try a clean invoice**, then **Extract fields**. See 200 USDC and Shenzhen Nova Trading.
2. Change the invoice number if you want to import it in addition to the existing demo invoice. The initial workspace intentionally already contains INV-2026-014, so importing it unchanged demonstrates duplicate detection.
3. Independently review the full wallet and destination chain, then check the verification box and save. See the evidence report. Extracted wallets are never silently approved.
4. Choose **Prepare payment → Check security & compare routes**. Inspect risk, recipient and limits. The default route is explicitly illustrative.
5. Optional: switch to **Live NEAR Intents dry quote**, load supported tokens, select a source amount, compatible destination asset and your source-chain refund address. A successful response is actual API data. Upstream failures are shown as failures, never replaced with demo quotes. Mainnet 1Click endpoints may be blocked by some hosting networks.
6. For the safe demo, choose **Review demo payment**, confirm recipient/amount/minimum output, then approve. No wallet signing or real funding occurs.
7. In **Transaction monitor**, explicitly choose **Simulate confirmed settlement**. The invoice changes to **Paid (demo)**. In **Transactions**, download the clearly labeled PDF receipt. Choose failure/refund on another demo to see that its invoice stays unpaid.
8. Upload **Try a suspicious invoice**. Its supplier matches the saved record but its wallet changes, and its text asks to bypass verification. The report shows the exact discrepancy and blocks payment at critical risk.
9. In **Security Shield**, try wallet analysis and Link protection. Unknown history is explicitly unknown; links are never opened.
10. Ask the assistant **“Pay my supplier 200 USDC.”** Inspect its structured proposal and missing fields. The assistant cannot execute it.

## Implemented

- Responsive lavender/white fintech workspace; landing and authentication screens.
- Dashboard, assistant, invoice list/upload/details/edit, supplier list and verified recipients.
- PDF **text-layer** extraction; PNG/JPEG/WebP **English OCR** through Tesseract; text paste/import. Optional structured extraction from an OpenAI-compatible model.
- Duplicate invoice checks, changed-wallet comparison, invalid fields, risky instructions and URL heuristics.
- Explainable deterministic 0–100 transaction risk; per-payment/daily limits, repeated attempts, recipient/asset/chain changes and duplicate-payment protection in the demo flow.
- Security dashboard, wallet analysis, transaction analyzer, invoice fraud checker, link protection, evidence alerts and local audit history.
- Payment form, route screen, approval, manual simulated progress, settled/failed/refunded outcomes and branded simulated PDF receipts.
- Actual official 1Click token discovery, dry quote requests and read-only status lookup using server-side optional JWT.
- Official NEAR Connect wallet connection with a read-only live native NEAR balance card, final-block provenance and refresh/error states. Mainnet signing remains disabled; the separate testnet lab permits one reviewed native Transfer action through the user’s wallet.
- Analytics, CSV/JSON exports, profile/security settings, Supabase email/password sign-in and password recovery UI.
- PostgreSQL foundation with tenant RLS, server-write-only financial records, audit triggers and unique active invoice payments.
- Unit/security/API integration tests, browser journey specifications, production build and container definition.

## Deliberate limits

- No committed mainnet quotes, funded mainnet swaps, automatic mainnet settlement reconciliation or real financial receipts. These need an audited transaction coordinator, signed quote verification, atomic reservations, idempotency and configured production access.
- Browser-local demo records and audit history are editable, not a secure ledger. Real business persistence is not wired to the supplied SQL schema.
- No external malicious-address or phishing feed is configured. NEAR wallet analysis optionally queries account existence through public RPC; it does not analyze historical flows. Other chain history is unavailable. A valid/new wallet is not thereby safe or malicious.
- Scanned PDFs without a text layer must be uploaded as images or entered manually. OCR language defaults to English. QR image decoding, QR destination comparison, document signature verification and redirect inspection are not implemented.
- Security rules are code-based, not AI-created evidence. Optional AI extraction requires credentials; the assistant is an honest structured local parser.
- Demo spending limits count selected assets at 1:1 USD for demonstration only. Real asset valuation is not implemented.
- Rate limiting is per-process and assumes a trusted deployment proxy; use an edge/shared limiter before production exposure.
- Browser end-to-end tests, SQL policies and container runtime require verification in a suitably configured environment. No public deployment, public GitHub repository or recorded video is claimed.

## Checks

```sh
npm run typecheck
npm test
npm run build
npm run test:smoke
```

For browser journeys, start the app, install Playwright's browsers in your own environment (`npx playwright install chromium`), then run `npm run test:e2e`. For a hosted deployment set `E2E_BASE_URL` to its URL. The v0.3 release runs these journeys in Chromium at desktop and mobile viewport sizes; these tests do not replace a real wallet or email-provider test.

## Project map

- `app/api/` — validated, bounded, same-origin server integrations. No payment execution endpoint exists.
- `lib/security.ts` — deterministic rules and source classifications.
- `lib/amount.ts` — precise decimal-to-atomic conversion.
- `lib/invoice.ts`, `lib/assistant.ts` — extraction/parser fallbacks.
- `components/workspace.tsx`, `app/globals.css` — responsive application and demo state.
- `supabase/schema.sql` — access-controlled database foundation.
- `tests/` — security, API and browser journey tests.
- [Architecture](docs/ARCHITECTURE.md), [checklist](docs/CHECKLIST.md), [deployment](docs/DEPLOYMENT.md), [submission kit](docs/HACKATHON.md).

## Official sources

Research checked 2026-11-04, with snapshots under `docs/research`:

- https://nearhackathon.com/HACKATHON.md
- https://docs.near.org/ and https://docs.near.org/tools/near-connect.md
- https://docs.near-intents.org/integration/distribution-channels/1click-api/quickstart/making-a-request.md
- https://docs.near-intents.org/api-reference/oneclick/request-a-swap-quote.md
- https://docs.near-intents.org/api-reference/oneclick/check-swap-execution-status.md

1Click uses mainnet; no Intents testnet exists. The dry → human review → committed → wallet authorization → verified settlement lifecycle is documented, and this release stops at dry quotes for mainnet Intents. Native NEAR testnet transfers are a separate implementation and never mark demo invoices paid.

## Hackathon disclosure and license

Built from an empty workspace during the November 2026 development window with AI assistance. No pre-existing product or own baseline code was imported. Libraries: Next.js, React, Tailwind, Lucide, Supabase JS, NEAR Connect, Tesseract.js, PDF.js, Zod, Vitest and Playwright. See `package-lock.json` for exact dependency versions and upstream licenses. No separate competing project is declared in this workspace. MIT license; see LICENSE. The copied PDF.js browser worker is Apache-2.0 licensed; see `public/PDFJS-LICENSE`.

## Observed verification

On 2026-11-04: **41 tests passed**, typecheck passed, production build passed, and an actual production server passed HTTP smoke checks for **22 page routes** plus configuration/extraction APIs. Production dependency audit reported zero known vulnerabilities. See [the verification record](docs/VERIFICATION.md) for browser, database and live API limits.

## Receipt design update

Payment receipts now download as branded PDFs with full wallet/reference fields and a visible simulation notice. See [Windows update instructions](docs/RECEIPT-UPDATE.md). PDF generation happens locally in the browser using bundled licensed fonts, without an external document service.

## Wallet balance update

A connected NEAR wallet now replaces the illustrative USD balance with its native NEAR account balance. Other tokens and USD valuation are not included. Payment activity remains simulated. See [wallet balance update instructions](docs/WALLET-BALANCE-UPDATE.md). Live RPC accessibility from the target PC still needs verification.

## Demo / Live wallet switch and registration

The top bar separates Demo, Live wallet (read-only mainnet), and the native NEAR testnet lab. The live view never displays seeded business records or simulated payments. Create account and Sign in are visible; Supabase credentials and public deployment are still required for actual visitor registration. See [the founder’s next steps](docs/START-HERE-NEXT-STEPS.md).

## Accounts, suppliers and receiving update

Signup now has a persistent email-confirmation screen and resend action. Pay supports custom demo recipients; Receive displays the actual connected native NEAR account. Demo storage is separated by signed-in user. Supplier applications and an admin review panel use authenticated Supabase tables/RLS after applying `supabase/supplier-marketplace.sql`. Admins are appointed by the project operator, never ordinary signup. See [setup and two-account test instructions](docs/ACCOUNTS-SUPPLIERS-ADMIN.md). Mainnet funded transfers, automatic mainnet receiving reconciliation and database-backed invoice/payment persistence remain unfinished.

## Authentication fix

Duplicate/obfuscated signup responses are no longer presented as guaranteed new-account confirmation. Password recovery has a dedicated email request, a verified-session gate, confirmation entry and a new-password login check. See [the Supabase settings and recovery test guide](docs/AUTH-FIX.md). Your actual project’s redirect configuration and inbox flow still require verification.

## Branded authentication emails

Supabase-ready AFRIPAY confirmation and reset templates are in `supabase/email-templates/`. Paste them into Supabase Authentication email settings; they are not installed by an app deployment. The verification links retain the provider’s `ConfirmationURL`. Custom SMTP is needed for branded template editing; an existing Gmail account with an App Password can work for small tests without buying a domain. A branded-domain sender address needs verification of that owned domain. See `supabase/email-templates/README.md`.

## Version 0.2.0: private onboarding and native testnet lab

Guest identities are explicitly Demo user / Sample business. Signup collects a name and Customer/Supplier preference; account-owned business/country profiles are saved under RLS after installing `supabase/account-profiles.sql`. The `wallet/setup` screen offers a no-wallet simulation, read-only mainnet connection and the native testnet lab. The lab uses only `.testnet` accounts, at most 1 test NEAR per transfer, explicit review/wallet approval and matching final RPC execution proof. It never executes a mainnet swap. See [complete setup and two-wallet instructions](docs/RELEASE-0.2.md).


## Version 0.3.0: private demo backup and guarded model proposals

Run `supabase/workspace-sync.sql` in your existing Supabase project's SQL Editor. Signed-in users' simulation invoices, suppliers, payment history, security reports and policies then save to an owner-only document. Saves serialize and use database revision checks; a stale tab cannot overwrite a newer document. Conflicts display a warning, with unsaved export and explicit reload controls. Guests keep local demo storage. Existing data is not deleted. First cloud initialization imports only that signed-in account's local simulation, never another account's or the guest's records.

These documents remain **user-editable simulations**, not a production financial ledger or immutable audit log. Mainnet payment coordination still requires durable server-side reservations and verified settlement. An unavailable database is labeled as unsaved; it never becomes a fabricated successful payment.

The assistant offers local parsing (no model) or a configured OpenAI-compatible structured model. Model calls require a Supabase-verified session. `AI_API_KEY`, `AI_BASE_URL` and `AI_MODEL` stay server-side. Only explicitly mentioned numeric amounts, supported asset symbols and recipient addresses are accepted. Invented fields, extra authority and malformed outputs fail closed. The model has no wallet tools and its prose cannot authorize payments. Invoice AI extraction uses the same session requirement and rejects invented wallet addresses. Actual inference needs your credentials and has not been exercised against a live model here.

Invoice instructions that attempt to override software rules now generate explicit heuristic evidence and block the demo payment. Decimal formatting cannot bypass duplicate payment checks. See [upgrade steps](docs/RELEASE-0.3.md), [verification](docs/VERIFICATION.md) and [the path to a stronger entry](docs/ROAD-TO-8.md).


Latest verification (v0.3.0): **177 automated tests and 28 desktop/mobile Chromium browser journeys passed**, plus TypeScript, the production build and 30-page startup smoke checks. Browser checks include actual sample PDF upload and demo receipt download. [Actual dashboard screenshots](docs/screenshots/) are included. Hosted Supabase synchronization, live model inference, real emails and wallet-authorized transfers still need target-account verification.


## Version 0.4.0: repair account setup and restrict the admin console

`npm run setup` creates/repairs `.env.local` using your Supabase project URL and publishable key, preserves unrelated settings and backs up an existing file. The account bootstrap reads validated public settings from the running server, so a stale frontend build cannot silently disable configured auth. Missing setup has an actionable local repair panel. The public config route never returns secret/service-role, SMTP or model keys.

Guests see **Sign in to save online** and an explanation that wallet connection is separate from account login. Normal customers/suppliers have no admin navigation; appointed administrators see **Admin console**, a separate layout. Direct navigation is denied to ordinary accounts and supplier review RPCs retain their database administrator checks. Existing invoice, demo payment, security, profile, supplier, AI and testnet features remain.

See [Windows update steps](docs/RELEASE-0.4.md), [Resend SMTP requirements](docs/RESEND-SUPABASE.md) and [current deployment steps](docs/DEPLOYMENT.md). Resend public delivery needs a verified sending domain; a free Resend test sender cannot mail all users. SMTP, hosting, live inference, wallet transfers and competition submission are not automatically enabled by installing this update.


Latest v0.4 verification: **188 automated tests, 50 desktop/mobile Chromium browser journeys, TypeScript, production build and 30-page startup smoke passed**. Account browser flows use the actual SDK with a mock service, not real email delivery. A read-only public check accepted the founder-provided Supabase settings and reported email signup enabled. Live Intents token discovery still returned HTTP 403 in this environment. See the verification record for limits.


## Version 0.5.0: clean starts, sign-in gates and account transfers

New workspaces start empty; sample invoice buttons load examples only when chosen. Existing saved data is preserved. The dashboard no longer invents a starting balance. Its DUSD balance comes from a separate account-owned test-credit ledger, initially zero. Signed-in users may explicitly claim 1,000 valueless DUSD credits once, share a receive code and transfer credits to another registered account. A restricted database RPC atomically debits/credits, enforces available balance and limits, records balanced entries and handles idempotent retries. DUSD is **not NEAR, USDC or real money**. Invoice workflow previews do not move DUSD; funded Intents settlement remains unfinished.

Guests may review invoices and use read-only NEAR observations, but demo payment approval and built-in downloads require sign-in. An explicit guest invoice continuation survives sign-in and reopens with recipient verification cleared. Other accounts' records are not imported.

`/near/checks` reads final wallet state or a transaction by hash/sender on an explicit mainnet/testnet selection. It requests receipt-capable RPC status, requires matching complete final execution for confirmation, and keeps unavailable data unknown. No external scam intelligence or full movement history is claimed. It never signs, sends or marks a real invoice paid.

The footer credits **Yabsera Teklemariyam**, links **yabsiratekle@gmail.com**, and exposes Privacy, Terms & rules, Contact and Ideas & feedback. Publication stays unset until actual deployment. Feedback requires sign-in to submit and is private to its author/authorized admins. An admin feedback panel is included.

Install `supabase/demo-accounts-feedback.sql` after the earlier migrations. See [Windows upgrade and two-account walkthrough](docs/RELEASE-0.5.md). All prior account/profile, supplier, security, AI guardrail and native testnet features remain. Actual wallets, inbox delivery, hosted Supabase setup, live inference, hosting and the final submission still need the documented verification/approvals.


Latest v0.5 verification: **212 automated tests, 64 Chromium desktop/mobile journeys, production build and 36-page startup smoke passed**. Real read-only API queries returned a testnet wallet balance and confirmed an already-existing public mainnet transaction. No transfer was sent by AFRIPAY in those checks. Browser account flows use a mock service, while embedded PostgreSQL executes the actual ledger/feedback policies. Founder-hosted two-account testing, emails, live model calls and actual wallet sends remain separate checks.


## Version 0.6.0: Pay, Transfer, Receive and shared receipts

Navigation now separates approved supplier **Pay**, friend **Transfer**, **Receive** and unified **Transactions**. Demo mode is selected at the top; DUSD remains explicit on balances and receipts. All recorded credit screens and the dashboard use the same validated database summary, whose balance/totals/history are read from one snapshot. Legacy invoice previews remain available via Open invoice preview and are separately labeled; they never affect DUSD totals.

Participants may choose a receipt display name in Receive. A transfer snapshots both labels, and both participants obtain the same canonical receipt/PDF. Their private emails/profiles are not returned. Receipt access is limited to sender/receiver, including denial to nonparticipant administrators. Old history and balances are preserved with stable fallback labels.

Supplier Pay derives the recipient from a currently approved supplier application, rather than guessing ownership of a wallet. Optional invoice payment binds the saved workspace revision, invoice identity/number, verified recipient, business, chain, wallet and amount; enforces policies/duplicate/security checks; and updates only the linked invoice after successful atomic credit recording. This remains DUSD simulation, not funded NEAR Intents execution. Uncertain network responses preserve the approval ID and freeze details for safe retries.

Run the additive `supabase/final-payments.sql` LAST, after the earlier migrations. See [the final update walkthrough](docs/RELEASE-0.6.md). Mainnet Intents settlement, live AI/inbox/wallet verification, public repository, hosting and submission remain the documented external tasks.
