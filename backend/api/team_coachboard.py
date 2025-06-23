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
team_coachboard_bp = Blueprint('team_coachboard', __name__)

# Initialize Firebase
if not firebase_admin._apps:
    firebase_admin.initialize_app()

db = firestore.client()

# Initialize Web3
w3 = Web3(Web3.HTTPProvider(os.getenv('WEB3_PROVIDER_URL', 'https://mainnet.infura.io/v3/your-project-id')))

# NFT contract configuration
NFT_CONTRACT_ADDRESS = os.getenv('BEACON_NFT_CONTRACT_ADDRESS')
BEACON_TOKEN_ADDRESS = os.getenv('BEACON_TOKEN_CONTRACT_ADDRESS')

def verify_signature(message: str, signature: str, address: str) -> bool:
    """Verify Ethereum signature for authentication."""
    try:
        message_hash = encode_defunct(text=message)
        recovered_address = Account.recover_message(message_hash, signature=signature)
        return recovered_address.lower() == address.lower()
    except Exception as e:
        logger.error(f"Error verifying signature: {e}")
        return False

@team_coachboard_bp.route('/api/team/coachboard', methods=['GET'])
def get_team_coachboard():
    """
    Get team coaching dashboard with stats, leaderboards, and aggregated data.
    
    Required query params:
    - wallet_address: string
    - signature: string
    - message: string
    - team_id: string (optional, defaults to user's team)
    - timeframe: string (optional, 'week', 'month', 'all_time', default 'week')
    
    Returns:
        JSON response with team coaching data
    """
    try:
        # Verify authentication
        wallet_address = request.args.get('wallet_address')
        signature = request.args.get('signature')
        message = request.args.get('message')
        team_id = request.args.get('team_id')
        timeframe = request.args.get('timeframe', 'week')
        
        if not all([wallet_address, signature, message]):
            return jsonify({'error': 'Missing authentication fields'}), 400
        
        if not verify_signature(message, signature, wallet_address):
            return jsonify({'error': 'Invalid signature'}), 401
        
        player_id = wallet_address.lower()
        
        # Get team ID if not provided
        if not team_id:
            team_id = _get_player_team(player_id)
            if not team_id:
                return jsonify({'error': 'Player not part of a team'}), 404
        
        # Get timeframe dates
        start_date, end_date = _get_timeframe_dates(timeframe)
        
        # Get team data
        team_data = _get_team_data(team_id)
        if not team_data:
            return jsonify({'error': 'Team not found'}), 404
        
        # Get team members
        team_members = _get_team_members(team_id)
        
        # Generate leaderboards
        beacon_leaderboard = _generate_beacon_leaderboard(team_members, start_date, end_date)
        nft_tier_leaderboard = _generate_nft_tier_leaderboard(team_members)
        drill_leaderboard = _generate_drill_leaderboard(team_members, start_date, end_date)
        streak_leaderboard = _generate_streak_leaderboard(team_members)
        
        # Get aggregated team stats
        team_stats = _get_team_stats(team_members, start_date, end_date)
        
        # Get team milestones and badges
        team_milestones = _get_team_milestones(team_id, start_date, end_date)
        
        # Get social interactions
        social_data = _get_social_interactions(team_members, start_date, end_date)
        
        return jsonify({
            'team_id': team_id,
            'team_name': team_data.get('name', 'Unknown Team'),
            'timeframe': timeframe,
            'start_date': start_date.isoformat(),
            'end_date': end_date.isoformat(),
            'team_stats': team_stats,
            'leaderboards': {
                'beacon_earned': beacon_leaderboard,
                'nft_tier': nft_tier_leaderboard,
                'drills_completed': drill_leaderboard,
                'engagement_streaks': streak_leaderboard
            },
            'milestones': team_milestones,
            'social_data': social_data,
            'generated_at': datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"Error in team coachboard endpoint: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@team_coachboard_bp.route('/api/team/coachboard/player/<player_id>', methods=['GET'])
def get_player_team_stats(player_id: str):
    """
    Get individual player stats within team context.
    
    Required query params:
    - wallet_address: string
    - signature: string
    - message: string
    - timeframe: string (optional, default 'week')
    """
    try:
        # Verify authentication
        wallet_address = request.args.get('wallet_address')
        signature = request.args.get('signature')
        message = request.args.get('message')
        timeframe = request.args.get('timeframe', 'week')
        
        if not all([wallet_address, signature, message]):
            return jsonify({'error': 'Missing authentication fields'}), 400
        
        if not verify_signature(message, signature, wallet_address):
            return jsonify({'error': 'Invalid signature'}), 401
        
        # Get timeframe dates
        start_date, end_date = _get_timeframe_dates(timeframe)
        
        # Get player's team
        team_id = _get_player_team(player_id)
        if not team_id:
            return jsonify({'error': 'Player not part of a team'}), 404
        
        # Get player stats
        player_stats = _get_player_stats(player_id, start_date, end_date)
        
        # Get player's position in team leaderboards
        team_members = _get_team_members(team_id)
        beacon_leaderboard = _generate_beacon_leaderboard(team_members, start_date, end_date)
        drill_leaderboard = _generate_drill_leaderboard(team_members, start_date, end_date)
        
        player_beacon_rank = next((i + 1 for i, p in enumerate(beacon_leaderboard) if p['player_id'] == player_id), None)
        player_drill_rank = next((i + 1 for i, p in enumerate(drill_leaderboard) if p['player_id'] == player_id), None)
        
        return jsonify({
            'player_id': player_id,
            'team_id': team_id,
            'timeframe': timeframe,
            'stats': player_stats,
            'team_rankings': {
                'beacon_earned': player_beacon_rank,
                'drills_completed': player_drill_rank
            },
            'generated_at': datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting player team stats: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@team_coachboard_bp.route('/api/team/coachboard/compare', methods=['POST'])
def compare_team_players():
    """
    Compare multiple players within a team.
    
    Required JSON body:
    {
        "wallet_address": "string",
        "signature": "string",
        "message": "string",
        "player_ids": ["player1", "player2"],
        "metrics": ["beacon_earned", "drills_completed", "streak"],
        "timeframe": "week"
    }
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        wallet_address = data.get('wallet_address')
        signature = data.get('signature')
        message = data.get('message')
        player_ids = data.get('player_ids', [])
        metrics = data.get('metrics', ['beacon_earned', 'drills_completed'])
        timeframe = data.get('timeframe', 'week')
        
        if not all([wallet_address, signature, message]):
            return jsonify({'error': 'Missing authentication fields'}), 400
        
        if not verify_signature(message, signature, wallet_address):
            return jsonify({'error': 'Invalid signature'}), 401
        
        if len(player_ids) < 2:
            return jsonify({'error': 'Need at least 2 players to compare'}), 400
        
        # Get timeframe dates
        start_date, end_date = _get_timeframe_dates(timeframe)
        
        # Get comparison data
        comparison_data = _compare_players(player_ids, metrics, start_date, end_date)
        
        return jsonify({
            'comparison': comparison_data,
            'timeframe': timeframe,
            'generated_at': datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"Error comparing team players: {e}")
        return jsonify({'error': 'Internal server error'}), 500

def _get_player_team(player_id: str) -> Optional[str]:
    """Get the team ID for a player."""
    try:
        player_ref = db.collection('players').document(player_id)
        player_doc = player_ref.get()
        
        if not player_doc.exists:
            return None
        
        player_data = player_doc.to_dict()
        return player_data.get('team_id')
        
    except Exception as e:
        logger.error(f"Error getting player team: {e}")
        return None

def _get_team_data(team_id: str) -> Optional[Dict]:
    """Get team information."""
    try:
        team_ref = db.collection('teams').document(team_id)
        team_doc = team_ref.get()
        
        if not team_doc.exists:
            return None
        
        return team_doc.to_dict()
        
    except Exception as e:
        logger.error(f"Error getting team data: {e}")
        return None

def _get_team_members(team_id: str) -> List[str]:
    """Get list of team member IDs."""
    try:
        players_ref = db.collection('players')
        team_players = players_ref.where('team_id', '==', team_id).get()
        
        return [doc.id for doc in team_players]
        
    except Exception as e:
        logger.error(f"Error getting team members: {e}")
        return []

def _get_timeframe_dates(timeframe: str) -> tuple:
    """Get start and end dates for timeframe."""
    end_date = datetime.now()
    
    if timeframe == 'week':
        start_date = end_date - timedelta(days=7)
    elif timeframe == 'month':
        start_date = end_date - timedelta(days=30)
    elif timeframe == 'all_time':
        start_date = datetime(2020, 1, 1)  # Arbitrary start date
    else:
        start_date = end_date - timedelta(days=7)  # Default to week
    
    return start_date, end_date

def _generate_beacon_leaderboard(team_members: List[str], start_date: datetime, end_date: datetime) -> List[Dict]:
    """Generate BEACON earned leaderboard for team."""
    try:
        leaderboard = []
        
        for player_id in team_members:
            # Get player's BEACON earnings for timeframe
            earnings_ref = db.collection('player_earnings')
            earnings = earnings_ref.where('player_id', '==', player_id).where('date', '>=', start_date).where('date', '<=', end_date).get()
            
            total_earned = sum(doc.to_dict().get('amount', 0) for doc in earnings)
            
            # Get player info
            player_ref = db.collection('players').document(player_id)
            player_doc = player_ref.get()
            player_data = player_doc.to_dict() if player_doc.exists else {}
            
            leaderboard.append({
                'player_id': player_id,
                'player_name': player_data.get('name', 'Unknown Player'),
                'beacon_earned': total_earned,
                'rank': 0  # Will be set after sorting
            })
        
        # Sort by BEACON earned and assign ranks
        leaderboard.sort(key=lambda x: x['beacon_earned'], reverse=True)
        for i, player in enumerate(leaderboard):
            player['rank'] = i + 1
        
        return leaderboard
        
    except Exception as e:
        logger.error(f"Error generating BEACON leaderboard: {e}")
        return []

def _generate_nft_tier_leaderboard(team_members: List[str]) -> List[Dict]:
    """Generate NFT tier leaderboard for team."""
    try:
        leaderboard = []
        
        for player_id in team_members:
            # Get player's NFT tier
            nft_tier = _get_player_nft_tier(player_id)
            
            # Get player info
            player_ref = db.collection('players').document(player_id)
            player_doc = player_ref.get()
            player_data = player_doc.to_dict() if player_doc.exists else {}
            
            leaderboard.append({
                'player_id': player_id,
                'player_name': player_data.get('name', 'Unknown Player'),
                'nft_tier': nft_tier,
                'tier_score': _get_tier_score(nft_tier),
                'rank': 0
            })
        
        # Sort by tier score and assign ranks
        leaderboard.sort(key=lambda x: x['tier_score'], reverse=True)
        for i, player in enumerate(leaderboard):
            player['rank'] = i + 1
        
        return leaderboard
        
    except Exception as e:
        logger.error(f"Error generating NFT tier leaderboard: {e}")
        return []

def _generate_drill_leaderboard(team_members: List[str], start_date: datetime, end_date: datetime) -> List[Dict]:
    """Generate drills completed leaderboard for team."""
    try:
        leaderboard = []
        
        for player_id in team_members:
            # Get player's completed drills for timeframe
            drills_ref = db.collection('drill_completions')
            completions = drills_ref.where('player_id', '==', player_id).where('completed_at', '>=', start_date).where('completed_at', '<=', end_date).get()
            
            total_drills = len(list(completions))
            
            # Get player info
            player_ref = db.collection('players').document(player_id)
            player_doc = player_ref.get()
            player_data = player_doc.to_dict() if player_doc.exists else {}
            
            leaderboard.append({
                'player_id': player_id,
                'player_name': player_data.get('name', 'Unknown Player'),
                'drills_completed': total_drills,
                'rank': 0
            })
        
        # Sort by drills completed and assign ranks
        leaderboard.sort(key=lambda x: x['drills_completed'], reverse=True)
        for i, player in enumerate(leaderboard):
            player['rank'] = i + 1
        
        return leaderboard
        
    except Exception as e:
        logger.error(f"Error generating drill leaderboard: {e}")
        return []

def _generate_streak_leaderboard(team_members: List[str]) -> List[Dict]:
    """Generate engagement streak leaderboard for team."""
    try:
        leaderboard = []
        
        for player_id in team_members:
            # Get player's current engagement streak
            streak = _get_player_streak(player_id)
            
            # Get player info
            player_ref = db.collection('players').document(player_id)
            player_doc = player_ref.get()
            player_data = player_doc.to_dict() if player_doc.exists else {}
            
            leaderboard.append({
                'player_id': player_id,
                'player_name': player_data.get('name', 'Unknown Player'),
                'current_streak': streak,
                'rank': 0
            })
        
        # Sort by streak and assign ranks
        leaderboard.sort(key=lambda x: x['current_streak'], reverse=True)
        for i, player in enumerate(leaderboard):
            player['rank'] = i + 1
        
        return leaderboard
        
    except Exception as e:
        logger.error(f"Error generating streak leaderboard: {e}")
        return []

def _get_team_stats(team_members: List[str], start_date: datetime, end_date: datetime) -> Dict:
    """Get aggregated team statistics."""
    try:
        total_beacon_earned = 0
        total_drills_completed = 0
        total_sessions = 0
        avg_fatigue = 0
        avg_form_score = 0
        
        for player_id in team_members:
            # Get player stats
            player_stats = _get_player_stats(player_id, start_date, end_date)
            
            total_beacon_earned += player_stats.get('beacon_earned', 0)
            total_drills_completed += player_stats.get('drills_completed', 0)
            total_sessions += player_stats.get('sessions_completed', 0)
            avg_fatigue += player_stats.get('avg_fatigue', 0)
            avg_form_score += player_stats.get('avg_form_score', 0)
        
        member_count = len(team_members)
        
        return {
            'member_count': member_count,
            'total_beacon_earned': total_beacon_earned,
            'total_drills_completed': total_drills_completed,
            'total_sessions': total_sessions,
            'avg_beacon_per_member': total_beacon_earned / member_count if member_count > 0 else 0,
            'avg_drills_per_member': total_drills_completed / member_count if member_count > 0 else 0,
            'avg_fatigue': avg_fatigue / member_count if member_count > 0 else 0,
            'avg_form_score': avg_form_score / member_count if member_count > 0 else 0,
            'team_activity_score': _calculate_team_activity_score(total_drills_completed, total_sessions, member_count)
        }
        
    except Exception as e:
        logger.error(f"Error getting team stats: {e}")
        return {}

def _get_team_milestones(team_id: str, start_date: datetime, end_date: datetime) -> List[Dict]:
    """Get team milestones and achievements."""
    try:
        milestones_ref = db.collection('team_milestones')
        milestones = milestones_ref.where('team_id', '==', team_id).where('achieved_at', '>=', start_date).where('achieved_at', '<=', end_date).get()
        
        return [doc.to_dict() for doc in milestones]
        
    except Exception as e:
        logger.error(f"Error getting team milestones: {e}")
        return []

def _get_social_interactions(team_members: List[str], start_date: datetime, end_date: datetime) -> Dict:
    """Get social interaction data for team."""
    try:
        total_follows = 0
        total_tips = 0
        total_interactions = 0
        
        for player_id in team_members:
            # Get player's social stats
            social_ref = db.collection('social_interactions')
            interactions = social_ref.where('player_id', '==', player_id).where('timestamp', '>=', start_date).where('timestamp', '<=', end_date).get()
            
            for interaction in interactions:
                interaction_data = interaction.to_dict()
                if interaction_data.get('type') == 'follow':
                    total_follows += 1
                elif interaction_data.get('type') == 'tip':
                    total_tips += interaction_data.get('amount', 0)
                total_interactions += 1
        
        return {
            'total_follows': total_follows,
            'total_tips': total_tips,
            'total_interactions': total_interactions,
            'avg_interactions_per_member': total_interactions / len(team_members) if team_members else 0
        }
        
    except Exception as e:
        logger.error(f"Error getting social interactions: {e}")
        return {}

def _get_player_stats(player_id: str, start_date: datetime, end_date: datetime) -> Dict:
    """Get comprehensive player statistics."""
    try:
        # Get BEACON earnings
        earnings_ref = db.collection('player_earnings')
        earnings = earnings_ref.where('player_id', '==', player_id).where('date', '>=', start_date).where('date', '<=', end_date).get()
        beacon_earned = sum(doc.to_dict().get('amount', 0) for doc in earnings)
        
        # Get drill completions
        drills_ref = db.collection('drill_completions')
        completions = drills_ref.where('player_id', '==', player_id).where('completed_at', '>=', start_date).where('completed_at', '<=', end_date).get()
        drills_completed = len(list(completions))
        
        # Get sessions
        sessions_ref = db.collection('coaching_sessions')
        sessions = sessions_ref.where('player_id', '==', player_id).where('start_time', '>=', start_date).where('start_time', '<=', end_date).get()
        sessions_completed = len(list(sessions))
        
        # Get wearable data
        wearables_ref = db.collection('wearable_data')
        wearable_data = wearables_ref.where('player_id', '==', player_id).where('received_at', '>=', start_date).where('received_at', '<=', end_date).get()
        
        fatigue_scores = []
        form_scores = []
        
        for data in wearable_data:
            data_dict = data.to_dict()
            fatigue_scores.append(data_dict.get('fatigue_metrics', {}).get('overall_fatigue', 0))
            form_scores.append(sum(data_dict.get('form_metrics', {}).values()) / len(data_dict.get('form_metrics', {})) if data_dict.get('form_metrics') else 0)
        
        avg_fatigue = sum(fatigue_scores) / len(fatigue_scores) if fatigue_scores else 0
        avg_form_score = sum(form_scores) / len(form_scores) if form_scores else 0
        
        return {
            'beacon_earned': beacon_earned,
            'drills_completed': drills_completed,
            'sessions_completed': sessions_completed,
            'avg_fatigue': avg_fatigue,
            'avg_form_score': avg_form_score,
            'total_workout_time': sessions_completed * 45  # Assume 45 min per session
        }
        
    except Exception as e:
        logger.error(f"Error getting player stats: {e}")
        return {}

def _get_player_nft_tier(player_id: str) -> str:
    """Get player's NFT tier."""
    try:
        # This would typically check on-chain NFT ownership
        # For now, return a mock tier
        return 'premium'  # Mock implementation
        
    except Exception as e:
        logger.error(f"Error getting player NFT tier: {e}")
        return 'basic'

def _get_tier_score(tier: str) -> int:
    """Get numerical score for NFT tier."""
    tier_scores = {
        'basic': 1,
        'premium': 2,
        'elite': 3
    }
    return tier_scores.get(tier, 1)

def _get_player_streak(player_id: str) -> int:
    """Get player's current engagement streak."""
    try:
        # Get recent coaching interactions
        cutoff_date = datetime.now() - timedelta(days=30)
        
        interactions_ref = db.collection('coaching_interactions')
        interactions = interactions_ref.where('player_id', '==', player_id).where('date', '>=', cutoff_date).get()
        
        # Calculate streak
        dates = [doc.to_dict().get('date') for doc in interactions]
        dates.sort()
        
        streak = 0
        current_date = datetime.now().date()
        
        for i in range(len(dates)):
            if (current_date - dates[i].date()).days == i:
                streak += 1
            else:
                break
        
        return streak
        
    except Exception as e:
        logger.error(f"Error getting player streak: {e}")
        return 0

def _calculate_team_activity_score(drills: int, sessions: int, members: int) -> float:
    """Calculate team activity score."""
    if members == 0:
        return 0
    
    # Weighted score based on drills and sessions per member
    drills_per_member = drills / members
    sessions_per_member = sessions / members
    
    return (drills_per_member * 0.6) + (sessions_per_member * 0.4)

def _compare_players(player_ids: List[str], metrics: List[str], start_date: datetime, end_date: datetime) -> Dict:
    """Compare multiple players across specified metrics."""
    try:
        comparison = {
            'players': {},
            'metrics': metrics,
            'timeframe': {
                'start': start_date.isoformat(),
                'end': end_date.isoformat()
            }
        }
        
        for player_id in player_ids:
            player_stats = _get_player_stats(player_id, start_date, end_date)
            comparison['players'][player_id] = player_stats
        
        return comparison
        
    except Exception as e:
        logger.error(f"Error comparing players: {e}")
        return {}

# Register blueprint
def init_app(app):
    """Initialize the team coachboard blueprint with the Flask app."""
    app.register_blueprint(team_coachboard_bp)
    CORS(app)

if __name__ == "__main__":
    app = Flask(__name__)
    init_app(app)
    app.run(debug=True, port=5005) 