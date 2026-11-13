# AFRIPAY AI

Built for **NEAR HACKATHON 2026** · Tracks: **Real-World Money**, **AI Security & Defense**

**Intelligent payments. Borderless business.**

A changed wallet address or a fake urgent instruction can turn a supplier invoice into a fraudulent payment. AFRIPAY AI helps African businesses review invoices, understand risk indicators and approve payments in their own wallet. Native NEAR invoices are marked **Paid** only after the exact bound payment passes final execution checks.

[Live app](https://afripay-ai.vercel.app/) · [GitHub](https://github.com/yabsira13/afripay-ai) · **v0.9.5**

## Try it

**Judges:** use **Demo** or **NEAR testnet** to try the product. Issuing internal mainnet invoices requires administrator-approved supplier registration. The verified mainnet transfers below provide public payment evidence; the walkthrough explains the complete invoice flow.

[Judge walkthrough](docs/JUDGE-WALKTHROUGH.md) · [Demo video plan](docs/DEMO-VIDEO.md)

**Without funds:** open the app in **Demo**, choose **Try guided invoice demo**, extract the sample fields and inspect the security report. DUSD transfers are simulated credits with no cash value; account records and transfers require sign-in.

**With test tokens:** choose **NEAR testnet**, connect a testnet wallet, create/pay an invoice and open its transaction and PDF receipt. [Testnet walkthrough](docs/RELEASE-0.9.md).

**Mainnet business flow:**

1. Register your mainnet business and complete administrator review.
2. Create an invoice, choose another approved business and send it to their AFRIPAY inbox. No link needs to be sent.
3. The payer reviews the locked invoice details and approves in their wallet.
4. Verified settlement changes the invoice to **Paid**, with notifications, explorer references and PDFs for the participants.

Uploading a supplier bill is a separate **Upload → Extract → Check → Review payment** flow. Creating an invoice requests payment **to you**; paying a supplier sends funds **to them**.

## Features

- **Invoice intelligence:** PDF text, English image OCR, editable fields and explicit recipient confirmation. Changing the document clears its previous review.
- **Security Shield:** explains changed destinations, repeated invoice references and suspicious instructions. It does not certify identity or guarantee safety.
- **Business inbox and supplier dashboard:** private received/issued invoices, registered-business selection, optional links and status updates.
- **Payment activity:** tracked sent/received native NEAR transfers, payment/invoice notifications, PDF invoices and receipts, and NEAR-order CSV export. BSC history is separate.
- **AI assistant:** local structured proposals and optional configured model integration. AI cannot approve or sign a payment.

## Payment modes and evidence

| Mode | Behavior | Evidence |
| --- | --- | --- |
| Demo | Account-to-account DUSD test credits | Simulation only |
| NEAR testnet | Wallet-approved native test NEAR; final execution checks | Transfers independently verified in both directions; see the links below |
| Native NEAR mainnet | Direct NEAR transfers, invoices and verified receipts | Two founder-supplied native transfers independently verified as final and successful; see below |
| Direct BSC | Exact Binance-Peg USDT/USDC transfers through a compatible EVM wallet on chain 56 | Implementation and fixture tests; funded acceptance pending |
| NEAR-funded Intents | Native NEAR funding to supported destination assets/networks | Live asset discovery checked; funded cross-chain acceptance pending |

The **sending** network determines wallet approval. NEAR-funded cross-chain payments are approved on NEAR; direct BSC transfers require a BSC wallet and BNB for fees. Every payment needs explicit wallet approval. No gas sponsorship or arbitrary source-network support is claimed.

Tracked wallet activity covers AFRIPAY-verified records, not every external transfer. Different assets are not combined into an invented USD balance. Optional model integration and private production inboxes require separate acceptance checks.

## Verified transactions

All four founder-supplied records below were independently checked against NEAR RPC final execution, successful receipt outcomes and matching explorer/block records on **11 November 2026**.

| Network | Amount | Sender → recipient | Explorer |
| --- | --- | --- | --- |
| NEAR mainnet | 0.01 NEAR | `yabsera13.near` → `afripayai.near` | [Mainnet 1](https://nearblocks.io/txns/GpeBUtrjjwn2ZzbXHxK5hFqkMK6mrgYegSMkq57xKrc6) |
| NEAR mainnet | 0.01 NEAR | `yabsera13.near` → `afripayai.near` | [Mainnet 2](https://nearblocks.io/txns/216K2NyfeTEwognrrcmmiminvR7oMLdEj5tAosBRXuhi) |
| NEAR testnet | 0.01 test NEAR | `afripayai.testnet` → `alephai.testnet` | [Testnet 1](https://testnet.nearblocks.io/txns/95t7HKvGZnrYFUR5k3cG1ZCokLnjDjrJPz5ATVb6xMEv) |
| NEAR testnet | 0.01 test NEAR | `alephai.testnet` → `afripayai.testnet` | [Testnet 2](https://testnet.nearblocks.io/txns/AHDKgjpWoAB9JmXReLT6hbpXdTqotiT9vty9UaCHQaK2) |

These establish successful **native NEAR transfers**. They do not establish BSC/Intents execution or independently prove private invoice linkage. [Verification details and saved public evidence](docs/VERIFIED-TRANSACTIONS.md).

## Run locally

Use **Node.js 24 LTS**:

```sh
npm ci
npm run dev
```

Guest demo exploration needs no credentials. For accounts, copy `.env.example` to `.env.local` and configure Supabase. Private invoice/testnet services require the server-only `SUPABASE_SERVICE_ROLE_KEY`; mainnet payments are enabled on the live app; fresh local installs default to `LIVE_PAYMENTS_ENABLED=false` until configured. Every payment still requires wallet approval.

Follow the [current setup and migration order](docs/SETUP.md). Existing installations should use the [focused invoice/payment patch guide](docs/patches/PAYMENTS-AND-INVOICE-INBOX.md). Keep `.env.local` out of Git and server credentials out of `NEXT_PUBLIC_` variables.

## Verification

On **11 November 2026**, **408 automated tests** and TypeScript passed. The latest feature validation also passed **154 desktop/mobile regression checks**, 8 final document-review checks, the production build and a **44-route smoke check**.

Public deployment checks and the limits of private/funded-flow verification are documented in the [review report](docs/reviews/REVIEW-2026-11-11.md).

```sh
npm run typecheck
npm test
npm run build
npm run test:smoke
```

Browser tests use `npm run test:e2e` against a running app. [Setup details](docs/SETUP.md#verification).

## Hackathon development

AFRIPAY was built from scratch after **19 October 2026**, within the hackathon development window, with AI assistance and third-party libraries. No code from an earlier personal project was reused.

Work built during this window includes native mainnet payments, the business inbox, the supplier dashboard, settlement checks, notifications and PDF receipts. The [first public commit](https://github.com/yabsira13/afripay-ai/commit/0f71026524847f189c6715bda1c3963722062089) is dated 7 November 2026. See the [development and dependency disclosure](docs/HACKATHON.md#development-and-reuse-disclosure).

## Project

Next.js · React · TypeScript · Supabase · NEAR Connect · official NEAR Intents 1Click SDK · pdf-lib · PDF.js · Tesseract.js.

Built with AI assistance. [Submission checklist](docs/HACKATHON.md) · [Architecture](docs/ARCHITECTURE.md) · [Security](docs/SECURITY.md) · [Patch walkthrough](docs/patches/PAYMENTS-AND-INVOICE-INBOX.md) · [MIT License](LICENSE).

**Founder:** Yabsera Teklemariyam · [yabsiratekle@gmail.com](mailto:yabsiratekle@gmail.com)
