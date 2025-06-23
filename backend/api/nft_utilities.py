from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
import firebase_admin
from firebase_admin import firestore, auth
from datetime import datetime, timedelta
import logging
from typing import Dict, List, Optional
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Firestore
db = firestore.client()

# Create blueprint
nft_utilities_bp = Blueprint('nft_utilities', __name__)

@nft_utilities_bp.route('/api/nft/utilities', methods=['GET'])
@cross_origin()
def get_utilities():
    """
    Get all available NFT utilities.
    
    Query parameters:
    - type: Filter by utility type (content, perk, access, reward)
    - tier: Filter by required tier (basic, premium, elite)
    - active: Filter by active status (true/false)
    """
    try:
        # Get query parameters
        utility_type = request.args.get('type')
        tier = request.args.get('tier')
        active_only = request.args.get('active', 'true').lower() == 'true'
        
        # Build query
        utilities_ref = db.collection('nft_utilities')
        
        if active_only:
            utilities_ref = utilities_ref.where('isActive', '==', True)
        
        if utility_type:
            utilities_ref = utilities_ref.where('type', '==', utility_type)
        
        # Get utilities
        utilities_docs = utilities_ref.get()
        
        utilities = []
        for doc in utilities_docs:
            utility_data = doc.to_dict()
            utility_data['id'] = doc.id
            
            # Filter by tier if specified
            if tier and utility_data.get('requiredTier') != tier:
                continue
            
            utilities.append(utility_data)
        
        return jsonify({
            'success': True,
            'utilities': utilities,
            'total': len(utilities)
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching utilities: {e}")
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500

@nft_utilities_bp.route('/api/nft/utilities/<utility_id>', methods=['GET'])
@cross_origin()
def get_utility(utility_id):
    """Get specific utility details."""
    try:
        utility_ref = db.collection('nft_utilities').document(utility_id)
        utility_doc = utility_ref.get()
        
        if not utility_doc.exists:
            return jsonify({
                'success': False,
                'error': 'Utility not found'
            }), 404
        
        utility_data = utility_doc.to_dict()
        utility_data['id'] = utility_doc.id
        
        return jsonify({
            'success': True,
            'utility': utility_data
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching utility: {e}")
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500

@nft_utilities_bp.route('/api/nft/utilities/<utility_id>/access/<address>', methods=['GET'])
@cross_origin()
def check_utility_access(utility_id, address):
    """
    Check if a user has access to a specific utility.
    
    Args:
        utility_id: The utility ID
        address: The user's wallet address
    """
    try:
        # Validate address format
        if not address.startswith('0x') or len(address) != 42:
            return jsonify({
                'success': False,
                'error': 'Invalid address format'
            }), 400
        
        # Get utility details
        utility_ref = db.collection('nft_utilities').document(utility_id)
        utility_doc = utility_ref.get()
        
        if not utility_doc.exists:
            return jsonify({
                'success': False,
                'error': 'Utility not found'
            }), 404
        
        utility_data = utility_doc.to_dict()
        
        # Check if user has access
        has_access = check_user_utility_access(address, utility_data)
        
        return jsonify({
            'success': True,
            'hasAccess': has_access,
            'utilityId': utility_id,
            'address': address
        }), 200
        
    except Exception as e:
        logger.error(f"Error checking utility access: {e}")
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500

@nft_utilities_bp.route('/api/nft/utilities/access/<address>', methods=['GET'])
@cross_origin()
def get_user_utility_access(address):
    """
    Get all utility access for a specific user.
    
    Args:
        address: The user's wallet address
    """
    try:
        # Validate address format
        if not address.startswith('0x') or len(address) != 42:
            return jsonify({
                'success': False,
                'error': 'Invalid address format'
            }), 400
        
        # Get user's utility access
        access_ref = db.collection('user_utility_access')
        user_access = access_ref.where('address', '==', address).get()
        
        access_list = []
        for doc in user_access:
            access_data = doc.to_dict()
            access_data['id'] = doc.id
            access_list.append(access_data)
        
        return jsonify({
            'success': True,
            'access': access_list,
            'total': len(access_list)
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching user utility access: {e}")
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500

@nft_utilities_bp.route('/api/nft/utilities/<utility_id>/unlock', methods=['POST'])
@cross_origin()
def unlock_utility(utility_id):
    """
    Unlock a utility for a user.
    
    Expected payload:
    {
        "address": "0x...",
        "timestamp": 1234567890
    }
    """
    try:
        # Get request data
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'error': 'No data provided'}), 400
        
        address = data.get('address')
        timestamp = data.get('timestamp')
        
        # Validate required fields
        if not all([address, timestamp]):
            return jsonify({
                'success': False, 
                'error': 'Missing required fields: address, timestamp'
            }), 400
        
        # Validate address format
        if not address.startswith('0x') or len(address) != 42:
            return jsonify({
                'success': False, 
                'error': 'Invalid address format'
            }), 400
        
        # Get utility details
        utility_ref = db.collection('nft_utilities').document(utility_id)
        utility_doc = utility_ref.get()
        
        if not utility_doc.exists:
            return jsonify({
                'success': False,
                'error': 'Utility not found'
            }), 404
        
        utility_data = utility_doc.to_dict()
        
        # Verify NFT ownership (simplified - would need blockchain verification)
        if not verify_nft_ownership(address, utility_data):
            return jsonify({
                'success': False,
                'error': 'NFT ownership requirements not met'
            }), 403
        
        # Unlock utility
        unlock_result = process_utility_unlock(address, utility_id, utility_data, timestamp)
        
        if unlock_result['success']:
            return jsonify({
                'success': True,
                'utilityId': utility_id,
                'address': address,
                'unlockedAt': timestamp
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': unlock_result['error']
            }), 500
            
    except Exception as e:
        logger.error(f"Error unlocking utility: {e}")
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500

@nft_utilities_bp.route('/api/nft/utilities/<utility_id>/use', methods=['POST'])
@cross_origin()
def use_utility(utility_id):
    """
    Use a utility (track usage).
    
    Expected payload:
    {
        "address": "0x...",
        "timestamp": 1234567890
    }
    """
    try:
        # Get request data
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'error': 'No data provided'}), 400
        
        address = data.get('address')
        timestamp = data.get('timestamp')
        
        # Validate required fields
        if not all([address, timestamp]):
            return jsonify({
                'success': False, 
                'error': 'Missing required fields: address, timestamp'
            }), 400
        
        # Validate address format
        if not address.startswith('0x') or len(address) != 42:
            return jsonify({
                'success': False, 
                'error': 'Invalid address format'
            }), 400
        
        # Check if user has access to this utility
        if not check_user_has_utility_access(address, utility_id):
            return jsonify({
                'success': False,
                'error': 'No access to this utility'
            }), 403
        
        # Track usage
        usage_result = track_utility_usage(address, utility_id, timestamp)
        
        if usage_result['success']:
            return jsonify({
                'success': True,
                'utilityId': utility_id,
                'address': address,
                'usedAt': timestamp,
                'usageCount': usage_result.get('usageCount', 0)
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': usage_result['error']
            }), 500
            
    except Exception as e:
        logger.error(f"Error using utility: {e}")
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500

@nft_utilities_bp.route('/api/nft/utilities', methods=['POST'])
@cross_origin()
def create_utility():
    """
    Create a new NFT utility (admin only).
    
    Expected payload:
    {
        "name": "Premium Content Access",
        "description": "Access to exclusive highlight breakdowns",
        "type": "content",
        "requiredNFTs": ["0x..."],
        "requiredTier": "premium",
        "metadata": {
            "contentUrl": "https://...",
            "perkDetails": "..."
        }
    }
    """
    try:
        # Verify admin authorization
        auth_header = request.headers.get('Authorization')
        if not auth_header or not verify_admin_auth(auth_header):
            return jsonify({
                'success': False,
                'error': 'Unauthorized - Admin access required'
            }), 401
        
        # Get request data
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'error': 'No data provided'}), 400
        
        # Validate required fields
        required_fields = ['name', 'description', 'type', 'requiredNFTs']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'error': f'Missing required field: {field}'
                }), 400
        
        # Validate utility type
        valid_types = ['content', 'perk', 'access', 'reward']
        if data['type'] not in valid_types:
            return jsonify({
                'success': False,
                'error': f'Invalid utility type. Must be one of: {valid_types}'
            }), 400
        
        # Create utility
        utility_data = {
            'name': data['name'],
            'description': data['description'],
            'type': data['type'],
            'requiredNFTs': data['requiredNFTs'],
            'requiredTokenIds': data.get('requiredTokenIds', []),
            'requiredBalance': data.get('requiredBalance'),
            'requiredTier': data.get('requiredTier'),
            'metadata': data.get('metadata', {}),
            'isActive': True,
            'createdAt': datetime.now(),
            'updatedAt': datetime.now()
        }
        
        # Add to Firestore
        utility_ref = db.collection('nft_utilities').add(utility_data)
        utility_id = utility_ref[1].id
        
        return jsonify({
            'success': True,
            'utilityId': utility_id,
            'utility': {**utility_data, 'id': utility_id}
        }), 201
        
    except Exception as e:
        logger.error(f"Error creating utility: {e}")
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500

