# Development checklist

## Phase 1 — research and architecture
- [x] Inspect empty workspace, runtime and network policy
- [x] Read official hackathon rules, NEAR docs, NEAR Connect and 1Click quote/status documentation
- [x] Preserve research snapshots; document architecture and payment boundaries

## Phase 2 — foundation
- [x] Next.js / React / TypeScript / Tailwind application
- [x] Original lavender/white design system, responsive navigation, landing and dashboard
- [x] Twenty requested screens plus suppliers and link analysis

## Phase 3 — business features
- [x] Supabase email/password authentication and recovery UI when configured
- [x] Persistent browser-local demo invoices and suppliers
- [x] PDF text and image OCR implementation, optional structured AI extraction
- [x] Invoice editing, explicit wallet verification and duplicate detection
- [ ] Browser verification of OCR, PDFs and configured Supabase authentication
- [ ] Connect real business persistence to supplied tenant database schema

## Phase 4 — security
- [x] Deterministic risk scores, evidence classification and spending checks
- [x] Changed-wallet, duplicate invoice/payment and instruction detection
- [x] Wallet-format analysis; optional public NEAR account observation
- [x] Local URL heuristics without opening links
- [x] Security dashboard, evidence reports, alerts and demo audit history
- [ ] Configure external threat/history feeds, QR decoding and redirect analysis

## Phase 5 — payment engine
- [x] Structured local intent parser with missing-field prompts; no AI signing
- [x] Official NEAR Connect wallet connection and read-only live native NEAR balance implementation
- [x] Official live tokens, dry quotes and read-only status API adapters
- [x] Human-approved demo lifecycle, explicit simulated settlement, failure/refund and branded demo PDF receipts
- [x] Reevaluate risk at approval and prevent repeated invoice payments
- [ ] Verify live API access on target hosting (executor token discovery returned 403)
- [ ] Production coordinator: committed quotes, signed-quote verification, durable approval binding, atomic spending reservations, wallet funding and settlement reconciliation

## Phase 6 — testing
- [x] 142 automated tests pass, including PostgreSQL supplier access controls
- [x] Typecheck and optimized production build pass
- [x] Production startup and page-route HTTP checks pass
- [x] Dependency audit: zero known production vulnerabilities
- [x] Desktop/mobile Playwright journey specifications written
- [x] Run Chromium desktop/mobile browser journeys and inspect actual dashboard screenshots
- [ ] Browser-verify English image OCR (PDF text upload is verified)
- [ ] Apply/test PostgreSQL migration and tenant isolation against real Supabase

## Phase 7 — deployment
- [x] Environment template, beginner run/deployment guide, standalone server, Dockerfile and README
- [x] PostgreSQL schema with RLS, tenant references, immutable browser financial records and audit triggers
- [ ] Public repository: available GitHub CLI credential failed authentication
- [ ] Hosted deployment: Sites helper/starter absent; Vercel/container instructions provided
- [ ] Verify target hosting with configured services and distributed rate limiting

## Phase 8 — submission
- [x] Description, exact track IDs, architecture diagram, video script, screenshot list, X draft and submission checklist
- [ ] Capture actual screenshots and record the video
- [ ] Founder publishes X announcement
- [ ] Collect founder details and mainnet prize account; present exact payload and obtain confirmation
- [ ] Submit once before 2026-11-14 23:59 UTC

This is a working demo release. Outstanding production and publication items are not marked complete.

## Wallet balance follow-up — 2026-11-05
- [x] Replace demo amount when connected; never fall back after a lookup failure
- [x] Exact native NEAR formatting, final block/time, refresh and unknown/error handling
- [x] Restore existing connector session without requesting transaction authorization
- [ ] Verify live RPC and balance against the user’s connected wallet on their PC
- [ ] Add supported fungible-token balances and verified USD prices in a future stage

## Explicit modes and account access — 2026-11-05
- [x] Persistent Demo / Live wallet switch with read-only labels
- [x] Sample business records never displayed as live financial data
- [x] Visible sign-in/create-account entry points and unconfigured-registration notice
- [x] Re-fetch official hackathon rules; founder step-by-step guide
- [ ] Configure founder-owned Supabase project, verify email delivery, sign-in and account recovery
- [ ] Verify latest desktop/mobile mode switch and live wallet on target PC

## Signup, Pay / Receive, supplier marketplace and admin review — 2026-11-05
- [x] Persistent signup confirmation and provider-backed resend UI
- [x] Separate Pay / Receive actions and actual connected receive address
- [x] Custom recipients for demo payment proposals
- [x] Account-separated local demo storage and guest-data preservation
- [x] Supplier applications, approved directory, admin review and standalone RLS migration
- [x] Database tests for privilege/ownership, forged approvals, stale wallet reviews and private review logs
- [x] Founder applied supplier SQL and appointed their administrator account (user-confirmed)
- [ ] Verify two confirmed accounts, real supplier submissions/reviews and email delivery on the target project
- [ ] Funded person-to-person transfers and incoming settlement reconciliation remain unimplemented

