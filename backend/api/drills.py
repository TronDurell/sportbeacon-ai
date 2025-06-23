from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
import firebase_admin
from firebase_admin import firestore
import os
import json
import logging
from typing import List, Dict

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

drills_bp = Blueprint('drills', __name__)

db = firestore.client()

@drills_bp.route('/api/drills/placement', methods=['POST'])
def place_drill():
    """
    Accepts drill metadata, coordinates, and context for AR/Unreal Engine placement.
    Stores in Firestore and updates drill_field_config.json.
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        # Store in Firestore
        drills_ref = db.collection('drill_placements')
        doc_ref = drills_ref.add({
            **data,
            'created_at': datetime.now().isoformat()
        })
        # Optionally update drill_field_config.json
        config_path = os.path.join(os.path.dirname(__file__), '../../drill_field_config.json')
        try:
            if os.path.exists(config_path):
                with open(config_path, 'r') as f:
                    config = json.load(f)
            else:
                config = []
            config.append(data)
            with open(config_path, 'w') as f:
                json.dump(config, f, indent=2)
        except Exception as e:
            pass  # Ignore file errors for now
        return jsonify({'success': True, 'id': doc_ref[1].id}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@drills_bp.route('/api/drills/schedule', methods=['GET', 'POST'])
def drill_schedule():
    """
    Auto-adjust future drills based on player form, fatigue, and streak data.
    
    GET: Retrieve current drill schedule
    POST: Generate new auto-adjusted schedule
    
    Required JSON body for POST:
    {
        "wallet_address": "string",
        "signature": "string",
        "message": "string",
        "sport": "string",
        "schedule_days": 7 // optional, default 7
    }
    """
    try:
        if request.method == 'GET':
            # Get schedule for authenticated user
            wallet_address = request.args.get('wallet_address')
            signature = request.args.get('signature')
            message = request.args.get('message')
            
            if not all([wallet_address, signature, message]):
                return jsonify({'error': 'Missing authentication fields'}), 400
            
            player_id = wallet_address.lower()
            
            # Get current schedule
            schedule_ref = db.collection('drill_schedules')
            schedule_docs = schedule_ref.where('player_id', '==', player_id).order_by('date').get()
            
            schedule = []
            for doc in schedule_docs:
                schedule.append(doc.to_dict())
            
            return jsonify({'schedule': schedule}), 200
        
        elif request.method == 'POST':
            data = request.get_json()
            if not data:
                return jsonify({'error': 'No data provided'}), 400
            
            wallet_address = data.get('wallet_address')
            signature = data.get('signature')
            message = data.get('message')
            sport = data.get('sport')
            schedule_days = data.get('schedule_days', 7)
            
            if not all([wallet_address, signature, message, sport]):
                return jsonify({'error': 'Missing required fields'}), 400
            
            player_id = wallet_address.lower()
            
            # Generate auto-adjusted schedule
            schedule = await _generate_auto_adjusted_schedule(player_id, sport, schedule_days)
            
            # Save schedule to Firestore
            schedule_ref = db.collection('drill_schedules')
            for day_schedule in schedule:
                schedule_ref.add(day_schedule)
            
            return jsonify({
                'success': True,
                'message': 'Auto-adjusted schedule generated successfully',
                'schedule': schedule
            }), 200
            
    except Exception as e:
        logger.error(f"Error in drill schedule endpoint: {e}")
        return jsonify({'error': 'Internal server error'}), 500

async def _generate_auto_adjusted_schedule(player_id: str, sport: str, days: int) -> List[Dict]:
    """Generate auto-adjusted drill schedule based on player data."""
    try:
        schedule = []
        
        # Get player preferences
        prefs_ref = db.collection('player_preferences').document(player_id)
        prefs_doc = prefs_ref.get()
        preferences = prefs_doc.to_dict() if prefs_doc.exists else {}
        
        # Get latest wearable data
        wearables_ref = db.collection('wearable_data')
        latest_wearable = wearables_ref.where('player_id', '==', player_id).order_by('received_at', direction=firestore.Query.DESCENDING).limit(1).get()
        wearable_data = latest_wearable[0].to_dict() if latest_wearable else {}
        
        # Get recent performance data
        performance_ref = db.collection('player_performance')
        recent_performance = performance_ref.where('player_id', '==', player_id).order_by('date', direction=firestore.Query.DESCENDING).limit(5).get()
        performance_data = [doc.to_dict() for doc in recent_performance]
        
        # Get engagement streak
        coaching_ref = db.collection('coaching_interactions')
        recent_interactions = coaching_ref.where('player_id', '==', player_id).order_by('date', direction=firestore.Query.DESCENDING).limit(30).get()
        streak = _calculate_engagement_streak([doc.to_dict() for doc in recent_interactions])
        
        # Generate schedule for each day
        for day in range(days):
            date = datetime.now() + timedelta(days=day)
            
            # Adjust based on fatigue
            fatigue_adjustment = _get_fatigue_adjustment(wearable_data)
            
            # Adjust based on form
            form_adjustment = _get_form_adjustment(performance_data)
            
            # Adjust based on streak
            streak_adjustment = _get_streak_adjustment(streak)
            
            # Generate day's drills
            day_drills = _generate_day_drills(
                sport=sport,
                preferences=preferences,
                fatigue_adjustment=fatigue_adjustment,
                form_adjustment=form_adjustment,
                streak_adjustment=streak_adjustment,
                day_of_week=date.strftime('%A').lower()
            )
            
            day_schedule = {
                'player_id': player_id,
                'date': date.date().isoformat(),
                'day_of_week': date.strftime('%A').lower(),
                'sport': sport,
                'drills': day_drills,
                'adjustments': {
                    'fatigue': fatigue_adjustment,
                    'form': form_adjustment,
                    'streak': streak_adjustment
                },
                'total_duration': sum(drill.get('duration', 0) for drill in day_drills),
                'intensity_level': _calculate_intensity_level(day_drills),
                'generated_at': datetime.now().isoformat()
            }
            
            schedule.append(day_schedule)
        
        return schedule
        
    except Exception as e:
        logger.error(f"Error generating auto-adjusted schedule: {e}")
        return []

def _get_fatigue_adjustment(wearable_data: Dict) -> Dict:
    """Get drill adjustment based on fatigue level."""
    try:
        fatigue_metrics = wearable_data.get('fatigue_metrics', {})
        overall_fatigue = fatigue_metrics.get('overall_fatigue', 0.5)
        
        if overall_fatigue > 0.7:
            return {
                'intensity_reduction': 0.3,
                'duration_reduction': 0.25,
                'focus': 'recovery_and_form',
                'message': 'High fatigue detected - focus on recovery drills'
            }
        elif overall_fatigue > 0.5:
            return {
                'intensity_reduction': 0.15,
                'duration_reduction': 0.1,
                'focus': 'moderate_intensity',
                'message': 'Moderate fatigue - maintain good form'
            }
        else:
            return {
                'intensity_reduction': 0.0,
                'duration_reduction': 0.0,
                'focus': 'high_intensity',
                'message': 'Low fatigue - ready for intense training'
            }
            
    except Exception as e:
        logger.error(f"Error getting fatigue adjustment: {e}")
        return {'intensity_reduction': 0.0, 'duration_reduction': 0.0, 'focus': 'standard'}

def _get_form_adjustment(performance_data: List[Dict]) -> Dict:
    """Get drill adjustment based on recent form."""
    try:
        if not performance_data:
            return {'focus': 'fundamentals', 'message': 'No recent data - focus on fundamentals'}
        
        # Calculate average form scores
        form_scores = []
        for performance in performance_data:
            form_metrics = performance.get('form_metrics', {})
            avg_form = sum(form_metrics.values()) / len(form_metrics) if form_metrics else 0.5
            form_scores.append(avg_form)
        
        avg_form = sum(form_scores) / len(form_scores)
        
        if avg_form < 0.6:
            return {
                'focus': 'form_correction',
                'intensity_reduction': 0.2,
                'message': 'Form needs improvement - focus on technique'
            }
        elif avg_form < 0.8:
            return {
                'focus': 'form_refinement',
                'intensity_reduction': 0.05,
                'message': 'Good form - refine technique'
            }
        else:
            return {
                'focus': 'performance',
                'intensity_reduction': 0.0,
                'message': 'Excellent form - focus on performance'
            }
            
    except Exception as e:
        logger.error(f"Error getting form adjustment: {e}")
        return {'focus': 'standard', 'message': 'Unable to assess form'}

def _get_streak_adjustment(streak: int) -> Dict:
    """Get drill adjustment based on engagement streak."""
    try:
        if streak >= 10:
            return {
                'intensity_boost': 0.1,
                'duration_boost': 0.05,
                'focus': 'advanced_skills',
                'message': f'Great {streak}-day streak! Ready for advanced drills'
            }
        elif streak >= 5:
            return {
                'intensity_boost': 0.05,
                'duration_boost': 0.02,
                'focus': 'skill_development',
                'message': f'Good {streak}-day streak! Building momentum'
            }
        elif streak >= 3:
            return {
                'intensity_boost': 0.0,
                'duration_boost': 0.0,
                'focus': 'consistency',
                'message': f'Keep up the {streak}-day streak!'
            }
        else:
            return {
                'intensity_boost': 0.0,
                'duration_boost': 0.0,
                'focus': 'building_habits',
                'message': 'Focus on building consistent training habits'
            }
            
    except Exception as e:
        logger.error(f"Error getting streak adjustment: {e}")
        return {'focus': 'standard', 'message': 'Unable to assess streak'}

def _generate_day_drills(sport: str, preferences: Dict, fatigue_adjustment: Dict, form_adjustment: Dict, streak_adjustment: Dict, day_of_week: str) -> List[Dict]:
    """Generate drills for a specific day based on adjustments."""
    try:
        drills = []
        
        # Get base drills for sport
        base_drills = _get_base_drills(sport)
        
        # Apply adjustments
        intensity_modifier = 1.0 - fatigue_adjustment.get('intensity_reduction', 0.0) + streak_adjustment.get('intensity_boost', 0.0)
        duration_modifier = 1.0 - fatigue_adjustment.get('duration_reduction', 0.0) + streak_adjustment.get('duration_boost', 0.0)
        
        # Select drills based on focus areas
        focus_areas = [fatigue_adjustment.get('focus'), form_adjustment.get('focus'), streak_adjustment.get('focus')]
        
        for drill in base_drills:
            # Check if drill matches focus areas
            if any(focus in drill.get('tags', []) for focus in focus_areas):
                adjusted_drill = {
                    **drill,
                    'duration': int(drill.get('duration', 15) * duration_modifier),
                    'intensity': drill.get('intensity', 'medium'),
                    'adjustment_reason': _get_adjustment_reason(fatigue_adjustment, form_adjustment, streak_adjustment)
                }
                drills.append(adjusted_drill)
        
        # Limit to 5 drills per day
        return drills[:5]
        
    except Exception as e:
        logger.error(f"Error generating day drills: {e}")
        return []

def _get_base_drills(sport: str) -> List[Dict]:
    """Get base drill templates for a sport."""
    drill_templates = {
        'basketball': [
            {
                'name': 'Form Shooting',
                'duration': 15,
                'intensity': 'low',
                'tags': ['form_correction', 'fundamentals'],
                'description': 'Focus on proper shooting form'
            },
            {
                'name': 'Ball Handling',
                'duration': 20,
                'intensity': 'medium',
                'tags': ['skill_development', 'consistency'],
                'description': 'Improve ball control and dribbling'
            },
            {
                'name': 'Defensive Slides',
                'duration': 12,
                'intensity': 'high',
                'tags': ['performance', 'advanced_skills'],
                'description': 'Defensive footwork and agility'
            },
            {
                'name': 'Recovery Stretches',
                'duration': 10,
                'intensity': 'low',
                'tags': ['recovery_and_form', 'building_habits'],
                'description': 'Active recovery and flexibility'
            }
        ],
        'soccer': [
            {
                'name': 'Passing Accuracy',
                'duration': 18,
                'intensity': 'medium',
                'tags': ['form_refinement', 'skill_development'],
                'description': 'Improve passing precision'
            },
            {
                'name': 'Dribbling Course',
                'duration': 25,
                'intensity': 'high',
                'tags': ['performance', 'advanced_skills'],
                'description': 'Advanced dribbling techniques'
            }
        ]
    }
    
    return drill_templates.get(sport, drill_templates['basketball'])

def _get_adjustment_reason(fatigue_adjustment: Dict, form_adjustment: Dict, streak_adjustment: Dict) -> str:
    """Get human-readable reason for drill adjustments."""
    reasons = []
    
    if fatigue_adjustment.get('message'):
        reasons.append(fatigue_adjustment['message'])
    if form_adjustment.get('message'):
        reasons.append(form_adjustment['message'])
    if streak_adjustment.get('message'):
        reasons.append(streak_adjustment['message'])
    
    return ' | '.join(reasons) if reasons else 'Standard training plan'

def _calculate_intensity_level(drills: List[Dict]) -> str:
    """Calculate overall intensity level for the day."""
    try:
        if not drills:
            return 'low'
        
        intensity_scores = {'low': 1, 'medium': 2, 'high': 3}
        total_score = sum(intensity_scores.get(drill.get('intensity', 'medium'), 2) for drill in drills)
        avg_score = total_score / len(drills)
        
        if avg_score < 1.5:
            return 'low'
        elif avg_score < 2.5:
            return 'medium'
        else:
            return 'high'
            
    except Exception as e:
        logger.error(f"Error calculating intensity level: {e}")
        return 'medium'

def _calculate_engagement_streak(interactions: List[Dict]) -> int:
    """Calculate current engagement streak."""
    try:
        if not interactions:
            return 0
        
        # Sort by date
        sorted_interactions = sorted(interactions, key=lambda x: x.get('date', ''), reverse=True)
        
        streak = 0
        current_date = datetime.now().date()
        
        for interaction in sorted_interactions:
            interaction_date = datetime.fromisoformat(interaction.get('date', '')).date()
            if (current_date - interaction_date).days == streak:
                streak += 1
            else:
                break
        
        return streak
        
    except Exception as e:
        logger.error(f"Error calculating engagement streak: {e}")
        return 0

# Register blueprint
def init_app(app):
    """Initialize the drills blueprint with the Flask app."""
    app.register_blueprint(drills_bp)
    CORS(app)

if __name__ == "__main__":
    app = Flask(__name__)
    init_app(app)
    app.run(debug=True, port=5004) 