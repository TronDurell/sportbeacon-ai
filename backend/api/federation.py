from flask import Blueprint, request, jsonify
from datetime import datetime
import logging
from typing import Dict, List, Optional
import firebase_admin
from firebase_admin import firestore
from services.federation_intelligence import FederationIntelligenceService, RuleConflict, HarmonizedRule

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

federation_bp = Blueprint('federation', __name__)
db = firestore.client()

# Initialize federation intelligence service
federation_intelligence = FederationIntelligenceService()

# Federation Types and Interfaces
class FederationType:
    HIGH_SCHOOL = "high_school"
    COLLEGE = "college"
    PROFESSIONAL = "professional"
    YOUTH = "youth"
    CLUB = "club"
    INTERNATIONAL = "international"

class FederationStatus:
    ACTIVE = "active"
    INACTIVE = "inactive"
    PENDING = "pending"
    SUSPENDED = "suspended"

# Enhanced Federation Configuration
FEDERATION_TEMPLATES = {
    "uil": {
        "name": "University Interscholastic League",
        "type": FederationType.HIGH_SCHOOL,
        "region": "Texas",
        "sports": ["basketball", "soccer", "baseball", "football", "volleyball"],
        "age_brackets": ["high_school_14_18"],
        "website": "https://www.uiltexas.org",
        "contact_email": "info@uiltexas.org",
        "sport_rules": {
            "basketball": {
                "scoring": {"points_per_basket": 2, "free_throw": 1, "three_pointer": 3},
                "timing": {"quarters": 4, "quarter_duration": 8, "overtime": 4},
                "equipment": {"ball_size": "regulation", "hoop_height": "10ft"},
                "field_dimensions": {"court_length": 84, "court_width": 50}
            }
        }
    },
    "ncaa": {
        "name": "National Collegiate Athletic Association",
        "type": FederationType.COLLEGE,
        "region": "United States",
        "sports": ["basketball", "soccer", "baseball", "football", "volleyball", "track"],
        "age_brackets": ["college_18_22"],
        "website": "https://www.ncaa.org",
        "contact_email": "info@ncaa.org",
        "sport_rules": {
            "basketball": {
                "scoring": {"points_per_basket": 2, "free_throw": 1, "three_pointer": 3},
                "timing": {"halves": 2, "half_duration": 20, "overtime": 5},
                "equipment": {"ball_size": "regulation", "hoop_height": "10ft"},
                "field_dimensions": {"court_length": 94, "court_width": 50}
            }
        }
    },
    "aau": {
        "name": "Amateur Athletic Union",
        "type": FederationType.YOUTH,
        "region": "United States",
        "sports": ["basketball", "soccer", "baseball", "volleyball", "track"],
        "age_brackets": ["youth_8_10", "youth_11_13", "high_school_14_18"],
        "website": "https://www.aausports.org",
        "contact_email": "info@aausports.org",
        "sport_rules": {
            "basketball": {
                "scoring": {"points_per_basket": 2, "free_throw": 1, "three_pointer": 3},
                "timing": {"quarters": 4, "quarter_duration": 6, "overtime": 3},
                "equipment": {"ball_size": "youth", "hoop_height": "8ft"},
                "field_dimensions": {"court_length": 74, "court_width": 42}
            }
        }
    },
    "fifa": {
        "name": "Fédération Internationale de Football Association",
        "type": FederationType.INTERNATIONAL,
        "region": "Global",
        "sports": ["soccer"],
        "age_brackets": ["youth_8_10", "youth_11_13", "high_school_14_18", "college_18_22", "adult_18_plus"],
        "website": "https://www.fifa.com",
        "contact_email": "info@fifa.com",
        "sport_rules": {
            "soccer": {
                "scoring": {"goal": 1, "penalty": 1},
                "timing": {"halves": 2, "half_duration": 45, "overtime": 30},
                "equipment": {"ball_size": "regulation", "field_type": "grass"},
                "field_dimensions": {"field_length": 110, "field_width": 70}
            }
        }
    },
    "nba": {
        "name": "National Basketball Association",
        "type": FederationType.PROFESSIONAL,
        "region": "United States",
        "sports": ["basketball"],
        "age_brackets": ["adult_18_plus"],
        "website": "https://www.nba.com",
        "contact_email": "info@nba.com",
        "sport_rules": {
            "basketball": {
                "scoring": {"points_per_basket": 2, "free_throw": 1, "three_pointer": 3},
                "timing": {"quarters": 4, "quarter_duration": 12, "overtime": 5},
                "equipment": {"ball_size": "regulation", "hoop_height": "10ft"},
                "field_dimensions": {"court_length": 94, "court_width": 50}
            }
        }
    }
}

