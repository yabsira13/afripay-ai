# Branded AFRIPAY AI authentication emails

These files are Supabase email templates, not application pages. Updating your app does not install them into Supabase automatically.

## Confirmation email

1. In Supabase choose **Authentication → Emails → Confirm signup** (some dashboard versions put it under Email Templates).
2. Subject: **Confirm your AFRIPAY AI account**.
3. Open `confirm-signup.html` in VS Code. Select all its code with Ctrl+A and copy it with Ctrl+C.
4. Replace the entire email **Body / HTML source** with that code. Save changes.
5. Preview in Supabase. Test a fresh confirmation email with an account you control; repeated signup with an already-confirmed email may send nothing.

## Password-reset email

Choose **Authentication → Emails → Reset password**.

Subject: **Reset your AFRIPAY AI password**.

Replace the Body / HTML source with the complete contents of `reset-password.html` and save. Test with a fresh reset link. Do not reuse an expired or consumed link.

## Keep the verification link intact

The main button and fallback link deliberately use `{{ .ConfirmationURL }}`. This is the Supabase-generated verification link. Never replace it with a direct homepage or `/auth/reset` URL: the verified session would be missing and the app would correctly refuse the reset.

`{{ .SiteURL }}` is only the secondary website link in the footer. Keep Site URL and allowed redirect URLs set to the current app origin. Local development remains localhost; use your actual public HTTPS website after deploying. `{{ .Email }}` displays the intended account email.

## Sender name and email address

A branded template changes the content, not the actual From address. For small tests you can use an existing Gmail sender with Google 2-Step Verification and an App Password, if supported by the account. Configure host `smtp.gmail.com`, port `465`, the same full Gmail address as sender/username, and sender name AFRIPAY AI. Paste the App Password only in Supabase SMTP settings; Gmail limits apply. No domain purchase is needed for that test setup.

To send from a branded domain you own:

1. Choose a supported SMTP email service (for example Resend, Postmark or Brevo).
2. Verify your own sending domain and the provider-required DNS records.
3. Configure custom SMTP in Supabase Authentication email settings.
4. Set sender name to **AFRIPAY AI** and use a sender address on that verified domain.
5. Keep SMTP credentials private in the provider/Supabase settings. Never put them in NEXT_PUBLIC variables or a public repository.

No domain or sender address has been invented or configured by this update. Supabase's default email service remains subject to its own recipient restrictions and rate limits; public signup delivery usually requires custom SMTP.

## Design and verification

White/lavender layout, text-based logo, inline email-compatible CSS, responsive table container and no external tracking images or scripts. The same single-use verification URL is used in the button and fallback. Template structure/variables are validated locally, but actual rendering/delivery in Gmail, Outlook and other inboxes must be checked after you save them in Supabase. No email is sent by generating these files.

Official references:
- https://supabase.com/docs/guides/auth/auth-email-templates
- https://supabase.com/docs/guides/auth/auth-smtp
