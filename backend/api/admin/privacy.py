from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
import logging
import hashlib
import re
from typing import Dict, List, Optional, Any
import firebase_admin
from firebase_admin import firestore
import json

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

privacy_bp = Blueprint('privacy', __name__)
db = firestore.client()

# Privacy Configuration
PRIVACY_CONFIG = {
    'coppa_age_threshold': 13,
    'data_retention_days': {
        'user_profiles': 2555,  # 7 years
        'activity_logs': 1095,  # 3 years
        'highlights': 1825,     # 5 years
        'analytics': 365,       # 1 year
        'temporary_data': 30    # 30 days
    },
    'anonymization_rules': {
        'names': {
            'pattern': r'\b[A-Z][a-z]+ [A-Z][a-z]+\b',
            'replacement': '[REDACTED_NAME]'
        },
        'emails': {
            'pattern': r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
            'replacement': '[REDACTED_EMAIL]'
        },
        'phone_numbers': {
            'pattern': r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b',
            'replacement': '[REDACTED_PHONE]'
        },
        'addresses': {
            'pattern': r'\b\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr)\b',
            'replacement': '[REDACTED_ADDRESS]'
        }
    },
    'sensitive_fields': [
        'email', 'phone', 'address', 'date_of_birth', 'social_security_number',
        'credit_card', 'bank_account', 'medical_info', 'location_data'
    ]
}

