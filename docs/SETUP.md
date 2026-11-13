# Current setup — AFRIPAY 0.9.5 with invoice inbox patches

This is the current installation guide. Older release guides describe the system at their publication date; their instructions to run a file “LAST” apply only to that older release.

## Local development

Use Node.js 24 LTS. Run `npm ci`, then `npm run dev`. Guest demo exploration works without credentials. Copy `.env.example` to `.env.local` when enabling account or provider integrations.

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Its public anon/publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only service/secret key from the same project; private invoice, testnet and live coordinators |
| `LIVE_PAYMENTS_ENABLED` | `false` by default; operator switch for mainnet funding |
| `ONECLICK_API_KEY` / `ONECLICK_API_TOKEN` | Optional provider credentials, if required by your 1Click partner access |
| `AI_API_KEY`, `AI_BASE_URL`, `AI_MODEL` | Optional configured model; local deterministic tools work without a model key |

Never commit `.env.local` or place service/model keys in `NEXT_PUBLIC_` variables. The application never needs a wallet seed phrase or private key in its server environment.

## Supabase migration order

For a fresh Supabase project, run these complete files in SQL Editor in order:

1. `supabase/account-profiles.sql`
2. `supabase/supplier-marketplace.sql`
3. `supabase/workspace-sync.sql`
4. `supabase/demo-accounts-feedback.sql`
5. `supabase/final-payments.sql`
6. `supabase/testnet-invoices.sql`
7. `supabase/testnet-activity.sql`
8. `supabase/live-payment-links.sql` — includes the live-payment foundation
9. `supabase/mainnet-transfers.sql` — combined native NEAR/BSC upgrade
10. `supabase/network-suppliers.sql`
11. `supabase/separate-payment.sql`
12. `supabase/business-inbox.sql` — current invoice identity, settlement notification and private-delivery foundation
13. `supabase/demo-invoice-inbox.sql` — separate private Demo bills and atomic DUSD settlement

For an existing installation, apply only the missing updates in that order. **Do not rerun an older migration after a newer one**, because older function definitions can replace newer behavior. The combined mainnet migration already contains the standalone native/BSC definitions; running those older standalone files afterward is unnecessary. `schema.sql` is a historical unfinished foundation, not a substitute for this list.

The current business inbox migration preserves payment and registration records, installs participant-only invoice/notification access and rebuilds notices from already-verified settlements. Installing migrations does not send a payment or approve a supplier.

## Authentication and administrators

Enable email authentication and configure confirmation/recovery delivery in Supabase. Set the production Site URL and approved redirect URLs for your deployment and local development, including `/auth`, `/auth/reset` and `/settings` (email-change confirmation). Keep email confirmation and Secure email change enabled when requiring approval of email changes. Test actual email delivery separately. [Email templates](../supabase/email-templates/README.md).

Administrator status is separate from a customer's profile role. After locating the founder's actual UUID in Supabase Authentication → Users, an authorized project administrator can appoint that account through SQL Editor:

```sql
insert into public.afripay_admins(user_id)
values ('ACTUAL-AUTH-USER-UUID')
on conflict do nothing;
```

Do not add a public self-appointment endpoint. Use Admin console → Application network to review mainnet/testnet supplier registrations. Issuing internal mainnet invoices requires approved registration; payment destinations remain fixed to the approved issuer snapshot. Optional payment links also support payers outside the directory.

## Deployment and wallet routes

Deploy the Next.js repository to Vercel and configure its project environment variables. New/changed environment settings require a new deployment. Use the existing Supabase project's matching public and server keys.

Mainnet funding requires installed migrations and the operator flag. A connected wallet alone cannot spend. NEAR transfers require an existing receiving account. NEAR contract tokens may require recipient storage. Direct BSC uses the pinned Binance-Peg USDT/USDC contracts and a compatible injected EVM wallet, chain 56, plus BNB for gas. On mobile this may require the wallet's browser.

A source NEAR payment to a BSC destination is an Intents conversion and is approved on NEAR. It is different from a direct BSC transfer. Quote/provider availability is independent from loading the app.

Default NEAR limits are 0.1 NEAR per payment and 0.3 per UTC day, shared by native/Intents orders; hard ceilings are 0.5 and 2. Direct BSC defaults are 10 tokens per transfer and 30 per asset per UTC day. Fees are additional. A submitted/uncertain signing result is recovered with its existing hash rather than automatically retried.

## Verification

```sh
npm run typecheck
npm test
npm run build
npm run test:smoke
```

Smoke starts its own local production server; build first. For browser tests, install Chromium with `npx playwright install chromium`, run the app in one terminal, then run `npm run test:e2e` in another. `E2E_BASE_URL` selects a different running app URL; `E2E_CHROMIUM_PATH` can select an existing Chromium binary.

Browser/database fixtures do not prove email delivery, an external wallet signature or a funded cross-chain settlement. After deployment, test invoice delivery between two accounts and a deliberate small wallet-approved payment; verify both invoice states, explorer evidence and PDFs. See the dated review for what was independently observed.

## Comparing the same inbox across devices

Use My account → Current email and Account ID on both devices. A connected wallet does not identify the signed-in AFRIPAY account. The founder confirmed that the PC and phone with different invoice counts were using different accounts. Sign out on the device with the unintended account and sign in with the existing intended account; do not create another account or merge private records by wallet address.

Invoices → Inbox sync details shows the authenticated server account, public Supabase project host, version, returned received/issued counts and last successful check. Compare after Reload saved invoices on the same deployed origin. These details contain no access token or service key. The response remains private, authenticated and uncached. If account IDs and project host match but fresh counts differ, capture these details and investigate the server records; do not infer a payment or copy records between owners.

## Demo invoice delivery between accounts

For an already configured installation, run only `supabase/demo-invoice-inbox.sql` in Supabase SQL Editor after the existing final-payments foundation. This additive migration preserves current credits, payments, uploaded previews and mainnet/testnet tables. No new environment variable or service key is required. Do not rerun older migrations afterward.

The customer opens Demo → Receive and shares their full Receive code. The issuer opens Invoices → Create invoice and bills that code. Sending the invoice moves no funds. The payer explicitly reviews and approves the immutable amount/issuer; a database transaction performs the DUSD debit/credit and Paid status update together. Only issuer and payer can read the bill or associated receipt. Sending and paying Demo invoices requires no supplier registration or administrator approval. It does not grant mainnet supplier privileges.

The invoice inbox and uploaded invoice previews are separate: uploading a document does not deliver it to another account. Invoice/receipt PDFs clearly identify DUSD and the absence of a blockchain payment. Ledger activity includes the invoice reference. Supplier-directory payments retain their existing approval requirements.
