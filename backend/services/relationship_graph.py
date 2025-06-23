import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Set
import firebase_admin
from firebase_admin import firestore
from collections import defaultdict
import networkx as nx
import json

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Firebase
db = firestore.client()

# Relationship Types
class RelationshipType:
    COACH_PLAYER = "coach_player"
    PLAYER_COACH = "player_coach"
    TEAMMATE = "teammate"
    MENTOR_MENTEE = "mentor_mentee"
    TRAINING_PARTNER = "training_partner"

# Connection Strength Factors
CONNECTION_STRENGTH_WEIGHTS = {
    'drills_coached': 10,           # Weight per drill coached
    'highlights_tagged': 5,         # Weight per highlight tagged
    'messages_sent': 2,             # Weight per message
    'training_sessions': 15,        # Weight per training session
    'achievements_shared': 8,       # Weight per shared achievement
    'tournaments_attended': 12,     # Weight per tournament
    'feedback_given': 3,            # Weight per feedback
    'goals_set': 6,                 # Weight per goal setting session
    'time_spent': 1,                # Weight per hour spent together
    'mutual_follow': 4,             # Weight for mutual follow
    'team_membership': 7,           # Weight for being on same team
    'seasonal_events': 9,           # Weight for seasonal events
}

class RelationshipGraph:
    def __init__(self):
        self.relationships_ref = db.collection('relationships')
        self.interactions_ref = db.collection('interactions')
        self.graph = nx.Graph()
        self.cache = {}
        self.cache_ttl = 300  # 5 minutes

    async def create_relationship(self, from_user_id: str, to_user_id: str, relationship_type: str, metadata: Dict = None) -> bool:
        """Create a new relationship between users"""
        try:
            # Validate relationship type
            if relationship_type not in [RelationshipType.COACH_PLAYER, RelationshipType.PLAYER_COACH, 
                                       RelationshipType.TEAMMATE, RelationshipType.MENTOR_MENTEE, 
                                       RelationshipType.TRAINING_PARTNER]:
                return False

            # Check if relationship already exists
            existing = await self.get_relationship(from_user_id, to_user_id)
            if existing:
                # Update existing relationship
                return await self.update_relationship(from_user_id, to_user_id, metadata)

            # Create new relationship
            relationship_data = {
                'from_user_id': from_user_id,
                'to_user_id': to_user_id,
                'relationship_type': relationship_type,
                'strength': 0,
                'created_at': datetime.now(),
                'updated_at': datetime.now(),
                'metadata': metadata or {},
                'interaction_count': 0,
                'last_interaction': None
            }

            self.relationships_ref.add(relationship_data)
            
            # Update graph
            self.graph.add_edge(from_user_id, to_user_id, **relationship_data)
            
            # Clear cache
            self.clear_cache()

            logger.info(f"Created relationship: {from_user_id} -> {to_user_id} ({relationship_type})")
            return True

        except Exception as e:
            logger.error(f"Error creating relationship: {e}")
            return False

    async def update_relationship(self, from_user_id: str, to_user_id: str, metadata: Dict) -> bool:
        """Update existing relationship"""
        try:
            # Find relationship document
            query = self.relationships_ref.where('from_user_id', '==', from_user_id).where('to_user_id', '==', to_user_id)
            docs = query.stream()
            
            for doc in docs:
                doc.reference.update({
                    'metadata': {**doc.to_dict().get('metadata', {}), **metadata},
                    'updated_at': datetime.now()
                })
                break

            # Clear cache
            self.clear_cache()
            return True

        except Exception as e:
            logger.error(f"Error updating relationship: {e}")
            return False

    async def get_relationship(self, from_user_id: str, to_user_id: str) -> Optional[Dict]:
        """Get relationship between two users"""
        try:
            query = self.relationships_ref.where('from_user_id', '==', from_user_id).where('to_user_id', '==', to_user_id)
            docs = query.stream()
            
            for doc in docs:
                return doc.to_dict()
            
            return None

        except Exception as e:
            logger.error(f"Error getting relationship: {e}")
            return None

    async def record_interaction(self, from_user_id: str, to_user_id: str, interaction_type: str, metadata: Dict = None) -> bool:
        """Record an interaction between users"""
        try:
            # Record interaction
            interaction_data = {
                'from_user_id': from_user_id,
                'to_user_id': to_user_id,
                'interaction_type': interaction_type,
                'timestamp': datetime.now(),
                'metadata': metadata or {}
            }
            
            self.interactions_ref.add(interaction_data)

            # Update relationship strength
            await self.update_relationship_strength(from_user_id, to_user_id, interaction_type)

            return True

        except Exception as e:
            logger.error(f"Error recording interaction: {e}")
            return False

    async def update_relationship_strength(self, from_user_id: str, to_user_id: str, interaction_type: str) -> None:
        """Update relationship strength based on interaction"""
        try:
            # Get weight for interaction type
            weight = CONNECTION_STRENGTH_WEIGHTS.get(interaction_type, 1)

            # Find relationship document
            query = self.relationships_ref.where('from_user_id', '==', from_user_id).where('to_user_id', '==', to_user_id)
            docs = query.stream()
            
            for doc in docs:
                current_data = doc.to_dict()
                new_strength = current_data.get('strength', 0) + weight
                
                doc.reference.update({
                    'strength': new_strength,
                    'interaction_count': current_data.get('interaction_count', 0) + 1,
                    'last_interaction': datetime.now(),
                    'updated_at': datetime.now()
                })
                break

            # Clear cache
            self.clear_cache()

        except Exception as e:
            logger.error(f"Error updating relationship strength: {e}")

    async def calculate_connection_strength(self, user1_id: str, user2_id: str) -> float:
        """Calculate connection strength between two users"""
        try:
            # Check cache first
            cache_key = f"strength_{user1_id}_{user2_id}"
            if cache_key in self.cache:
                return self.cache[cache_key]

            # Get relationship data
            relationship = await self.get_relationship(user1_id, user2_id)
            if not relationship:
                return 0.0

            # Base strength from relationship
            strength = relationship.get('strength', 0)

            # Additional factors
            additional_strength = await self.calculate_additional_factors(user1_id, user2_id)
            total_strength = strength + additional_strength

            # Cache result
            self.cache[cache_key] = total_strength
            return total_strength

        except Exception as e:
            logger.error(f"Error calculating connection strength: {e}")
            return 0.0

    async def calculate_additional_factors(self, user1_id: str, user2_id: str) -> float:
        """Calculate additional strength factors"""
        try:
            additional_strength = 0.0

            # Check mutual follow
            if await self.check_mutual_follow(user1_id, user2_id):
                additional_strength += CONNECTION_STRENGTH_WEIGHTS['mutual_follow']

            # Check team membership
            if await self.check_team_membership(user1_id, user2_id):
                additional_strength += CONNECTION_STRENGTH_WEIGHTS['team_membership']

            # Check recent interactions (last 30 days)
            recent_interactions = await self.get_recent_interactions(user1_id, user2_id, days=30)
            additional_strength += len(recent_interactions) * 2

            # Check shared achievements
            shared_achievements = await self.get_shared_achievements(user1_id, user2_id)
            additional_strength += len(shared_achievements) * CONNECTION_STRENGTH_WEIGHTS['achievements_shared']

            return additional_strength

        except Exception as e:
            logger.error(f"Error calculating additional factors: {e}")
            return 0.0

    async def check_mutual_follow(self, user1_id: str, user2_id: str) -> bool:
        """Check if users follow each other"""
        try:
            # Check if user1 follows user2
            follow1 = db.collection('follows').where('follower_id', '==', user1_id).where('following_id', '==', user2_id).stream()
            follow1_exists = any(follow1)

            # Check if user2 follows user1
            follow2 = db.collection('follows').where('follower_id', '==', user2_id).where('following_id', '==', user1_id).stream()
            follow2_exists = any(follow2)

            return follow1_exists and follow2_exists

        except Exception as e:
            logger.error(f"Error checking mutual follow: {e}")
            return False

    async def check_team_membership(self, user1_id: str, user2_id: str) -> bool:
        """Check if users are on the same team"""
        try:
            # Get teams for both users
            user1_teams = db.collection('team_members').where('user_id', '==', user1_id).stream()
            user2_teams = db.collection('team_members').where('user_id', '==', user2_id).stream()

            user1_team_ids = {doc.to_dict()['team_id'] for doc in user1_teams}
            user2_team_ids = {doc.to_dict()['team_id'] for doc in user2_teams}

            return bool(user1_team_ids.intersection(user2_team_ids))

        except Exception as e:
            logger.error(f"Error checking team membership: {e}")
            return False

    async def get_recent_interactions(self, user1_id: str, user2_id: str, days: int = 30) -> List[Dict]:
        """Get recent interactions between users"""
        try:
            cutoff_date = datetime.now() - timedelta(days=days)
            
            # Get interactions in both directions
            interactions = []
            
            # User1 -> User2
            query1 = self.interactions_ref.where('from_user_id', '==', user1_id).where('to_user_id', '==', user2_id).where('timestamp', '>=', cutoff_date)
            docs1 = query1.stream()
            interactions.extend([doc.to_dict() for doc in docs1])

            # User2 -> User1
            query2 = self.interactions_ref.where('from_user_id', '==', user2_id).where('to_user_id', '==', user1_id).where('timestamp', '>=', cutoff_date)
            docs2 = query2.stream()
            interactions.extend([doc.to_dict() for doc in docs2])

            return interactions

        except Exception as e:
            logger.error(f"Error getting recent interactions: {e}")
            return []

    async def get_shared_achievements(self, user1_id: str, user2_id: str) -> List[Dict]:
        """Get achievements shared between users"""
        try:
            # Get achievements for both users
            user1_achievements = db.collection('achievements').where('user_id', '==', user1_id).stream()
            user2_achievements = db.collection('achievements').where('user_id', '==', user2_id).stream()

            user1_achievement_types = {doc.to_dict()['type'] for doc in user1_achievements}
            user2_achievement_types = {doc.to_dict()['type'] for doc in user2_achievements}

            shared_types = user1_achievement_types.intersection(user2_achievement_types)
            
            # Get full achievement data for shared types
            shared_achievements = []
            for achievement_type in shared_types:
                achievements = db.collection('achievements').where('type', '==', achievement_type).where('user_id', 'in', [user1_id, user2_id]).stream()
                shared_achievements.extend([doc.to_dict() for doc in achievements])

            return shared_achievements

        except Exception as e:
            logger.error(f"Error getting shared achievements: {e}")
            return []

    async def get_user_relationships(self, user_id: str, relationship_type: str = None) -> List[Dict]:
        """Get all relationships for a user"""
        try:
            query = self.relationships_ref.where('from_user_id', '==', user_id)
            if relationship_type:
                query = query.where('relationship_type', '==', relationship_type)

            docs = query.stream()
            relationships = [doc.to_dict() for doc in docs]

            # Add connection strength to each relationship
            for relationship in relationships:
                relationship['connection_strength'] = await self.calculate_connection_strength(
                    user_id, relationship['to_user_id']
                )

            # Sort by connection strength
            relationships.sort(key=lambda x: x['connection_strength'], reverse=True)
            return relationships

        except Exception as e:
            logger.error(f"Error getting user relationships: {e}")
            return []

    async def get_network_graph(self, user_id: str, depth: int = 2) -> Dict:
        """Get network graph for a user"""
        try:
            network = {
                'nodes': [],
                'edges': [],
                'user_id': user_id,
                'depth': depth
            }

            # Get user's direct relationships
            direct_relationships = await self.get_user_relationships(user_id)
            
            # Add user node
            network['nodes'].append({
                'id': user_id,
                'type': 'user',
                'depth': 0
            })

            # Add direct connections
            for relationship in direct_relationships:
                network['nodes'].append({
                    'id': relationship['to_user_id'],
                    'type': 'connection',
                    'depth': 1,
                    'relationship_type': relationship['relationship_type'],
                    'strength': relationship['connection_strength']
                })

                network['edges'].append({
                    'from': user_id,
                    'to': relationship['to_user_id'],
                    'type': relationship['relationship_type'],
                    'strength': relationship['connection_strength']
                })

            # Add second-degree connections if depth > 1
            if depth > 1:
                second_degree = set()
                for relationship in direct_relationships:
                    second_rels = await self.get_user_relationships(relationship['to_user_id'])
                    for second_rel in second_rels:
                        if second_rel['to_user_id'] != user_id:
                            second_degree.add(second_rel['to_user_id'])

                for second_user_id in second_degree:
                    # Calculate indirect strength
                    indirect_strength = await self.calculate_indirect_strength(user_id, second_user_id)
                    
                    network['nodes'].append({
                        'id': second_user_id,
                        'type': 'indirect_connection',
                        'depth': 2,
                        'strength': indirect_strength
                    })

                    network['edges'].append({
                        'from': user_id,
                        'to': second_user_id,
                        'type': 'indirect',
                        'strength': indirect_strength
                    })

            return network

        except Exception as e:
            logger.error(f"Error getting network graph: {e}")
            return {'nodes': [], 'edges': [], 'user_id': user_id, 'depth': depth}

    async def calculate_indirect_strength(self, user1_id: str, user2_id: str) -> float:
        """Calculate indirect connection strength through mutual connections"""
        try:
            # Get mutual connections
            user1_connections = {rel['to_user_id'] for rel in await self.get_user_relationships(user1_id)}
            user2_connections = {rel['to_user_id'] for rel in await self.get_user_relationships(user2_id)}
            
            mutual_connections = user1_connections.intersection(user2_connections)
            
            if not mutual_connections:
                return 0.0

            # Calculate strength through each mutual connection
            total_strength = 0.0
            for mutual_id in mutual_connections:
                strength1 = await self.calculate_connection_strength(user1_id, mutual_id)
                strength2 = await self.calculate_connection_strength(user2_id, mutual_id)
                
                # Indirect strength is the minimum of the two direct strengths
                indirect_strength = min(strength1, strength2) * 0.5
                total_strength += indirect_strength

            return total_strength

        except Exception as e:
            logger.error(f"Error calculating indirect strength: {e}")
            return 0.0

    async def get_recommendations(self, user_id: str, limit: int = 10) -> List[Dict]:
        """Get relationship recommendations for a user"""
        try:
            recommendations = []
            
            # Get user's current relationships
            current_relationships = {rel['to_user_id'] for rel in await self.get_user_relationships(user_id)}
            
            # Get all users (excluding current relationships)
            all_users = db.collection('users').stream()
            
            for user_doc in all_users:
                user_data = user_doc.to_dict()
                potential_user_id = user_doc.id
                
                if potential_user_id == user_id or potential_user_id in current_relationships:
                    continue

                # Calculate potential connection strength
                potential_strength = await self.calculate_potential_strength(user_id, potential_user_id)
                
                if potential_strength > 0:
                    recommendations.append({
                        'user_id': potential_user_id,
                        'user_name': user_data.get('name', 'Unknown'),
                        'user_avatar': user_data.get('avatar_url'),
                        'potential_strength': potential_strength,
                        'common_interests': await self.get_common_interests(user_id, potential_user_id),
                        'mutual_connections': await self.get_mutual_connections(user_id, potential_user_id)
                    })

            # Sort by potential strength and return top recommendations
            recommendations.sort(key=lambda x: x['potential_strength'], reverse=True)
            return recommendations[:limit]

        except Exception as e:
            logger.error(f"Error getting recommendations: {e}")
            return []

    async def calculate_potential_strength(self, user1_id: str, user2_id: str) -> float:
        """Calculate potential connection strength between users"""
        try:
            potential_strength = 0.0

            # Check mutual connections
            mutual_connections = await self.get_mutual_connections(user1_id, user2_id)
            potential_strength += len(mutual_connections) * 5

            # Check common interests
            common_interests = await self.get_common_interests(user1_id, user2_id)
            potential_strength += len(common_interests) * 3

            # Check team compatibility
            if await self.check_team_compatibility(user1_id, user2_id):
                potential_strength += 10

            # Check skill level compatibility
            skill_compatibility = await self.check_skill_compatibility(user1_id, user2_id)
            potential_strength += skill_compatibility * 2

            return potential_strength

        except Exception as e:
            logger.error(f"Error calculating potential strength: {e}")
            return 0.0

    async def get_mutual_connections(self, user1_id: str, user2_id: str) -> List[str]:
        """Get mutual connections between users"""
        try:
            user1_connections = {rel['to_user_id'] for rel in await self.get_user_relationships(user1_id)}
            user2_connections = {rel['to_user_id'] for rel in await self.get_user_relationships(user2_id)}
            
            return list(user1_connections.intersection(user2_connections))

        except Exception as e:
            logger.error(f"Error getting mutual connections: {e}")
            return []

    async def get_common_interests(self, user1_id: str, user2_id: str) -> List[str]:
        """Get common interests between users"""
        try:
            # Get user interests (this would be from user profiles)
            user1_doc = db.collection('users').document(user1_id).get()
            user2_doc = db.collection('users').document(user2_id).get()
            
            user1_interests = user1_doc.to_dict().get('interests', []) if user1_doc.exists else []
            user2_interests = user2_doc.to_dict().get('interests', []) if user2_doc.exists else []
            
            return list(set(user1_interests).intersection(set(user2_interests)))

        except Exception as e:
            logger.error(f"Error getting common interests: {e}")
            return []

    async def check_team_compatibility(self, user1_id: str, user2_id: str) -> bool:
        """Check if users would be compatible teammates"""
        try:
            # Get user profiles
            user1_doc = db.collection('users').document(user1_id).get()
            user2_doc = db.collection('users').document(user2_id).get()
            
            if not user1_doc.exists or not user2_doc.exists:
                return False

            user1_data = user1_doc.to_dict()
            user2_data = user2_doc.to_dict()

            # Check if they play the same sports
            user1_sports = set(user1_data.get('sports', []))
            user2_sports = set(user2_data.get('sports', []))
            
            return bool(user1_sports.intersection(user2_sports))

        except Exception as e:
            logger.error(f"Error checking team compatibility: {e}")
            return False

    async def check_skill_compatibility(self, user1_id: str, user2_id: str) -> float:
        """Check skill level compatibility between users"""
        try:
            # Get user skill levels
            user1_doc = db.collection('users').document(user1_id).get()
            user2_doc = db.collection('users').document(user2_id).get()
            
            if not user1_doc.exists or not user2_doc.exists:
                return 0.0

            user1_data = user1_doc.to_dict()
            user2_data = user2_doc.to_dict()

            # Compare skill levels (assuming 1-10 scale)
            user1_skill = user1_data.get('skill_level', 5)
            user2_skill = user2_data.get('skill_level', 5)
            
            # Calculate compatibility (closer skill levels = higher compatibility)
            skill_diff = abs(user1_skill - user2_skill)
            compatibility = max(0, 10 - skill_diff)
            
            return compatibility

        except Exception as e:
            logger.error(f"Error checking skill compatibility: {e}")
            return 0.0

    def clear_cache(self):
        """Clear relationship cache"""
        self.cache.clear()

# Initialize relationship graph
relationship_graph = RelationshipGraph() 