class FederationManager:
    def __init__(self):
        self.federations_ref = db.collection('federations')
        self.regions_ref = db.collection('regions')
        self.school_districts_ref = db.collection('school_districts')

    async def create_federation(self, federation_data: Dict) -> Dict:
        """Create a new federation"""
        try:
            # Validate federation data
            required_fields = ['name', 'type', 'region', 'sports']
            for field in required_fields:
                if field not in federation_data:
                    raise ValueError(f"Missing required field: {field}")

            # Generate federation ID
            federation_id = federation_data.get('id') or f"fed_{federation_data['name'].lower().replace(' ', '_')}_{datetime.now().strftime('%Y%m%d')}"

            # Add metadata
            federation_data.update({
                'id': federation_id,
                'status': FederationStatus.PENDING,
                'created_at': datetime.now(),
                'updated_at': datetime.now(),
                'member_count': 0,
                'verified': False
            })

            # Save to Firestore
            doc_ref = self.federations_ref.document(federation_id)
            doc_ref.set(federation_data)

            logger.info(f"Created federation: {federation_id}")
            return federation_data

        except Exception as e:
            logger.error(f"Error creating federation: {e}")
            raise

    async def get_federation(self, federation_id: str) -> Optional[Dict]:
        """Get federation by ID"""
        try:
            doc = self.federations_ref.document(federation_id).get()
            if doc.exists:
                return doc.to_dict()
            return None
        except Exception as e:
            logger.error(f"Error getting federation {federation_id}: {e}")
            return None

    async def update_federation(self, federation_id: str, updates: Dict) -> bool:
        """Update federation"""
        try:
            updates['updated_at'] = datetime.now()
            self.federations_ref.document(federation_id).update(updates)
            logger.info(f"Updated federation: {federation_id}")
            return True
        except Exception as e:
            logger.error(f"Error updating federation {federation_id}: {e}")
            return False

    async def delete_federation(self, federation_id: str) -> bool:
        """Delete federation"""
        try:
            self.federations_ref.document(federation_id).delete()
            logger.info(f"Deleted federation: {federation_id}")
            return True
        except Exception as e:
            logger.error(f"Error deleting federation {federation_id}: {e}")
            return False

    async def list_federations(self, filters: Dict = None) -> List[Dict]:
        """List federations with optional filters"""
        try:
            query = self.federations_ref

            if filters:
                if 'type' in filters:
                    query = query.where('type', '==', filters['type'])
                if 'region' in filters:
                    query = query.where('region', '==', filters['region'])
                if 'status' in filters:
                    query = query.where('status', '==', filters['status'])
                if 'sport' in filters:
                    query = query.where('sports', 'array_contains', filters['sport'])

            docs = query.stream()
            federations = [doc.to_dict() for doc in docs]
            return federations

        except Exception as e:
            logger.error(f"Error listing federations: {e}")
            return []

    async def add_member_to_federation(self, federation_id: str, member_id: str, member_type: str = 'player') -> bool:
        """Add member to federation"""
        try:
            federation_ref = self.federations_ref.document(federation_id)
            federation = federation_ref.get().to_dict()
            
            if not federation:
                return False

            # Update member count
            federation_ref.update({
                'member_count': firestore.Increment(1),
                'updated_at': datetime.now()
            })

            # Add member record
            member_data = {
                'federation_id': federation_id,
                'member_id': member_id,
                'member_type': member_type,
                'joined_at': datetime.now(),
                'status': 'active'
            }

            db.collection('federation_members').add(member_data)
            return True

        except Exception as e:
            logger.error(f"Error adding member to federation: {e}")
            return False

    async def remove_member_from_federation(self, federation_id: str, member_id: str) -> bool:
        """Remove member from federation"""
        try:
            federation_ref = self.federations_ref.document(federation_id)
            federation = federation_ref.get().to_dict()
            
            if not federation:
                return False

            # Update member count
            federation_ref.update({
                'member_count': firestore.Increment(-1),
                'updated_at': datetime.now()
            })

            # Remove member record
            members_query = db.collection('federation_members').where('federation_id', '==', federation_id).where('member_id', '==', member_id)
            members = members_query.stream()
            
            for member in members:
                member.reference.delete()

            return True

        except Exception as e:
            logger.error(f"Error removing member from federation: {e}")
            return False

    async def get_federation_members(self, federation_id: str) -> List[Dict]:
        """Get federation members"""
        try:
            members_query = db.collection('federation_members').where('federation_id', '==', federation_id)
            members = members_query.stream()
            return [member.to_dict() for member in members]
        except Exception as e:
            logger.error(f"Error getting federation members: {e}")
            return []

    async def verify_federation(self, federation_id: str) -> bool:
        """Verify federation"""
        try:
            self.federations_ref.document(federation_id).update({
                'verified': True,
                'status': FederationStatus.ACTIVE,
                'updated_at': datetime.now()
            })
            logger.info(f"Verified federation: {federation_id}")
            return True
        except Exception as e:
            logger.error(f"Error verifying federation {federation_id}: {e}")
            return False