## Signup/recovery fixes — 2026-11-05
- [x] Handle provider duplicate/obfuscated signup results without promising a confirmation email
- [x] Dedicated forgot-password flow and verified recovery-session routing
- [x] Reject missing/expired recovery grants and mismatched account identity
- [x] Require password confirmation, verify updated credentials and clear stale local session
- [x] Document exact Supabase redirect settings and fresh-link test
- [ ] Verify actual inbox delivery and password reset against the founder’s Supabase project

## Email branding — 2026-11-05
- [x] AFRIPAY-branded confirmation and password-reset HTML templates with provider verification URLs
- [x] Validate template variables/links and package copy-paste instructions
- [ ] Save templates in the founder’s Supabase dashboard and verify actual inbox rendering
- [ ] Configure a founder-owned verified sending domain/custom SMTP for branded public email delivery

## Version 0.2.0 — onboarding and native testnet
- [x] Explicit guest identities; real signup name/type; private business/country profiles
- [x] Owner-only profile migration and PostgreSQL access-control tests
- [x] Optional wallet setup without seed/key generation
- [x] Separate native NEAR testnet transfer lab, wallet approval and final execution checks
- [x] Mainnet address rejection, amount cap, expiry, duplicate-attempt guards and untrusted-history handling
- [x] Successful real read-only testnet RPC account query; no transfer signed by the assistant
- [x] Startup configuration diagnostic without exposing credential values
- [x] Founder reports applying account-profiles.sql to the existing Supabase project
- [ ] Verify profile onboarding, two-account isolation and two-wallet testnet transfer on PC
- [ ] Finish mainnet Intents coordinator, production financial persistence and public deployment


## Version 0.3.0 — stronger evidence and account persistence
- [x] Private signed-in simulation backups, owner-only RLS and immutable ownership
- [x] Atomic revision checks and serialized/coalesced saves; stale tab conflict warnings
- [x] Visible cloud status, local fallback warnings, unsaved export and explicit reload
- [x] Account-bound database operations; guest/local data preserved
- [x] Optional real-model assistant, structured outputs, grounded fields, verified-session gate, no signing tools
- [x] AI invoice extraction gated by session; invented wallet fields rejected
- [x] Software-directed invoice instructions produce explicit heuristic evidence and block payment
- [x] Decimal-equivalent duplicate payments blocked
- [ ] Founder applies workspace-sync.sql and verifies two accounts/devices against hosted Supabase
- [ ] Live model inference with founder-configured credentials
- [ ] Actual wallet-authorized testnet transfer; confirmed cross-chain invoice settlement remains unfinished

- [x] 177 unit/security/API/PostgreSQL tests, TypeScript and production build passed
- [x] 28 Chromium desktop/mobile browser journeys passed, including actual PDF upload/download
- [x] Actual dashboard screenshots captured and inspected; no horizontal mobile overflow
- [x] Production startup and all 30 page-route smoke checks passed


## Version 0.4.0 — November 6, 2026
- [x] Confirm founder-provided public Supabase URL/key accepted; email signup enabled (read-only check)
- [x] Runtime public auth configuration, valid-key checks and no secret/service-role key exposure
- [x] Local Windows setup command with safe .env.local repair and backup
- [x] Actionable local auth setup panel and visible sign-in/cloud-saving distinction
- [x] Admin-only navigation and separate restricted admin console; database review guards retained
- [x] Real Supabase browser SDK tests against a mock service: login, confirmation, invalid credentials, recovery, persistence and account switching
- [x] Resend official documentation reviewed; verified-domain restriction and SMTP setup documented
- [x] Current hosting guide updated for cloud demo storage and runtime account configuration
- [ ] Founder installs 0.4, recreates/copies .env.local and verifies actual email/password sign-in
- [ ] Verify hosted cloud save/refresh with two real accounts and devices
- [ ] Configure a suitable email sender; Resend public delivery requires a verified sending domain
- [ ] Live AI inference with founder credentials; actual two-wallet testnet transfer
- [ ] Complete funded mainnet invoice settlement, publish repository, host app and record X video

No email, mainnet transaction, repository publication, deployment or hackathon submission was performed by this release.

- [x] 188 automated tests and 50 final desktop/mobile Chromium browser journeys passed
- [x] Production build, TypeScript and 30-page startup smoke passed
- [x] Local setup command tested interactively in an isolated folder