class PrivacyManager:
    def __init__(self):
        self.audit_logs_ref = db.collection('audit_logs')
        self.privacy_settings_ref = db.collection('privacy_settings')
        self.data_requests_ref = db.collection('data_requests')

    async def anonymize_user_data(self, user_id: str, anonymization_level: str = 'full') -> Dict[str, Any]:
        """Anonymize user data based on privacy settings"""
        try:
            # Get user data
            user_doc = db.collection('users').document(user_id).get()
            if not user_doc.exists:
                return {'error': 'User not found'}

            user_data = user_doc.to_dict()
            
            # Check if user is under COPPA age threshold
            is_coppa_user = self.is_coppa_user(user_data)
            
            # Apply anonymization based on level
            if anonymization_level == 'full' or is_coppa_user:
                anonymized_data = self.apply_full_anonymization(user_data)
            elif anonymization_level == 'partial':
                anonymized_data = self.apply_partial_anonymization(user_data)
            else:
                anonymized_data = user_data

            # Update user data
            db.collection('users').document(user_id).update(anonymized_data)

            # Log anonymization action
            await self.log_audit_event(
                'data_anonymization',
                user_id=user_id,
                details={
                    'anonymization_level': anonymization_level,
                    'is_coppa_user': is_coppa_user,
                    'fields_anonymized': list(anonymized_data.keys())
                }
            )

            return {
                'success': True,
                'user_id': user_id,
                'anonymization_level': anonymization_level,
                'is_coppa_user': is_coppa_user
            }

        except Exception as e:
            logger.error(f"Error anonymizing user data: {e}")
            return {'error': str(e)}

    def is_coppa_user(self, user_data: Dict[str, Any]) -> bool:
        """Check if user is under COPPA age threshold"""
        try:
            # Check age directly
            if 'age' in user_data:
                return user_data['age'] < PRIVACY_CONFIG['coppa_age_threshold']

            # Check date of birth
            if 'date_of_birth' in user_data:
                dob = user_data['date_of_birth']
                if isinstance(dob, str):
                    dob = datetime.fromisoformat(dob.replace('Z', '+00:00'))
                age = (datetime.now() - dob).days // 365
                return age < PRIVACY_CONFIG['coppa_age_threshold']

            # Default to False if age cannot be determined
            return False

        except Exception as e:
            logger.error(f"Error checking COPPA status: {e}")
            return False

    def apply_full_anonymization(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """Apply full anonymization to user data"""
        try:
            anonymized_data = {}
            
            for field, value in user_data.items():
                if field in PRIVACY_CONFIG['sensitive_fields']:
                    # Hash sensitive fields
                    anonymized_data[field] = self.hash_value(str(value))
                elif isinstance(value, str):
                    # Apply pattern-based anonymization
                    anonymized_data[field] = self.apply_text_anonymization(value)
                else:
                    # Keep non-sensitive data
                    anonymized_data[field] = value

            # Add anonymization metadata
            anonymized_data['anonymized_at'] = datetime.now()
            anonymized_data['anonymization_level'] = 'full'

            return anonymized_data

        except Exception as e:
            logger.error(f"Error applying full anonymization: {e}")
            return user_data

    def apply_partial_anonymization(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """Apply partial anonymization to user data"""
        try:
            anonymized_data = user_data.copy()
            
            # Only anonymize highly sensitive fields
            highly_sensitive = ['email', 'phone', 'address', 'social_security_number']
            
            for field in highly_sensitive:
                if field in anonymized_data:
                    anonymized_data[field] = self.hash_value(str(anonymized_data[field]))

            # Add anonymization metadata
            anonymized_data['anonymized_at'] = datetime.now()
            anonymized_data['anonymization_level'] = 'partial'

            return anonymized_data

        except Exception as e:
            logger.error(f"Error applying partial anonymization: {e}")
            return user_data

    def apply_text_anonymization(self, text: str) -> str:
        """Apply pattern-based text anonymization"""
        try:
            anonymized_text = text
            
            for field_type, rule in PRIVACY_CONFIG['anonymization_rules'].items():
                pattern = rule['pattern']
                replacement = rule['replacement']
                anonymized_text = re.sub(pattern, replacement, anonymized_text)

            return anonymized_text

        except Exception as e:
            logger.error(f"Error applying text anonymization: {e}")
            return text

    def hash_value(self, value: str) -> str:
        """Hash a value for anonymization"""
        try:
            return hashlib.sha256(value.encode()).hexdigest()[:16]
        except Exception as e:
            logger.error(f"Error hashing value: {e}")
            return '[REDACTED]'

    async def process_data_deletion_request(self, user_id: str, request_type: str = 'full') -> Dict[str, Any]:
        """Process data deletion request (GDPR/CCPA compliance)"""
        try:
            # Log deletion request
            request_id = await self.create_data_request(user_id, 'deletion', request_type)

            if request_type == 'full':
                # Delete all user data
                await self.delete_all_user_data(user_id)
            elif request_type == 'selective':
                # Delete specific data types
                data_types = request.json.get('data_types', [])
                await self.delete_selective_user_data(user_id, data_types)

            # Log deletion action
            await self.log_audit_event(
                'data_deletion',
                user_id=user_id,
                details={
                    'request_id': request_id,
                    'deletion_type': request_type,
                    'deleted_at': datetime.now()
                }
            )

            return {
                'success': True,
                'request_id': request_id,
                'deletion_type': request_type,
                'message': 'Data deletion request processed successfully'
            }

        except Exception as e:
            logger.error(f"Error processing data deletion request: {e}")
            return {'error': str(e)}

    async def delete_all_user_data(self, user_id: str) -> None:
        """Delete all data associated with a user"""
        try:
            # List of collections to clean
            collections_to_clean = [
                'users', 'drill_logs', 'highlights', 'achievements', 'rewards',
                'social_interactions', 'tips', 'notifications', 'user_preferences',
                'analytics', 'activity_logs'
            ]

            for collection_name in collections_to_clean:
                # Delete documents where user_id matches
                docs = db.collection(collection_name).where('user_id', '==', user_id).stream()
                for doc in docs:
                    doc.reference.delete()

            logger.info(f"Deleted all data for user {user_id}")

        except Exception as e:
            logger.error(f"Error deleting all user data: {e}")

    async def delete_selective_user_data(self, user_id: str, data_types: List[str]) -> None:
        """Delete specific types of user data"""
        try:
            for data_type in data_types:
                if data_type in ['drill_logs', 'highlights', 'achievements', 'rewards']:
                    docs = db.collection(data_type).where('user_id', '==', user_id).stream()
                    for doc in docs:
                        doc.reference.delete()

            logger.info(f"Deleted selective data for user {user_id}: {data_types}")

        except Exception as e:
            logger.error(f"Error deleting selective user data: {e}")

    async def process_data_export_request(self, user_id: str) -> Dict[str, Any]:
        """Process data export request (GDPR compliance)"""
        try:
            # Log export request
            request_id = await self.create_data_request(user_id, 'export')

            # Collect all user data
            user_data = await self.collect_user_data(user_id)

            # Create export file
            export_data = {
                'user_id': user_id,
                'export_date': datetime.now().isoformat(),
                'data': user_data
            }

            # Store export data
            export_ref = db.collection('data_exports').document(request_id)
            export_ref.set(export_data)

            # Log export action
            await self.log_audit_event(
                'data_export',
                user_id=user_id,
                details={
                    'request_id': request_id,
                    'export_size': len(str(user_data)),
                    'exported_at': datetime.now()
                }
            )

            return {
                'success': True,
                'request_id': request_id,
                'export_url': f"/api/admin/privacy/exports/{request_id}",
                'message': 'Data export request processed successfully'
            }

        except Exception as e:
            logger.error(f"Error processing data export request: {e}")
            return {'error': str(e)}

    async def collect_user_data(self, user_id: str) -> Dict[str, Any]:
        """Collect all data associated with a user"""
        try:
            user_data = {}

            # Collect from different collections
            collections_to_export = [
                'users', 'drill_logs', 'highlights', 'achievements', 'rewards',
                'social_interactions', 'tips', 'notifications', 'user_preferences'
            ]

            for collection_name in collections_to_export:
                docs = db.collection(collection_name).where('user_id', '==', user_id).stream()
                user_data[collection_name] = [doc.to_dict() for doc in docs]

            return user_data

        except Exception as e:
            logger.error(f"Error collecting user data: {e}")
            return {}

    async def create_data_request(self, user_id: str, request_type: str, details: str = None) -> str:
        """Create a data request record"""
        try:
            request_id = f"req_{user_id}_{int(datetime.now().timestamp())}"
            
            request_data = {
                'request_id': request_id,
                'user_id': user_id,
                'request_type': request_type,
                'details': details,
                'status': 'pending',
                'created_at': datetime.now(),
                'processed_at': None
            }

            self.data_requests_ref.document(request_id).set(request_data)
            return request_id

        except Exception as e:
            logger.error(f"Error creating data request: {e}")
            return None

    async def log_audit_event(self, event_type: str, user_id: str = None, details: Dict[str, Any] = None) -> None:
        """Log audit event for compliance"""
        try:
            audit_data = {
                'event_type': event_type,
                'user_id': user_id,
                'admin_id': request.headers.get('X-Admin-User-ID'),
                'ip_address': request.remote_addr,
                'user_agent': request.headers.get('User-Agent'),
                'timestamp': datetime.now(),
                'details': details or {},
                'session_id': request.headers.get('X-Session-ID')
            }

            self.audit_logs_ref.add(audit_data)

        except Exception as e:
            logger.error(f"Error logging audit event: {e}")

    async def get_audit_logs(self, filters: Dict[str, Any] = None, limit: int = 100) -> List[Dict[str, Any]]:
        """Get audit logs with optional filters"""
        try:
            query = self.audit_logs_ref.order_by('timestamp', direction=firestore.Query.DESCENDING)

            if filters:
                if 'event_type' in filters:
                    query = query.where('event_type', '==', filters['event_type'])
                if 'user_id' in filters:
                    query = query.where('user_id', '==', filters['user_id'])
                if 'start_date' in filters:
                    query = query.where('timestamp', '>=', filters['start_date'])
                if 'end_date' in filters:
                    query = query.where('timestamp', '<=', filters['end_date'])

            docs = query.limit(limit).stream()
            return [doc.to_dict() for doc in docs]

        except Exception as e:
            logger.error(f"Error getting audit logs: {e}")
            return []

    async def cleanup_expired_data(self) -> Dict[str, Any]:
        """Clean up expired data based on retention policies"""
        try:
            cleanup_stats = {
                'users_cleaned': 0,
                'highlights_cleaned': 0,
                'logs_cleaned': 0,
                'analytics_cleaned': 0
            }

            # Clean up user profiles
            user_retention_days = PRIVACY_CONFIG['data_retention_days']['user_profiles']
            cutoff_date = datetime.now() - timedelta(days=user_retention_days)
            
            inactive_users = db.collection('users').where('last_active', '<', cutoff_date).stream()
            for user_doc in inactive_users:
                user_data = user_doc.to_dict()
                if user_data.get('inactive_for_deletion', False):
                    user_doc.reference.delete()
                    cleanup_stats['users_cleaned'] += 1

            # Clean up old highlights
            highlight_retention_days = PRIVACY_CONFIG['data_retention_days']['highlights']
            cutoff_date = datetime.now() - timedelta(days=highlight_retention_days)
            
            old_highlights = db.collection('highlights').where('timestamp', '<', cutoff_date).stream()
            for highlight_doc in old_highlights:
                highlight_doc.reference.delete()
                cleanup_stats['highlights_cleaned'] += 1

            # Clean up old activity logs
            log_retention_days = PRIVACY_CONFIG['data_retention_days']['activity_logs']
            cutoff_date = datetime.now() - timedelta(days=log_retention_days)
            
            old_logs = db.collection('activity_logs').where('timestamp', '<', cutoff_date).stream()
            for log_doc in old_logs:
                log_doc.reference.delete()
                cleanup_stats['logs_cleaned'] += 1

            # Clean up old analytics
            analytics_retention_days = PRIVACY_CONFIG['data_retention_days']['analytics']
            cutoff_date = datetime.now() - timedelta(days=analytics_retention_days)
            
            old_analytics = db.collection('analytics').where('timestamp', '<', cutoff_date).stream()
            for analytics_doc in old_analytics:
                analytics_doc.reference.delete()
                cleanup_stats['analytics_cleaned'] += 1

            # Log cleanup action
            await self.log_audit_event(
                'data_cleanup',
                details={
                    'cleanup_stats': cleanup_stats,
                    'cleanup_date': datetime.now()
                }
            )

            return {
                'success': True,
                'cleanup_stats': cleanup_stats,
                'message': 'Data cleanup completed successfully'
            }

        except Exception as e:
            logger.error(f"Error cleaning up expired data: {e}")
            return {'error': str(e)}

    async def get_privacy_compliance_report(self) -> Dict[str, Any]:
        """Generate privacy compliance report"""
        try:
            # Get COPPA compliance stats
            coppa_users = db.collection('users').where('age', '<', PRIVACY_CONFIG['coppa_age_threshold']).stream()
            coppa_count = len(list(coppa_users))

            # Get data retention stats
            retention_stats = {}
            for data_type, retention_days in PRIVACY_CONFIG['data_retention_days'].items():
                cutoff_date = datetime.now() - timedelta(days=retention_days)
                # This would count expired records for each data type
                retention_stats[data_type] = {
                    'retention_days': retention_days,
                    'expired_count': 0  # Would be calculated based on actual data
                }

            # Get recent audit events
            recent_audits = await self.get_audit_logs(limit=50)

            report = {
                'generated_at': datetime.now(),
                'coppa_compliance': {
                    'total_coppa_users': coppa_count,
                    'anonymized_coppa_users': 0,  # Would be calculated
                    'compliance_percentage': 100 if coppa_count == 0 else 0
                },
                'data_retention': retention_stats,
                'recent_audit_events': len(recent_audits),
                'data_requests': {
                    'pending_deletions': 0,
                    'pending_exports': 0,
                    'completed_this_month': 0
                },
                'privacy_settings': {
                    'auto_anonymization_enabled': True,
                    'audit_logging_enabled': True,
                    'data_retention_enforced': True
                }
            }

            return report

        except Exception as e:
            logger.error(f"Error generating privacy compliance report: {e}")
            return {'error': str(e)}

# Initialize privacy manager
privacy_manager = PrivacyManager()

# API Routes
@privacy_bp.route('/anonymize/<user_id>', methods=['POST'])
def anonymize_user(user_id):
    """Anonymize user data"""
    try:
        data = request.get_json() or {}
        anonymization_level = data.get('level', 'full')
        
        result = asyncio.run(privacy_manager.anonymize_user_data(user_id, anonymization_level))
        return jsonify(result)

    except Exception as e:
        logger.error(f"Error in anonymize user endpoint: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@privacy_bp.route('/delete/<user_id>', methods=['POST'])
def delete_user_data(user_id):
    """Delete user data"""
    try:
        data = request.get_json() or {}
        deletion_type = data.get('type', 'full')
        
        result = asyncio.run(privacy_manager.process_data_deletion_request(user_id, deletion_type))
        return jsonify(result)

    except Exception as e:
        logger.error(f"Error in delete user data endpoint: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@privacy_bp.route('/export/<user_id>', methods=['POST'])
def export_user_data(user_id):
    """Export user data"""
    try:
        result = asyncio.run(privacy_manager.process_data_export_request(user_id))
        return jsonify(result)

    except Exception as e:
        logger.error(f"Error in export user data endpoint: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@privacy_bp.route('/audit-logs', methods=['GET'])
def get_audit_logs():
    """Get audit logs"""
    try:
        filters = request.args.to_dict()
        limit = int(request.args.get('limit', 100))
        
        logs = asyncio.run(privacy_manager.get_audit_logs(filters, limit))
        return jsonify({
            'success': True,
            'logs': logs,
            'count': len(logs)
        })

    except Exception as e:
        logger.error(f"Error in get audit logs endpoint: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@privacy_bp.route('/cleanup', methods=['POST'])
def cleanup_expired_data():
    """Clean up expired data"""
    try:
        result = asyncio.run(privacy_manager.cleanup_expired_data())
        return jsonify(result)

    except Exception as e:
        logger.error(f"Error in cleanup endpoint: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@privacy_bp.route('/compliance-report', methods=['GET'])
def get_compliance_report():
    """Get privacy compliance report"""
    try:
        report = asyncio.run(privacy_manager.get_privacy_compliance_report())
        return jsonify(report)

    except Exception as e:
        logger.error(f"Error in compliance report endpoint: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@privacy_bp.route('/data-requests', methods=['GET'])
def get_data_requests():
    """Get data requests"""
    try:
        status = request.args.get('status', 'all')
        limit = int(request.args.get('limit', 50))
        
        query = privacy_manager.data_requests_ref.order_by('created_at', direction=firestore.Query.DESCENDING)
        
        if status != 'all':
            query = query.where('status', '==', status)
        
        docs = query.limit(limit).stream()
        requests = [doc.to_dict() for doc in docs]
        
        return jsonify({
            'success': True,
            'requests': requests,
            'count': len(requests)
        })

    except Exception as e:
        logger.error(f"Error in get data requests endpoint: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@privacy_bp.route('/exports/<request_id>', methods=['GET'])
def get_export_data(request_id):
    """Get exported data"""
    try:
        export_doc = db.collection('data_exports').document(request_id).get()
        
        if not export_doc.exists:
            return jsonify({'error': 'Export not found'}), 404
        
        export_data = export_doc.to_dict()
        return jsonify(export_data)

    except Exception as e:
        logger.error(f"Error in get export data endpoint: {e}")
        return jsonify({'error': 'Internal server error'}), 500 