# Initialize federation manager
federation_manager = FederationManager()

# Enhanced Federation API Routes

@federation_bp.route('/federations', methods=['POST'])
def create_federation():
    """Create a new federation"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        federation = asyncio.run(federation_manager.create_federation(data))
        return jsonify(federation), 201

    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        logger.error(f"Error creating federation: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@federation_bp.route('/federations/<federation_id>', methods=['GET'])
def get_federation(federation_id):
    """Get federation by ID"""
    try:
        federation = asyncio.run(federation_manager.get_federation(federation_id))
        if not federation:
            return jsonify({'error': 'Federation not found'}), 404
        return jsonify(federation), 200

    except Exception as e:
        logger.error(f"Error getting federation: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@federation_bp.route('/federations/<federation_id>', methods=['PUT'])
def update_federation(federation_id):
    """Update federation"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        success = asyncio.run(federation_manager.update_federation(federation_id, data))
        if not success:
            return jsonify({'error': 'Federation not found'}), 404

        return jsonify({'message': 'Federation updated successfully'}), 200

    except Exception as e:
        logger.error(f"Error updating federation: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@federation_bp.route('/federations/<federation_id>', methods=['DELETE'])
def delete_federation(federation_id):
    """Delete federation"""
    try:
        success = asyncio.run(federation_manager.delete_federation(federation_id))
        if not success:
            return jsonify({'error': 'Federation not found'}), 404

        return jsonify({'message': 'Federation deleted successfully'}), 200

    except Exception as e:
        logger.error(f"Error deleting federation: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@federation_bp.route('/federations', methods=['GET'])
def list_federations():
    """List federations with optional filters"""
    try:
        filters = {}
        if request.args.get('type'):
            filters['type'] = request.args.get('type')
        if request.args.get('region'):
            filters['region'] = request.args.get('region')
        if request.args.get('status'):
            filters['status'] = request.args.get('status')
        if request.args.get('sport'):
            filters['sport'] = request.args.get('sport')

        federations = asyncio.run(federation_manager.list_federations(filters))
        return jsonify(federations), 200

    except Exception as e:
        logger.error(f"Error listing federations: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@federation_bp.route('/federations/<federation_id>/members', methods=['POST'])
def add_federation_member(federation_id):
    """Add member to federation"""
    try:
        data = request.get_json()
        if not data or 'member_id' not in data:
            return jsonify({'error': 'Member ID required'}), 400

        member_type = data.get('member_type', 'player')
        success = asyncio.run(federation_manager.add_member_to_federation(federation_id, data['member_id'], member_type))
        
        if not success:
            return jsonify({'error': 'Federation not found'}), 404

        return jsonify({'message': 'Member added successfully'}), 200

    except Exception as e:
        logger.error(f"Error adding federation member: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@federation_bp.route('/federations/<federation_id>/members/<member_id>', methods=['DELETE'])
def remove_federation_member(federation_id, member_id):
    """Remove member from federation"""
    try:
        success = asyncio.run(federation_manager.remove_member_from_federation(federation_id, member_id))
        
        if not success:
            return jsonify({'error': 'Federation or member not found'}), 404

        return jsonify({'message': 'Member removed successfully'}), 200

    except Exception as e:
        logger.error(f"Error removing federation member: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@federation_bp.route('/federations/<federation_id>/members', methods=['GET'])
def get_federation_members(federation_id):
    """Get federation members"""
    try:
        members = asyncio.run(federation_manager.get_federation_members(federation_id))
        return jsonify(members), 200

    except Exception as e:
        logger.error(f"Error getting federation members: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@federation_bp.route('/federations/<federation_id>/verify', methods=['POST'])
def verify_federation(federation_id):
    """Verify federation"""
    try:
        success = asyncio.run(federation_manager.verify_federation(federation_id))
        
        if not success:
            return jsonify({'error': 'Federation not found'}), 404

        return jsonify({'message': 'Federation verified successfully'}), 200

    except Exception as e:
        logger.error(f"Error verifying federation: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@federation_bp.route('/federations/templates', methods=['GET'])
def get_federation_templates():
    """Get available federation templates"""
    try:
        return jsonify(FEDERATION_TEMPLATES), 200
    except Exception as e:
        logger.error(f"Error getting federation templates: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@federation_bp.route('/federations/templates/<template_id>', methods=['POST'])
def create_from_template(template_id):
    """Create federation from template"""
    try:
        if template_id not in FEDERATION_TEMPLATES:
            return jsonify({'error': 'Template not found'}), 404

        template = FEDERATION_TEMPLATES[template_id].copy()
        data = request.get_json() or {}
        
        # Override template with provided data
        template.update(data)
        
        federation = asyncio.run(federation_manager.create_federation(template))
        return jsonify(federation), 201

    except Exception as e:
        logger.error(f"Error creating federation from template: {e}")
        return jsonify({'error': 'Internal server error'}), 500

# New AI Federation Intelligence Routes

@federation_bp.route('/federations/stats/normalize', methods=['POST'])
def normalize_stats_by_region():
    """Normalize player statistics by region"""
    try:
        data = request.get_json()
        if not data or 'stats' not in data or 'player_region' not in data or 'competition_region' not in data:
            return jsonify({'error': 'Stats, player_region, and competition_region required'}), 400

        normalized_stats = asyncio.run(federation_intelligence.normalize_stats_by_region(
            data['stats'],
            data['player_region'],
            data['competition_region']
        ))

        return jsonify({
            'original_stats': data['stats'],
            'normalized_stats': normalized_stats,
            'player_region': data['player_region'],
            'competition_region': data['competition_region']
        }), 200

    except Exception as e:
        logger.error(f"Error normalizing stats: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@federation_bp.route('/federations/conflicts/detect', methods=['POST'])
def detect_rule_conflicts():
    """Detect rule conflicts between federations"""
    try:
        data = request.get_json()
        if not data or 'federation1_id' not in data or 'federation2_id' not in data or 'sport' not in data:
            return jsonify({'error': 'federation1_id, federation2_id, and sport required'}), 400

        conflicts = asyncio.run(federation_intelligence.detect_rule_conflicts(
            data['federation1_id'],
            data['federation2_id'],
            data['sport']
        ))

        return jsonify({
            'conflicts': [conflict.__dict__ for conflict in conflicts],
            'total_conflicts': len(conflicts)
        }), 200

    except Exception as e:
        logger.error(f"Error detecting rule conflicts: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@federation_bp.route('/federations/conflicts/<conflict_id>/resolve', methods=['POST'])
def resolve_rule_conflict(conflict_id):
    """Resolve rule conflict using LLM"""
    try:
        # Get conflict from database
        conflict_doc = db.collection('rule_conflicts').document(conflict_id).get()
        if not conflict_doc.exists:
            return jsonify({'error': 'Conflict not found'}), 404

        conflict_data = conflict_doc.to_dict()
        conflict = RuleConflict(
            id=conflict_data['id'],
            federation1_id=conflict_data['federation1_id'],
            federation2_id=conflict_data['federation2_id'],
            sport=conflict_data['sport'],
            rule_type=conflict_data['rule_type'],
            conflict_description=conflict_data['conflict_description'],
            severity=conflict_data['severity'],
            status=conflict_data['status'],
            resolution=conflict_data.get('resolution'),
            resolved_by=conflict_data.get('resolved_by'),
            resolved_at=conflict_data.get('resolved_at'),
            created_at=conflict_data['created_at']
        )

        resolution = asyncio.run(federation_intelligence.resolve_rule_conflict_llm(conflict))

        return jsonify({
            'conflict_id': conflict_id,
            'resolution': resolution,
            'status': 'resolved'
        }), 200

    except Exception as e:
        logger.error(f"Error resolving rule conflict: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@federation_bp.route('/federations/rules/harmonize', methods=['POST'])
def harmonize_sport_rules():
    """Harmonize rules across multiple federations for a sport"""
    try:
        data = request.get_json()
        if not data or 'sport' not in data or 'federations' not in data:
            return jsonify({'error': 'sport and federations required'}), 400

        harmonized_rule = asyncio.run(federation_intelligence.harmonize_sport_rules(
            data['sport'],
            data['federations']
        ))

        return jsonify({
            'sport': harmonized_rule.sport,
            'rule_type': harmonized_rule.rule_type,
            'base_rule': harmonized_rule.base_rule,
            'federation_overrides': harmonized_rule.federation_overrides,
            'harmonized_rule': harmonized_rule.harmonized_rule,
            'confidence_score': harmonized_rule.confidence_score,
            'last_updated': harmonized_rule.last_updated.isoformat()
        }), 200

    except Exception as e:
        logger.error(f"Error harmonizing sport rules: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@federation_bp.route('/federations/rules/harmonized/<sport>', methods=['GET'])
def get_harmonized_rule(sport):
    """Get harmonized rule for a sport"""
    try:
        rule_type = request.args.get('rule_type', 'harmonized')
        harmonized_rule = asyncio.run(federation_intelligence.get_harmonized_rule(sport, rule_type))
        
        if not harmonized_rule:
            return jsonify({'error': 'Harmonized rule not found'}), 404

        return jsonify({
            'sport': harmonized_rule.sport,
            'rule_type': harmonized_rule.rule_type,
            'base_rule': harmonized_rule.base_rule,
            'federation_overrides': harmonized_rule.federation_overrides,
            'harmonized_rule': harmonized_rule.harmonized_rule,
            'confidence_score': harmonized_rule.confidence_score,
            'last_updated': harmonized_rule.last_updated.isoformat()
        }), 200

    except Exception as e:
        logger.error(f"Error getting harmonized rule: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@federation_bp.route('/federations/conflicts', methods=['GET'])
def list_rule_conflicts():
    """List rule conflicts with optional filters"""
    try:
        filters = {}
        if request.args.get('status'):
            filters['status'] = request.args.get('status')
        if request.args.get('severity'):
            filters['severity'] = request.args.get('severity')
        if request.args.get('sport'):
            filters['sport'] = request.args.get('sport')

        conflicts_query = db.collection('rule_conflicts')
        
        for key, value in filters.items():
            conflicts_query = conflicts_query.where(key, '==', value)

        conflicts = [doc.to_dict() for doc in conflicts_query.stream()]
        
        return jsonify({
            'conflicts': conflicts,
            'total_conflicts': len(conflicts)
        }), 200

    except Exception as e:
        logger.error(f"Error listing rule conflicts: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@federation_bp.route('/federations/regions/stats', methods=['GET'])
def get_region_stats():
    """Get region statistics and normalization factors"""
    try:
        region = request.args.get('region', 'all')
        
        if region == 'all':
            return jsonify({
                'regions': federation_intelligence.region_factors,
                'total_regions': len(federation_intelligence.region_factors)
            }), 200
        else:
            region_stats = federation_intelligence.region_factors.get(region)
            if not region_stats:
                return jsonify({'error': 'Region not found'}), 404
            
            return jsonify({
                'region': region,
                'stats': region_stats.__dict__
            }), 200

    except Exception as e:
        logger.error(f"Error getting region stats: {e}")
        return jsonify({'error': 'Internal server error'}), 500 