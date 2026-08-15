import pytest

from backend.runtime_env import require_app_env, resolve_app_env


def test_require_app_env_fails_closed(monkeypatch):
    monkeypatch.delenv("APP_ENV", raising=False)
    with pytest.raises(RuntimeError):
        require_app_env()
    monkeypatch.setenv("APP_ENV", "preview")
    with pytest.raises(RuntimeError):
        require_app_env()


def test_resolve_app_env_defaults_to_development(monkeypatch):
    monkeypatch.delenv("APP_ENV", raising=False)
    assert resolve_app_env() == "development"
    monkeypatch.setenv("APP_ENV", "staging")
    assert resolve_app_env() == "staging"
