# Patch A — payment completion, status refresh and notifications

For your existing AFRIPAY 0.9.5 plus the separate-payment fix. No version upgrade.

1. Copy the included folders into the matching repository folders, preserving `.git` and `.env.local`.
2. Copy Patch B afterward to add the invoice inbox and supplier dashboard. You may commit/push both patches together.
3. Run the entire `supabase/business-inbox.sql` in Supabase SQL Editor. Existing network-suppliers and mainnet/separate-payment foundations are required. Do not rerun older SQL afterward.
4. Commit and Push origin, then wait for Vercel Ready.

Paid payments show a clean completion screen. Make a new payment shows the warning only when requested; its checkbox immediately opens the next page. Linked invoice statuses refresh from verified settlement. The bell shows private payment and invoice notifications.

The SQL also installs the private invoice-delivery foundation used by Patch B. It preserves existing financial records, wallet approvals and spending limits. It never sends funds or approves suppliers.

See `docs/patches/PAYMENTS-AND-INVOICE-INBOX.md` for the full walkthrough and evidence.
