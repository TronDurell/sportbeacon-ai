import asyncio
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

# Import the coaching engine
import sys
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'ai'))
from coaching_engine import AICoachingEngine

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Flask Blueprint
coach_bp = Blueprint('coach', __name__)

# Initialize Firebase
if not firebase_admin._apps:
    firebase_admin.initialize_app()

db = firestore.client()

# Initialize Web3
w3 = Web3(Web3.HTTPProvider(os.getenv('WEB3_PROVIDER_URL', 'https://mainnet.infura.io/v3/your-project-id')))

# Initialize coaching engine
coaching_engine = AICoachingEngine()

# NFT contract addresses and ABIs
NFT_CONTRACT_ADDRESS = os.getenv('BEACON_NFT_CONTRACT_ADDRESS')
NFT_ABI = [
    {
        "inputs": [
            {"internalType": "address", "name": "owner", "type": "address"},
            {"internalType": "uint256", "name": "index", "type": "uint256"}
        ],
        "name": "tokenOfOwnerByIndex",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "address", "name": "owner", "type": "address"}],
        "name": "balanceOf",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "uint256", "name": "tokenId", "type": "uint256"}],
        "name": "tokenURI",
        "outputs": [{"internalType": "string", "name": "", "type": "string"}],
        "stateMutability": "view",
        "type": "function"
    }
]

def verify_signature(message: str, signature: str, address: str) -> bool:
    """
    Verify Ethereum signature for authentication.
    
    Args:
        message: The message that was signed
        signature: The signature to verify
        address: The Ethereum address that should have signed the message
        
    Returns:
        bool: True if signature is valid, False otherwise
    """
    try:
        # Create the message hash
        message_hash = encode_defunct(text=message)
        
        # Recover the address from the signature
        recovered_address = Account.recover_message(message_hash, signature=signature)
        
        # Check if the recovered address matches the provided address
        return recovered_address.lower() == address.lower()
        
    except Exception as e:
        logger.error(f"Error verifying signature: {e}")
        return False

def get_nft_subscription_tier(wallet_address: str) -> str:
    """
    Get the subscription tier based on NFT ownership.
    
    Args:
        wallet_address: The user's wallet address
        
    Returns:
        str: Subscription tier (basic, premium, elite)
    """
    try:
        if not NFT_CONTRACT_ADDRESS:
            logger.warning("NFT contract address not configured, defaulting to basic tier")
            return 'basic'
        
        # Create contract instance
        contract = w3.eth.contract(address=NFT_CONTRACT_ADDRESS, abi=NFT_ABI)
        
        # Get NFT balance
        balance = contract.functions.balanceOf(wallet_address).call()
        
        if balance == 0:
            return 'basic'
        
        # Check for specific NFT tiers
        elite_tokens = []
        premium_tokens = []
        
        for i in range(balance):
            try:
                token_id = contract.functions.tokenOfOwnerByIndex(wallet_address, i).call()
                token_uri = contract.functions.tokenURI(token_id).call()
                
                # Parse token metadata to determine tier
                # This would typically involve fetching the token URI and parsing the metadata
                # For now, we'll use a simple heuristic based on token ID ranges
                
                if token_id >= 1000:  # Elite tier tokens
                    elite_tokens.append(token_id)
                elif token_id >= 100:  # Premium tier tokens
                    premium_tokens.append(token_id)
                    
            except Exception as e:
                logger.error(f"Error checking token {i}: {e}")
                continue
        
        # Determine tier based on highest tier NFT owned
        if elite_tokens:
            return 'elite'
        elif premium_tokens:
            return 'premium'
        else:
            return 'basic'
            
    except Exception as e:
        logger.error(f"Error getting NFT subscription tier: {e}")
        return 'basic'

def check_daily_limit(player_id: str, subscription_tier: str) -> bool:
    """
    Check if player has exceeded daily coaching request limit.
    
    Args:
        player_id: The player's unique identifier
        subscription_tier: The player's subscription tier
        
    Returns:
        bool: True if within limit, False if exceeded
    """
    try:
        # Get daily limits based on tier
        daily_limits = {
            'basic': 1,
            'premium': 3,
            'elite': 5
        }
        
        daily_limit = daily_limits.get(subscription_tier, 1)
        
        # Get today's date
        today = datetime.now().date()
        
        # Count today's coaching requests
        coaching_ref = db.collection('coaching_requests')
        today_requests = coaching_ref.where('player_id', '==', player_id).where('date', '>=', today).get()
        
        request_count = len(list(today_requests))
        
        return request_count < daily_limit
        
    except Exception as e:
        logger.error(f"Error checking daily limit: {e}")
        return False

