# Covenant Loom — v2

Covenant Loom preserves creator-owned, versioned obligations and evaluates supplied delivery text against an immutable checkpoint snapshot. It is not escrow, legal arbitration or independent proof that delivery happened.

## Reviewer path
1. Connect any Studionet wallet, not necessarily the deployer.
2. Create a covenant with a unique ID, title and 1–8 obligations (one per line).
3. Open a checkpoint with its own ID and deliverable. This freezes the covenant version and obligations.
4. Enter the report and supporting text; select the checkpoint and submit.
5. Wait for finalization and read back the actual report, evidence, indexed findings and assessment history.
6. A different wallet can look up the creator address/checkpoint ID and challenge once with counter-evidence before finalization.
7. The creator may finalize an evaluated/challenged checkpoint, or cancel an open one.

Revising a covenant never alters an existing checkpoint. Original reports and first-round assessments remain in challenge history. Submissions, challenges and finalizations cannot be replayed. All IDs are scoped to their creator.

## Consensus
Each validator independently evaluates every canonical obligation in order. Indexed SUPPORTED/MISSING/CONTRADICTED findings must agree. Stored explanations and SATISFIED/PARTIAL/INSUFFICIENT/BREACH are derived deterministically from those findings. Model-authored prose is discarded, so it cannot add unvalidated claims of external verification.

## Limits
Evidence is caller-supplied text, not authenticated external evidence. There is no enforced challenge delay: the creator can finalize before someone challenges. No funds, signatures certifying delivery or binding legal decision are implemented. All submitted text is public. Do not describe SATISFIED as independently proven real-world completion.

## Source and verification

- Complete contract: contracts/covenant_loom.py
- Direct adversarial tests: tests/test_contract.py (mock nondeterministic execution; not a real validator network)
- Deployment script: scripts/deploy.mjs
- Published source hash and address: artifacts/deployment.json
- Real-network lifecycle check: scripts/verify-live.mjs (creates a fresh unrelated test wallet; saves public evidence only)
- Frontend methods and exact argument forwarding: app/page.tsx and lib/ledger.ts

Run npm install, npx tsc --noEmit, npm run build, python -m pytest tests -q, and genvm-lint contracts/covenant_loom.py. Deployment requires GENLAYER_PRIVATE_KEY in the process environment; never commit it. Run node scripts/verify-live.mjs to test the current deployment. Local tests and source matching do not alone prove a complete production audit.

## Hosting

[Public application](https://covenant-loom-genlayer.pages.dev). Cloudflare Pages proxies the built application hosted on Cloudflare Workers. No ChatGPT sign-in is required. The old v1 deployment is superseded, not migrated; its records are not part of this v2 workspace.