## Version 0.5.0 — clean experience and evidence
- [x] Empty defaults for new guests/accounts; no invented $24,860 balance
- [x] Existing records preserved; explicit sample actions only; intentional clear does not reset credit ledger
- [x] Sign-in before demo approval and downloads; invoice retained and verification cleared on continuation
- [x] Mainnet/testnet public NEAR wallet and transaction observations with honest unavailable states
- [x] Receipt-capable RPC method for final execution checks
- [x] Actual read-only API verification: testnet wallet balance and existing public mainnet transaction confirmed
- [x] Founder-approved developer name/contact; publication unset; privacy/terms/contact/feedback pages
- [x] Private signed-in feedback and admin feedback panel
- [x] Separate valueless DUSD ledger, explicit grant, debit/credit atomicity, immutable-to-user entries
- [x] Idempotency, insufficient balance, single/daily limits and rollback tests in embedded PostgreSQL
- [ ] Founder applies demo-accounts-feedback.sql to the existing project
- [ ] Verify two real Supabase accounts/devices, actual emails and optional live model
- [ ] Actual wallet-authorized native testnet send and funded Intents coordinator
- [ ] Public repository, hosting, X video/post and approved final submission

- [x] 212 automated tests, 64 final desktop/mobile browser journeys, TypeScript and build passed
- [x] 36-page production startup smoke passed
- [x] Live read-only wallet and existing public transaction lookup verified through the app API; wallet browser screenshot inspected


## Version 0.6

- [x] Pay approved suppliers / Transfer friends / Receive / unified Transactions
- [x] Shared balance and lifetime received/sent summaries; named counterparties
- [x] Participant-only professional PDF receipts with matching references
- [x] Atomic supplier invoice updates, policy checks and duplicate/retry protection
- [x] Additive migration preserves existing balances and records
- [x] 234 automated tests, 74 browser journeys, typecheck, production build and 40-route smoke
- [ ] Founder installs final-payments.sql LAST and verifies both hosted accounts
- [ ] Real email, authorized wallet execution, hosting, public repository and X demo
- [ ] Funded mainnet Intents coordinator and verified settlement

## Version 0.7 mainnet pilot

- [x] Supported destination network/asset selection and manually confirmed address
- [x] Production-key quote verification, dry approval then committed quote
- [x] Native NEAR exact funding request, once-only authorization, saved history
- [x] Private service-written orders/events, limits, duplicate and retry guards
- [x] Final origin funding and bound provider settlement checks; SUCCESS-only receipts
- [x] 273 automated tests; 84 final browser journeys; typecheck/build/40-route smoke
- [x] Actual hosted token discovery and signature-verified dry quote, with no funding
- [ ] Founder installs live SQL and server-only credential
- [ ] Deploy and verify operator-gated live mode on founder's hosting
- [ ] Explicitly reviewed and wallet-authorized tiny mainnet pilot
- [ ] Actual funded success, destination receipt and failure/refund verification
- [ ] Record true end-to-end demo and finish approved hackathon submission

## Version 0.8 review fixes

- [x] Public, explicitly published invoice page with immutable destination and amount
- [x] Payer sign-in/review continuation; verification stays unchecked
- [x] Server/SQL request binding; second payer/changed details rejected
- [x] Safe cancellation of uncommitted request only; verified PAID projection
- [x] Dedicated live history with authenticated, paginated CSV and safe explorer links
- [x] Live Security Shield, plain-English observations, private risk evidence
- [x] Live analytics with verified principal and separate asset totals
- [x] Opt-in guided invoice demo; no forced samples in new accounts
- [x] 300 automated tests; 98 browser journeys; production build and 41-route smoke
- [x] Real read-only testnet wallet and recent existing mainnet transaction observed
- [ ] Founder installs 0.8 SQL, deploys and verifies private reports/public links
- [ ] Explicitly approved actual mainnet invoice payment and settlement/receipt proof
- [ ] Funded end-to-end video/X post and approved final hackathon submission

## Version 0.9 testnet invoice and startup changes

- [x] Saved private native NEAR testnet invoices with one-time wallet authorization
- [x] Exact transaction/receipt, execution-block height and timestamp validation before PAID
- [x] Unique transaction hash, private reads and denied browser writes
- [x] Manual hash recovery, explorer links and verified testnet JSON receipt
- [x] Bounded configuration/session/cloud loads; useful public navigation during loading
- [x] Live Invoices opens shareable invoice creation; landing publication footer corrected
- [x] README distinguishes real public reads, implemented payment pilots, DUSD simulation and missing funded evidence
- [ ] Founder installs additive testnet SQL and deploys 0.9
- [ ] Founder signs the first actual testnet invoice payment and records its explorer URL
- [ ] Independently demonstrate a funded mainnet Intents settlement; no claim of gas sponsorship
