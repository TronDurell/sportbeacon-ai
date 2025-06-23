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
dao_revenue_bp = Blueprint('dao_revenue', __name__)

@dao_revenue_bp.route('/api/dao/revenue/claim', methods=['POST'])
@cross_origin()
def claim_revenue():
    """
    Claim revenue for a creator from a specific revenue stream.
    
    Expected payload:
    {
        "creator": "0x...",
        "streamId": 1,
        "amount": "10.5",
        "timestamp": 1234567890
    }
    """
    try:
        # Get request data
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'error': 'No data provided'}), 400
        
        creator = data.get('creator')
        stream_id = data.get('streamId')
        amount = data.get('amount')
        timestamp = data.get('timestamp')
        
        # Validate required fields
        if not all([creator, stream_id, amount, timestamp]):
            return jsonify({
                'success': False, 
                'error': 'Missing required fields: creator, streamId, amount, timestamp'
            }), 400
        
        # Validate creator address format
        if not creator.startswith('0x') or len(creator) != 42:
            return jsonify({
                'success': False, 
                'error': 'Invalid creator address format'
            }), 400
        
        # Validate amount
        try:
            amount_float = float(amount)
            if amount_float <= 0:
                return jsonify({
                    'success': False, 
                    'error': 'Amount must be greater than 0'
                }), 400
        except ValueError:
            return jsonify({
                'success': False, 
                'error': 'Invalid amount format'
            }), 400
        
        # Check if creator has sufficient claimable amount
        claimable_amount = get_creator_claimable_amount(creator, stream_id)
        if claimable_amount < amount_float:
            return jsonify({
                'success': False, 
                'error': f'Insufficient claimable amount. Available: {claimable_amount}'
            }), 400
        
        # Check if creator has already claimed recently (prevent spam)
        if is_recent_claim(creator, stream_id):
            return jsonify({
                'success': False, 
                'error': 'Recent claim detected. Please wait before claiming again.'
            }), 429
        
        # Process the claim
        claim_result = process_revenue_claim(creator, stream_id, amount_float, timestamp)
        
        if claim_result['success']:
            return jsonify({
                'success': True,
                'claimId': claim_result['claimId'],
                'txHash': claim_result.get('txHash'),
                'amount': amount,
                'streamId': stream_id,
                'timestamp': timestamp
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': claim_result['error']
            }), 500
            
    except Exception as e:
        logger.error(f"Error processing revenue claim: {e}")
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500

