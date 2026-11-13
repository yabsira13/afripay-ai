# NEAR Hackathon 2026 — AFRIPAY submission guide

Current guide for AFRIPAY 0.9.5 and its focused patches. This replaces the earlier simulation-only description. [Official rules](https://nearhackathon.com/HACKATHON.md) remain authoritative; recheck them before submission.

## What exists today

AFRIPAY is an invoice and payments workspace for African businesses. Users extract supplier invoice fields, inspect explainable security checks, deliver invoices to registered businesses, approve a native NEAR payment in their own wallet and inspect verified settlement, activity and PDF receipts.

Native NEAR mainnet and testnet transfers have independently checked public chain evidence. That evidence proves the transfers, not their private invoice linkage. A final recording must show the invoice and its exact bound payment together. Direct BSC and NEAR-funded Intents have implementations and fixture tests; funded acceptance remains pending. DUSD is simulated account-to-account credit with no cash value.

Mainnet payments are enabled on the live app; fresh local installs default to `LIVE_PAYMENTS_ENABLED=false` until configured. Every payment still requires wallet approval and settlement verification.

## Tracks

- Primary: `realworld` — Real-World Money.
- Additional: `security` — AI Security & Defense, based on explainable invoice checks, spending constraints and human-controlled payment authorization.

No autonomous-business execution, sponsored gas, complete external wallet history or production security certification is claimed. The organizers' example prompts are suggestions, not mandatory feature lists.

## Judge walkthrough

Follow [JUDGE-WALKTHROUGH.md](JUDGE-WALKTHROUGH.md): start with a no-funds guest review, then the native testnet path. The mainnet recording separately demonstrates a small founder-approved real transfer. Supplier approval is required for issuing internal mainnet invoices; it is not bypassed for judges. Existing published links are bearer links, so do not publish a private invoice merely to make it easier to inspect.

## Demonstration and X post

Use [DEMO-VIDEO.md](DEMO-VIDEO.md) for the spoken script, recording order, preparation and X draft. The founder records and publishes the post. It must mention NEAR HACKATHON, tag @NEARProtocol and include #NEARHackathon, with video or screenshots attached. A video is preferable for this multi-step workflow; it is necessary when judges cannot open a local-only demo.

No public X post or saved application has been confirmed in the current conversation. Check actual submission status before submitting; this sentence is not an organizer-side lookup.

## Development and reuse disclosure

The founder confirms that AFRIPAY was built from scratch after **19 October 2026**, within the hackathon development window, with AI assistance and third-party libraries. No code from an earlier personal project was reused.

Work built during this window includes native mainnet payments, the business inbox, the supplier dashboard, settlement checks, notifications and PDF receipts. The public repository was created on **7 November 2026**; its [first public commit](https://github.com/yabsira13/afripay-ai/commit/0f71026524847f189c6715bda1c3963722062089) is dated the same day.

Third-party dependencies include Next.js, React, TypeScript, Supabase, NEAR Connect, the official NEAR Intents 1Click SDK, PDF.js, Tesseract.js, pdf-lib and fontkit. Dependencies are recorded in package.json/package-lock.json. The repository carries an MIT license; third-party code and assets retain their own licenses.

Tagging the actual reviewed submission commit makes the final scope easier to reproduce.

## Final checks

- [ ] On phone and PC, compare My account → Current email and Account ID. Different IDs mean different private inboxes. Sign into the intended existing account; do not merge records based on a wallet address.
- [ ] Demonstrate one invoice delivered to the intended business, the payment review, wallet approval, verified Paid state for both parties, transaction activity and a PDF receipt.
- [ ] Demonstrate one suspicious invoice and the evidence behind its warning/block. Clearly label deterministic checks versus an optional model.
- [ ] Verify actual email confirmation/recovery and any configured model if they appear in the recording.
- [ ] Confirm a clean install using README and SETUP.md; run the checks listed there. Do not turn mocked tests into claims of live wallet acceptance.
- [ ] Freeze the submission commit after final fixes; the founder-confirmed development and reuse disclosure is recorded above.
- [ ] Keep the public repository available through judging; keep the hosted demonstration online through at least 18 November, preferably 25 November.
- [ ] Publish the founder's X post and retain its real public URL.
- [ ] Confirm project/lead names, contact email, actual team size, chosen tracks, mainnet prize account, repository URL, X URL and final description.
- [ ] Obtain consent to the organizer's contact notice, exactly as written in the official rules, before submitting.
- [ ] Review the exact application once. Submit only if the project has not already been submitted; retain its request ID and successful response. Saved corrections go through the organizer's request-changes page.

Deadline: **14 November 2026 at 23:59 UTC**, which is **15 November at 02:59 in Addis Ababa**. Aim to submit earlier on 14 November.

This guide is preparation, not a submission, published social post, security audit or funded-wallet test.
