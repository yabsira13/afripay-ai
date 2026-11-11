# Patch B — mainnet invoice inbox, upload review and supplier dashboard

Apply after Patch A. Copy the included folders into the matching folders of your existing repository. Its workspace navigation replaces Patch A's navigation to add the invoice screens. No package installation or new secret is needed.

Run `supabase/business-inbox.sql` from Patch A once, then commit/push both patches. Suggested Summary:

Add invoice inbox, supplier dashboard and payment notifications

Live wallet → Invoices now has Received, Issued, Create and Optional links. Issuing requires an approved mainnet business registration. Select another approved business and Send invoice to business inbox. The recipient reviews and pays it inside AFRIPAY, without anyone needing to send a link.

Supplier dashboard shows recent issued/received invoices and verified paid states. Invoice PDFs are available. Upload supplier bill reads PDF/image/TXT and requires security review and manual confirmation before preparing a payment. Selecting a different token does not convert its amount.

This is a mainnet invoicing patch. Existing demo/testnet payment flows and registrations remain available. No payment is signed by installing, reading or sending an invoice.

See `docs/patches/PAYMENTS-AND-INVOICE-INBOX.md` for installation order, checks and evidence limits.
