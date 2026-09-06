# CovenantLoom v3 verification

- Steward concern: unauthenticated text. Fixed by accepting evidence only from the designated counterparty wallet, fetching its clean HTTPS URL inside nondeterministic execution, and storing the SHA-256 digest of assessed bytes.
- Steward concern: immediate owner finalization. Fixed by a deterministic transaction-time deadline of 1 hour to 7 days. Finalization is permissionless only after the window, or after rebuttal.
- Steward concern: outsider consumes challenge slot. Fixed by authorizing only the covenant owner to challenge.
- Steward concern: missing rebuttal. Fixed by a counterparty-only fetched rebuttal transition with its own URL and digest.
- Direct tests: 9 passed. GenVM lint: 3 checks passed. Production build passed.
- Studionet source match: `deployment.json`.
- Live proof: three separate wallets finalized six writes through submission, challenge, rebuttal, and finalization in `live-verification.json`.
- Public hosting and asset checks: `hosting-verification.json`.
