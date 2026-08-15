from __future__ import annotations

from dataclasses import dataclass
from typing import Optional, Protocol

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from starlette.requests import Request

bearer_scheme = HTTPBearer(auto_error=False)


class TokenVerifier(Protocol):
    def verify_id_token(self, token: str) -> str:
        """Return the canonical Firebase uid or raise ValueError."""


@dataclass(frozen=True)
class AuthenticatedUser:
    uid: str


class FirebaseTokenVerifier:
    def verify_id_token(self, token: str) -> str:
        from firebase_admin import auth as firebase_auth

        from .firebase_admin_app import get_firebase_app

        get_firebase_app()
        try:
            decoded = firebase_auth.verify_id_token(token, check_revoked=False)
        except Exception as exc:
            raise ValueError("Invalid Firebase ID token") from exc
        uid = decoded.get("uid")
        if not isinstance(uid, str) or not uid.strip():
            raise ValueError("Firebase token is missing uid")
        return uid


def _unauthorized(detail: str) -> HTTPException:
    return HTTPException(
        status_code=401,
        detail=detail,
        headers={"WWW-Authenticate": "Bearer"},
    )


def get_token_verifier(request: Request) -> TokenVerifier:
    verifier = getattr(request.app.state, "token_verifier", None)
    if verifier is None:
        verifier = FirebaseTokenVerifier()
        request.app.state.token_verifier = verifier
    return verifier


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    verifier: TokenVerifier = Depends(get_token_verifier),
) -> AuthenticatedUser:
    if credentials is None or credentials.scheme.lower() != "bearer" or not credentials.credentials:
        raise _unauthorized("Missing bearer token")
    token = credentials.credentials.strip()
    if not token or token.count(".") != 2:
        raise _unauthorized("Malformed bearer token")
    try:
        uid = verifier.verify_id_token(token)
    except ValueError:
        raise _unauthorized("Invalid or expired bearer token") from None
    return AuthenticatedUser(uid=uid)
