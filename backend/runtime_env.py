from __future__ import annotations

import os
from typing import Optional

ALLOWED_APP_ENVS = frozenset({"development", "test", "staging", "production"})
TRUE_VALUES = {"1", "true", "yes", "on"}
FALSE_VALUES = {"0", "false", "no", "off"}
_UNSET = object()


def env_flag(name: str) -> Optional[bool]:
    raw = os.getenv(name)
    if raw is None or not str(raw).strip():
        return None
    value = str(raw).strip().lower()
    if value in TRUE_VALUES:
        return True
    if value in FALSE_VALUES:
        return False
    return None


def parse_app_env(raw: object = _UNSET) -> Optional[str]:
    """Return a recognized APP_ENV, or None when missing, blank, or unknown.

    Recognized values are exactly: development, test, staging, production.
    Aliases such as ``prod`` or ``preview`` are not accepted. Comparison is
    case-insensitive after stripping surrounding whitespace.
    """
    if raw is _UNSET:
        raw = os.getenv("APP_ENV")
    if raw is None:
        return None
    stripped = str(raw).strip()
    if not stripped:
        return None
    value = stripped.lower()
    if value in ALLOWED_APP_ENVS:
        return value
    return None


def app_env_is_valid() -> bool:
    return parse_app_env() is not None


def require_app_env() -> str:
    env = parse_app_env()
    if env is None:
        raise RuntimeError("APP_ENV is missing or unrecognized; failing closed")
    return env


def resolve_app_env(*, allow_missing_for_tests: bool = False) -> str:
    env = parse_app_env()
    if env is not None:
        return env
    if allow_missing_for_tests:
        return "test"
    raise RuntimeError("APP_ENV is missing or unrecognized; failing closed")
