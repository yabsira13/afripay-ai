# AFRIPAY AI 0.2.0 — founder setup and test guide

## What changed

- Guests see **Demo user / Sample business**, never a borrowed person's name or account initials.
- Signup asks for full name and Customer/Supplier preference. It never offers an Admin role.
- After sign-in, incomplete accounts complete business name/country onboarding. Profiles are stored in private, owner-only Supabase rows.
- Header/sidebar names and initials come from the signed-in user's own profile. Another user's cached profile is never used.
- Wallet setup can be skipped. Mainnet wallet connection remains read-only. Wallet ownership is not automatically certified or linked to an email identity.
- A third mode, **NEAR testnet**, implements a native test-NEAR transfer lab with explicit review, wallet approval and final on-chain verification. It is not a NEAR Intents testnet or a mainnet payment system.
- A startup check names the exact `.env.local` location when account settings are missing from the running project.

## Install without losing your settings

1. Stop the old app with Ctrl+C.
2. Extract the complete 0.2 ZIP, then open its `afripay-ai` folder containing `package.json` in VS Code.
3. Copy your existing `.env.local` from the old project into that folder. It is intentionally never included in downloads.
4. Run:

```powershell
npm.cmd ci
npm.cmd run check:setup
npm.cmd run dev
```

The terminal should say `afripay-ai@0.2.0`. Open the same http://localhost:3000 address and refresh with Ctrl+Shift+R. Demo records remain scoped to the browser account and are not deleted by installing the code.

## One new Supabase setup step

1. Open `supabase/account-profiles.sql` in VS Code, select all and copy.
2. In your existing Supabase project open **SQL Editor → New query**, paste it and click Run.
3. This adds private account profiles and seeds existing users from their own signup metadata. It does not change passwords, user UIDs, supplier approvals or the founder's admin membership.
4. Existing users without a name/business/country will be asked to complete those fields after sign-in.

Keep your existing supplier migration. On a completely new project, also install `supabase/supplier-marketplace.sql` using its instructions. Do not put a service-role key into the frontend.

## Check the profile flow

- Guest: open Settings. It should say Sample business / Demo user and offer account creation, rather than showing editable fake personal details.
- New account: enter full name, email, password and Customer/Supplier preference. Confirm the email and sign in.
- Complete the private profile. Save, sign out, sign in and verify the name/business persist.
- Test with a second confirmed account in another browser profile. It must not see the first user's private profile.
- A Supplier preference does not grant directory approval. Submit a supplier application and use the separately authorized founder account to review it.

Gender is not collected because it is not needed for this payment workflow. No wallet or seed phrase is created during account signup.

## Wallet choices

- **Demo:** no wallet needed. Invoices and receipts remain simulations; demo data is browser-local.
- **Live wallet:** native mainnet NEAR balance lookup only. Mainnet funding and Intents execution are disabled.
- **NEAR testnet:** separate named `.testnet` wallets and valueless native test NEAR only. Other assets, implicit wallet IDs, mainnet accounts and Intents swaps are not supported by this lab.

Use the official setup guide at https://docs.near.org/getting-started/create-account to create/fund a testnet account in a supported wallet. The app does not generate keys, seed phrases or accounts on your behalf. NEAR Connect filters for wallets declaring testnet support and always receives the explicit `testnet` network parameter.

## Two-wallet testnet journey

1. Use two email accounts you control in separate browser profiles. Complete their profiles and confirm each email.
2. Create/select two different named testnet wallets, such as accounts ending in `.testnet`, and obtain test NEAR through the wallet/official faucet setup. These are not created by registering an email account.
3. In each AFRIPAY window choose **NEAR testnet**, then **Connect testnet wallet**. Check the account ID and balance.
4. In the receiver's window copy its testnet address. In the sender's window enter it and a small amount such as `0.01` test NEAR (maximum 1).
5. Choose Review transfer. The app checks the recipient exists on testnet and shows sender, receiver and exact amount.
6. Tick the confirmation, choose Authorize in testnet wallet, and inspect the wallet prompt. Approve only if it says Testnet and matches the review.
7. A wallet hash alone is **submitted**, not confirmed. The app queries a fixed testnet RPC and requires final successful execution, the same sender/recipient/amount, a single native Transfer action and a successful recipient receipt.
8. If verification times out, retain the hash and choose Verify on testnet. Never treat an unavailable lookup as a successful transfer.
9. After confirmed, the recipient refreshes their testnet balance. No demo invoice is marked paid, and no mainnet financial receipt is issued.

The app prevents rapid repeated signing attempts and matching recent submissions. History is local to that signed-in browser account; a stored "confirmed" label is deliberately discarded on reload until RPC verification is repeated. This is not an immutable financial ledger or durable mainnet spending-control system.

## Email setup remains your account task

Signup/password recovery rely on your Supabase project's actual email configuration. Supabase's default sender has recipient restrictions/rate limits. Gmail SMTP can be used for small tests if Google allows App Passwords on your account. Keep Gmail/App Passwords only in Supabase's SMTP settings, not `.env.local`, source code or chat. Branded templates are provided in `supabase/email-templates`; Supabase may require custom SMTP before allowing template edits. No email account was created or configured by this release.

## Verified here and still to verify

- 142 automated tests pass, including actual embedded-PostgreSQL profile/supplier access-control tests and mocked testnet signing/status boundaries.
- Typecheck and production build pass.
- A real read-only query to the documented testnet RPC returned account data, exact integer balance format and final-block metadata. No wallet transaction was signed or sent here.
- Wallet popup behavior, a real authorized testnet transfer, mobile layout, and your hosted Supabase profile migration must still be checked on your PC.

## What remains before a production payment service

1. Mainnet Intents committed quotes, immutable approval binding, signed quote verification, wallet funding, durable idempotency, verified asset valuations/spending reservations and settlement/refund reconciliation.
2. Production invoice/document/payment persistence; these demo records still remain in the browser. Profiles and supplier applications use Supabase.
3. Threat/history provider configuration and independent wallet-ownership verification; current data gaps are disclosed.
4. Public GitHub/deployment credentials and publication, full browser/mobile testing, actual screenshots/video and the founder-approved hackathon submission.

Do not present the native testnet lab as a completed mainnet cross-border payment product. NEAR Intents has no testnet.
