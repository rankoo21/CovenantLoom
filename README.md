# Covenant Loom

Consensus Obligation Compiler and Fulfillment Ledger.

Covenant Loom turns natural-language commitments into versioned, reviewable fulfillment checkpoints. Claimants cannot supply or silently replace the rules used to judge them: the owner first anchors a canonical covenant, then every report is compared to that exact stored version.

## Why GenLayer is essential

Real commitments contain semantic requirements that cannot be reduced to keyword checks. The Intelligent Contract uses gl.eq_principle.prompt_comparative to identify which material obligations are met, which are missing, and whether the result is SATISFIED, PARTIAL, or BREACH. Challenges trigger a second bounded round; the owner explicitly finalizes the checkpoint. No external URL or oracle is required.

## Complete repository

- contracts/covenant_loom.py — complete deployed Intelligent Contract source
- app/page.tsx — wallet-connected working surface
- tests/test_contract.py — source, method, and canonical-terms tests
- scripts/deploy.mjs — reproducible Studionet deployment
- scripts/verify.mjs — real covenant, checkpoint, evaluation, and receipt read-back

## Workflow and method map

1. create_covenant anchors authoritative terms; revise_covenant creates a visible new version.
2. open_checkpoint binds a deliverable to that stored covenant.
3. submit_fulfillment evaluates only against the canonical version.
4. challenge_fulfillment permits one counter-evidence round.
5. finalize_checkpoint closes the record; get_checkpoint returns the complete receipt.

## Studionet evidence

- Contract: https://explorer-studio.genlayer.com/address/0xa85E3bdDA9DBFD7446D079f17AE5c6dCe00b8171
- Deployment: https://explorer-studio.genlayer.com/tx/0xa14c7dfedf803cdfb5394d5c7817692c04c477b27bfbfb25186256272bf67d53
- Covenant: https://explorer-studio.genlayer.com/tx/0x90bb57fac46def75d01e1604cf7443be10f2979cbc507f34de932cbcb82bd421
- Checkpoint: https://explorer-studio.genlayer.com/tx/0xee47ad4ee7888aa6710efe0041c6b3e448cc5384bf74ec78fbdd1dcb6c4e02cd
- Verified consensus: https://explorer-studio.genlayer.com/tx/0x1dbc22a3487283f3a2aa31cf96b0ece31f78325b28c15763b3b9111cc5cb07ca
- Result: SATISFIED, 98%, missing NONE

## Verify

npm install; genvm-lint contracts/covenant_loom.py; python -m pytest -q; npm run build.

The private key is never committed.

Live app: https://covenant-loom-genlayer.pages.dev
