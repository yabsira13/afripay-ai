# Security model and operational limits

## Current boundaries — 0.9.5 and invoice patches

The later version sections below record implementation history; this section describes the current scope. Mainnet native transfers are implemented and have verified public transaction evidence. The earlier simulation-only description is superseded. The hosted operator flag was enabled at review; new local setups still default to disabled.

- No wallet private key or seed phrase is collected. Models and extraction tools cannot authorize, sign or execute transfers. Wallet approval remains mandatory.
- Authenticated server routes derive the account from a verified Supabase user, not a client-supplied owner ID. Service-only database functions coordinate reservations and writes; participant policies protect private invoice access. Administrator approval is separate from signup/profile role.
- Native settlement requires the exact bound sender, recipient, amount and final successful execution evidence. A wallet-returned hash or elapsed timer does not mark an invoice paid. Provider failures leave outcomes unresolved rather than initiating a replacement transfer.
- Invoice input is untrusted. Edits clear review/confirmation. Deterministic checks record observations or heuristics, including supplier-destination differences, duplicate references and suspicious instructions. They do not certify legal identity, use a comprehensive threat feed or guarantee safety.
- Quotes, payment bindings, spending caps, duplicate prevention and recovery have implemented controls and automated coverage, documented in the version sections. Tests do not establish an independent security audit or funded cross-chain acceptance.
- Public optional invoice links deliberately reveal their published projection to holders. Do not publish private fields unintentionally. Private business inboxes are account-scoped, not shared merely because accounts use the same public wallet address.
- Inbox sync responses contain only the requesting account's ID and its returned counts, a public project host, version and check time. They expose no bearer token, key or other user's inbox. The client rejects a server context for another account.
- Public token/project settings are distinct from server-only model/partner/service credentials. Fixed RPC/1Click hosts limit outbound destinations; user-supplied links are not fetched for security analysis.

## Risk and evidence limits

Risk scores are additive and capped at 100: Low 0–24, Medium 25–49, High 50–79, Critical 80–100. Critical evidence blocks the supported review flow; risk labels are not proof of authenticity. Missing threat intelligence is disclosed rather than invented. Optional model proposals are validated against supplied text and have no signing tools.

Native NEAR mainnet/testnet transfer evidence is documented in VERIFIED-TRANSACTIONS.md. Direct BSC and NEAR-funded Intents still need funded end-to-end acceptance evidence. Independent destination-chain decoding and refund verification remain limited for provider-mediated settlement. Tracking is not a complete external wallet index. Private production account permissions, actual wallet providers, email delivery and optional models require acceptance checks beyond mocked browser tests.

## Operational limits

Local demo storage is editable and unencrypted. Audit records are not immutable against the database operator, and server service credentials can bypass RLS by design. Protect and rotate credentials; never put them in public variables or Git. Per-process rate limiting is not a distributed production abuse control. Production hardening still needs monitoring, shared rate limits and a verified CSP allowlist for wallet/OCR resources. Existing headers do not constitute a complete security audit.

New deployments must install current migrations, configure authentication/mail and explicitly enable funding before intentional wallet tests. Follow SETUP.md, not an older version's migration ordering. No mainnet transaction or deployment is authorized by this document.

## Historical implementation notes

## Private onboarding and testnet controls

Profiles have owner-only SELECT/INSERT/UPDATE policies. Neither signup metadata nor account_type can appoint an admin. Existing guest names are never presented as authenticated identities. Profile fields exclude wallet keys and do not certify wallet ownership. Profile and supplier policy tests execute against embedded PostgreSQL; hosted-project verification remains required.

Testnet endpoints use fixed documented testnet hosts and do not broadcast transactions. Only the wallet submits a single native Transfer with `network: testnet`. Sender/receiver must be distinct named `.testnet` accounts, amount must be positive and at most 1 test NEAR, approval expires in two minutes, and the form requires explicit confirmation. RPC verification refuses mismatched hash/signer/receiver/amount/action and requires FINAL successful recipient execution. Stored local status is never trusted as confirmation after reload. These test-token controls do not establish mainnet or cross-chain acceptance; later mainnet coordinator controls are described in the versioned sections below.


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

### 0.9 testnet invoice boundaries

Saved testnet invoices are private to authenticated owners; anonymous/authenticated clients cannot write the table. All mutations occur in the authenticated, owner-scoped server route. Exact transfer binding, final successful execution/receipts, block hash/height/timestamp, one-time authorization and global transaction-hash uniqueness protect paid status. A wallet failure never automatically retries a transfer. Service-role credential security and trustworthy testnet RPC remain dependencies. This flow proves neither mainnet settlement nor cross-chain execution, legal identity or sponsored gas. No wallet secret is collected.

