# AFRIPAY 0.4 — account repair and private admin console

## What your screenshots showed

The dashboard banner said **Guest demo · saved in this browser only**. The wallet was connected, but the AFRIPAY account was signed out. Connecting a wallet is separate from email/password sign-in. The registration screen reported missing account configuration. A read-only check of the founder-provided Supabase URL/publishable key returned HTTP 200 with email signup enabled; this did not send email or change the database.

## Install on Windows

1. Keep the old project as a backup. Stop its terminal server with Ctrl + C.
2. Extract the full 0.4 ZIP into a NEW folder. Open its `afripay-ai` folder in VS Code (the folder containing `package.json`).
3. If your old `.env.local` exists, copy it here. If it is missing or unclear, run:

```powershell
npm.cmd run setup
```

4. Paste your Supabase HTTPS project URL when asked. Then paste your publishable key (`sb_publishable_…`). The setup command creates/repairs `.env.local` in this folder, preserves other settings and backs up an existing file. It rejects secret/service-role keys. Do not commit `.env.local` or its backups.
5. Run these one at a time:

```powershell
npm.cmd ci
npm.cmd run dev
```

6. Open the exact Local URL printed by the terminal. If another server already occupies port 3000, stop it; do not accidentally keep using an old app on a different port. Refresh with Ctrl + Shift + R.
7. Click **Sign in**, enter your existing email/password and sign in. Choose **Demo**. Wait for **Simulation saved privately in Supabase**. Guest mode now includes **Sign in to save online** to explain the next step.

No new database migration is required specifically for 0.4. Keep the earlier `account-profiles.sql`, `supplier-marketplace.sql` and `workspace-sync.sql` migrations installed. If cloud storage reports missing setup, run the relevant migration in your EXISTING Supabase project, not a new project.

## Included changes

- Runtime account bootstrap reads valid public settings from the server rather than relying only on a previously built browser bundle. Missing/malformed settings show an actionable local repair panel. Secret/service-role keys are never returned by the public config endpoint.
- Normal users and guests no longer have an Admin review menu. Appointed administrators see **Admin console**. It opens a separate layout. Direct navigation by a non-admin shows an access-denied screen without loading supplier applications. The database still enforces review privileges independently.
- Guests are explicitly told that wallet connection does not sign them into an AFRIPAY account. The storage banner offers a sign-in action.
- Existing invoice/security/payment demo, profiles, supplier registration, private cloud backup, guarded model proposals and testnet lab are preserved.
- A Resend/Supabase guide explains free-plan limits, verified domains, private SMTP credentials, branded templates and callback settings. SMTP is not enabled automatically.
- Browser regression coverage now includes real Supabase SDK operations against a mock service for sign-in, invalid credentials, signup confirmation, password-reset request, cloud save/refresh, account switching and admin gating.

## Yesterday's remaining work

| Area | Current position |
| --- | --- |
| Admin visibility and separate console | Implemented; both UI and database restrictions tested |
| Account configuration repair | Implemented; target PC needs this installation/restart |
| Email confirmation and recovery | Implemented; mock-provider browser coverage; actual inbox delivery still requires testing |
| Two-account private cloud storage | Implemented; embedded PostgreSQL policies and browser mock journeys tested; hosted two-device check remains |
| Actual AI model | Adapter and guardrails implemented; needs the founder's provider key/credit and live verification |
| Two-wallet native testnet transfer | Lab implemented; a real authorized transfer still needs the founder's wallets |
| Mainnet cross-chain invoice payment | Still unfinished: committed quotes, durable funding/approval coordination and verified settlement |
| Free hosting and GitHub | Deployment instructions included; no site deployed or repo published by this update |
| X video and submission | Follow after actual end-to-end verification; founder publishes and confirms final submission |

Intents token discovery was rechecked and returned HTTP 403 from this environment. We did not replace it with fabricated quotes or execution results. Mainnet payments remain disabled. No real funds moved, external messages were sent, or cloud account settings changed during this release.
