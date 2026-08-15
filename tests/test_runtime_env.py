import pytest

from backend.runtime_env import parse_app_env, require_app_env, resolve_app_env


def test_parse_app_env_missing(monkeypatch):
    monkeypatch.delenv("APP_ENV", raising=False)
    assert parse_app_env() is None


def test_parse_app_env_blank_and_whitespace():
    assert parse_app_env("") is None
    assert parse_app_env("   ") is None
    assert parse_app_env("\t") is None


def test_parse_app_env_unrecognized():
    assert parse_app_env("preview") is None
    assert parse_app_env("prod") is None
    assert parse_app_env("prodction") is None
    assert parse_app_env("staging-preview") is None


def test_parse_app_env_recognized_exact_values():
    assert parse_app_env("development") == "development"
    assert parse_app_env("test") == "test"
    assert parse_app_env("staging") == "staging"
    assert parse_app_env("production") == "production"
    assert parse_app_env(" Production ") == "production"


def test_require_app_env_fails_closed(monkeypatch):
    monkeypatch.delenv("APP_ENV", raising=False)
    with pytest.raises(RuntimeError):
        require_app_env()
    monkeypatch.setenv("APP_ENV", "preview")
    with pytest.raises(RuntimeError):
        require_app_env()


def test_resolve_app_env_fails_closed_when_missing(monkeypatch):
    monkeypatch.delenv("APP_ENV", raising=False)
    with pytest.raises(RuntimeError):
        resolve_app_env()
    monkeypatch.setenv("APP_ENV", "staging")
    assert resolve_app_env() == "staging"