### 0.9.2 shared testnet activity

Shared activity stores public chain facts only: transaction hash, sender, recipient, native amount, execution block/time, verification time and public provider. Client roles cannot directly read/write the table; the authenticated API projects only these public fields for a named testnet address. A public wallet address is not treated as proof of ownership, and exposes no account email or private invoice fields. Native transactions must have exactly one matching Transfer and final successful receipt evidence before immutable hash-keyed insertion. Import/recheck never authorizes or sends another transfer. Tracked totals exclude fees and do not claim full external chain history. PDFs remain descriptive records whose hashes should be checked in the explorer.

### 0.9.4 source-network controls

Direct native NEAR uses exactly one Transfer action to the reviewed receiver on mainnet. A successful final outcome, matching transfer and fresh canonical block are required before settlement is reported. Direct BSC uses pinned USDT/USDC contracts, chain 56 and exact ERC-20 transfer calldata; no token approval is requested. Wallet accounts/chains are rechecked before sending. Server verification requires the matching successful Transfer event and at least 12 canonical confirmations. A returned wallet hash is not proof of payment.

Service-only RPCs lock spending policy, invoice and order records, claim authorization once, enforce per-route caps and prevent competing invoice payers or duplicate transaction hashes/references. Uncertain authorization requires recovery, not an automatic resend. Published invoice fields remain immutable. No private keys are stored and no server signs transactions. Mobile BSC requires a compatible injected wallet browser; selecting a receiving network cannot change a NEAR funding transaction into a BSC signature.

### 0.9.5 public transfer projections and supplier separation

An authenticated public-address lookup can read only verified native transfer facts shared with the sender and receiver. The API never returns another payer's order ID, user ID, invoice contents or risk record. Reconciliation checks existing submitted hashes only through final native execution verification and does not authorize or send a transaction. Missing or mismatching evidence does not become a received amount. These records are not complete external wallet history, and lookup does not prove address ownership.

Network supplier applications require an owner-scoped account and a distinct registration per mainnet/testnet network. Testnet addresses must be `.testnet`; a registration's network cannot be reassigned. Owners cannot self-approve, and every owner edit removes review approval. Appointed administrators must explicitly verify the destination, with stale-snapshot protection and separate review logs. Legacy reviewed mainnet applications retain their original review status when copied; sample invoice contacts are not copied or approved. Selecting a supplier never skips recipient review or wallet signing.

### Mainnet invoice inbox and notifications

Private delivery is limited to the issuer and intended payer. Issuance requires the authenticated issuer's approved mainnet registration; the server and SQL transaction verify the receiving address/network. Client roles cannot create delivery records or call the service-only delivery RPC. Public optional payment links expose only the established published request projection, not private participant IDs, notification records or payer order/risk details.

Paid invoice status requires verified settlement of the exact bound order. Different published invoices can have the same human invoice number, while the immutable invoice token and reservation locks prevent a second payment to the same request. Notifications are private and deduplicated; opening a read action filters by authenticated owner. Unverified or unrelated transfers do not complete an invoice. Uploaded text is untrusted, edits invalidate review, and extraction or invoice delivery cannot sign a wallet transaction.

## Demo account invoice inbox

Demo invoices use the payer's shared Receive code, not an email directory or arbitrary user ID. Issuer identity comes from auth.uid(); receipt labels are explicit public account names, not private profile/email fields. Both parties must have Demo credit accounts, and self-billing is rejected. Only participants have SELECT access. Creation/payment/cancellation run through restricted authenticated functions; clients cannot directly edit invoice states, amounts, balances or transfer links.

Invoices have immutable details and issuer-unique references. Reusing an invoice ID for different details is rejected. Payment locks the saved policy, invoice and credit accounts in a consistent order, uses the existing DUSD coordinator and updates Paid state and transfer link in the same transaction. The server fixes amount and receiver from the invoice. A paid retry returns the existing record; insufficient credit or a policy failure leaves the invoice unpaid. Uncertain browser results retain approval identity and can recover from the server inbox without a new debit.

Demo billing does not approve suppliers, certify identity or provide mainnet/cross-chain settlement. Descriptions are untrusted display data and are never executed. No wallet signing is involved, and PDF invoices/receipts remain explicitly simulated.
