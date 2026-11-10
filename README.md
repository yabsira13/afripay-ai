# AFRIPAY AI

**Intelligent payments. Borderless business.**

AFRIPAY AI helps African businesses review invoices, spot changed payment destinations and approve payments with clear risk explanations. Built for NEAR HACKATHON 2026.

[Live demo](https://afripay-ai.vercel.app/) · [GitHub](https://github.com/yabsira13/afripay-ai) · **Version 0.9.3**

**Payment status:** DUSD is simulated. The founder demonstrated a paid testnet invoice, and its 0.01 test NEAR transfer was independently confirmed through public RPC. [View the transaction](https://testnet.nearblocks.io/txns/55jZE7gnpLRzhUySa2NtqxMRp6PuxfqFcWhzmECiHWGa). The operator-gated mainnet Intents pilot also needs a funded end-to-end demonstration. Neither gas sponsorship nor unrestricted source-chain wallets is implemented.

Wallet sessions now persist across AFRIPAY pages and idle time, with explicit disconnect/logout controls. Testnet transactions have All/Sent/Received filters; compact invoice rows open into details. Mainnet tools display their actual funding availability and retain per-payment wallet approval.

## Try it in two minutes

1. Open the [demo](https://afripay-ai.vercel.app/) and choose **Try guided invoice demo**.
2. Click **Extract fields**, review the sample recipient and save the invoice to see its security checks.
3. Try a suspicious sample to inspect changed-wallet and unsafe-instruction warnings.
4. Sign in to explore simulated payments, transaction receipts and account-owned records. No real funds are needed for the DUSD demo.

For the blockchain flow, choose **NEAR testnet**: create an invoice in **Invoices**, pay it in **Pay**, and check **Transactions** or **Receive** for verified activity and PDF receipts. Follow the [testnet walkthrough](docs/RELEASE-0.9.md) for setup and recovery.

## What works—and what it proves

| Feature | Current status |
| --- | --- |
| Invoice intelligence | PDF text extraction, English image OCR and editable fields |
| Security Shield | Explainable checks for changed wallets, duplicates and suspicious instructions; not a safety guarantee |
| DUSD payments and PDF receipts | Simulated account-to-account credits; no cash value |
| NEAR account and transaction checks | Real public RPC observations; unavailable evidence stays unavailable |
| Saved testnet invoices | Wallet-approved native transfers, final execution checks, sent/received activity, explorer links and PDF invoices/receipts |
| Mainnet invoice links and Intents | Public invoice checkout and guarded funding/monitoring pilot; funded end-to-end proof pending |
| Reporting | Authenticated live-order CSV and per-asset analytics; no invented USD valuation |
| AI assistant | Local structured proposals, optional model integration; AI cannot sign or approve payments |

## Run locally

Use **Node.js 24 LTS**:

```sh
npm ci
npm run dev
```

Open the local URL printed by Next.js. Guest exploration needs no credentials.

For accounts, copy `.env.example` to `.env.local`, configure your Supabase public URL/key, install the [database migrations and authentication settings](docs/PROJECT-GUIDE.md#configure-accounts), and configure SMTP. Testnet invoices/activity additionally require `supabase/testnet-invoices.sql`, `supabase/testnet-activity.sql` and the server-only `SUPABASE_SERVICE_ROLE_KEY`. Keep secrets out of Git and `NEXT_PUBLIC_` variables.

Existing installation? Follow the [0.9.3 wallet and design update](docs/RELEASE-0.9.3.md) and [0.9 setup instructions](docs/RELEASE-0.9.md). Mainnet funding is disabled by default and requires separate operator configuration.

## Verification

**352 automated tests**, **122 desktop/mobile browser checks**, TypeScript, production build and a **41-route smoke check** passed for 0.9.3.

Browser and RPC fixtures do not prove an actual blockchain transfer or email delivery. See [verification evidence and limits](docs/VERIFICATION-0.9.3.md).

```sh
npm test
npm run build
npm run test:smoke
```

## Documentation

[Detailed guide](docs/PROJECT-GUIDE.md) · [Deployment](docs/DEPLOYMENT.md) · [Architecture](docs/ARCHITECTURE.md) · [Security](docs/SECURITY.md) · [Submission checklist](docs/HACKATHON.md)

Built with Next.js, React, TypeScript, Supabase, NEAR Connect and the official NEAR Intents 1Click SDK. Developed with AI assistance; dependencies and hackathon disclosures are in the detailed guide.

**Founder:** Yabsera Teklemariyam · [yabsiratekle@gmail.com](mailto:yabsiratekle@gmail.com) · [MIT License](LICENSE)
