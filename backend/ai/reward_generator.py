import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
import firebase_admin
from firebase_admin import firestore
from web3 import Web3
from web3.middleware import geth_poa_middleware
import json
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class HighlightRewardGenerator:
    """
    AI-powered reward generator for automatically minting BEACON tokens
    based on highlight engagement and metadata analysis.
    """
    
    def __init__(self):
        self.db = firestore.client()
        self.w3 = None
        self.beacon_token_contract = None
        self.reward_config = self._load_reward_config()
        self.engagement_thresholds = self._load_engagement_thresholds()
        
        # Initialize Web3 connection
        self._initialize_web3()
    
    def _load_reward_config(self) -> Dict:
        """Load reward configuration from environment or defaults."""
        return {
            'base_reward': float(os.getenv('BASE_REWARD', '10.0')),  # Base BEACON reward
            'engagement_multiplier': float(os.getenv('ENGAGEMENT_MULTIPLIER', '0.1')),  # Per engagement point
            'quality_bonus': float(os.getenv('QUALITY_BONUS', '5.0')),  # Quality bonus
            'viral_bonus': float(os.getenv('VIRAL_BONUS', '15.0')),  # Viral content bonus
            'max_reward_per_highlight': float(os.getenv('MAX_REWARD_PER_HIGHLIGHT', '100.0')),
            'min_engagement_for_reward': int(os.getenv('MIN_ENGAGEMENT_FOR_REWARD', '10')),
            'reward_cooldown_hours': int(os.getenv('REWARD_COOLDOWN_HOURS', '24')),
            'batch_size': int(os.getenv('REWARD_BATCH_SIZE', '50')),
            'auto_mint_enabled': os.getenv('AUTO_MINT_ENABLED', 'true').lower() == 'true'
        }
    
    def _load_engagement_thresholds(self) -> Dict:
        """Load engagement thresholds for different reward tiers."""
        return {
            'viral': {
                'views': 10000,
                'likes': 500,
                'shares': 100,
                'comments': 50,
                'multiplier': 3.0
            },
            'trending': {
                'views': 5000,
                'likes': 200,
                'shares': 50,
                'comments': 25,
                'multiplier': 2.0
            },
            'popular': {
                'views': 1000,
                'likes': 50,
                'shares': 10,
                'comments': 10,
                'multiplier': 1.5
            },
            'standard': {
                'views': 100,
                'likes': 10,
                'shares': 2,
                'comments': 5,
                'multiplier': 1.0
            }
        }
    
    def _initialize_web3(self):
        """Initialize Web3 connection and contract."""
        try:
            # Connect to blockchain
            rpc_url = os.getenv('POLYGON_RPC_URL')
            if not rpc_url:
                logger.error("POLYGON_RPC_URL not configured")
                return
            
            self.w3 = Web3(Web3.HTTPProvider(rpc_url))
            self.w3.middleware_onion.inject(geth_poa_middleware, layer=0)
            
            # Load BEACON token contract
            beacon_token_address = os.getenv('BEACON_TOKEN_ADDRESS')
            if not beacon_token_address:
                logger.error("BEACON_TOKEN_ADDRESS not configured")
                return
            
            # Load contract ABI (simplified for BEACON token)
            beacon_token_abi = [
                {
                    "inputs": [
                        {"internalType": "address", "name": "to", "type": "address"},
                        {"internalType": "uint256", "name": "amount", "type": "uint256"}
                    ],
                    "name": "mint",
                    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
                    "stateMutability": "nonpayable",
                    "type": "function"
                },
                {
                    "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
                    "name": "balanceOf",
                    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
                    "stateMutability": "view",
                    "type": "function"
                }
            ]
            
            self.beacon_token_contract = self.w3.eth.contract(
                address=beacon_token_address,
                abi=beacon_token_abi
            )
            
            logger.info("Web3 connection initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize Web3: {e}")
    
    async def analyze_highlight_engagement(self, highlight_id: str) -> Dict:
        """
        Analyze highlight engagement and calculate reward eligibility.
        
        Args:
            highlight_id: The highlight document ID
            
        Returns:
            Dict containing engagement analysis and reward calculation
        """
        try:
            # Get highlight data from Firestore
            highlight_ref = self.db.collection('highlights').document(highlight_id)
            highlight_doc = highlight_ref.get()
            
            if not highlight_doc.exists:
                return {'eligible': False, 'reason': 'Highlight not found'}
            
            highlight_data = highlight_doc.to_dict()
            
            # Get engagement metrics
            engagement_metrics = await self._get_engagement_metrics(highlight_id)
            
            # Calculate engagement score
            engagement_score = self._calculate_engagement_score(engagement_metrics)
            
            # Check if already rewarded recently
            if await self._is_recently_rewarded(highlight_id):
                return {
                    'eligible': False,
                    'reason': 'Recently rewarded',
                    'engagement_score': engagement_score
                }
            
            # Check minimum engagement threshold
            if engagement_score < self.reward_config['min_engagement_for_reward']:
                return {
                    'eligible': False,
                    'reason': 'Insufficient engagement',
                    'engagement_score': engagement_score
                }
            
            # Calculate reward amount
            reward_amount = self._calculate_reward_amount(engagement_metrics, engagement_score)
            
            # Determine reward tier
            reward_tier = self._determine_reward_tier(engagement_metrics)
            
            return {
                'eligible': True,
                'highlight_id': highlight_id,
                'creator_address': highlight_data.get('creator_address'),
                'engagement_score': engagement_score,
                'reward_amount': reward_amount,
                'reward_tier': reward_tier,
                'engagement_metrics': engagement_metrics,
                'highlight_data': highlight_data
            }
            
        except Exception as e:
            logger.error(f"Error analyzing highlight engagement: {e}")
            return {'eligible': False, 'reason': f'Analysis error: {str(e)}'}
    
    async def _get_engagement_metrics(self, highlight_id: str) -> Dict:
        """Get comprehensive engagement metrics for a highlight."""
        try:
            # Get views, likes, shares, comments from various collections
            views = await self._get_highlight_views(highlight_id)
            likes = await self._get_highlight_likes(highlight_id)
            shares = await self._get_highlight_shares(highlight_id)
            comments = await self._get_highlight_comments(highlight_id)
            
            # Get time-based engagement (recent activity)
            recent_engagement = await self._get_recent_engagement(highlight_id)
            
            # Get quality metrics from AI analysis
            quality_metrics = await self._get_quality_metrics(highlight_id)
            
            return {
                'views': views,
                'likes': likes,
                'shares': shares,
                'comments': comments,
                'recent_engagement': recent_engagement,
                'quality_score': quality_metrics.get('quality_score', 0),
                'viral_potential': quality_metrics.get('viral_potential', 0),
                'content_quality': quality_metrics.get('content_quality', 0),
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error getting engagement metrics: {e}")
            return {
                'views': 0,
                'likes': 0,
                'shares': 0,
                'comments': 0,
                'recent_engagement': 0,
                'quality_score': 0,
                'viral_potential': 0,
                'content_quality': 0,
                'timestamp': datetime.now().isoformat()
            }
    
    async def _get_highlight_views(self, highlight_id: str) -> int:
        """Get total views for a highlight."""
        try:
            views_ref = self.db.collection('highlights').document(highlight_id).collection('views')
            views = views_ref.get()
            return len(views)
        except Exception as e:
            logger.error(f"Error getting highlight views: {e}")
            return 0
    
    async def _get_highlight_likes(self, highlight_id: str) -> int:
        """Get total likes for a highlight."""
        try:
            likes_ref = self.db.collection('highlights').document(highlight_id).collection('likes')
            likes = likes_ref.get()
            return len(likes)
        except Exception as e:
            logger.error(f"Error getting highlight likes: {e}")
            return 0
    
    async def _get_highlight_shares(self, highlight_id: str) -> int:
        """Get total shares for a highlight."""
        try:
            shares_ref = self.db.collection('highlights').document(highlight_id).collection('shares')
            shares = shares_ref.get()
            return len(shares)
        except Exception as e:
            logger.error(f"Error getting highlight shares: {e}")
            return 0
    
    async def _get_highlight_comments(self, highlight_id: str) -> int:
        """Get total comments for a highlight."""
        try:
            comments_ref = self.db.collection('highlights').document(highlight_id).collection('comments')
            comments = comments_ref.get()
            return len(comments)
        except Exception as e:
            logger.error(f"Error getting highlight comments: {e}")
            return 0
    
    async def _get_recent_engagement(self, highlight_id: str, hours: int = 24) -> int:
        """Get engagement in the last N hours."""
        try:
            cutoff_time = datetime.now() - timedelta(hours=hours)
            
            # Get recent views, likes, shares, comments
            recent_views = self.db.collection('highlights').document(highlight_id).collection('views').where('timestamp', '>=', cutoff_time).get()
            recent_likes = self.db.collection('highlights').document(highlight_id).collection('likes').where('timestamp', '>=', cutoff_time).get()
            recent_shares = self.db.collection('highlights').document(highlight_id).collection('shares').where('timestamp', '>=', cutoff_time).get()
            recent_comments = self.db.collection('highlights').document(highlight_id).collection('comments').where('timestamp', '>=', cutoff_time).get()
            
            return len(recent_views) + len(recent_likes) + len(recent_shares) + len(recent_comments)
            
        except Exception as e:
            logger.error(f"Error getting recent engagement: {e}")
            return 0
    
    async def _get_quality_metrics(self, highlight_id: str) -> Dict:
        """Get AI-generated quality metrics for a highlight."""
        try:
            # Get AI analysis from highlight_tagging_engine results
            analysis_ref = self.db.collection('highlights').document(highlight_id).collection('ai_analysis')
            analysis_docs = analysis_ref.get()
            
            if not analysis_docs:
                return {'quality_score': 0, 'viral_potential': 0, 'content_quality': 0}
            
            # Get the latest analysis
            latest_analysis = None
            for doc in analysis_docs:
                if not latest_analysis or doc.get('timestamp') > latest_analysis.get('timestamp'):
                    latest_analysis = doc.to_dict()
            
            if not latest_analysis:
                return {'quality_score': 0, 'viral_potential': 0, 'content_quality': 0}
            
            return {
                'quality_score': latest_analysis.get('quality_score', 0),
                'viral_potential': latest_analysis.get('viral_potential', 0),
                'content_quality': latest_analysis.get('content_quality', 0),
                'tags': latest_analysis.get('tags', []),
                'sentiment': latest_analysis.get('sentiment', 'neutral')
            }
            
        except Exception as e:
            logger.error(f"Error getting quality metrics: {e}")
            return {'quality_score': 0, 'viral_potential': 0, 'content_quality': 0}
    
    def _calculate_engagement_score(self, engagement_metrics: Dict) -> float:
        """Calculate weighted engagement score."""
        try:
            views_weight = 1.0
            likes_weight = 3.0
            shares_weight = 5.0
            comments_weight = 2.0
            recent_weight = 2.0
            quality_weight = 1.5
            
            score = (
                engagement_metrics['views'] * views_weight +
                engagement_metrics['likes'] * likes_weight +
                engagement_metrics['shares'] * shares_weight +
                engagement_metrics['comments'] * comments_weight +
                engagement_metrics['recent_engagement'] * recent_weight +
                engagement_metrics['quality_score'] * quality_weight
            )
            
            return score
            
        except Exception as e:
            logger.error(f"Error calculating engagement score: {e}")
            return 0.0
    
    def _calculate_reward_amount(self, engagement_metrics: Dict, engagement_score: float) -> float:
        """Calculate BEACON reward amount based on engagement."""
        try:
            # Base reward
            reward = self.reward_config['base_reward']
            
            # Engagement multiplier
            engagement_bonus = engagement_score * self.reward_config['engagement_multiplier']
            reward += engagement_bonus
            
            # Quality bonus
            if engagement_metrics['quality_score'] > 0.7:
                reward += self.reward_config['quality_bonus']
            
            # Viral bonus
            if engagement_metrics['viral_potential'] > 0.8:
                reward += self.reward_config['viral_bonus']
            
            # Tier multiplier
            tier = self._determine_reward_tier(engagement_metrics)
            tier_multiplier = self.engagement_thresholds[tier]['multiplier']
            reward *= tier_multiplier
            
            # Cap at maximum reward
            reward = min(reward, self.reward_config['max_reward_per_highlight'])
            
            return round(reward, 2)
            
        except Exception as e:
            logger.error(f"Error calculating reward amount: {e}")
            return 0.0
    
    def _determine_reward_tier(self, engagement_metrics: Dict) -> str:
        """Determine reward tier based on engagement metrics."""
        try:
            views = engagement_metrics['views']
            likes = engagement_metrics['likes']
            shares = engagement_metrics['shares']
            comments = engagement_metrics['comments']
            
            # Check viral tier
            if (views >= self.engagement_thresholds['viral']['views'] and
                likes >= self.engagement_thresholds['viral']['likes'] and
                shares >= self.engagement_thresholds['viral']['shares']):
                return 'viral'
            
            # Check trending tier
            if (views >= self.engagement_thresholds['trending']['views'] and
                likes >= self.engagement_thresholds['trending']['likes'] and
                shares >= self.engagement_thresholds['trending']['shares']):
                return 'trending'
            
            # Check popular tier
            if (views >= self.engagement_thresholds['popular']['views'] and
                likes >= self.engagement_thresholds['popular']['likes']):
                return 'popular'
            
            # Default to standard
            return 'standard'
            
        except Exception as e:
            logger.error(f"Error determining reward tier: {e}")
            return 'standard'
    
    async def _is_recently_rewarded(self, highlight_id: str) -> bool:
        """Check if highlight was recently rewarded."""
        try:
            cooldown_hours = self.reward_config['reward_cooldown_hours']
            cutoff_time = datetime.now() - timedelta(hours=cooldown_hours)
            
            rewards_ref = self.db.collection('highlight_rewards')
            recent_rewards = rewards_ref.where('highlight_id', '==', highlight_id).where('timestamp', '>=', cutoff_time).get()
            
            return len(recent_rewards) > 0
            
        except Exception as e:
            logger.error(f"Error checking recent rewards: {e}")
            return False
    
    async def mint_reward(self, reward_data: Dict) -> Dict:
        """
        Mint BEACON tokens as reward for highlight engagement.
        
        Args:
            reward_data: Reward calculation data from analyze_highlight_engagement
            
        Returns:
            Dict containing mint result
        """
        try:
            if not self.w3 or not self.beacon_token_contract:
                return {'success': False, 'error': 'Web3 not initialized'}
            
            if not self.reward_config['auto_mint_enabled']:
                return {'success': False, 'error': 'Auto minting disabled'}
            
            highlight_id = reward_data['highlight_id']
            creator_address = reward_data['creator_address']
            reward_amount = reward_data['reward_amount']
            
            if not creator_address:
                return {'success': False, 'error': 'No creator address found'}
            
            # Convert reward amount to wei
            reward_wei = self.w3.to_wei(reward_amount, 'ether')
            
            # Get private key for minting (should be stored securely)
            private_key = os.getenv('REWARD_MINT_PRIVATE_KEY')
            if not private_key:
                return {'success': False, 'error': 'Mint private key not configured'}
            
            # Create transaction
            nonce = self.w3.eth.get_transaction_count(creator_address)
            
            mint_txn = self.beacon_token_contract.functions.mint(
                creator_address,
                reward_wei
            ).build_transaction({
                'chainId': 137,  # Polygon mainnet
                'gas': 200000,
                'gasPrice': self.w3.eth.gas_price,
                'nonce': nonce,
            })
            
            # Sign and send transaction
            signed_txn = self.w3.eth.account.sign_transaction(mint_txn, private_key)
            tx_hash = self.w3.eth.send_raw_transaction(signed_txn.rawTransaction)
            
            # Wait for transaction confirmation
            tx_receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)
            
            # Log reward in Firestore
            await self._log_reward(highlight_id, creator_address, reward_amount, tx_hash.hex(), reward_data)
            
            return {
                'success': True,
                'tx_hash': tx_hash.hex(),
                'reward_amount': reward_amount,
                'creator_address': creator_address,
                'highlight_id': highlight_id
            }
            
        except Exception as e:
            logger.error(f"Error minting reward: {e}")
            return {'success': False, 'error': str(e)}
    
    async def _log_reward(self, highlight_id: str, creator_address: str, reward_amount: float, tx_hash: str, reward_data: Dict):
        """Log reward transaction in Firestore."""
        try:
            reward_log = {
                'highlight_id': highlight_id,
                'creator_address': creator_address,
                'reward_amount': reward_amount,
                'tx_hash': tx_hash,
                'reward_tier': reward_data['reward_tier'],
                'engagement_score': reward_data['engagement_score'],
                'engagement_metrics': reward_data['engagement_metrics'],
                'timestamp': datetime.now(),
                'status': 'completed'
            }
            
            self.db.collection('highlight_rewards').add(reward_log)
            logger.info(f"Reward logged: {highlight_id} -> {creator_address} ({reward_amount} BEACON)")
            
        except Exception as e:
            logger.error(f"Error logging reward: {e}")
    
    async def process_highlight_rewards(self, batch_size: Optional[int] = None) -> Dict:
        """
        Process rewards for a batch of highlights.
        
        Args:
            batch_size: Number of highlights to process (defaults to config)
            
        Returns:
            Dict containing processing results
        """
        try:
            batch_size = batch_size or self.reward_config['batch_size']
            
            # Get highlights that haven't been rewarded recently
            cutoff_time = datetime.now() - timedelta(hours=self.reward_config['reward_cooldown_hours'])
            
            highlights_ref = self.db.collection('highlights')
            highlights = highlights_ref.where('created_at', '>=', cutoff_time).limit(batch_size).get()
            
            results = {
                'processed': 0,
                'eligible': 0,
                'rewarded': 0,
                'errors': 0,
                'total_rewarded': 0.0
            }
            
            for highlight_doc in highlights:
                try:
                    results['processed'] += 1
                    highlight_id = highlight_doc.id
                    
                    # Analyze engagement
                    analysis = await self.analyze_highlight_engagement(highlight_id)
                    
                    if analysis['eligible']:
                        results['eligible'] += 1
                        
                        # Mint reward
                        mint_result = await self.mint_reward(analysis)
                        
                        if mint_result['success']:
                            results['rewarded'] += 1
                            results['total_rewarded'] += analysis['reward_amount']
                            logger.info(f"Reward minted: {highlight_id} -> {analysis['reward_amount']} BEACON")
                        else:
                            results['errors'] += 1
                            logger.error(f"Failed to mint reward for {highlight_id}: {mint_result['error']}")
                    else:
                        logger.debug(f"Highlight {highlight_id} not eligible: {analysis.get('reason', 'Unknown')}")
                
                except Exception as e:
                    results['errors'] += 1
                    logger.error(f"Error processing highlight {highlight_doc.id}: {e}")
            
            logger.info(f"Reward processing complete: {results}")
            return results
            
        except Exception as e:
            logger.error(f"Error processing highlight rewards: {e}")
            return {'error': str(e)}
    
    async def get_creator_rewards_summary(self, creator_address: str, days: int = 30) -> Dict:
        """
        Get reward summary for a creator.
        
        Args:
            creator_address: The creator's wallet address
            days: Number of days to look back
            
        Returns:
            Dict containing reward summary
        """
        try:
            cutoff_time = datetime.now() - timedelta(days=days)
            
            rewards_ref = self.db.collection('highlight_rewards')
            creator_rewards = rewards_ref.where('creator_address', '==', creator_address).where('timestamp', '>=', cutoff_time).get()
            
            total_rewarded = 0.0
            reward_count = 0
            highlights_rewarded = set()
            
            for reward_doc in creator_rewards:
                reward_data = reward_doc.to_dict()
                total_rewarded += reward_data['reward_amount']
                reward_count += 1
                highlights_rewarded.add(reward_data['highlight_id'])
            
            return {
                'creator_address': creator_address,
                'total_rewarded': total_rewarded,
                'reward_count': reward_count,
                'highlights_rewarded': len(highlights_rewarded),
                'period_days': days,
                'average_per_highlight': total_rewarded / len(highlights_rewarded) if highlights_rewarded else 0
            }
            
        except Exception as e:
            logger.error(f"Error getting creator rewards summary: {e}")
            return {'error': str(e)}

# Example usage
async def main():
    """Example usage of the reward generator."""
    generator = HighlightRewardGenerator()
    
    # Process rewards for highlights
    results = await generator.process_highlight_rewards(batch_size=10)
    print(f"Processing results: {results}")
    
    # Get creator summary
    creator_summary = await generator.get_creator_rewards_summary("0x123...", days=30)
    print(f"Creator summary: {creator_summary}")

if __name__ == "__main__":
    asyncio.run(main()) 