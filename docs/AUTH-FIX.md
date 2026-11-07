# Signup and password-reset correction

## Install

1. Stop the current app with Ctrl+C.
2. Extract the full auth-fixed project ZIP and open its `afripay-ai` folder in VS Code.
3. Copy your existing `.env.local` into that folder. Your accounts, suppliers and admin memberships stay in your existing Supabase project; no SQL migration is needed for this update.
4. Run `npm.cmd ci`, then `npm.cmd run dev`.
5. Open http://localhost:3000 and refresh with Ctrl+Shift+R.

## Required Supabase URL settings

In your project open **Authentication → URL Configuration**.

Set **Site URL** to:

```text
http://localhost:3000
```

Add both of these under **Redirect URLs**, and save:

```text
http://localhost:3000/auth
http://localhost:3000/auth/reset
```

Use this same localhost address and port in your browser. If Next started on a different port, stop the old server and use port 3000, or configure that exact actual origin in Supabase instead. On a public deployment replace localhost with the actual HTTPS origin. The app requests the reset callback at the current origin's `/auth/reset` path.

Keep the app running while opening the recovery email. Request a **fresh** link after changing the settings. Old, expired or already-used links may not work. Use the provider's normal recovery email containing the actual confirmation URL; merely opening the app's reset page does not verify a recovery session.

## Existing-email signup

Supabase can deliberately return a vague/fake user result for an existing email instead of exposing whether the email is registered. It does not thereby create a second account or guarantee another confirmation email.

The app now handles an empty-identity/no-session signup response as a registration that did not create a new account. It directs the user to Sign in or Forgot password and does not show the new-user confirmation screen for that response. Explicit provider errors are shown persistently. Other ambiguous responses retain neutral wording; no public account-existence lookup or administrator secret was added.

## Password reset

1. On Sign in choose **Forgot your password?**.
2. Enter the full email belonging to the existing account and request the link.
3. Open the newest email and click its reset link. The correct screen says **Set a new password**, not the dashboard.
4. The form unlocks only after Supabase emits a verified `PASSWORD_RECOVERY` session. The account email is displayed when supplied by the session.
5. Enter the new password twice (at least 12 characters).
6. The app validates the recovery session against the server's current user, updates the password and attempts a new sign-in with that password.
7. A successful update and a successful login check are distinguished. The local session is cleared and the password fields are emptied before the user returns to Sign in.
8. Sign in with the new password. Browser autofill may still offer the old password, so enter the new one explicitly the first time.

Normal sign-in accepts existing shorter passwords rather than imposing the current signup length policy on older credentials. Password reset still requires at least 12 characters.

A password-reset email request is not proof that the email exists or that the password changed. A normal signed-in session is not accepted as a password-recovery grant. Refreshing a consumed reset page can require a new email link; recovery grants are intentionally short-lived and are not stored as a reusable browser flag. Opening a new-account confirmation email does not turn into a password reset.

## Verification and remaining checks

108 automated tests pass, covering duplicate signup responses, recovery routing, expiry, missing recovery grants, wrong-account rejection, matching-password validation, provider update errors, verification of the new credential and clearing the local session. These use mocked auth-provider responses, not your real passwords or email inbox. Browser/email delivery and hosted Supabase settings must still be verified on your PC.

No passwords, access tokens, refresh tokens or private keys are logged or added to download archives. Never share your password or the full reset-email link in chat; share only the visible error message if recovery still fails.

Official references:
- https://supabase.com/docs/reference/javascript/auth-signup
- https://supabase.com/docs/reference/javascript/auth-resetpasswordforemail
- https://supabase.com/docs/reference/javascript/auth-updateuser
- https://supabase.com/docs/guides/auth/redirect-urls