def log_coaching_request(player_id: str, sport: str, subscription_tier: str, request_data: Dict):
    """
    Log coaching request for analytics and rate limiting.
    
    Args:
        player_id: The player's unique identifier
        sport: The sport for coaching
        subscription_tier: The player's subscription tier
        request_data: The request data to log
    """
    try:
        coaching_ref = db.collection('coaching_requests')
        
        log_entry = {
            'player_id': player_id,
            'sport': sport,
            'subscription_tier': subscription_tier,
            'request_data': request_data,
            'timestamp': datetime.now(),
            'date': datetime.now().date(),
            'ip_address': request.remote_addr,
            'user_agent': request.headers.get('User-Agent', '')
        }
        
        coaching_ref.add(log_entry)
        
    except Exception as e:
        logger.error(f"Error logging coaching request: {e}")

@coach_bp.route('/api/coach/recommendations', methods=['POST'])
def get_coaching_recommendations():
    """
    Get personalized coaching recommendations.
    
    Required JSON body:
    {
        "player_id": "string",
        "sport": "string",
        "wallet_address": "string",
        "signature": "string",
        "message": "string",
        "focus_skills": ["string"] (optional)
    }
    
    Returns:
        JSON response with coaching recommendations
    """
    try:
        # Get request data
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Extract required fields
        player_id = data.get('player_id')
        sport = data.get('sport')
        wallet_address = data.get('wallet_address')
        signature = data.get('signature')
        message = data.get('message')
        focus_skills = data.get('focus_skills', [])
        
        # Validate required fields
        if not all([player_id, sport, wallet_address, signature, message]):
            return jsonify({
                'error': 'Missing required fields: player_id, sport, wallet_address, signature, message'
            }), 400
        
        # Verify signature
        if not verify_signature(message, signature, wallet_address):
            return jsonify({'error': 'Invalid signature'}), 401
        
        # Get subscription tier based on NFT ownership
        subscription_tier = get_nft_subscription_tier(wallet_address)
        
        # Check daily limit
        if not check_daily_limit(player_id, subscription_tier):
            daily_limits = {'basic': 1, 'premium': 3, 'elite': 5}
            limit = daily_limits.get(subscription_tier, 1)
            return jsonify({
                'error': f'Daily limit exceeded. You can request {limit} coaching recommendations per day with your {subscription_tier} tier.'
            }), 429
        
        # Log the request
        log_coaching_request(player_id, sport, subscription_tier, data)
        
        # Get coaching recommendations
        async def get_recommendations():
            return await coaching_engine.get_coaching_recommendations(
                player_id=player_id,
                sport=sport,
                subscription_tier=subscription_tier
            )
        
        # Run async function
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        recommendations = loop.run_until_complete(get_recommendations())
        loop.close()
        
        if 'error' in recommendations:
            return jsonify({'error': recommendations['error']}), 500
        
        # Add subscription tier info to response
        recommendations['subscription_tier'] = subscription_tier
        recommendations['daily_limit'] = {
            'basic': 1,
            'premium': 3,
            'elite': 5
        }.get(subscription_tier, 1)
        
        return jsonify(recommendations), 200
        
    except Exception as e:
        logger.error(f"Error in coaching recommendations endpoint: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@coach_bp.route('/api/coach/training-plan', methods=['POST'])
def generate_training_plan():
    """
    Generate personalized training plan.
    
    Required JSON body:
    {
        "player_id": "string",
        "sport": "string",
        "wallet_address": "string",
        "signature": "string",
        "message": "string",
        "focus_skills": ["string"] (optional)
    }
    
    Returns:
        JSON response with training plan
    """
    try:
        # Get request data
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Extract required fields
        player_id = data.get('player_id')
        sport = data.get('sport')
        wallet_address = data.get('wallet_address')
        signature = data.get('signature')
        message = data.get('message')
        focus_skills = data.get('focus_skills', [])
        
        # Validate required fields
        if not all([player_id, sport, wallet_address, signature, message]):
            return jsonify({
                'error': 'Missing required fields: player_id, sport, wallet_address, signature, message'
            }), 400
        
        # Verify signature
        if not verify_signature(message, signature, wallet_address):
            return jsonify({'error': 'Invalid signature'}), 401
        
        # Get subscription tier
        subscription_tier = get_nft_subscription_tier(wallet_address)
        
        # Check daily limit
        if not check_daily_limit(player_id, subscription_tier):
            daily_limits = {'basic': 1, 'premium': 3, 'elite': 5}
            limit = daily_limits.get(subscription_tier, 1)
            return jsonify({
                'error': f'Daily limit exceeded. You can request {limit} training plans per day with your {subscription_tier} tier.'
            }), 429
        
        # Log the request
        log_coaching_request(player_id, sport, subscription_tier, data)
        
        # Generate training plan
        async def generate_plan():
            return await coaching_engine.generate_training_plan(
                player_id=player_id,
                sport=sport,
                focus_skills=focus_skills if focus_skills else None
            )
        
        # Run async function
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        training_plan = loop.run_until_complete(generate_plan())
        loop.close()
        
        if 'error' in training_plan:
            return jsonify({'error': training_plan['error']}), 500
        
        # Add subscription tier info
        training_plan['subscription_tier'] = subscription_tier
        
        return jsonify(training_plan), 200
        
    except Exception as e:
        logger.error(f"Error in training plan endpoint: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@coach_bp.route('/api/coach/performance-analysis', methods=['POST'])
def analyze_performance():
    """
    Analyze player performance and identify skill gaps.
    
    Required JSON body:
    {
        "player_id": "string",
        "sport": "string",
        "wallet_address": "string",
        "signature": "string",
        "message": "string"
    }
    
    Returns:
        JSON response with performance analysis
    """
    try:
        # Get request data
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Extract required fields
        player_id = data.get('player_id')
        sport = data.get('sport')
        wallet_address = data.get('wallet_address')
        signature = data.get('signature')
        message = data.get('message')
        
        # Validate required fields
        if not all([player_id, sport, wallet_address, signature, message]):
            return jsonify({
                'error': 'Missing required fields: player_id, sport, wallet_address, signature, message'
            }), 400
        
        # Verify signature
        if not verify_signature(message, signature, wallet_address):
            return jsonify({'error': 'Invalid signature'}), 401
        
        # Get subscription tier
        subscription_tier = get_nft_subscription_tier(wallet_address)
        
        # Check daily limit
        if not check_daily_limit(player_id, subscription_tier):
            daily_limits = {'basic': 1, 'premium': 3, 'elite': 5}
            limit = daily_limits.get(subscription_tier, 1)
            return jsonify({
                'error': f'Daily limit exceeded. You can request {limit} analyses per day with your {subscription_tier} tier.'
            }), 429
        
        # Log the request
        log_coaching_request(player_id, sport, subscription_tier, data)
        
        # Analyze performance
        async def analyze():
            return await coaching_engine.analyze_player_performance(
                player_id=player_id,
                sport=sport
            )
        
        # Run async function
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        analysis = loop.run_until_complete(analyze())
        loop.close()
        
        if 'error' in analysis:
            return jsonify({'error': analysis['error']}), 500
        
        # Add subscription tier info
        analysis['subscription_tier'] = subscription_tier
        
        return jsonify(analysis), 200
        
    except Exception as e:
        logger.error(f"Error in performance analysis endpoint: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@coach_bp.route('/api/coach/subscription-info', methods=['POST'])
def get_subscription_info():
    """
    Get user's subscription information and limits.
    
    Required JSON body:
    {
        "wallet_address": "string",
        "signature": "string",
        "message": "string"
    }
    
    Returns:
        JSON response with subscription information
    """
    try:
        # Get request data
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Extract required fields
        wallet_address = data.get('wallet_address')
        signature = data.get('signature')
        message = data.get('message')
        
        # Validate required fields
        if not all([wallet_address, signature, message]):
            return jsonify({
                'error': 'Missing required fields: wallet_address, signature, message'
            }), 400
        
        # Verify signature
        if not verify_signature(message, signature, wallet_address):
            return jsonify({'error': 'Invalid signature'}), 401
        
        # Get subscription tier
        subscription_tier = get_nft_subscription_tier(wallet_address)
        
        # Get subscription info
        subscription_info = {
            'wallet_address': wallet_address,
            'subscription_tier': subscription_tier,
            'daily_limit': {
                'basic': 1,
                'premium': 3,
                'elite': 5
            }.get(subscription_tier, 1),
            'reward_multiplier': {
                'basic': 1.0,
                'premium': 1.5,
                'elite': 2.0
            }.get(subscription_tier, 1.0),
            'access_level': {
                'basic': 'basic_coaching',
                'premium': 'advanced_coaching',
                'elite': 'elite_coaching'
            }.get(subscription_tier, 'basic_coaching'),
            'features': {
                'basic': ['Basic training plans', 'Skill gap analysis'],
                'premium': ['Advanced training plans', 'Detailed skill analysis', 'Highlight recommendations', 'Progress tracking'],
                'elite': ['Elite training plans', 'Comprehensive analysis', 'Personalized coaching', 'Priority support', 'Advanced analytics']
            }.get(subscription_tier, ['Basic training plans'])
        }
        
        return jsonify(subscription_info), 200
        
    except Exception as e:
        logger.error(f"Error in subscription info endpoint: {e}")
        return jsonify({'error': 'Internal server error'}), 500

# Register blueprint
def init_app(app):
    """Initialize the coach blueprint with the Flask app."""
    app.register_blueprint(coach_bp)
    CORS(app)

if __name__ == "__main__":
    # Test the endpoints
    app = Flask(__name__)
    init_app(app)
    app.run(debug=True, port=5001) 