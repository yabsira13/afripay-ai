# Update to AFRIPAY AI 0.3.0

Keep your current project folder as a backup. Extract the new complete ZIP into a new folder. Copy your existing `.env.local` into the new `afripay-ai` folder, beside `package.json`. Never upload that file to GitHub.

## One Supabase step

1. In VS Code, open `supabase/workspace-sync.sql` in the new project.
2. Select all its text and copy it.
3. Open your existing Supabase project → SQL Editor (the `>_` icon).
4. Paste the SQL into a new query and click **Run**.
5. Expect **Success. No rows returned**. You do not need to delete anything or create a new Supabase project.

The earlier `account-profiles.sql` and `supplier-marketplace.sql` migrations stay in place. This migration adds a separate private simulation document for each account. It does not grant anyone administrator access.

## Start on Windows

Open the new project folder in VS Code. In its terminal run these commands, one at a time:

```powershell
npm.cmd ci
npm.cmd run dev
```

Open http://localhost:3000. Sign in. In Demo mode, the storage banner should say **Simulation saved privately in Supabase**. Upload an invoice, wait for the saved banner, refresh and check the invoice remains. Then sign in on another browser with the same account and check it appears there. A different account must not see it. Guest demo records stay local to that browser.

If you see an error banner, your edits are not confirmed in the cloud. **Download unsaved copy** before reloading. A conflict means another tab/device saved first; reload the saved copy and redo your unsaved changes. There is deliberately no button to overwrite another device's newer revision. Keep the page open until **saved** appears; closing while a save is pending may leave that change local.

## Optional real AI

The default assistant says **local rule-based parser** and needs no model account. The model option requires sign-in, your own provider credentials and available provider credit. An OpenAI-compatible provider uses these existing `.env.local` entries:

```dotenv
AI_BASE_URL=https://api.openai.com/v1
AI_API_KEY=YOUR_PROVIDER_KEY
AI_MODEL=gpt-4.1-mini
```

Use the endpoint/model supplied by your provider; do not assume all providers support JSON schemas. Restart the server after changing settings. In **AI assistant**, enable **Use configured AI model**. A successful response is labeled **configured AI model**. Messages are sent to your provider only when this option is enabled. AI invoice extraction now requires sign-in too. Never paste private keys or seed phrases into either tool. No model has transaction signing tools, and missing payment details remain missing.

## What this does not finish

Cloud documents are editable demo records, not real balances, immutable audit logs or confirmed stablecoin transfers. Mainnet Intents still stops at dry quotes. Native testnet transfers remain a separate wallet-authorized lab. Actual AI inference, inbox authentication, cross-device cloud synchronization and funded wallet transfers need verification with your accounts. See `ROAD-TO-8.md` for the remaining competition priorities.