# Helper functions

def check_user_utility_access(address: str, utility_data: Dict) -> bool:
    """Check if user has access to a utility based on NFT ownership."""
    try:
        # Get user's NFT ownership
        ownership_ref = db.collection('nft_ownership')
        user_nfts = ownership_ref.where('address', '==', address).get()
        
        user_nft_contracts = []
        for doc in user_nfts:
            nft_data = doc.to_dict()
            user_nft_contracts.append(nft_data.get('contractAddress'))
        
        # Check if user has required NFTs
        required_nfts = utility_data.get('requiredNFTs', [])
        for required_nft in required_nfts:
            if required_nft not in user_nft_contracts:
                return False
        
        # Check tier requirements
        required_tier = utility_data.get('requiredTier')
        if required_tier:
            user_tier = get_user_tier(address)
            if not meets_tier_requirement(user_tier, required_tier):
                return False
        
        return True
        
    except Exception as e:
        logger.error(f"Error checking user utility access: {e}")
        return False

def verify_nft_ownership(address: str, utility_data: Dict) -> bool:
    """Verify NFT ownership for utility unlock."""
    try:
        # This would typically involve blockchain verification
        # For now, we'll use a simplified check
        
        # Get user's NFT ownership from Firestore
        ownership_ref = db.collection('nft_ownership')
        user_nfts = ownership_ref.where('address', '==', address).get()
        
        user_nft_contracts = []
        user_nft_balances = {}
        
        for doc in user_nfts:
            nft_data = doc.to_dict()
            contract = nft_data.get('contractAddress')
            balance = nft_data.get('balance', 0)
            user_nft_contracts.append(contract)
            user_nft_balances[contract] = balance
        
        # Check required NFTs
        required_nfts = utility_data.get('requiredNFTs', [])
        for required_nft in required_nfts:
            if required_nft not in user_nft_contracts:
                return False
            
            # Check balance requirement
            required_balance = utility_data.get('requiredBalance')
            if required_balance and user_nft_balances.get(required_nft, 0) < required_balance:
                return False
        
        # Check token ID requirements
        required_token_ids = utility_data.get('requiredTokenIds', [])
        if required_token_ids:
            user_token_ids = get_user_token_ids(address, required_nfts)
            for required_id in required_token_ids:
                if required_id not in user_token_ids:
                    return False
        
        return True
        
    except Exception as e:
        logger.error(f"Error verifying NFT ownership: {e}")
        return False

