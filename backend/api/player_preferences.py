import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from flask import Flask, request, jsonify, Blueprint
from flask_cors import CORS
import firebase_admin
from firebase_admin import firestore, auth
import json
import os
from dotenv import load_dotenv
from eth_account import Account
from eth_account.messages import encode_defunct

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Flask Blueprint
player_prefs_bp = Blueprint('player_preferences', __name__)

# Initialize Firebase
if not firebase_admin._apps:
    firebase_admin.initialize_app()

db = firestore.client()

def verify_signature(message: str, signature: str, address: str) -> bool:
    """Verify Ethereum signature for authentication."""
    try:
        message_hash = encode_defunct(text=message)
        recovered_address = Account.recover_message(message_hash, signature=signature)
        return recovered_address.lower() == address.lower()
    except Exception as e:
        logger.error(f"Error verifying signature: {e}")
        return False

@player_prefs_bp.route('/api/player/preferences', methods=['GET', 'POST', 'PUT'])
def player_preferences():
    """
    Handle player preferences - skill goals, favorite drills, injury data, coach tone.
    
    GET: Retrieve player preferences
    POST: Create new preferences
    PUT: Update existing preferences
    
    Required JSON body for POST/PUT:
    {
        "wallet_address": "string",
        "signature": "string",
        "message": "string",
        "preferences": {
            "skill_goals": {
                "shooting": {"target_score": 85, "priority": "high"},
                "dribbling": {"target_score": 80, "priority": "medium"}
            },
            "favorite_drills": ["drill_1", "drill_2"],
            "injury_data": {
                "recent_injuries": ["ankle_sprain"],
                "restrictions": ["no_high_impact"],
                "recovery_date": "2024-01-15"
            },
            "coach_tone": "encouraging", // encouraging, technical, motivational, strict
            "training_intensity": "medium", // low, medium, high
            "preferred_duration": 45, // minutes
            "rest_days": ["sunday", "wednesday"],
            "notification_preferences": {
                "voice_feedback": true,
                "streak_reminders": true,
                "milestone_alerts": true
            }
        }
    }
    """
    try:
        # Verify authentication
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        wallet_address = data.get('wallet_address')
        signature = data.get('signature')
        message = data.get('message')
        
        if not all([wallet_address, signature, message]):
            return jsonify({'error': 'Missing authentication fields'}), 400
        
        if not verify_signature(message, signature, wallet_address):
            return jsonify({'error': 'Invalid signature'}), 401
        
        player_id = wallet_address.lower()
        
        if request.method == 'GET':
            # Retrieve preferences
            prefs_ref = db.collection('player_preferences').document(player_id)
            prefs_doc = prefs_ref.get()
            
            if not prefs_doc.exists:
                return jsonify({'preferences': {}}), 200
            
            return jsonify({'preferences': prefs_doc.to_dict()}), 200
        
        elif request.method in ['POST', 'PUT']:
            # Create or update preferences
            preferences = data.get('preferences', {})
            
            # Validate preferences structure
            if not self._validate_preferences(preferences):
                return jsonify({'error': 'Invalid preferences structure'}), 400
            
            # Add metadata
            preferences['last_updated'] = datetime.now().isoformat()
            preferences['player_id'] = player_id
            
            # Save to Firestore
            prefs_ref = db.collection('player_preferences').document(player_id)
            prefs_ref.set(preferences, merge=True)
            
            return jsonify({
                'success': True,
                'message': 'Preferences saved successfully',
                'preferences': preferences
            }), 200
        
    except Exception as e:
        logger.error(f"Error in player preferences endpoint: {e}")
        return jsonify({'error': 'Internal server error'}), 500

def _validate_preferences(preferences: Dict) -> bool:
    """Validate preferences structure."""
    try:
        required_fields = ['skill_goals', 'coach_tone', 'training_intensity']
        
        for field in required_fields:
            if field not in preferences:
                return False
        
        # Validate coach tone
        valid_tones = ['encouraging', 'technical', 'motivational', 'strict']
        if preferences['coach_tone'] not in valid_tones:
            return False
        
        # Validate training intensity
        valid_intensities = ['low', 'medium', 'high']
        if preferences['training_intensity'] not in valid_intensities:
            return False
        
        return True
        
    except Exception as e:
        logger.error(f"Error validating preferences: {e}")
        return False

