Current instructions: see RELEASE-0.4.md and DEPLOYMENT.md. The following November 5 guide is historical; v0.3/v0.4 added private simulation backup, profiles and optional model proposals.

# AFRIPAY AI — next steps for the founder

Updated 5 November 2026. This is a tested prototype, not a finished funded-payment service.

## 1. Install the Demo/Live switch update

Stop the old server with Ctrl+C. Extract the full new ZIP to a new folder. In VS Code open its `afripay-ai` folder (the one with `package.json`). If you have configured `.env.local`, copy your own file from the old folder. Run:

```powershell
npm.cmd ci
npm.cmd run dev
```

Open the same http://localhost:3000 address and press Ctrl+Shift+R. Your demo records remain in that browser. The new top bar has **Demo** and **Live wallet · Read-only**. Demo keeps sample business records and simulated payments. Live wallet never presents those records as real.

Connecting a wallet explicitly opens Live wallet mode. A restored connection does not override your saved mode preference: choose Live wallet if you prefer it. Live shows only native NEAR, not USDC or USD prices. If the lookup fails, share the visible error, not a private key or seed phrase. This switch never enables real transfers.

## 2. Enable registration

The app now has Create account and Sign in buttons. They use Supabase email/password authentication once configured. Without configuration, the page truthfully says registration is unavailable.

1. Create an account at https://supabase.com and create a new project. Keep the database password private.
2. In the project settings, locate the project URL and publishable/legacy anon API key. Do not copy a service-role or secret key into browser settings.
3. In VS Code create `.env.local` next to `package.json`. Set:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR-PUBLISHABLE-OR-ANON-KEY
```

4. Enable the Email provider under Authentication. Keep email confirmation enabled. During testing set Site URL to `http://localhost:3000` and allow `http://localhost:3000/auth/reset` as a redirect. On deployment, change these to the actual HTTPS website URL.
5. Restart the development server. Click Create account, enter your email and a password of at least 12 characters, confirm the email, then sign in.
6. Test signing out and signing in again, and the password-reset email.

Anyone can register once the app is deployed publicly with that configuration and the email provider permits it. `localhost` on your computer is not a public website. Supabase default email sending is limited: configure a supported SMTP provider for public signups.

Registration creates an identity. It does not yet give people a production business database. Business records currently stay in each browser. Integrating the tenant schema, private document storage, business onboarding and account-owned records is the next engineering task before collecting real customer documents.

## 3. Verify the actual NEAR integration

Compare the live NEAR balance with your wallet. Check the account and mainnet network, refresh, and test the offline/error state. Then test genuine 1Click token discovery and dry quotes with supported assets. If blocked, record the exact API error and fix access rather than replacing it with sample data.

The dry quote tool remains accessible in Demo via Payments → Compare routes → Live dry quote; it is clearly labeled and does not commit a swap. The dedicated Live wallet view deliberately exposes balances only in this release.

## 4. Finish secure funded payments

Outstanding implementation: committed quotes after immutable human approval, quote-signature verification, fresh risk checks, exact approval binding, atomic spending reservations with verified asset valuations, idempotency, wallet-authorized deposits/memos, durable status reconciliation, destination settlement verification and failed/refunded handling.

Only after those controls are implemented and tested should you use a separate mainnet dev wallet for one tiny authorized transfer. NEAR Intents has no testnet. A successful wallet connection, a dry quote or a timer must never mark a real invoice paid.

## 5. Publish and demonstrate

- Publish the actual source to a public GitHub repository. The managed workspace's GitHub CLI credential previously failed; use your own authenticated GitHub account.
- Deploy through Vercel or the provided container workflow and test the public URL.
- Run browser/mobile journeys against the real deployment. Repeat invoice extraction, changed-wallet blocking, duplicate protection, receipts, real sign-in and live RPC tests.
- Record a short demo showing one clean invoice and one changed-wallet attack. Clearly separate simulated payments and real API calls.
- Use `docs/HACKATHON.md` for description, tracks, demo outline and X draft. No video, social post or submission has been sent by this app.

## 6. Submit once

Official rules were re-fetched on 5 November 2026 from https://nearhackathon.com/HACKATHON.md . Primary track: `realworld`; additional fit: `security`.

Deadline: **14 November 2026, 23:59 UTC**, which is **15 November 2026, 02:59 in Addis Ababa**. Aim to finish before the final day. Public repository and a public demo post are required. For a local-only demo, the rules require a video; screenshots alone are not enough.

The founder supplies lead name, email, team size, mainnet prize account, public repository/demo-post links and consent. Show the exact payload and confirm it before submitting. Submit only once; corrections use the organizer's request-changes process.

## What gives the entry a stronger chance?

No honest winning percentage can be calculated. The credible strength is a concrete business problem and demonstrable prevention: a supplier wallet changes, AFRIPAY shows the evidence and stops the payment. Reliable NEAR integration, reproducibility, honest limits and a clear demo will matter more than adding extra screens. Do not call this production-ready or claim real settlement until demonstrated.
