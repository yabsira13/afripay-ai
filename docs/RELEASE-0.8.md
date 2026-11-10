# AFRIPAY 0.8 — review fixes and shareable invoice checkout

This update addresses missing/discoverable software features in the external review. It does not claim that an AFRIPAY funded mainnet swap has already succeeded.

## Install simply

1. Back up your working project. Extract the full 0.8 ZIP.
2. Copy the CONTENTS of its `afripay-ai` folder into your existing GitHub repository folder, replacing matching project files. Preserve your existing `.git` and `.env.local`; the ZIP contains neither. Do not copy into the old nested `afripay-ai` repository.
3. In your existing Supabase project's SQL Editor run **`supabase/live-payment-links.sql`**. This additive upgrade preserves existing demo and live records and includes the 0.7 live table/function foundation. It is safe to rerun. If you ever rerun the older `live-payments.sql`, reapply this new file LAST to restore link binding checks.
4. Keep the current Vercel public settings and private server key. No new credential or market-data API is needed for 0.8. Do not paste secrets into GitHub or chat.
5. Commit the reviewed files in GitHub Desktop, keeping the old nested repository entry unchecked, then Push origin. Check the new Vercel deployment says Ready and the app footer/version says 0.8.0.
6. For local use run `npm.cmd ci` and `npm.cmd run dev`. The release remains OFF by default for new installations; your existing Vercel LIVE_PAYMENTS_ENABLED setting is not changed by copying code. Enabling it never authorizes a payment on its own.

## 1. Shareable invoice link

In **Live wallet → Receive**:

- Sign in and click **Load invoice assets**.
- Enter public business name, invoice reference, destination network/asset, receiving address, exact amount and a non-confidential description.
- Confirm that these details may be published to anyone with the link, then **Publish invoice payment link**.
- Copy the `/pay/<random-token>` link and open it in a different browser/profile. It shows only the published invoice fields and status. Business identity/wallet ownership is not certified by publication.

The public invoice uses a separate MAINNET checkout layout without a Demo banner. Links are unpredictable, expire after seven days, and cannot be edited after publication. Up to 20 unexpired open publications are allowed per owner. The service stores only the fields explicitly chosen for publication; do not include personal/confidential data in the description.

The payer chooses **Review payment with a NEAR wallet**. The linked fields are locked; recipient verification is NOT prechecked. Sign-in and source-wallet connection are still required. The amount, asset, destination and description are checked again on the server and atomically in SQL before reservation. A second payer cannot reserve the same active invoice. Cancellation of a dry request expires its uncommitted quote; a committed/funded/uncertain payment cannot be cancelled through this control.

Only a verified SUCCESS changes the public page to PAID. The publisher can refresh statuses in Receive. Public pages show the saved status; they are not an independent background settlement worker. The payer must keep monitoring or revisit the saved order. In-progress links offer a path back to saved history rather than starting a second payment. Confirmed refunds can permit a new attempt; generic failures and uncertain outcomes stay reserved.

## 2. Clear transaction history and CSV

**Live wallet → Transactions** is now a dedicated history screen. Select a saved order for evidence or its verified mainnet receipt. Origin/destination explorer links are generated from known explorer domains, not arbitrary URLs supplied by a provider.

Click **Export live payments CSV**. The authenticated export includes account-owned funding orders, invoice references, UTC timestamps, state, paid/unpaid classification, networks, addresses, principal, atomic and decimal output fields, risk and explorer/hash references. Quote-only/pending/failed/refunded orders are explicitly NOT PAID. Actual network fees are not imported; the CSV says so rather than using an invented zero.

The export paginates beyond the visible 30-row history. It uses a stable creation cutoff and stops with an explicit error over 10,000 orders or if any page fails, never silently producing a partial report. Formula-like spreadsheet fields are escaped. When importing into a spreadsheet, select Text for `*_atomic` columns to prevent the spreadsheet from rounding long integers. Older 0.7 records without token metadata retain their asset ID/atomic amount rather than guessing decimals. Demo DUSD records are excluded. Incoming published invoices are tracked separately in Receive; this is not a general wallet-indexer export or audited tax ledger.

## 3. Security Shield and analytics in Live mode

- **Security Shield** opens actual NEAR wallet/transaction lookups with a plain-English explanation of observations and limitations. Saved risk evidence from recent real orders appears separately.
- A confirmed transaction means final successful execution, not that its recipient is trustworthy. A balance or new account is not a scam verdict. Unknown/missing data stays unknown. No external threat feed or complete historical fund-flow model is claimed.
- **Analytics** uses account-owned live orders. Only verified SUCCESS contributes to settled principal/output totals. Different assets are grouped separately; nothing is falsely added as USD or DUSD. Principal excludes network fees.
- The dashboard includes **Try guided invoice demo** as an explicit opt-in. New accounts are still empty until they choose samples or add records.

## Judge walkthrough (do X → see Y)

1. Open the hosted demo, select **Try guided invoice demo**, then **Extract fields** → see the 200 USDC sample fields with recipient unverified.
2. Save/review the sample; load the suspicious sample → see changed-wallet/instruction evidence and blocking. These are synthetic documents, not intelligence about a real scammer.
3. In Live mode open **Security Shield**, query a known public account or an existing transaction → see network evidence and its plain-English limits. A provider failure must remain unavailable.
4. In Receive publish a small invoice request to a wallet you actually control → open the link in a second account and see locked invoice fields.
5. Obtain a genuine dry quote and review it. A committed quote does not prove payment. Stop before wallet authorization unless the exact mainnet transfer has been reviewed and explicitly approved by the human.
6. For an authorized funded pilot: approve only the reviewed native NEAR action, keep monitoring, verify origin/destination hashes, then check the public invoice becomes PAID and the verified receipt is available.
7. Export live Transactions CSV and compare status/amount/hash fields with the saved order. Open Analytics → verify only successful orders are counted as settled.

Step 6 is still an external test to perform, not a claim about an already-demonstrated swap. Native testnet transfers remain a separate feature, never an Intents testnet swap. Gas sponsorship and non-NEAR source wallets are not implemented.

## Verification

300 automated unit/API/security/embedded PostgreSQL tests, 98 desktop/mobile Chromium journeys, typecheck, production build and a 41-route startup check passed. Browser account/provider/wallet data is mocked; SQL policies/functions execute in embedded PostgreSQL. Mobile emulation is not physical Safari/wallet testing.

A real public testnet account lookup and an existing recent mainnet transaction lookup returned successful observations through the hosted 0.7 API. An older mainnet reference returned HTTP 503 and remains recorded as unavailable; no fabricated replacement was used. The recent reference transaction was NOT initiated by AFRIPAY. See `docs/research/near-readonly-v0.8.json`.

The 0.8 public invoice publication, live exports and funded route still require deployment and founder-owned account verification. No private credential was used by the assistant, no wallet was authorized, no funds sent and no final submission made by this update.
