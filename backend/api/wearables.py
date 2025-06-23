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
wearables_bp = Blueprint('wearables', __name__)

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

@wearables_bp.route('/api/wearables/sync', methods=['POST'])
def sync_wearable_data():
    """
    Receive and store wearable sensor data for drill auto-adjustment.
    
    Required JSON body:
    {
        "wallet_address": "string",
        "signature": "string",
        "message": "string",
        "sensor_data": {
            "heart_rate": {
                "current": 145,
                "average": 140,
                "max": 180,
                "resting": 65
            },
            "jump_count": 25,
            "jump_height": {
                "average": 0.8,
                "max": 1.2,
                "units": "meters"
            },
            "movement_data": {
                "steps": 1250,
                "distance": 2.5,
                "calories": 450,
                "active_time": 45
            },
            "fatigue_metrics": {
                "muscle_fatigue": 0.7, // 0-1 scale
                "cardio_fatigue": 0.6,
                "overall_fatigue": 0.65
            },
            "form_metrics": {
                "shooting_form": 0.85, // 0-1 scale
                "dribbling_form": 0.78,
                "passing_form": 0.82
            },
            "device_info": {
                "device_type": "smart_watch",
                "model": "Apple Watch Series 8",
                "battery_level": 0.75
            },
            "timestamp": "2024-01-15T10:30:00Z"
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
        sensor_data = data.get('sensor_data', {})
        
        if not all([wallet_address, signature, message]):
            return jsonify({'error': 'Missing authentication fields'}), 400
        
        if not verify_signature(message, signature, wallet_address):
            return jsonify({'error': 'Invalid signature'}), 401
        
        player_id = wallet_address.lower()
        
        # Validate sensor data
        if not _validate_sensor_data(sensor_data):
            return jsonify({'error': 'Invalid sensor data structure'}), 400
        
        # Add metadata
        sensor_data['player_id'] = player_id
        sensor_data['received_at'] = datetime.now().isoformat()
        sensor_data['data_source'] = 'wearable_sync'
        
        # Store in Firestore
        wearables_ref = db.collection('wearable_data')
        doc_ref = wearables_ref.add(sensor_data)
        
        # Trigger drill auto-adjustment analysis
        _analyze_fatigue_and_adjust_drills(player_id, sensor_data)
        
        return jsonify({
            'success': True,
            'message': 'Wearable data synced successfully',
            'data_id': doc_ref[1].id,
            'fatigue_level': _calculate_fatigue_level(sensor_data)
        }), 200
        
    except Exception as e:
        logger.error(f"Error in wearable sync endpoint: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@wearables_bp.route('/api/wearables/status', methods=['GET'])
def get_wearable_status():
    """
    Get current wearable connection status and latest data.
    
    Required query params:
    - wallet_address: string
    - signature: string
    - message: string
    """
    try:
        wallet_address = request.args.get('wallet_address')
        signature = request.args.get('signature')
        message = request.args.get('message')
        
        if not all([wallet_address, signature, message]):
            return jsonify({'error': 'Missing authentication fields'}), 400
        
        if not verify_signature(message, signature, wallet_address):
            return jsonify({'error': 'Invalid signature'}), 401
        
        player_id = wallet_address.lower()
        
        # Get latest wearable data
        wearables_ref = db.collection('wearable_data')
        latest_data = wearables_ref.where('player_id', '==', player_id).order_by('received_at', direction=firestore.Query.DESCENDING).limit(1).get()
        
        if not latest_data:
            return jsonify({
                'connected': False,
                'last_sync': None,
                'message': 'No wearable data found'
            }), 200
        
        latest = latest_data[0].to_dict()
        last_sync = latest.get('received_at')
        
        # Check if data is recent (within last 5 minutes)
        if last_sync:
            last_sync_time = datetime.fromisoformat(last_sync.replace('Z', '+00:00'))
            is_recent = (datetime.now(last_sync_time.tzinfo) - last_sync_time).total_seconds() < 300
        
        return jsonify({
            'connected': is_recent,
            'last_sync': last_sync,
            'fatigue_level': _calculate_fatigue_level(latest),
            'current_heart_rate': latest.get('heart_rate', {}).get('current'),
            'jump_count': latest.get('jump_count', 0),
            'form_metrics': latest.get('form_metrics', {})
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting wearable status: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@wearables_bp.route('/api/wearables/history', methods=['GET'])
def get_wearable_history():
    """
    Get wearable data history for analysis.
    
    Required query params:
    - wallet_address: string
    - signature: string
    - message: string
    - days: int (optional, default 7)
    """
    try:
        wallet_address = request.args.get('wallet_address')
        signature = request.args.get('signature')
        message = request.args.get('message')
        days = int(request.args.get('days', 7))
        
        if not all([wallet_address, signature, message]):
            return jsonify({'error': 'Missing authentication fields'}), 400
        
        if not verify_signature(message, signature, wallet_address):
            return jsonify({'error': 'Invalid signature'}), 401
        
        player_id = wallet_address.lower()
        
        # Get data from last N days
        cutoff_date = datetime.now() - timedelta(days=days)
        
        wearables_ref = db.collection('wearable_data')
        history = wearables_ref.where('player_id', '==', player_id).where('received_at', '>=', cutoff_date.isoformat()).order_by('received_at').get()
        
        history_data = []
        for doc in history:
            data = doc.to_dict()
            history_data.append({
                'timestamp': data.get('received_at'),
                'heart_rate': data.get('heart_rate', {}),
                'jump_count': data.get('jump_count', 0),
                'fatigue_metrics': data.get('fatigue_metrics', {}),
                'form_metrics': data.get('form_metrics', {})
            })
        
        return jsonify({
            'history': history_data,
            'summary': _calculate_history_summary(history_data)
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting wearable history: {e}")
        return jsonify({'error': 'Internal server error'}), 500

def _validate_sensor_data(sensor_data: Dict) -> bool:
    """Validate sensor data structure."""
    try:
        required_fields = ['heart_rate', 'jump_count', 'fatigue_metrics']
        
        for field in required_fields:
            if field not in sensor_data:
                return False
        
        # Validate heart rate data
        heart_rate = sensor_data.get('heart_rate', {})
        if not all(key in heart_rate for key in ['current', 'average', 'max']):
            return False
        
        # Validate fatigue metrics
        fatigue = sensor_data.get('fatigue_metrics', {})
        if not all(key in fatigue for key in ['muscle_fatigue', 'cardio_fatigue', 'overall_fatigue']):
            return False
        
        return True
        
    except Exception as e:
        logger.error(f"Error validating sensor data: {e}")
        return False

def _calculate_fatigue_level(sensor_data: Dict) -> str:
    """Calculate overall fatigue level from sensor data."""
    try:
        fatigue = sensor_data.get('fatigue_metrics', {})
        overall_fatigue = fatigue.get('overall_fatigue', 0.5)
        
        if overall_fatigue < 0.3:
            return 'low'
        elif overall_fatigue < 0.7:
            return 'medium'
        else:
            return 'high'
            
    except Exception as e:
        logger.error(f"Error calculating fatigue level: {e}")
        return 'medium'

def _analyze_fatigue_and_adjust_drills(player_id: str, sensor_data: Dict):
    """Analyze fatigue and trigger drill auto-adjustment."""
    try:
        fatigue_level = _calculate_fatigue_level(sensor_data)
        form_metrics = sensor_data.get('form_metrics', {})
        
        # Create adjustment recommendation
        adjustment = {
            'player_id': player_id,
            'fatigue_level': fatigue_level,
            'form_metrics': form_metrics,
            'recommendation': _generate_drill_adjustment(fatigue_level, form_metrics),
            'timestamp': datetime.now().isoformat()
        }
        
        # Store adjustment recommendation
        adjustments_ref = db.collection('drill_adjustments')
        adjustments_ref.add(adjustment)
        
        logger.info(f"Drill adjustment created for player {player_id}: {fatigue_level} fatigue")
        
    except Exception as e:
        logger.error(f"Error analyzing fatigue and adjusting drills: {e}")

def _generate_drill_adjustment(fatigue_level: str, form_metrics: Dict) -> Dict:
    """Generate drill adjustment recommendation based on fatigue and form."""
    try:
        if fatigue_level == 'high':
            return {
                'intensity_reduction': 0.3,
                'duration_reduction': 0.2,
                'focus_areas': ['recovery', 'form_practice'],
                'message': 'High fatigue detected. Focus on form and recovery drills.'
            }
        elif fatigue_level == 'medium':
            return {
                'intensity_reduction': 0.1,
                'duration_reduction': 0.05,
                'focus_areas': ['skill_development', 'moderate_intensity'],
                'message': 'Moderate fatigue. Maintain good form with moderate intensity.'
            }
        else:
            return {
                'intensity_reduction': 0.0,
                'duration_reduction': 0.0,
                'focus_areas': ['performance', 'high_intensity'],
                'message': 'Low fatigue. Ready for high-intensity training.'
            }
            
    except Exception as e:
        logger.error(f"Error generating drill adjustment: {e}")
        return {'message': 'Unable to generate adjustment recommendation'}

def _calculate_history_summary(history_data: List[Dict]) -> Dict:
    """Calculate summary statistics from wearable history."""
    try:
        if not history_data:
            return {}
        
        heart_rates = [data.get('heart_rate', {}).get('current', 0) for data in history_data if data.get('heart_rate', {}).get('current')]
        jump_counts = [data.get('jump_count', 0) for data in history_data]
        fatigue_levels = [data.get('fatigue_metrics', {}).get('overall_fatigue', 0.5) for data in history_data]
        
        return {
            'total_sessions': len(history_data),
            'avg_heart_rate': sum(heart_rates) / len(heart_rates) if heart_rates else 0,
            'total_jumps': sum(jump_counts),
            'avg_fatigue': sum(fatigue_levels) / len(fatigue_levels) if fatigue_levels else 0,
            'trend': _calculate_trend(history_data)
        }
        
    except Exception as e:
        logger.error(f"Error calculating history summary: {e}")
        return {}

def _calculate_trend(history_data: List[Dict]) -> str:
    """Calculate trend from recent data."""
    try:
        if len(history_data) < 2:
            return 'insufficient_data'
        
        # Compare first and last fatigue levels
        first_fatigue = history_data[0].get('fatigue_metrics', {}).get('overall_fatigue', 0.5)
        last_fatigue = history_data[-1].get('fatigue_metrics', {}).get('overall_fatigue', 0.5)
        
        if last_fatigue < first_fatigue - 0.1:
            return 'improving'
        elif last_fatigue > first_fatigue + 0.1:
            return 'declining'
        else:
            return 'stable'
            
    except Exception as e:
        logger.error(f"Error calculating trend: {e}")
        return 'unknown'

# Register blueprint
def init_app(app):
    """Initialize the wearables blueprint with the Flask app."""
    app.register_blueprint(wearables_bp)
    CORS(app)

if __name__ == "__main__":
    app = Flask(__name__)
    init_app(app)
    app.run(debug=True, port=5003) 