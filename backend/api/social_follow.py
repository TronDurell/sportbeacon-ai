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
import web3
from web3 import Web3

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Flask Blueprint
social_follow_bp = Blueprint('social_follow', __name__)

# Initialize Firebase
if not firebase_admin._apps:
    firebase_admin.initialize_app()

db = firestore.client()

# Initialize Web3
w3 = Web3(Web3.HTTPProvider(os.getenv('WEB3_PROVIDER_URL', 'https://mainnet.infura.io/v3/your-project-id')))

def verify_signature(message: str, signature: str, address: str) -> bool:
    """Verify Ethereum signature for authentication."""
    try:
        message_hash = encode_defunct(text=message)
        recovered_address = Account.recover_message(message_hash, signature=signature)
        return recovered_address.lower() == address.lower()
    except Exception as e:
        logger.error(f"Error verifying signature: {e}")
        return False

@social_follow_bp.route('/api/social/follow', methods=['POST'])
def follow_user():
    """
    Follow another user (athlete or coach).
    
    Required JSON body:
    {
        "wallet_address": "string",
        "signature": "string",
        "message": "string",
        "target_user_id": "string",
        "follow_type": "athlete" | "coach"
    }
    
    Returns:
        JSON response with follow status
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        wallet_address = data.get('wallet_address')
        signature = data.get('signature')
        message = data.get('message')
        target_user_id = data.get('target_user_id')
        follow_type = data.get('follow_type', 'athlete')
        
        if not all([wallet_address, signature, message, target_user_id]):
            return jsonify({'error': 'Missing required fields'}), 400
        
        if not verify_signature(message, signature, wallet_address):
            return jsonify({'error': 'Invalid signature'}), 401
        
        follower_id = wallet_address.lower()
        
        # Prevent self-following
        if follower_id == target_user_id:
            return jsonify({'error': 'Cannot follow yourself'}), 400
        
        # Check if target user exists
        target_user_ref = db.collection('players').document(target_user_id)
        target_user_doc = target_user_ref.get()
        
        if not target_user_doc.exists:
            return jsonify({'error': 'Target user not found'}), 404
        
        # Check if already following
        follow_ref = db.collection('social_follows')
        existing_follow = follow_ref.where('follower_id', '==', follower_id).where('target_user_id', '==', target_user_id).get()
        
        if len(list(existing_follow)) > 0:
            return jsonify({'error': 'Already following this user'}), 409
        
        # Create follow relationship
        follow_data = {
            'follower_id': follower_id,
            'target_user_id': target_user_id,
            'follow_type': follow_type,
            'followed_at': datetime.now(),
            'status': 'active'
        }
        
        follow_ref.add(follow_data)
        
        # Update follower counts
        _update_follower_counts(target_user_id, 1)
        _update_following_counts(follower_id, 1)
        
        # Create social interaction record
        _create_social_interaction(follower_id, target_user_id, 'follow', follow_type)
        
        # Generate coaching insights based on follow
        _generate_follow_insights(follower_id, target_user_id, follow_type)
        
        return jsonify({
            'success': True,
            'message': f'Successfully followed {target_user_id}',
            'follow_data': follow_data,
            'timestamp': datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"Error in follow endpoint: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@social_follow_bp.route('/api/social/follow', methods=['DELETE'])
def unfollow_user():
    """
    Unfollow another user.
    
    Required JSON body:
    {
        "wallet_address": "string",
        "signature": "string",
        "message": "string",
        "target_user_id": "string"
    }
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        wallet_address = data.get('wallet_address')
        signature = data.get('signature')
        message = data.get('message')
        target_user_id = data.get('target_user_id')
        
        if not all([wallet_address, signature, message, target_user_id]):
            return jsonify({'error': 'Missing required fields'}), 400
        
        if not verify_signature(message, signature, wallet_address):
            return jsonify({'error': 'Invalid signature'}), 401
        
        follower_id = wallet_address.lower()
        
        # Find and delete follow relationship
        follow_ref = db.collection('social_follows')
        follow_docs = follow_ref.where('follower_id', '==', follower_id).where('target_user_id', '==', target_user_id).get()
        
        if len(list(follow_docs)) == 0:
            return jsonify({'error': 'Not following this user'}), 404
        
        # Delete follow relationship
        for doc in follow_docs:
            doc.reference.delete()
        
        # Update follower counts
        _update_follower_counts(target_user_id, -1)
        _update_following_counts(follower_id, -1)
        
        return jsonify({
            'success': True,
            'message': f'Successfully unfollowed {target_user_id}',
            'timestamp': datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"Error in unfollow endpoint: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@social_follow_bp.route('/api/social/follow/followers', methods=['GET'])
def get_followers():
    """
    Get list of users following the authenticated user.
    
    Required query params:
    - wallet_address: string
    - signature: string
    - message: string
    - limit: int (optional, default 20)
    - offset: int (optional, default 0)
    """
    try:
        wallet_address = request.args.get('wallet_address')
        signature = request.args.get('signature')
        message = request.args.get('message')
        limit = int(request.args.get('limit', 20))
        offset = int(request.args.get('offset', 0))
        
        if not all([wallet_address, signature, message]):
            return jsonify({'error': 'Missing authentication fields'}), 400
        
        if not verify_signature(message, signature, wallet_address):
            return jsonify({'error': 'Invalid signature'}), 401
        
        user_id = wallet_address.lower()
        
        # Get followers
        follow_ref = db.collection('social_follows')
        followers = follow_ref.where('target_user_id', '==', user_id).where('status', '==', 'active').limit(limit).offset(offset).get()
        
        follower_list = []
        for follower in followers:
            follower_data = follower.to_dict()
            follower_info = _get_user_info(follower_data['follower_id'])
            
            follower_list.append({
                'follower_id': follower_data['follower_id'],
                'follower_name': follower_info.get('name', 'Unknown User'),
                'follower_avatar': follower_info.get('avatar_url'),
                'follow_type': follower_data['follow_type'],
                'followed_at': follower_data['followed_at'].isoformat(),
                'follower_stats': _get_user_stats(follower_data['follower_id'])
            })
        
        return jsonify({
            'followers': follower_list,
            'total_count': len(follower_list),
            'limit': limit,
            'offset': offset,
            'timestamp': datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting followers: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@social_follow_bp.route('/api/social/follow/following', methods=['GET'])
def get_following():
    """
    Get list of users the authenticated user is following.
    
    Required query params:
    - wallet_address: string
    - signature: string
    - message: string
    - limit: int (optional, default 20)
    - offset: int (optional, default 0)
    """
    try:
        wallet_address = request.args.get('wallet_address')
        signature = request.args.get('signature')
        message = request.args.get('message')
        limit = int(request.args.get('limit', 20))
        offset = int(request.args.get('offset', 0))
        
        if not all([wallet_address, signature, message]):
            return jsonify({'error': 'Missing authentication fields'}), 400
        
        if not verify_signature(message, signature, wallet_address):
            return jsonify({'error': 'Invalid signature'}), 401
        
        user_id = wallet_address.lower()
        
        # Get following
        follow_ref = db.collection('social_follows')
        following = follow_ref.where('follower_id', '==', user_id).where('status', '==', 'active').limit(limit).offset(offset).get()
        
        following_list = []
        for follow in following:
            follow_data = follow.to_dict()
            user_info = _get_user_info(follow_data['target_user_id'])
            
            following_list.append({
                'target_user_id': follow_data['target_user_id'],
                'user_name': user_info.get('name', 'Unknown User'),
                'user_avatar': user_info.get('avatar_url'),
                'follow_type': follow_data['follow_type'],
                'followed_at': follow_data['followed_at'].isoformat(),
                'user_stats': _get_user_stats(follow_data['target_user_id'])
            })
        
        return jsonify({
            'following': following_list,
            'total_count': len(following_list),
            'limit': limit,
            'offset': offset,
            'timestamp': datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting following: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@social_follow_bp.route('/api/social/follow/suggestions', methods=['GET'])
def get_follow_suggestions():
    """
    Get personalized follow suggestions based on user's activity and preferences.
    
    Required query params:
    - wallet_address: string
    - signature: string
    - message: string
    - limit: int (optional, default 10)
    """
    try:
        wallet_address = request.args.get('wallet_address')
        signature = request.args.get('signature')
        message = request.args.get('message')
        limit = int(request.args.get('limit', 10))
        
        if not all([wallet_address, signature, message]):
            return jsonify({'error': 'Missing authentication fields'}), 400
        
        if not verify_signature(message, signature, wallet_address):
            return jsonify({'error': 'Invalid signature'}), 401
        
        user_id = wallet_address.lower()
        
        # Get user's current following
        following = _get_user_following(user_id)
        
        # Get user's preferences and activity
        user_prefs = _get_user_preferences(user_id)
        user_activity = _get_user_activity(user_id)
        
        # Generate suggestions based on:
        # 1. Similar skill levels
        # 2. Same sport/position
        # 3. Popular coaches
        # 4. Team members
        # 5. Recent high performers
        
        suggestions = _generate_follow_suggestions(user_id, following, user_prefs, user_activity, limit)
        
        return jsonify({
            'suggestions': suggestions,
            'total_count': len(suggestions),
            'timestamp': datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting follow suggestions: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@social_follow_bp.route('/api/social/follow/feed', methods=['GET'])
def get_social_feed():
    """
    Get social feed from followed users for coaching discovery.
    
    Required query params:
    - wallet_address: string
    - signature: string
    - message: string
    - limit: int (optional, default 20)
    - offset: int (optional, default 0)
    - filter_type: string (optional, 'all', 'coaching', 'achievements', 'drills')
    """
    try:
        wallet_address = request.args.get('wallet_address')
        signature = request.args.get('signature')
        message = request.args.get('message')
        limit = int(request.args.get('limit', 20))
        offset = int(request.args.get('offset', 0))
        filter_type = request.args.get('filter_type', 'all')
        
        if not all([wallet_address, signature, message]):
            return jsonify({'error': 'Missing authentication fields'}), 400
        
        if not verify_signature(message, signature, wallet_address):
            return jsonify({'error': 'Invalid signature'}), 401
        
        user_id = wallet_address.lower()
        
        # Get user's following list
        following = _get_user_following(user_id)
        
        if not following:
            return jsonify({
                'feed': [],
                'message': 'Follow some users to see their activity in your feed',
                'timestamp': datetime.now().isoformat()
            }), 200
        
        # Get feed items from followed users
        feed_items = _get_feed_items(following, filter_type, limit, offset)
        
        return jsonify({
            'feed': feed_items,
            'total_count': len(feed_items),
            'filter_type': filter_type,
            'timestamp': datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting social feed: {e}")
        return jsonify({'error': 'Internal server error'}), 500

def _update_follower_counts(user_id: str, change: int):
    """Update follower count for a user."""
    try:
        user_ref = db.collection('players').document(user_id)
        user_doc = user_ref.get()
        
        if user_doc.exists:
            user_data = user_doc.to_dict()
            current_followers = user_data.get('follower_count', 0)
            new_count = max(0, current_followers + change)
            
            user_ref.update({'follower_count': new_count})
        
    except Exception as e:
        logger.error(f"Error updating follower count: {e}")

def _update_following_counts(user_id: str, change: int):
    """Update following count for a user."""
    try:
        user_ref = db.collection('players').document(user_id)
        user_doc = user_ref.get()
        
        if user_doc.exists:
            user_data = user_doc.to_dict()
            current_following = user_data.get('following_count', 0)
            new_count = max(0, current_following + change)
            
            user_ref.update({'following_count': new_count})
        
    except Exception as e:
        logger.error(f"Error updating following count: {e}")

def _create_social_interaction(follower_id: str, target_user_id: str, interaction_type: str, follow_type: str):
    """Create a social interaction record."""
    try:
        interaction_data = {
            'follower_id': follower_id,
            'target_user_id': target_user_id,
            'interaction_type': interaction_type,
            'follow_type': follow_type,
            'timestamp': datetime.now(),
            'metadata': {
                'source': 'follow_system',
                'platform': 'sportbeacon'
            }
        }
        
        db.collection('social_interactions').add(interaction_data)
        
    except Exception as e:
        logger.error(f"Error creating social interaction: {e}")

def _generate_follow_insights(follower_id: str, target_user_id: str, follow_type: str):
    """Generate coaching insights based on new follow relationship."""
    try:
        # Get target user's recent activity
        target_activity = _get_user_activity(target_user_id)
        
        # Generate personalized insights
        insights = []
        
        if follow_type == 'coach':
            # Coach-specific insights
            coach_drills = target_activity.get('recent_drills', [])
            if coach_drills:
                insights.append({
                    'type': 'coach_drill_suggestion',
                    'message': f'Coach {target_user_id} recently completed {len(coach_drills)} drills. Consider trying their training approach.',
                    'drills': coach_drills[:3]  # Top 3 drills
                })
        
        elif follow_type == 'athlete':
            # Athlete-specific insights
            athlete_achievements = target_activity.get('recent_achievements', [])
            if athlete_achievements:
                insights.append({
                    'type': 'athlete_achievement',
                    'message': f'Athlete {target_user_id} recently earned {len(athlete_achievements)} achievements. Great motivation!',
                    'achievements': athlete_achievements[:3]
                })
        
        # Store insights for the follower
        if insights:
            insight_data = {
                'user_id': follower_id,
                'trigger_user_id': target_user_id,
                'trigger_type': 'follow',
                'insights': insights,
                'generated_at': datetime.now(),
                'status': 'unread'
            }
            
            db.collection('coaching_insights').add(insight_data)
        
    except Exception as e:
        logger.error(f"Error generating follow insights: {e}")

def _get_user_info(user_id: str) -> Dict:
    """Get basic user information."""
    try:
        user_ref = db.collection('players').document(user_id)
        user_doc = user_ref.get()
        
        if user_doc.exists:
            return user_doc.to_dict()
        return {}
        
    except Exception as e:
        logger.error(f"Error getting user info: {e}")
        return {}

def _get_user_stats(user_id: str) -> Dict:
    """Get user statistics for social display."""
    try:
        # Get recent stats (last 30 days)
        start_date = datetime.now() - timedelta(days=30)
        
        # Get BEACON earned
        earnings_ref = db.collection('player_earnings')
        earnings = earnings_ref.where('player_id', '==', user_id).where('date', '>=', start_date).get()
        beacon_earned = sum(doc.to_dict().get('amount', 0) for doc in earnings)
        
        # Get drill completions
        drills_ref = db.collection('drill_completions')
        completions = drills_ref.where('player_id', '==', user_id).where('completed_at', '>=', start_date).get()
        drills_completed = len(list(completions))
        
        # Get achievements
        achievements_ref = db.collection('player_achievements')
        achievements = achievements_ref.where('player_id', '==', user_id).where('earned_at', '>=', start_date).get()
        achievements_earned = len(list(achievements))
        
        return {
            'beacon_earned_30d': beacon_earned,
            'drills_completed_30d': drills_completed,
            'achievements_earned_30d': achievements_earned,
            'activity_score': _calculate_activity_score(beacon_earned, drills_completed, achievements_earned)
        }
        
    except Exception as e:
        logger.error(f"Error getting user stats: {e}")
        return {}

def _get_user_following(user_id: str) -> List[str]:
    """Get list of user IDs that the user is following."""
    try:
        follow_ref = db.collection('social_follows')
        following = follow_ref.where('follower_id', '==', user_id).where('status', '==', 'active').get()
        
        return [doc.to_dict()['target_user_id'] for doc in following]
        
    except Exception as e:
        logger.error(f"Error getting user following: {e}")
        return []

def _get_user_preferences(user_id: str) -> Dict:
    """Get user preferences for suggestion generation."""
    try:
        prefs_ref = db.collection('player_preferences').document(user_id)
        prefs_doc = prefs_ref.get()
        
        if prefs_doc.exists:
            return prefs_doc.to_dict()
        return {}
        
    except Exception as e:
        logger.error(f"Error getting user preferences: {e}")
        return {}

def _get_user_activity(user_id: str) -> Dict:
    """Get user's recent activity for suggestion generation."""
    try:
        start_date = datetime.now() - timedelta(days=7)
        
        # Get recent drills
        drills_ref = db.collection('drill_completions')
        drills = drills_ref.where('player_id', '==', user_id).where('completed_at', '>=', start_date).get()
        recent_drills = [doc.to_dict() for doc in drills]
        
        # Get recent achievements
        achievements_ref = db.collection('player_achievements')
        achievements = achievements_ref.where('player_id', '==', user_id).where('earned_at', '>=', start_date).get()
        recent_achievements = [doc.to_dict() for doc in achievements]
        
        return {
            'recent_drills': recent_drills,
            'recent_achievements': recent_achievements
        }
        
    except Exception as e:
        logger.error(f"Error getting user activity: {e}")
        return {}

def _generate_follow_suggestions(user_id: str, following: List[str], prefs: Dict, activity: Dict, limit: int) -> List[Dict]:
    """Generate personalized follow suggestions."""
    try:
        suggestions = []
        
        # Get all users not already being followed
        all_users_ref = db.collection('players')
        all_users = all_users_ref.get()
        
        for user_doc in all_users:
            user_data = user_doc.to_dict()
            suggested_user_id = user_doc.id
            
            if suggested_user_id in following or suggested_user_id == user_id:
                continue
            
            # Calculate suggestion score based on various factors
            score = _calculate_suggestion_score(user_data, prefs, activity)
            
            if score > 0:
                suggestions.append({
                    'user_id': suggested_user_id,
                    'user_name': user_data.get('name', 'Unknown User'),
                    'user_avatar': user_data.get('avatar_url'),
                    'suggestion_score': score,
                    'reason': _get_suggestion_reason(user_data, prefs, activity),
                    'user_stats': _get_user_stats(suggested_user_id)
                })
        
        # Sort by score and return top suggestions
        suggestions.sort(key=lambda x: x['suggestion_score'], reverse=True)
        return suggestions[:limit]
        
    except Exception as e:
        logger.error(f"Error generating follow suggestions: {e}")
        return []

def _calculate_suggestion_score(user_data: Dict, prefs: Dict, activity: Dict) -> float:
    """Calculate suggestion score for a user."""
    score = 0.0
    
    # Sport/position match
    if prefs.get('sport') == user_data.get('sport'):
        score += 2.0
    
    if prefs.get('position') == user_data.get('position'):
        score += 1.5
    
    # Skill level proximity
    user_skill = user_data.get('skill_level', 0)
    pref_skill = prefs.get('target_skill_level', 0)
    skill_diff = abs(user_skill - pref_skill)
    
    if skill_diff <= 1:
        score += 1.0
    elif skill_diff <= 2:
        score += 0.5
    
    # Recent activity bonus
    recent_activity = user_data.get('last_active', datetime.now() - timedelta(days=30))
    if (datetime.now() - recent_activity).days <= 7:
        score += 0.5
    
    # Popularity bonus
    follower_count = user_data.get('follower_count', 0)
    if follower_count > 100:
        score += 0.3
    elif follower_count > 50:
        score += 0.2
    
    return score

def _get_suggestion_reason(user_data: Dict, prefs: Dict, activity: Dict) -> str:
    """Get human-readable reason for suggestion."""
    reasons = []
    
    if prefs.get('sport') == user_data.get('sport'):
        reasons.append('Same sport')
    
    if prefs.get('position') == user_data.get('position'):
        reasons.append('Same position')
    
    if user_data.get('follower_count', 0) > 100:
        reasons.append('Popular athlete')
    
    if reasons:
        return ', '.join(reasons)
    
    return 'Based on your activity'

def _get_feed_items(following: List[str], filter_type: str, limit: int, offset: int) -> List[Dict]:
    """Get feed items from followed users."""
    try:
        feed_items = []
        
        # Get recent activity from followed users
        start_date = datetime.now() - timedelta(days=7)
        
        # Get drill completions
        if filter_type in ['all', 'drills']:
            drills_ref = db.collection('drill_completions')
            drills = drills_ref.where('player_id', 'in', following).where('completed_at', '>=', start_date).order_by('completed_at', direction=firestore.Query.DESCENDING).limit(limit).offset(offset).get()
            
            for drill in drills:
                drill_data = drill.to_dict()
                user_info = _get_user_info(drill_data['player_id'])
                
                feed_items.append({
                    'type': 'drill_completion',
                    'user_id': drill_data['player_id'],
                    'user_name': user_info.get('name', 'Unknown User'),
                    'user_avatar': user_info.get('avatar_url'),
                    'drill_name': drill_data.get('drill_name', 'Unknown Drill'),
                    'drill_score': drill_data.get('score', 0),
                    'completed_at': drill_data['completed_at'].isoformat(),
                    'timestamp': drill_data['completed_at']
                })
        
        # Get achievements
        if filter_type in ['all', 'achievements']:
            achievements_ref = db.collection('player_achievements')
            achievements = achievements_ref.where('player_id', 'in', following).where('earned_at', '>=', start_date).order_by('earned_at', direction=firestore.Query.DESCENDING).limit(limit).offset(offset).get()
            
            for achievement in achievements:
                achievement_data = achievement.to_dict()
                user_info = _get_user_info(achievement_data['player_id'])
                
                feed_items.append({
                    'type': 'achievement_earned',
                    'user_id': achievement_data['player_id'],
                    'user_name': user_info.get('name', 'Unknown User'),
                    'user_avatar': user_info.get('avatar_url'),
                    'achievement_name': achievement_data.get('name', 'Unknown Achievement'),
                    'achievement_description': achievement_data.get('description', ''),
                    'earned_at': achievement_data['earned_at'].isoformat(),
                    'timestamp': achievement_data['earned_at']
                })
        
        # Sort by timestamp and return
        feed_items.sort(key=lambda x: x['timestamp'], reverse=True)
        return feed_items[:limit]
        
    except Exception as e:
        logger.error(f"Error getting feed items: {e}")
        return []

def _calculate_activity_score(beacon_earned: float, drills_completed: int, achievements_earned: int) -> float:
    """Calculate activity score for social display."""
    return (beacon_earned * 0.5) + (drills_completed * 10) + (achievements_earned * 50)

# Register blueprint
def init_app(app):
    """Initialize the social follow blueprint with the Flask app."""
    app.register_blueprint(social_follow_bp)
    CORS(app)

if __name__ == "__main__":
    app = Flask(__name__)
    init_app(app)
    app.run(debug=True, port=5006) 