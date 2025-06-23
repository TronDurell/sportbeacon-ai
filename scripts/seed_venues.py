import firebase_admin
from firebase_admin import credentials, firestore

cred = credentials.Certificate("path/to/serviceAccount.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

from mock.venues import venues as mock_venue_data

for venue in mock_venue_data:
    doc_ref = db.collection("venues").document(venue["venue_id"])
    doc_ref.set(venue) 