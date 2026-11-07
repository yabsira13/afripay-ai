# NEAR Hackathon 2026 submission kit

## Project description (draft)

AFRIPAY AI helps African businesses turn supplier invoices into payment proposals while catching changes that can lead to invoice fraud. An Ethiopian exporter can extract a 200 USDC invoice, compare the recipient with saved supplier details, review an explainable risk report and approve a clearly labeled simulation. A second scenario shows how a changed supplier wallet and instructions to bypass verification trigger a critical-risk block.

The NEAR integration uses official 1Click endpoints for live supported-token discovery, dry swap quotes and execution-status lookup, plus official NEAR Connect for wallet connection. The app does not move real funds. Real funded execution and database-backed business persistence remain future work; no simulated confirmation is presented as an on-chain settlement.

## Tracks

- Primary: `realworld` — Real-World Money.
- Additional: `security` — AI Security & Defense.

These are valid IDs in the official rules downloaded on 2026-11-04. Re-read the current rules before final submission.

## Architecture diagram

See `ARCHITECTURE.md` for Mermaid diagram, trust boundaries and research sources.

## 2–3 minute recording script

1. **0:00–0:15:** Show dashboard. “AFRIPAY AI helps an Ethiopian exporter review supplier invoices and make safer cross-border payment decisions. This is the labeled demo workspace.”
2. **0:15–0:50:** Invoice upload → clean sample → Extract fields. Point out 200 USDC and full wallet. Use a new invoice number such as `INV-DEMO-VIDEO-200` to avoid the intentionally seeded duplicate. Verify recipient and save.
3. **0:50–1:15:** Show evidence report → Prepare payment → Security check. Explain supplier matching and spending limits.
4. **1:15–1:40:** If available, show a genuine 1Click dry quote with supported assets, fees/output and raw response. If API is unavailable, show the error and explain the limitation honestly. Return to the illustrative demo route.
5. **1:40–2:05:** Review and approve demo payment. Explicitly advance simulated settlement. Download the receipt and show “SIMULATED — NOT PROOF OF A BLOCKCHAIN PAYMENT.”
6. **2:05–2:35:** Upload suspicious sample. Show changed wallet and bypass-verification evidence. Show critical-risk block and disabled payment button.
7. **2:35–2:50:** Explain “AI prepares, humans approve. Live execution stays disabled until the production coordinator is ready.”

For a local-only project, official rules require a video rather than screenshots alone. A video file was not generated in this session.

## Screenshot list (to capture in a supported browser)

- Desktop overview with lavender balance card and Security Shield.
- Invoice extraction with 200 USDC and unverified wallet.
- Critical-risk changed-wallet report.
- Human approval screen.
- Simulated settlement and receipt.
- Mobile dashboard and invoice upload.

No screenshots are claimed without browser capture.

## Founder’s X announcement draft

> Supplier invoice fraud can start with one changed wallet address.
>
> I built AFRIPAY AI at NEAR HACKATHON: invoice extraction, explainable transaction risk and human-approved payment proposals for African businesses. It integrates NEAR Intents for live dry quotes; funded payments are disabled in this prototype.
>
> [Attach the recorded demo, then add your actual public demo/repository links.]
>
> @NEARProtocol #NEARHackathon

The founder publishes this post. No social post is sent automatically.

## Before submission

- [ ] Confirm production build, unit/integration tests and browser journeys.
- [ ] Verify SQL RLS policies in an isolated Supabase project before enabling persistence.
- [ ] Publish a public repository and deployed demo (or reproducible local instructions with video).
- [ ] Keep the repository public through judging; deadline: **2026-11-14 23:59 UTC**.
- [ ] Record and attach the demo video.
- [ ] Founder publishes the X post and supplies its actual URL.
- [ ] Founder supplies lead name, contact email, team size `1`, mainnet NEAR prize account and final URLs. Do not invent these.
- [ ] Read the official consent text verbatim: “I agree that the organizers may use these details to review our submission and contact us about this hackathon.”
- [ ] Generate one request ID, show the complete exact final payload and receive founder confirmation before sending it.
- [ ] Send one submission only; use the same request ID if a retry is required. Never submit twice.

No submission has been sent. Public repository, hosting, screenshots and video remain outstanding.
