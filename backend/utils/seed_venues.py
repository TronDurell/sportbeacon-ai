import firebase_admin
from firebase_admin import credentials, firestore

cred = credentials.ApplicationDefault()
firebase_admin.initialize_app(cred)
db = firestore.client()

venues = [
    {
        "venue_id": "venue_001",
        "name": "Cary Community Center",
        "type": "court",
        "surface": "rubber",
        "coordinates": { "lat": 35.7915, "lng": -78.7811 },
        "amenities": ["indoor", "lighting", "open access"]
    },
    # Add more venues as needed
]

for venue in venues:
    db.collection('venues').document(venue['venue_id']).set(venue) 