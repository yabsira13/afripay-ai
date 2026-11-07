# Evidence needed for a stronger hackathon entry

The 6/10 assessment was subjective readiness feedback, not an organizer score or a winning probability. Improvements should be assessed through working journeys, not a promised score.

| Priority | Concrete result | Status in 0.3 |
| --- | --- | --- |
| Reliable account data | Account A's demo invoices survive refresh and appear on its other device; B cannot read/write them | Implemented with RLS, serialized saves and optimistic revision checks; PostgreSQL tested, founder's hosted project not yet verified |
| Genuine AI assistance | A configured model produces validated payment proposals without wallet permissions | Implemented with verified-session requirement and grounded structured outputs; provider mocked in tests, live credentials not configured |
| Explainable protection | Changed wallet, duplicate payment, prompt injection and expired approval cannot silently pass | Deterministic evidence and regression tests; browser demonstrations cover changed wallet and explicit recipient verification |
| Confirmed NEAR execution | Two wallets show a real authorized transfer and matching final settlement proof | Native testnet lab implemented; actual user-authorized transaction still needed |
| Cross-border invoice settlement | Reviewed USDC invoice → genuine quote → committed quote → wallet funding → verified success/refund → correct invoice state | Dry quotes only. Mainnet coordinator and immutable financial persistence remain unfinished |
| Reproducibility | Fresh installation, browser tests, clear limitations, public repository and real video | Local production build/tests available; public repository, hosting and founder's video/post remain |

Do not add more dashboard pages before closing the main integration gaps. A native testnet transfer is useful NEAR evidence, but does not prove a cross-chain stablecoin invoice has been paid. Never relabel a simulated invoice as paid because of an unrelated testnet transfer.

## Best demonstration

1. Explain the Ethiopian business's supplier invoice in one sentence.
2. Upload the clean 200 USDC sample, inspect the extracted address and explicitly verify it.
3. Upload the changed-wallet invoice and show the discrepancy and blocking evidence.
4. Show the genuine dry-quote source, output and unavailable/error states honestly.
5. Demonstrate whichever actual wallet flow has been tested, identifying its network and asset.
6. Show a verifiable final hash for actual execution, and clearly labeled PDF receipts for simulations.

## Founder verification

- Apply `workspace-sync.sql`, test two accounts and two tabs/devices.
- Verify signup confirmation and password reset through real email. Configure SMTP for public recipients when needed.
- Configure and test an AI provider, including malformed output and provider downtime.
- Follow `RELEASE-0.2.md` for two native testnet wallets. Signing happens only in your wallet.
- Prepare the public GitHub repository and recording. Review current official rules before submitting.

Per the supplied rules, testnet-only projects are eligible; NEAR Intents itself has no testnet. Repository publication/push, mainnet transactions and the exact final submission need the human's explicit confirmation. Deadline: 2026-11-14 23:59 UTC. Primary proposed track: `realworld`; secondary: `security`, supported by the actual demonstrated protections.