def process_utility_unlock(address: str, utility_id: str, utility_data: Dict, timestamp: int) -> Dict:
    """Process utility unlock for a user."""
    try:
        # Check if already unlocked
        access_ref = db.collection('user_utility_access')
        existing_access = access_ref.where('address', '==', address).where('utilityId', '==', utility_id).get()
        
        if existing_access:
            return {
                'success': False,
                'error': 'Utility already unlocked'
            }
        
        # Create access record
        access_data = {
            'address': address,
            'utilityId': utility_id,
            'hasAccess': True,
            'accessGrantedAt': timestamp,
            'usageCount': 0,
            'maxUsage': utility_data.get('maxUsage'),
            'expiresAt': utility_data.get('expiresAt'),
            'createdAt': datetime.now(),
            'updatedAt': datetime.now()
        }
        
        # Add to Firestore
        access_ref.add(access_data)
        
        # Log unlock event
        unlock_log = {
            'address': address,
            'utilityId': utility_id,
            'action': 'unlock',
            'timestamp': timestamp,
            'createdAt': datetime.now()
        }
        db.collection('utility_events').add(unlock_log)
        
        return {
            'success': True,
            'accessGranted': True
        }
        
    except Exception as e:
        logger.error(f"Error processing utility unlock: {e}")
        return {
            'success': False,
            'error': str(e)
        }

