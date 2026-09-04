import json
import pytest
from harness import load_contract, agree, UserError
TERMS = "Include a detailed threat model in the report.\nList every critical finding and its mitigation."
REPORT = "The supplied report has a threat model identifying input injection and data leakage."
EVIDENCE = "Section 1 describes the threat model; section 2 maps critical findings to mitigations."
GOOD = {"checks": ["SUPPORTED", "SUPPORTED"], "reason": "Both indexed obligations are explicitly addressed by the supplied text."}

@pytest.fixture
def env():
    return load_contract("covenant_loom.py", "CovenantLoom")

def opened(env):
    c = env[1]
    c.create_covenant("COV-001", "Safety review", TERMS)
    c.open_checkpoint("CP-001", "COV-001", "Review the supplied safety report text.")
    return c

def evaluated(env):
    c = opened(env)
    agree(env[3], GOOD)
    c.submit_fulfillment("CP-001", REPORT, EVIDENCE)
    return c

def test_non_deployer_full_path(env):
    env[2].message.sender_address = "0xvisitor"
    c = evaluated(env)
    c.finalize_checkpoint("CP-001")
    r = json.loads(c.get_checkpoint("0xvisitor", "CP-001"))
    assert r["status"] == "FINAL" and r["report"] == REPORT and r["evidence"] == EVIDENCE
    assert len(r["history"]) == 1

def test_snapshot_survives_revision(env):
    c = opened(env)
    c.revise_covenant("COV-001", "A completely new obligation requiring independent signed approval.")
    agree(env[3], GOOD)
    c.submit_fulfillment("CP-001", REPORT, EVIDENCE)
    r = json.loads(c.get_checkpoint("0xowner", "CP-001"))
    assert r["covenant_version"] == 1 and r["obligations"] == TERMS.splitlines()
    assert "completely new" not in env[4][0]

def test_unrelated_wallet_cannot_mutate(env):
    c = opened(env)
    env[2].message.sender_address = "0xother"
    with pytest.raises(UserError): c.revise_covenant("COV-001", TERMS)
    with pytest.raises(UserError): c.submit_fulfillment("CP-001", REPORT, EVIDENCE)
    with pytest.raises(UserError): c.cancel_checkpoint("CP-001")
    c.create_covenant("COV-001", "Other safety", TERMS)
    assert json.loads(c.get_covenant("0xowner", "COV-001"))["title"] == "Safety review"

def test_ids_duplicate_and_normalized(env):
    c = opened(env)
    with pytest.raises(UserError): c.create_covenant(" cov-001 ", "Safety review", TERMS)
    with pytest.raises(UserError): c.open_checkpoint("cp-001", "COV-001", REPORT)

def test_resubmit_after_challenge_blocked_history_retained(env):
    c = evaluated(env)
    env[2].message.sender_address = "0xchallenger"
    agree(env[3], {"checks": ["SUPPORTED", "CONTRADICTED"], "reason": "Counter-evidence contradicts the mitigation requirement at index one."})
    c.challenge_fulfillment("0xowner", "CP-001", "Section two explicitly says the critical finding remains unmitigated.")
    r = json.loads(c.get_checkpoint("0xowner", "CP-001"))
    assert r["outcome"] == "BREACH" and len(r["history"]) == 2
    with pytest.raises(UserError): c.challenge_fulfillment("0xowner", "CP-001", EVIDENCE)
    env[2].message.sender_address = "0xowner"
    with pytest.raises(UserError): c.submit_fulfillment("CP-001", REPORT, EVIDENCE)
    c.finalize_checkpoint("CP-001")
    with pytest.raises(UserError): c.finalize_checkpoint("CP-001")

def test_self_challenge_forbidden(env):
    c = evaluated(env)
    with pytest.raises(UserError): c.challenge_fulfillment("0xowner", "CP-001", EVIDENCE)

def test_cancel_open_and_no_submit(env):
    c = opened(env)
    c.cancel_checkpoint("CP-001")
    with pytest.raises(UserError): c.submit_fulfillment("CP-001", REPORT, EVIDENCE)

@pytest.mark.parametrize("raw", ['{}','{"checks":["SUPPORTED"],"reason":"Enough length for a reason."}','{"checks":["SUPPORTED","UNKNOWN"],"reason":"Enough length for a reason."}'])
def test_malformed_no_mutation(env, raw):
    c = opened(env)
    env[3].append(raw)
    with pytest.raises((ValueError, UserError)): c.submit_fulfillment("CP-001", REPORT, EVIDENCE)
    assert json.loads(c.get_checkpoint("0xowner", "CP-001"))["status"] == "OPEN"

def test_same_band_different_obligations_rejected(env):
    c = opened(env)
    agree(env[3], {"checks": ["SUPPORTED","MISSING"],"reason":"First supported; second missing."}, {"checks":["MISSING","SUPPORTED"],"reason":"First missing; second supported."})
    with pytest.raises(UserError, match="disagreement"): c.submit_fulfillment("CP-001", REPORT, EVIDENCE)

def test_false_model_narrative_is_never_persisted(env):
    c = opened(env)
    agree(env[3], GOOD, {"checks":GOOD["checks"],"reason":"An external auditor independently authenticated all the real-world delivery."}, semantic="NO")
    c.submit_fulfillment("CP-001", REPORT, EVIDENCE)
    record = json.loads(c.get_checkpoint("0xowner", "CP-001"))
    assert "external auditor" not in record["reason"]
    assert "obligation 1 = SUPPORTED" in record["reason"]
    assert "No independent verification" in record["reason"]

def test_no_unbounded_or_duplicate_obligations(env):
    with pytest.raises(UserError): env[1].create_covenant("COV-001", "Safety review", "\n".join(["same obligation " * 3]*2))
    with pytest.raises(UserError): env[1].create_covenant("COV-002", "Safety review", "short")