@dao_revenue_bp.route('/api/dao/revenue/claims/<creator_address>', methods=['GET'])
@cross_origin()
def get_creator_claims(creator_address):
    """
    Get all claims for a specific creator.
    
    Query parameters:
    - limit: Number of claims to return (default: 50)
    - offset: Number of claims to skip (default: 0)
    - status: Filter by status (pending, completed, failed)
    """
    try:
        # Validate creator address
        if not creator_address.startswith('0x') or len(creator_address) != 42:
            return jsonify({
                'success': False,
                'error': 'Invalid creator address format'
            }), 400
        
        # Get query parameters
        limit = int(request.args.get('limit', 50))
        offset = int(request.args.get('offset', 0))
        status_filter = request.args.get('status')
        
        # Validate parameters
        if limit > 100:
            limit = 100
        if limit < 1:
            limit = 1
        
        # Build query
        claims_ref = db.collection('revenue_claims')
        query = claims_ref.where('creator', '==', creator_address)
        
        if status_filter:
            query = query.where('status', '==', status_filter)
        
        # Get claims
        claims_docs = query.order_by('timestamp', direction=firestore.Query.DESCENDING).limit(limit).offset(offset).get()
        
        claims = []
        for doc in claims_docs:
            claim_data = doc.to_dict()
            claim_data['id'] = doc.id
            claims.append(claim_data)
        
        return jsonify({
            'success': True,
            'claims': claims,
            'total': len(claims),
            'limit': limit,
            'offset': offset
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching creator claims: {e}")
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500

@dao_revenue_bp.route('/api/dao/revenue/streams', methods=['GET'])
@cross_origin()
def get_revenue_streams():
    """Get all revenue streams."""
    try:
        streams_ref = db.collection('revenue_streams')
        streams_docs = streams_ref.where('isActive', '==', True).get()
        
        streams = []
        for doc in streams_docs:
            stream_data = doc.to_dict()
            stream_data['streamId'] = doc.id
            streams.append(stream_data)
        
        return jsonify({
            'success': True,
            'streams': streams,
            'total': len(streams)
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching revenue streams: {e}")
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500

@dao_revenue_bp.route('/api/dao/revenue/streams/<stream_id>', methods=['GET'])
@cross_origin()
def get_revenue_stream(stream_id):
    """Get specific revenue stream details."""
    try:
        stream_ref = db.collection('revenue_streams').document(stream_id)
        stream_doc = stream_ref.get()
        
        if not stream_doc.exists:
            return jsonify({
                'success': False,
                'error': 'Revenue stream not found'
            }), 404
        
        stream_data = stream_doc.to_dict()
        stream_data['streamId'] = stream_doc.id
        
        return jsonify({
            'success': True,
            'stream': stream_data
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching revenue stream: {e}")
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500

@dao_revenue_bp.route('/api/dao/revenue/creator/<creator_address>', methods=['GET'])
@cross_origin()
def get_creator_revenue(creator_address):
    """
    Get revenue summary for a specific creator.
    
    Query parameters:
    - days: Number of days to look back (default: 30)
    """
    try:
        # Validate creator address
        if not creator_address.startswith('0x') or len(creator_address) != 42:
            return jsonify({
                'success': False,
                'error': 'Invalid creator address format'
            }), 400
        
        # Get query parameters
        days = int(request.args.get('days', 30))
        
        # Calculate cutoff time
        cutoff_time = datetime.now() - timedelta(days=days)
        
        # Get creator's revenue shares
        shares_ref = db.collection('revenue_shares')
        creator_shares = shares_ref.where('creator', '==', creator_address).where('isActive', '==', True).get()
        
        total_shares = 0
        total_released = 0
        shares_data = []
        
        for share_doc in creator_shares:
            share_data = share_doc.to_dict()
            total_shares += share_data.get('shares', 0)
            total_released += share_data.get('totalReleased', 0)
            shares_data.append({
                'shareId': share_doc.id,
                **share_data
            })
        
        # Get recent claims
        claims_ref = db.collection('revenue_claims')
        recent_claims = claims_ref.where('creator', '==', creator_address).where('timestamp', '>=', cutoff_time).get()
        
        recent_claim_amount = 0
        for claim_doc in recent_claims:
            claim_data = claim_doc.to_dict()
            if claim_data.get('status') == 'completed':
                recent_claim_amount += float(claim_data.get('amount', 0))
        
        # Calculate pending amount
        pending_amount = max(0, total_shares - total_released)
        
        return jsonify({
            'success': True,
            'creator': creator_address,
            'totalShares': total_shares,
            'totalReleased': total_released,
            'pendingAmount': pending_amount,
            'recentClaimAmount': recent_claim_amount,
            'shares': shares_data,
            'periodDays': days
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching creator revenue: {e}")
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500

@dao_revenue_bp.route('/api/dao/revenue/distribute/<stream_id>', methods=['POST'])
@cross_origin()
def distribute_revenue(stream_id):
    """
    Distribute revenue for a specific stream (DAO admin only).
    
    Expected payload:
    {
        "amount": "100.0",
        "timestamp": 1234567890
    }
    """
    try:
        # Verify admin authorization (simplified - would need proper auth)
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
        
        amount = data.get('amount')
        timestamp = data.get('timestamp')
        
        # Validate required fields
        if not all([amount, timestamp]):
            return jsonify({
                'success': False, 
                'error': 'Missing required fields: amount, timestamp'
            }), 400
        
        # Validate amount
        try:
            amount_float = float(amount)
            if amount_float <= 0:
                return jsonify({
                    'success': False, 
                    'error': 'Amount must be greater than 0'
                }), 400
        except ValueError:
            return jsonify({
                'success': False, 
                'error': 'Invalid amount format'
            }), 400
        
        # Process distribution
        distribution_result = process_revenue_distribution(stream_id, amount_float, timestamp)
        
        if distribution_result['success']:
            return jsonify({
                'success': True,
                'distributionId': distribution_result['distributionId'],
                'amount': amount,
                'streamId': stream_id,
                'timestamp': timestamp,
                'recipients': distribution_result.get('recipients', [])
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': distribution_result['error']
            }), 500
            
    except Exception as e:
        logger.error(f"Error distributing revenue: {e}")
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500

# Helper functions

def get_creator_claimable_amount(creator: str, stream_id: int) -> float:
    """Get claimable amount for a creator in a specific stream."""
    try:
        # Get creator's shares for this stream
        shares_ref = db.collection('revenue_shares')
        creator_shares = shares_ref.where('creator', '==', creator).where('streamId', '==', stream_id).where('isActive', '==', True).get()
        
        total_shares = 0
        total_released = 0
        
        for share_doc in creator_shares:
            share_data = share_doc.to_dict()
            total_shares += share_data.get('shares', 0)
            total_released += share_data.get('totalReleased', 0)
        
        return max(0, total_shares - total_released)
        
    except Exception as e:
        logger.error(f"Error getting claimable amount: {e}")
        return 0.0

def is_recent_claim(creator: str, stream_id: int, hours: int = 1) -> bool:
    """Check if creator has claimed recently to prevent spam."""
    try:
        cutoff_time = datetime.now() - timedelta(hours=hours)
        
        claims_ref = db.collection('revenue_claims')
        recent_claims = claims_ref.where('creator', '==', creator).where('streamId', '==', stream_id).where('timestamp', '>=', cutoff_time).get()
        
        return len(recent_claims) > 0
        
    except Exception as e:
        logger.error(f"Error checking recent claims: {e}")
        return False

def process_revenue_claim(creator: str, stream_id: int, amount: float, timestamp: int) -> Dict:
    """Process a revenue claim."""
    try:
        # Create claim record
        claim_data = {
            'creator': creator,
            'streamId': stream_id,
            'amount': str(amount),
            'timestamp': timestamp,
            'status': 'pending',
            'createdAt': datetime.now(),
            'updatedAt': datetime.now()
        }
        
        # Add to Firestore
        claim_ref = db.collection('revenue_claims').add(claim_data)
        claim_id = claim_ref[1].id
        
        # Update creator's released amount
        update_creator_released_amount(creator, stream_id, amount)
        
        # In a real implementation, this would trigger blockchain transaction
        # For now, we'll simulate success
        tx_hash = f"0x{claim_id[:64]}"  # Simulated transaction hash
        
        # Update claim status
        db.collection('revenue_claims').document(claim_id).update({
            'status': 'completed',
            'txHash': tx_hash,
            'updatedAt': datetime.now()
        })
        
        return {
            'success': True,
            'claimId': claim_id,
            'txHash': tx_hash
        }
        
    except Exception as e:
        logger.error(f"Error processing revenue claim: {e}")
        return {
            'success': False,
            'error': str(e)
        }

def update_creator_released_amount(creator: str, stream_id: int, amount: float):
    """Update creator's total released amount."""
    try:
        shares_ref = db.collection('revenue_shares')
        creator_shares = shares_ref.where('creator', '==', creator).where('streamId', '==', stream_id).where('isActive', '==', True).get()
        
        for share_doc in creator_shares:
            share_data = share_doc.to_dict()
            current_released = share_data.get('totalReleased', 0)
            
            # Update the share document
            share_doc.reference.update({
                'totalReleased': current_released + amount,
                'updatedAt': datetime.now()
            })
            
    except Exception as e:
        logger.error(f"Error updating creator released amount: {e}")

def process_revenue_distribution(stream_id: int, amount: float, timestamp: int) -> Dict:
    """Process revenue distribution for a stream."""
    try:
        # Get all active creators for this stream
        shares_ref = db.collection('revenue_shares')
        stream_shares = shares_ref.where('streamId', '==', stream_id).where('isActive', '==', True).get()
        
        total_shares = 0
        creators = []
        
        for share_doc in stream_shares:
            share_data = share_doc.to_dict()
            creator_shares = share_data.get('shares', 0)
            total_shares += creator_shares
            creators.append({
                'creator': share_data.get('creator'),
                'shares': creator_shares
            })
        
        if total_shares == 0:
            return {
                'success': False,
                'error': 'No active shares found for this stream'
            }
        
        # Calculate distribution amounts
        recipients = []
        for creator_info in creators:
            creator_amount = (amount * creator_info['shares']) / total_shares
            recipients.append({
                'creator': creator_info['creator'],
                'amount': creator_amount,
                'shares': creator_info['shares']
            })
        
        # Create distribution record
        distribution_data = {
            'streamId': stream_id,
            'totalAmount': str(amount),
            'timestamp': timestamp,
            'recipients': recipients,
            'createdAt': datetime.now()
        }
        
        distribution_ref = db.collection('revenue_distributions').add(distribution_data)
        distribution_id = distribution_ref[1].id
        
        return {
            'success': True,
            'distributionId': distribution_id,
            'recipients': recipients
        }
        
    except Exception as e:
        logger.error(f"Error processing revenue distribution: {e}")
        return {
            'success': False,
            'error': str(e)
        }

def verify_admin_auth(auth_header: str) -> bool:
    """Verify admin authorization (simplified implementation)."""
    try:
        # In a real implementation, this would verify JWT tokens or other auth
        # For now, we'll use a simple API key check
        api_key = os.getenv('DAO_ADMIN_API_KEY')
        if not api_key:
            return False
        
        # Extract token from "Bearer <token>" format
        if auth_header.startswith('Bearer '):
            token = auth_header[7:]
            return token == api_key
        
        return False
        
    except Exception as e:
        logger.error(f"Error verifying admin auth: {e}")
        return False

# Register blueprint
def init_dao_revenue_routes(app):
    """Initialize DAO revenue routes."""
    app.register_blueprint(dao_revenue_bp) 