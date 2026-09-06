# Covenant Loom v3

Covenant Loom is a counterparty-bound evidence and dispute primitive for GenLayer. It does not accept an owner-authored delivery assertion as proof.

## Lifecycle

1. The owner creates versioned obligations and names a separate counterparty wallet.
2. Opening a checkpoint freezes the obligation version and a 1-hour to 7-day challenge duration.
3. Only that counterparty can submit a clean public HTTPS evidence URL.
4. Validators independently fetch the source, hash its exact bytes, and evaluate every indexed obligation. Only exact structured findings and the SHA-256 digest are stored.
5. The owner cannot finalize during the challenge window. Only the owner can challenge, so an outsider cannot consume the dispute slot.
6. Only the designated counterparty can answer with a fetched rebuttal source.
7. Finalization is permissionless after an unchallenged deadline, or after rebuttal. History preserves actors, URLs, digests, and findings.

Source outages, malformed model output, different fetched bytes, or validator disagreement fail without changing checkpoint state. Text at public evidence URLs remains untrusted and can change later; the stored digest identifies the bytes actually assessed. This is not escrow, legal arbitration, or proof beyond the fetched source.

## Verification

- Contract: `contracts/covenant_loom.py`
- Tests: 9 direct lifecycle and adversarial checks
- GenVM lint: 3 checks passed
- Live test: three wallets completed create, open, fetched submission, challenge, fetched rebuttal, and permissionless finalization
- Deployment evidence: `artifacts/deployment.json` and `artifacts/live-verification.json`
- App: https://covenant-loom-genlayer.pages.dev/

Run `python -m pytest tests -q`, `genvm-lint contracts/covenant_loom.py`, `npm run build`, and `node scripts/verify-live.mjs`.
