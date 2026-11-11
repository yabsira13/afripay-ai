# Run and deploy AFRIPAY 0.7

## On Windows

Install Node.js 24 LTS from https://nodejs.org and VS Code. Extract the complete project and open the folder containing `package.json`. Stop any old AFRIPAY server first.

For account access, copy your existing `.env.local` here or run `npm.cmd run setup` and enter the Supabase project URL and publishable key. The setup command preserves unrelated settings and refuses secret/service-role keys. Then run these one at a time:

```powershell
npm.cmd ci
npm.cmd run dev
```

Open the exact Local URL printed by the terminal. Guest invoice review works without credentials; demo approval/downloads require sign-in; connecting a wallet is separate from signing in. A signed-in demo displays its cloud-save status. No real funds move in Demo. New workspaces start empty. DUSD test credits require an explicit once-only grant and are not blockchain funds. See RELEASE-0.6.md for the demo two-account/receipt walkthrough.

## Supabase setup

Use your existing project, not a replacement project. Enable email/password authentication and keep confirmation enabled. Put the URL and publishable/legacy anon key into the two public environment variables shown in `.env.example`. Public settings are validated and read at runtime. They contain no server secrets.

Run the independent migrations in Supabase SQL Editor if not already installed:

1. `supabase/account-profiles.sql` — private profiles.
2. `supabase/supplier-marketplace.sql` — supplier applications and restricted admin membership/review.
3. `supabase/workspace-sync.sql` — private demo documents with revision checks.
4. `supabase/demo-accounts-feedback.sql` — atomic DUSD test-credit accounts/transfers and private feedback.
5. `supabase/final-payments.sql` — final receipts, summaries and supplier/invoice payment guards. Run this LAST.

Do not run the unfinished production `schema.sql` as a substitute for these migrations. Demo documents remain user-editable simulations, not a production financial ledger. RLS and RPC policies restrict account data. No service-role key is needed in the app.

For local testing, set Supabase Site URL to your exact local origin and allow `/auth` and `/auth/reset` redirect URLs on that origin. When hosted, use the actual HTTPS domain. Verify confirmation and reset links in real inboxes. Default Supabase email has recipient restrictions and limits; see `RESEND-SUPABASE.md` before changing SMTP.

## Optional integrations

- AI: set `AI_BASE_URL`, `AI_API_KEY` and `AI_MODEL` for a provider supporting strict JSON schema. Signed-in users can opt into invoice extraction/model payment proposals. Default assistant behavior is explicitly labeled local rule-based parsing. Model calls are authenticated and have no wallet tools.
- Intents: an optional partner token goes in server-only `ONECLICK_API_TOKEN`. The separate 0.7 pilot adds committed quotes and wallet funding behind server configuration; see RELEASE-0.7.md. No funded end-to-end swap is yet verified. Token discovery returned HTTP 403 from the managed environment; verify the deployed connection and disclose errors honestly.
- NEAR wallet: the balance card reads native NEAR. The separate mainnet Pay pilot requires operator setup and exact wallet approval. A separate native testnet lab requires the user's explicit wallet approval and verifies final execution. No keys or seed phrases are stored.

## Production checks

```sh
npm run typecheck
npm test
npm run build
npm start
```

For browser checks, run a server, install Chromium with `npx playwright install chromium`, then run `npm run test:e2e`. Set `E2E_BASE_URL` if using a different origin. Mobile tests emulate a phone in Chromium; actual wallet and email behavior need separate verification.

## Free hackathon hosting with Vercel and Supabase

1. Prepare the public GitHub repository after the founder confirms publication/push. Exclude `.env.local`, its backups, `node_modules`, `.next` and test output. Include the README, license and lockfile.
2. Import the repository at https://vercel.com. Select Next.js; build command `npm run build`.
3. In Vercel Project Settings → Environment Variables, set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Add optional server-only integration keys only if used. Do not expose those through `NEXT_PUBLIC_*`.
4. Deploy after the founder approves the concrete publication. Use the free assigned HTTPS URL; no purchased website domain is required for the supplied competition rules.
5. Set Supabase Site URL to that public URL and allow its exact `/auth` and `/auth/reset` callbacks. Restart/redeploy when configuration changes.
6. Test the public URL with a fresh browser: signup/confirmation/recovery, supplier application, admin restrictions, two-account isolation, cloud save/refresh, PDF processing and demo flow. Check `/api/config` for public readiness; it never returns SMTP/model/partner secrets.
7. Keep the demo available through judging. Free services have quotas; provider credit, public email sending and mainnet gas are separate costs.

Vercel/Supabase free plans are proposed for a hackathon prototype within their current plan terms and limits. Before real customer money, finish the mainnet coordinator, immutable financial audit/ledger, atomic spending reservations, distributed rate limits, data retention/security review and settlement reconciliation.

## Container alternative

The Dockerfile prepares a non-root standalone Next.js runtime. Build with `docker build -t afripay-ai .`, then run with `docker run --rm -p 3000:3000 --env-file .env.local afripay-ai`. Runtime public configuration supports environment variables added after the build. Never bake private keys or API secrets into the image. The container build has not been executed in this session.

No public repository or hosted site was published during this update. Local success is not a deployment URL or a verified blockchain payment.

## Real-payment pilot configuration

Read [RELEASE-0.7.md](RELEASE-0.7.md) before enabling. Install `supabase/live-payments.sql` separately, keep `SUPABASE_SERVICE_ROLE_KEY` server-only, start `LIVE_PAYMENTS_ENABLED=false`, and verify settings before choosing to enable wallet requests. Monitoring remains available when new funding is disabled. The 0.7 pilot has automated coverage but needs actual hosted and funded wallet testing.

### Upgrading to 0.9.4

After the existing mainnet payment-link foundation, run the complete atomic `supabase/mainnet-transfers.sql` migration in SQL Editor, then deploy 0.9.4. Do not rerun older mainnet migrations afterward. No new secret is required. This adds native NEAR and direct BSC invoice/order handling while preserving records. Existing mainnet funding flags and Supabase server credentials still apply. See [release instructions](RELEASE-0.9.4.md) for wallet support, caps and post-deploy checks. Funded mainnet end-to-end acceptance has not been performed by the development assistant.