@player_prefs_bp.route('/api/player/preferences/skill-goals', methods=['POST'])
def update_skill_goals():
    """
    Update specific skill goals.
    
    Required JSON body:
    {
        "wallet_address": "string",
        "signature": "string",
        "message": "string",
        "skill_goals": {
            "shooting": {"target_score": 85, "priority": "high"},
            "dribbling": {"target_score": 80, "priority": "medium"}
        }
    }
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        wallet_address = data.get('wallet_address')
        signature = data.get('signature')
        message = data.get('message')
        skill_goals = data.get('skill_goals', {})
        
        if not all([wallet_address, signature, message]):
            return jsonify({'error': 'Missing authentication fields'}), 400
        
        if not verify_signature(message, signature, wallet_address):
            return jsonify({'error': 'Invalid signature'}), 401
        
        player_id = wallet_address.lower()
        
        # Update skill goals
        prefs_ref = db.collection('player_preferences').document(player_id)
        prefs_ref.update({
            'skill_goals': skill_goals,
            'last_updated': datetime.now().isoformat()
        })
        
        return jsonify({
            'success': True,
            'message': 'Skill goals updated successfully',
            'skill_goals': skill_goals
        }), 200
        
    except Exception as e:
        logger.error(f"Error updating skill goals: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@player_prefs_bp.route('/api/player/preferences/injury-data', methods=['POST'])
def update_injury_data():
    """
    Update injury data and restrictions.
    
    Required JSON body:
    {
        "wallet_address": "string",
        "signature": "string",
        "message": "string",
        "injury_data": {
            "recent_injuries": ["ankle_sprain"],
            "restrictions": ["no_high_impact"],
            "recovery_date": "2024-01-15"
        }
    }
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        wallet_address = data.get('wallet_address')
        signature = data.get('signature')
        message = data.get('message')
        injury_data = data.get('injury_data', {})
        
        if not all([wallet_address, signature, message]):
            return jsonify({'error': 'Missing authentication fields'}), 400
        
        if not verify_signature(message, signature, wallet_address):
            return jsonify({'error': 'Invalid signature'}), 401
        
        player_id = wallet_address.lower()
        
        # Update injury data
        prefs_ref = db.collection('player_preferences').document(player_id)
        prefs_ref.update({
            'injury_data': injury_data,
            'last_updated': datetime.now().isoformat()
        })
        
        return jsonify({
            'success': True,
            'message': 'Injury data updated successfully',
            'injury_data': injury_data
        }), 200
        
    except Exception as e:
        logger.error(f"Error updating injury data: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@player_prefs_bp.route('/api/player/preferences/coach-tone', methods=['POST'])
def update_coach_tone():
    """
    Update preferred coach tone and feedback style.
    
    Required JSON body:
    {
        "wallet_address": "string",
        "signature": "string",
        "message": "string",
        "coach_tone": "encouraging",
        "notification_preferences": {
            "voice_feedback": true,
            "streak_reminders": true,
            "milestone_alerts": true
        }
    }
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        wallet_address = data.get('wallet_address')
        signature = data.get('signature')
        message = data.get('message')
        coach_tone = data.get('coach_tone')
        notification_prefs = data.get('notification_preferences', {})
        
        if not all([wallet_address, signature, message, coach_tone]):
            return jsonify({'error': 'Missing required fields'}), 400
        
        if not verify_signature(message, signature, wallet_address):
            return jsonify({'error': 'Invalid signature'}), 401
        
        # Validate coach tone
        valid_tones = ['encouraging', 'technical', 'motivational', 'strict']
        if coach_tone not in valid_tones:
            return jsonify({'error': 'Invalid coach tone'}), 400
        
        player_id = wallet_address.lower()
        
        # Update coach tone and notifications
        prefs_ref = db.collection('player_preferences').document(player_id)
        prefs_ref.update({
            'coach_tone': coach_tone,
            'notification_preferences': notification_prefs,
            'last_updated': datetime.now().isoformat()
        })
        
        return jsonify({
            'success': True,
            'message': 'Coach tone updated successfully',
            'coach_tone': coach_tone,
            'notification_preferences': notification_prefs
        }), 200
        
    except Exception as e:
        logger.error(f"Error updating coach tone: {e}")
        return jsonify({'error': 'Internal server error'}), 500

# Register blueprint
def init_app(app):
    """Initialize the player preferences blueprint with the Flask app."""
    app.register_blueprint(player_prefs_bp)
    CORS(app)

if __name__ == "__main__":
    app = Flask(__name__)
    init_app(app)
    app.run(debug=True, port=5002) 