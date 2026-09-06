import hashlib,json,pytest
from harness import load_contract,agree,web_agree,UserError
TERMS="Publish a detailed threat model with named attack surfaces.\nMap every critical finding to a concrete mitigation."
URL="https://evidence.example/report-v1.txt"
BODY="Threat model: prompt injection and data exfiltration. Critical findings map to input isolation and output filtering mitigations."
GOOD={"checks":["SUPPORTED","SUPPORTED"]}
@pytest.fixture
def env():return load_contract("covenant_loom.py","CovenantLoom")
def opened(e):
 c,g=e[1],e[2];c.create_covenant("COV-1","Safety delivery",TERMS,"0xcounterparty");c.open_checkpoint("CP-1","COV-1","Verify the published security report.",3600);return c
def submitted(e):
 c=opened(e);e[2].message.sender_address="0xcounterparty";web_agree(e[5],BODY);agree(e[3],GOOD);c.submit_fulfillment("0xowner","CP-1",URL);return c
def test_counterparty_authenticated_fetched_evidence(env):
 c=submitted(env);r=json.loads(c.get_checkpoint("0xowner","CP-1"));assert r["status"]=="CHALLENGE_WINDOW";assert r["source_digest"]==hashlib.sha256(BODY.encode()).hexdigest();assert r["history"][0]["actor"]=="0xcounterparty"
def test_owner_cannot_submit_and_outsider_cannot_challenge(env):
 c=opened(env)
 with pytest.raises(UserError):c.submit_fulfillment("0xowner","CP-1",URL)
 env[2].message.sender_address="0xcounterparty";web_agree(env[5],BODY);agree(env[3],GOOD);c.submit_fulfillment("0xowner","CP-1",URL)
 env[2].message.sender_address="0xoutsider"
 with pytest.raises(UserError):c.challenge_fulfillment("CP-1","A detailed challenge that identifies a missing mitigation in the report.")
def test_immediate_finalize_blocked_and_permissionless_after_deadline(env):
 c=submitted(env)
 with pytest.raises(UserError,match="still open"):c.finalize_checkpoint("0xowner","CP-1")
 k=c.key("0xowner","CP-1");r=json.loads(c.checkpoints[k]);r["challenge_deadline"]=0;c.checkpoints[k]=env[0].enc(r);env[2].message.sender_address="0xanyone";c.finalize_checkpoint("0xowner","CP-1");assert json.loads(c.get_checkpoint("0xowner","CP-1"))["status"]=="FINAL"
def test_defined_owner_challenge_and_counterparty_rebuttal(env):
 c=submitted(env);env[2].message.sender_address="0xowner";c.challenge_fulfillment("CP-1","The source does not demonstrate the deployment mitigation under production conditions.");env[2].message.sender_address="0xoutsider"
 with pytest.raises(UserError):c.submit_rebuttal("0xowner","CP-1",URL)
 env[2].message.sender_address="0xcounterparty";web_agree(env[5],BODY+" Production deployment logs included.");agree(env[3],GOOD);c.submit_rebuttal("0xowner","CP-1","https://evidence.example/rebuttal.txt");env[2].message.sender_address="0xanyone";c.finalize_checkpoint("0xowner","CP-1");assert json.loads(c.get_checkpoint("0xowner","CP-1"))["status"]=="FINAL"
def test_bad_url_and_source_failure_leave_open(env):
 c=opened(env);env[2].message.sender_address="0xcounterparty"
 for u in ("http://evidence.example/a","https://user:pass@evidence.example/a#x"):
  with pytest.raises(UserError):c.submit_fulfillment("0xowner","CP-1",u)
 env[5].extend(["tiny"])
 with pytest.raises(ValueError):c.submit_fulfillment("0xowner","CP-1",URL)
 assert json.loads(c.get_checkpoint("0xowner","CP-1"))["status"]=="OPEN"
def test_validator_source_or_finding_disagreement_rejected(env):
 c=opened(env);env[2].message.sender_address="0xcounterparty";env[5].extend([BODY,BODY+" changed"]);agree(env[3],GOOD)
 with pytest.raises(UserError,match="disagreement"):c.submit_fulfillment("0xowner","CP-1",URL)
def test_snapshot_duplicate_and_window_bounds(env):
 c=opened(env);c.revise_covenant("COV-1","A new obligation that is long enough for validation.");r=json.loads(c.get_checkpoint("0xowner","CP-1"));assert r["covenant_version"]==1 and r["obligations"]==TERMS.splitlines()
 with pytest.raises(UserError):c.create_covenant("cov-1","Safety delivery",TERMS,"0xcounterparty")
 with pytest.raises(UserError):c.open_checkpoint("CP-2","COV-1","Verify another published report.",60)
def test_owner_counterparty_must_differ(env):
 with pytest.raises(UserError):env[1].create_covenant("COV-1","Safety delivery",TERMS,"0xowner")
def test_wrapped_json_is_accepted_but_extra_fields_fail(env):
 assert env[0].norm('```json\n{"checks":["SUPPORTED","MISSING"]}\n```',2)["checks"][1]=="MISSING"
 with pytest.raises(ValueError):env[0].norm('{"checks":["SUPPORTED","MISSING"],"reason":"unchecked"}',2)
