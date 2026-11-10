# Security model and operational limits

## Implemented boundaries

- The assistant produces data only. No arbitrary tool execution, private keys or server signing endpoint exists. The native testnet lab allows only an explicitly reviewed, wallet-authorized Transfer request on testnet; the assistant cannot invoke it.
- Invoice extraction is untrusted. Recipient confirmation is explicit and reset after edits to payment-relevant fields.
- Demo approval reevaluates risk against the latest state. It binds all proposal details to the reviewed invoice, checks approval and quote age, blocks critical risk and requires extra confirmation for high risk.
- Duplicate active invoice payments are checked by the demo transition function and by a partial unique index in the production schema.
- Failure/refund outcomes leave invoices unpaid. Demo receipt identifiers start with DEMO and never look like transaction hashes.
- API request schemas reject invalid data, committed quotes, excessive payloads, non-web URLs and unsupported address formats. Quote API uses decimal strings and BigInt atomic conversion.
- Outbound 1Click/RPC destinations are fixed. URL analysis never fetches submitted URLs, preventing an SSRF path through link analysis. Only the operator-configured AI endpoint is variable.
- Optional provider secrets remain server-side. No API exposes environment values. Public Supabase publishable keys are intentionally browser-visible; service-role keys are never used by this UI.
- Cross-origin mutations are rejected when Origin is supplied. Routes are non-privileged; they do not initiate money movement. Add authenticated CSRF/session protections before introducing privileged write APIs.
- SQL financial records are server-write-only. Tenant membership RLS protects reads. Compound foreign keys prevent cross-business invoice/quote references. Audit rows have no browser insert/update/delete policy.
- File size and PDF page limits reduce resource abuse. PDF.js is pinned through the lockfile to a version that fixes the audited malicious-PDF advisory. Extraction reads the text layer only; document actions are not invoked.

## Risk model

Scores are additive, capped at 100. Low: 0–24; Medium: 25–49; High: 50–79; Critical: 80–100. Each rule records its code, points, explanation and evidence class. High risk requires manual review; critical risk is blocked. Missing external intelligence contributes zero maliciousness points and is always disclosed. No provider absence is framed as a clean safety verdict.

## Not production guarantees

Local storage is editable and can be corrupted or cleared. Demo audit records are not cryptographically chained. Browser spending policies are not authorization controls for real money. No threat feed, comprehensive historical-chain analysis, QR decoding, redirect analysis or contract-interaction simulation is configured.

Rate limiting is in-memory per process and assumes a trusted proxy for the forwarded IP header. Production needs a shared edge limiter, observability and abuse limits on paid AI calls. There is no application CSP yet because wallet iframe and OCR worker hosts require a verified allowlist. Security headers currently include no-sniff, frame denial, strict referrer policy and disabled camera/microphone/geolocation.

SQL is a foundation; it was not applied to a live database. Service-role code can bypass RLS by design, so future coordinator code must authenticate, authorize, bind an approval to immutable quote fields and use atomic transactions. Do not add a funded action merely by toggling a boolean.

## Before funded mainnet execution

Implement verified quote signatures, current-token validation, immutable approval binding, explicit committed-quote reapproval when output changes, expiry checks, actual supported wallet funding, memo handling, atomic spending reservations with verified FX prices, durable idempotency, quote/deposit ownership, polling/reconciliation with authenticated settlement evidence, destination transaction verification and resumable failure/refund handling. Test against tiny mainnet amounts with a separate dev wallet and explicit founder authorization.

Never request a seed phrase. Never infer a settled invoice from a wallet submission, pasted hash, independent deposit lookup or elapsed time.

## Private onboarding and testnet controls

Profiles have owner-only SELECT/INSERT/UPDATE policies. Neither signup metadata nor account_type can appoint an admin. Existing guest names are never presented as authenticated identities. Profile fields exclude wallet keys and do not certify wallet ownership. Profile and supplier policy tests execute against embedded PostgreSQL; hosted-project verification remains required.

