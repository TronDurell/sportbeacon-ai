from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional

app = FastAPI()

# Division progression map (example)
DIVISION_MAP = {
    "6-8": "9-12",
    "9-12": "13-15",
    "13-15": "16-18",
    "16-18": "Adult"
}

class CoachIntent(BaseModel):
    coach_id: str
    team_id: str
    current_division: str
    wants_to_return: bool
    wants_to_move_up: bool
    notes: Optional[str] = None
    next_division: Optional[str] = None  # Auto-assigned if moving up

# In-memory storage (dict by coach_id for demo)
coach_intents = {}

@app.post("/submit-intent", response_model=CoachIntent)
def submit_intent(intent: CoachIntent):
    """Submit a coach's intent for the upcoming season."""
    # Auto-assign next division if moving up
    if intent.wants_to_move_up:
        intent.next_division = DIVISION_MAP.get(intent.current_division, None)
    coach_intents[intent.coach_id] = intent
    return intent

@app.get("/review-intents", response_model=List[CoachIntent])
def review_intents():
    """Return all submitted coach intents (admin view)."""
    return list(coach_intents.values()) 