# 0.9.1 — invoice suppliers visible in the supplier list

Copy this update into the existing repository root, preserving `.git` and `.env.local`. Commit `Show invoice supplier contacts in supplier lists` and Push origin. Leave the accidental nested `afripay-ai` entry unchecked. Wait for Vercel Ready; `/api/config` should report `0.9.1`.

No new SQL or environment variable is required for this patch. Keep the 0.9 database setup already installed.

## Changed behavior

- **Suppliers** includes invoice contacts even if they were never manually added. They show **From invoice · unverified**.
- **Pay → Approved supplier** also lists invoice/saved contacts in a separate **not approved** group. Linking an invoice selects its exact name, network and destination when available.
- Unapproved contacts show their full destination, explain the missing payment setup and offer **Preview this invoice workflow**. This opens the selected invoice's simulated workflow with the correct recipient.
- Actual DUSD credit payments still require supplier registration, administrator approval and an active Receive account. Sample names are not silently registered, approved or given receiving accounts.
- Matching contacts are deduplicated by name, chain and address. Different destinations remain separate, unverified entries. Displaying contacts does not change saved trust records or weaken Security Shield checks.

## Try it

Open Suppliers to see the contacts from your invoices. Then open Pay, choose a linked invoice and check its supplier selection. For Shenzhen Nova Trading or Kigali Creative Studio samples, use the invoice preview. For a registered supplier's DUSD payment, have that supplier open Receive after administrator approval.

Verification: three contact-matching tests plus the existing supplier-payment database regression pass (20 tests). TypeScript/production build passed. Eight desktop/mobile browser checks passed, covering contact selection, correct invoice preview, approved supplier payment and changed-wallet blocking.