Testnet endpoints use fixed documented testnet hosts and do not broadcast transactions. Only the wallet submits a single native Transfer with `network: testnet`. Sender/receiver must be distinct named `.testnet` accounts, amount must be positive and at most 1 test NEAR, approval expires in two minutes, and the form requires explicit confirmation. RPC verification refuses mismatched hash/signer/receiver/amount/action and requires FINAL successful recipient execution. Stored local status is never trusted as confirmation after reload. These test-token controls do not replace the unfinished mainnet coordinator or distributed spending/idempotency enforcement.


## v0.3 review

- `demo_workspaces` stores editable simulation documents, never real transaction evidence. Ownership comes from a verified JWT's `auth.uid()`; a security-definer save function has a fixed search path and restricted execution grants. Expected revisions prevent stale writes. PostgreSQL tests exercise anonymous denial, cross-account isolation, direct-write denial, stale revision rejection and live-mode record rejection.
- Browser cache is not encrypted and is not an access-control boundary. Signing out hides the previous account's data, but a person with local device access can inspect local storage. Cloud save failures are visible; users can export their pending work before choosing to reload.
- No automatic synchronization conflict resolution changes recipients, policies or approvals. A stale document cannot overwrite a newer cloud version. These are per-account simulation documents, not collaborative team workspaces.
- AI endpoints authenticate before paid inference. Model fields are untrusted; payment output rejects extra fields/authority and recipient/amount/asset values not grounded in the message. No signing tool or free-form executable output exists. Invoice-directed attempts to override software rules are classified as heuristic evidence, not confirmed external intelligence.
- Real AI, external threat intelligence and wallet-provider behavior are not proven by mocked tests. Browser testing uses Chromium desktop and mobile emulation, not an actual iPhone wallet.


## v0.4 account and admin boundaries

The public configuration endpoint returns only validated Supabase project/public-key settings and feature readiness. Secret-prefixed and legacy service-role keys are rejected and never returned. Model and partner keys remain private. Account bootstrap uses a no-store runtime request so deployment configuration need not match stale compiled browser substitutions.

The admin menu requires a positive membership check for the current account and is hidden during checks/errors/account switches. A separate console denies ordinary accounts before mounting the application list. This UI gate is not the privilege boundary: existing authenticated RPCs and PostgreSQL row policies enforce administrator reviews independently. No browser metadata, email comparison, profile preference or local storage flag can appoint an administrator.

The local setup script only runs as a CLI; there is no public endpoint for rewriting environment files. It preserves unrelated settings, makes a local backup and accepts public keys only. Environment files and backups are excluded from Git and release archives.

Resend remains an external Supabase SMTP configuration. No SMTP sending API or client-side SMTP secret was introduced. Authentication links continue to be issued/verified by Supabase. Mock-service browser tests are not evidence of real inbox delivery.


## v0.5 boundaries

- Demo approval/download gates are product access controls. Browser-generated simulations/public observations are not tamper-proof financial evidence. Account-owned cloud data remains protected by authenticated database policies; test-credit issuance/transfers require authenticated restricted RPCs.
- Empty defaults do not delete existing account or guest records. Only an explicit sample action loads examples. Guest-to-account continuation copies only the selected guest task, expires after 30 minutes and clears recipient verification; signing between existing accounts does not copy their private records.
- DUSD RPCs derive ownership from auth.uid(), use a fixed search path, restrict execution grants and expose no arbitrary owner parameter. Row locks serialize both accounts, while debit/credit/journal writes roll back together. The sender/approval unique constraint plus matching-detail check prevents repeated debits under the same approval. Caps, zero/negative rejection, insufficient balance and self-transfer rejection are database checks. This does not implement real-money custody, FX, blockchain execution or mainnet spending reservations.
- Test-credit accounts/transfers/journal are read-only to ordinary users under RLS. Feedback is private and administrator-readable. Server timestamps cannot be supplied by users. Feedback rate checks are best-effort per-account policies rather than a distributed anti-abuse service.
- Public wallet observations report missing external threat intelligence. Receipt finality is checked for transaction observations, not inferred from a timer or mere inclusion. Fixed RPC provider URLs prevent user-selected server-side URL fetching. TLS verification remains enabled.
- Updated privacy/terms describe local/cloud storage, configured AI/email/RPC providers, absent automatic deletion, prototype limits and private feedback. They are not a claim of a legal/compliance audit.


