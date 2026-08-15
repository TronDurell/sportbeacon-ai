from __future__ import annotations

import os
from typing import Optional

ALLOWED_APP_ENVS = frozenset({"development", "test", "staging", "production"})
TRUE_VALUES = {"1", "true", "yes", "on"}
FALSE_VALUES = {"0", "false", "no", "off"}


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


def resolve_app_env(*, allow_missing_for_tests: bool = False) -> str:
    raw = os.getenv("APP_ENV", "").strip().lower()
    if raw in ALLOWED_APP_ENVS:
        return raw
    if allow_missing_for_tests and not raw:
        return "test"
    if not raw:
        # Local/default FastAPI process without APP_ENV stays in development.
        return "development"
    raise RuntimeError("APP_ENV is unrecognized; refusing to start")


def require_app_env() -> str:
    raw = os.getenv("APP_ENV", "").strip().lower()
    if raw in ALLOWED_APP_ENVS:
        return raw
    raise RuntimeError("APP_ENV is missing or unrecognized; failing closed")