def check_user_has_utility_access(address: str, utility_id: str) -> bool:
    """Check if user has access to a specific utility."""
    try:
        access_ref = db.collection('user_utility_access')
        user_access = access_ref.where('address', '==', address).where('utilityId', '==', utility_id).where('hasAccess', '==', True).get()
        
        return len(user_access) > 0
        
    except Exception as e:
        logger.error(f"Error checking user utility access: {e}")
        return False

def track_utility_usage(address: str, utility_id: str, timestamp: int) -> Dict:
    """Track utility usage for a user."""
    try:
        # Get current access record
        access_ref = db.collection('user_utility_access')
        access_docs = access_ref.where('address', '==', address).where('utilityId', '==', utility_id).get()
        
        if not access_docs:
            return {
                'success': False,
                'error': 'No access record found'
            }
        
        access_doc = access_docs[0]
        access_data = access_doc.to_dict()
        
        # Check if usage limit exceeded
        max_usage = access_data.get('maxUsage')
        current_usage = access_data.get('usageCount', 0)
        
        if max_usage and current_usage >= max_usage:
            return {
                'success': False,
                'error': 'Usage limit exceeded'
            }
        
        # Check if access has expired
        expires_at = access_data.get('expiresAt')
        if expires_at and timestamp > expires_at:
            return {
                'success': False,
                'error': 'Access has expired'
            }
        
        # Update usage count
        new_usage_count = current_usage + 1
        access_doc.reference.update({
            'usageCount': new_usage_count,
            'lastUsedAt': timestamp,
            'updatedAt': datetime.now()
        })
        
        # Log usage event
        usage_log = {
            'address': address,
            'utilityId': utility_id,
            'action': 'use',
            'timestamp': timestamp,
            'usageCount': new_usage_count,
            'createdAt': datetime.now()
        }
        db.collection('utility_events').add(usage_log)
        
        return {
            'success': True,
            'usageCount': new_usage_count
        }
        
    except Exception as e:
        logger.error(f"Error tracking utility usage: {e}")
        return {
            'success': False,
            'error': str(e)
        }

def get_user_tier(address: str) -> str:
    """Get user's tier based on NFT ownership."""
    try:
        # Get user's NFTs
        ownership_ref = db.collection('nft_ownership')
        user_nfts = ownership_ref.where('address', '==', address).get()
        
        highest_tier = 'basic'
        for doc in user_nfts:
            nft_data = doc.to_dict()
            tier = nft_data.get('tier', 'basic')
            
            # Determine highest tier
            tier_hierarchy = ['basic', 'premium', 'elite']
            current_index = tier_hierarchy.index(highest_tier)
            tier_index = tier_hierarchy.index(tier)
            
            if tier_index > current_index:
                highest_tier = tier
        
        return highest_tier
        
    except Exception as e:
        logger.error(f"Error getting user tier: {e}")
        return 'basic'

def meets_tier_requirement(user_tier: str, required_tier: str) -> bool:
    """Check if user tier meets required tier."""
    tier_hierarchy = ['basic', 'premium', 'elite']
    
    try:
        user_index = tier_hierarchy.index(user_tier)
        required_index = tier_hierarchy.index(required_tier)
        
        return user_index >= required_index
        
    except ValueError:
        return False

def get_user_token_ids(address: str, contracts: List[str]) -> List[int]:
    """Get user's token IDs for specific contracts."""
    try:
        token_ids = []
        ownership_ref = db.collection('nft_ownership')
        
        for contract in contracts:
            user_nfts = ownership_ref.where('address', '==', address).where('contractAddress', '==', contract).get()
            
            for doc in user_nfts:
                nft_data = doc.to_dict()
                contract_token_ids = nft_data.get('tokenIds', [])
                token_ids.extend(contract_token_ids)
        
        return token_ids
        
    except Exception as e:
        logger.error(f"Error getting user token IDs: {e}")
        return []

def verify_admin_auth(auth_header: str) -> bool:
    """Verify admin authorization."""
    try:
        api_key = os.getenv('NFT_UTILITY_ADMIN_API_KEY')
        if not api_key:
            return False
        
        if auth_header.startswith('Bearer '):
            token = auth_header[7:]
            return token == api_key
        
        return False
        
    except Exception as e:
        logger.error(f"Error verifying admin auth: {e}")
        return False

# Register blueprint
def init_nft_utilities_routes(app):
    """Initialize NFT utilities routes."""
    app.register_blueprint(nft_utilities_bp) 