## v0.6 receipt and supplier-payment invariants

- Receipt data is selected only for auth.uid() as sender or receiver; ordinary table RLS remains, and the receipt RPC does not grant administrator-wide access. Canonical amount/asset/reference/date/label snapshots are identical for both participants. Labels are chosen explicitly and are not extracted from private profiles. Later display-name edits do not rewrite recorded receipts.
- The internal coordinator has no public/anon/authenticated execution grant. Authenticated wrappers derive sender from auth.uid(); supplier wrapper derives recipient from the approved application's owner and checks current review/version. Friend code resolution returns only a label/code, never email or private profile fields.
- Supplier/invoice payments lock the payer's saved document, verify revision and binding, block unsafe instructions/duplicates, and update the invoice only after atomic debit/credit/journal recording. A normalized supplier-invoice unique index protects reimports under another local ID. Direct invoice previews also refuse an already credit-paid invoice.
- Fixed caps and saved lower policies apply to friend/supplier operations. Locks follow document-before-account and stable account-ID order. Summary JSON selects account and all totals/history in one statement snapshot; it does not combine an older balance with newer aggregates.
- Approval IDs are bound to details server-side. The client freezes uncertain operations and reuses that ID, so a lost response cannot silently create a second debit. Frontend data validation rejects malformed summaries, unsupported asset claims and mismatched receipt references.
- These are test-credit controls, not real-money custody, cryptographic quote verification or mainnet settlement. Existing founder-hosted data/credentials, distributed anti-abuse controls and funded Intents coordination still require the documented production work.

## Version 0.7: real mainnet pilot boundary

Funding is operator-gated and disabled by default. A server-only Supabase service key is required; never expose it with NEXT_PUBLIC_ or commit it. Session verification uses Auth getUser, not user IDs supplied by the client. The official SDK verifies quotes with its pinned production key. Source/destination/amount/refund/slippage/deadline are checked against saved approval, and committed terms may not worsen. Memo/custom-instruction funding is rejected.

Only a native NEAR Transfer to the saved deposit address can be requested. The wallet must independently authorize Mainnet. Database locks, invoice-reference uniqueness, a recent-match guard, once-only external-step claims and conservative reservations protect retries. A cancelled or uncertain wallet result cannot automatically reset the authorization. Audit events are protected from browser writes, not immutable against the database operator.

No timer, model prose or wallet-returned hash can mark an order paid. Final origin execution plus matching provider SUCCESS, the signed quote, origin hash, destination hashes and minimum received amount are required. Provider status remains a trust dependency; refund-chain verification and independent destination receipt decoding are not implemented. Tests are not a security audit, and a funded end-to-end pilot remains required.

## Version 0.8: invoice publication and export

Published invoice fields are deliberately public to anyone with the 256-bit random token. Owner IDs, private account profiles, payer identity, full quotes and service credentials are excluded from public projections. Treat descriptions as untrusted text; no embedded HTML/instructions are executed. Token publication is immutable; changing the payee requires a new explicit request. Server-only SQL reservations bind the request and prevent another active payer, including when a client changes the payload. A committed/funded/uncertain request cannot be cancelled from the publication UI.

CSV and aggregate reports require authenticated account access and explicitly filter by the verified user. Spreadsheet formulas are escaped and returned provider explorer URLs are never trusted; links are constructed only for known chains. Tests cover scope, projection, metadata, duplicate attempts, cancellation, refunds and request tampering. Public pages show saved payment status; an autonomous settlement worker and independently decoded destination-chain receipts are still outside this pilot.
