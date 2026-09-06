"""Strict direct-call harness. Not a replacement for GenVM network tests."""
import importlib.util
import json
import pickle
import sys
import types
from pathlib import Path
import pytest

class Map(dict):
    @classmethod
    def __class_getitem__(cls, _):
        return cls

class Return:
    def __init__(self, value):
        self.calldata = value

class UserError(Exception):
    pass

class WebResponse:
    def __init__(self, body, status_code=200):
        self.body = body.encode("utf-8")
        self.status_code = status_code

def load_contract(filename, classname):
    fake = types.ModuleType("genlayer")
    prompts = []
    responses = []
    web_responses = []
    def prompt(text):
        prompts.append(text)
        if not responses:
            raise AssertionError("unexpected LLM call")
        return responses.pop(0)
    def run(leader, validator):
        value = leader()
        assert pickle.loads(pickle.dumps(value)) == value
        if not validator(Return(value)):
            raise UserError("consensus disagreement")
        return value
    def web_get(_url):
        if not web_responses:
            raise AssertionError("unexpected web call")
        value = web_responses.pop(0)
        return WebResponse(value) if isinstance(value, str) else value
    identity = lambda f: f
    fake.gl = types.SimpleNamespace(
        Contract=object, public=types.SimpleNamespace(write=identity, view=identity),
        message=types.SimpleNamespace(sender_address="0xowner"),
        vm=types.SimpleNamespace(Return=Return, UserError=UserError, run_nondet_unsafe=run),
        nondet=types.SimpleNamespace(exec_prompt=prompt, web=types.SimpleNamespace(get=web_get)))
    fake.TreeMap = Map
    fake.u256 = int
    fake.Address = str
    fake.__all__ = ["gl", "TreeMap", "u256", "Address"]
    sys.modules["genlayer"] = fake
    path = Path(__file__).parents[1] / "contracts" / filename
    spec = importlib.util.spec_from_file_location(classname, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    cls = getattr(module, classname)
    contract = cls.__new__(cls)
    for name, annotation in cls.__annotations__.items():
        if annotation is Map:
            setattr(contract, name, Map())
    contract.__init__()
    return module, contract, fake.gl, responses, prompts, web_responses

def agree(queue, value, other=None, semantic="YES"):
    queue.extend([json.dumps(value), json.dumps(other or value)])

def web_agree(queue, body):
    queue.extend([body, body])
