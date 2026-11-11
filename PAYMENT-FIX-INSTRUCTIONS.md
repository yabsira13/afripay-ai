# Small NEAR payment-flow patch for AFRIPAY 0.9.5

Only the payment flow is changed. No app-wide version upgrade, new dependencies or dashboard/supplier changes are included.

1. Copy the included `components`, `lib`, `supabase` and `tests` files into the matching folders of your existing repository. Preserve `.git`, `.env.local` and every other file.
2. In Supabase SQL Editor, run the complete `supabase/separate-payment.sql` file. The existing 0.9.4/0.9.5 mainnet foundation must already be installed. Existing orders, receipts, duplicate invoice keys, wallet authorization guards and spending limits are preserved. Do not rerun older mainnet SQL afterward.
3. GitHub Desktop Summary: `Allow confirmed separate NEAR payments`. Commit, Push origin, and wait for Vercel Ready.

## Paying again intentionally

Open your previous saved payment in Pay. A verified successful payment now displays a warning and a checkbox:

`I checked the previous payment. This is a separate new payment, not a retry.`

Check it and click **Prepare a separate new payment**. AFRIPAY prepares the same destination with a new visible reference, clears recipient confirmation and requires normal review and wallet approval again. The original payment and its receipt stay unchanged. The paid invoice link stays paid; the separate payment is not attached to that old link.

If an old invoice reference is reused, AFRIPAY opens the existing account-owned order for review instead of showing the raw database constraint. Pending, authorizing or uncertain transfers must be recovered, not duplicated. A new explicit payment still counts against all single/daily NEAR limits. Direct BSC behavior is unchanged.

Verification: 395 automated tests passed, including new PostgreSQL cases for repeat confirmation, paid versus uncertain orders, ownership, distinct references and unchanged daily caps. Production build and all 18 focused desktop/mobile payment checks passed. No funds were sent by the assistant.
