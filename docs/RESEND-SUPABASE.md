# Resend email setup for AFRIPAY

Checked against official Resend documentation on November 6, 2026:

- https://resend.com/docs/send-with-supabase-smtp
- https://resend.com/docs/knowledge-base/403-error-resend-dev-domain
- https://resend.com/pricing

## What Resend changes

Supabase still creates accounts, confirmation links and password-reset links. Resend delivers those messages through Supabase's custom SMTP settings. We do not need a second registration system or a browser-side Resend key.

Resend has a free plan, subject to its current quotas. Its SMTP instructions require a verified sending domain. The default `onboarding@resend.dev` sender can only send testing messages to the email address associated with your Resend account. It cannot deliver public signup confirmations to everyone. A free `vercel.app` website address does not give you DNS control of the sending domain.

If you do not have a domain you control, do not enable an incomplete SMTP configuration. Keep the current Supabase test mail service while testing with permitted recipients, or arrange another supported sender. The supplied hackathon rules do not require a purchased domain or branded emails.

## When you have a verified domain

1. Create a Resend account and add your domain under Domains.
2. Add the DNS records shown by Resend at the place managing your domain. Wait for verification. Do not remove existing mail records without checking their purpose.
3. Create a Resend sending API key. Keep it private.
4. Open your Supabase project → Authentication → Email/Emails → SMTP Settings. Labels may vary slightly.
5. Configure:

| Setting | Value |
| --- | --- |
| Sender name | AFRIPAY AI |
| Sender email | An address on your verified domain, such as `noreply@YOUR-VERIFIED-DOMAIN` |
| Host | `smtp.resend.com` |
| Port | `465` |
| Username | `resend` |
| Password | Your Resend API key |

The example domain above is a placeholder, not an address to paste unchanged. A Gmail address cannot be verified as a domain you control in Resend. Do not use your Gmail account password as the SMTP password.

6. Save SMTP settings. Keep email confirmation enabled.
7. In Supabase email templates, use the existing AFRIPAY HTML files in `supabase/email-templates/`. Keep `{{ .ConfirmationURL }}` exactly as provided; do not replace it with a normal website link.
8. In Supabase URL Configuration, use your actual application URL and allow its `/auth` and `/auth/reset` callbacks. For local testing include `http://localhost:3000/auth` and `http://localhost:3000/auth/reset`; if using another port, use that exact port.
9. Test one NEW address: signup → email confirmation → sign-in → password reset → sign-in with new password. Check both Resend delivery logs and Supabase Auth logs if delivery fails. Never assume a requested email was delivered.

Do not put the SMTP password into `NEXT_PUBLIC_*`, GitHub, screenshots or chat. The app only needs its existing public Supabase settings; the Resend SMTP credential belongs in Supabase's private SMTP settings.

No Resend account, domain, SMTP setting or real email was changed/sent by this release.
