from pathlib import Path
SOURCE=Path(__file__).parents[1]/"contracts"/"covenant_loom.py"
def test_complete_reviewable_contract():
    text=SOURCE.read_text(encoding="utf-8")
    for name in ("create_covenant","revise_covenant","open_checkpoint","submit_fulfillment","challenge_fulfillment","finalize_checkpoint","get_checkpoint"):
        assert f"def {name}" in text
    assert "prompt_comparative" in text and "COVENANT_VERSION" in text
def test_terms_are_canonical():
    text=SOURCE.read_text(encoding="utf-8")
    assert "self.terms[cov]" in text and "claimant-supplied replacement terms" in text
