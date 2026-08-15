from __future__ import annotations

import os
from typing import Optional

import firebase_admin
from firebase_admin import credentials


_APP_NAME = "[DEFAULT]"


def get_firebase_app():
    if firebase_admin._apps:
        return firebase_admin.get_app()
    project_id = os.getenv("GOOGLE_CLOUD_PROJECT") or os.getenv("GCLOUD_PROJECT") or "sportbeacon-ai"
    options = {"projectId": project_id}
    using_emulator = bool(
        os.getenv("FIRESTORE_EMULATOR_HOST") or os.getenv("FIREBASE_AUTH_EMULATOR_HOST")
    )
    if using_emulator:
        # Emulators do not need a credential file. Cloud Run still uses ADC below.
        return firebase_admin.initialize_app(options=options, name=_APP_NAME)
    # Application Default Credentials / Cloud Run attached identity. No key file.
    cred = credentials.ApplicationDefault()
    return firebase_admin.initialize_app(cred, options, name=_APP_NAME)


def get_firestore_client(app: Optional[object] = None):
    from firebase_admin import firestore

    return firestore.client(app=app or get_firebase_app())
