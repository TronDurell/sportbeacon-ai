import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
import firebase_admin
from firebase_admin import firestore
import stripe
from web3 import Web3
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Firebase and Stripe
db = firestore.client()
stripe.api_key = os.getenv('STRIPE_SECRET_KEY')

# Web3 setup
w3 = Web3(Web3.HTTPProvider(os.getenv('WEB3_PROVIDER_URL')))

# BEACON Token Configuration
BEACON_TOKEN_CONFIG = {
    'name': 'BEACON',
    'symbol': 'BEACON',
    'decimals': 18,
    'total_supply': 1000000000,  # 1 billion tokens
    'initial_distribution': {
        'community_rewards': 0.40,  # 40%
        'team_treasury': 0.25,      # 25%
        'development': 0.20,        # 20%
        'marketing': 0.10,          # 10%
        'reserve': 0.05             # 5%
    },
    'reward_rates': {
        'drill_completion': 10,     # BEACON per drill
        'streak_bonus': 5,          # BEACON per day in streak
        'achievement': 50,          # BEACON per achievement
        'highlight_upload': 25,     # BEACON per highlight
        'social_interaction': 2,    # BEACON per like/comment
        'coaching_session': 100,    # BEACON per coaching session
        'viral_content': 200,       # BEACON for viral content
        'tournament_win': 500,      # BEACON for tournament wins
        'referral': 100,            # BEACON per referral
        'daily_login': 5,           # BEACON per daily login
    },
    'multipliers': {
        'premium_member': 1.5,
        'verified_coach': 2.0,
        'pro_athlete': 2.5,
        'seasonal_event': 1.2,
        'streak_7_days': 1.1,
        'streak_30_days': 1.3,
        'streak_100_days': 1.5,
    },
    'burn_rates': {
        'marketplace_fee': 0.02,    # 2% burn on marketplace transactions
        'premium_features': 0.05,   # 5% burn on premium feature purchases
        'governance_voting': 0.01,  # 1% burn on governance voting
    }
}

class TokenomicsEngine:
    def __init__(self):
        self.tokens_ref = db.collection('tokens')
        self.transactions_ref = db.collection('token_transactions')
        self.wallets_ref = db.collection('wallets')
        self.rewards_ref = db.collection('rewards')

    async def get_wallet_balance(self, user_id: str) -> Dict:
        """Get user's BEACON token balance"""
        try:
            wallet_doc = self.wallets_ref.document(user_id).get()
            if wallet_doc.exists:
                wallet_data = wallet_doc.to_dict()
                return {
                    'user_id': user_id,
                    'beacon_balance': wallet_data.get('beacon_balance', 0),
                    'total_earned': wallet_data.get('total_earned', 0),
                    'total_spent': wallet_data.get('total_spent', 0),
                    'last_updated': wallet_data.get('last_updated', datetime.now())
                }
            else:
                # Initialize wallet if it doesn't exist
                await self.initialize_wallet(user_id)
                return {
                    'user_id': user_id,
                    'beacon_balance': 0,
                    'total_earned': 0,
                    'total_spent': 0,
                    'last_updated': datetime.now()
                }
        except Exception as e:
            logger.error(f"Error getting wallet balance: {e}")
            return None

    async def initialize_wallet(self, user_id: str) -> bool:
        """Initialize user wallet"""
        try:
            wallet_data = {
                'user_id': user_id,
                'beacon_balance': 0,
                'total_earned': 0,
                'total_spent': 0,
                'created_at': datetime.now(),
                'last_updated': datetime.now(),
                'wallet_address': None,
                'payment_methods': []
            }
            
            self.wallets_ref.document(user_id).set(wallet_data)
            return True
        except Exception as e:
            logger.error(f"Error initializing wallet: {e}")
            return False

    async def award_tokens(self, user_id: str, reward_type: str, amount: int = None, metadata: Dict = None) -> bool:
        """Award BEACON tokens to user"""
        try:
            # Get base reward amount
            if amount is None:
                amount = BEACON_TOKEN_CONFIG['reward_rates'].get(reward_type, 0)

            if amount <= 0:
                logger.warning(f"Invalid reward amount for {reward_type}: {amount}")
                return False

            # Calculate multiplier
            multiplier = await self.calculate_multiplier(user_id)
            final_amount = int(amount * multiplier)

            # Update wallet balance
            wallet_ref = self.wallets_ref.document(user_id)
            wallet_ref.update({
                'beacon_balance': firestore.Increment(final_amount),
                'total_earned': firestore.Increment(final_amount),
                'last_updated': datetime.now()
            })

            # Record transaction
            transaction_data = {
                'user_id': user_id,
                'type': 'reward',
                'reward_type': reward_type,
                'amount': final_amount,
                'base_amount': amount,
                'multiplier': multiplier,
                'metadata': metadata or {},
                'timestamp': datetime.now(),
                'status': 'completed'
            }
            
            self.transactions_ref.add(transaction_data)

            logger.info(f"Awarded {final_amount} BEACON tokens to user {user_id} for {reward_type}")
            return True

        except Exception as e:
            logger.error(f"Error awarding tokens: {e}")
            return False

    async def calculate_multiplier(self, user_id: str) -> float:
        """Calculate reward multiplier for user"""
        try:
            multiplier = 1.0
            
            # Get user profile
            user_doc = db.collection('users').document(user_id).get()
            if user_doc.exists:
                user_data = user_doc.to_dict()
                
                # Premium member multiplier
                if user_data.get('premium_member'):
                    multiplier *= BEACON_TOKEN_CONFIG['multipliers']['premium_member']
                
                # Verified coach multiplier
                if user_data.get('verified_coach'):
                    multiplier *= BEACON_TOKEN_CONFIG['multipliers']['verified_coach']
                
                # Pro athlete multiplier
                if user_data.get('pro_athlete'):
                    multiplier *= BEACON_TOKEN_CONFIG['multipliers']['pro_athlete']
                
                # Streak multipliers
                current_streak = user_data.get('current_streak', 0)
                if current_streak >= 100:
                    multiplier *= BEACON_TOKEN_CONFIG['multipliers']['streak_100_days']
                elif current_streak >= 30:
                    multiplier *= BEACON_TOKEN_CONFIG['multipliers']['streak_30_days']
                elif current_streak >= 7:
                    multiplier *= BEACON_TOKEN_CONFIG['multipliers']['streak_7_days']
                
                # Seasonal event multiplier
                if await self.is_seasonal_event_active():
                    multiplier *= BEACON_TOKEN_CONFIG['multipliers']['seasonal_event']

            return multiplier

        except Exception as e:
            logger.error(f"Error calculating multiplier: {e}")
            return 1.0

    async def is_seasonal_event_active(self) -> bool:
        """Check if seasonal event is active"""
        # This would check for active seasonal events
        # For now, return False
        return False

    async def process_tip(self, from_user_id: str, to_user_id: str, amount: int, tip_type: str = 'highlight') -> bool:
        """Process tip transaction"""
        try:
            # Validate tip amount
            if amount <= 0:
                return False

            # Check sender balance
            sender_balance = await self.get_wallet_balance(from_user_id)
            if not sender_balance or sender_balance['beacon_balance'] < amount:
                return False

            # Transfer tokens
            success = await self.transfer_tokens(from_user_id, to_user_id, amount, 'tip', {
                'tip_type': tip_type,
                'from_user': from_user_id,
                'to_user': to_user_id
            })

            if success:
                # Award bonus tokens to receiver for receiving tip
                await self.award_tokens(to_user_id, 'tip_received', amount // 10, {
                    'tip_amount': amount,
                    'from_user': from_user_id
                })

            return success

        except Exception as e:
            logger.error(f"Error processing tip: {e}")
            return False

    async def transfer_tokens(self, from_user_id: str, to_user_id: str, amount: int, transfer_type: str, metadata: Dict = None) -> bool:
        """Transfer BEACON tokens between users"""
        try:
            # Check sender balance
            sender_balance = await self.get_wallet_balance(from_user_id)
            if not sender_balance or sender_balance['beacon_balance'] < amount:
                return False

            # Update sender wallet
            sender_ref = self.wallets_ref.document(from_user_id)
            sender_ref.update({
                'beacon_balance': firestore.Increment(-amount),
                'total_spent': firestore.Increment(amount),
                'last_updated': datetime.now()
            })

            # Update receiver wallet
            receiver_ref = self.wallets_ref.document(to_user_id)
            receiver_ref.update({
                'beacon_balance': firestore.Increment(amount),
                'total_earned': firestore.Increment(amount),
                'last_updated': datetime.now()
            })

            # Record transaction
            transaction_data = {
                'from_user_id': from_user_id,
                'to_user_id': to_user_id,
                'type': 'transfer',
                'transfer_type': transfer_type,
                'amount': amount,
                'metadata': metadata or {},
                'timestamp': datetime.now(),
                'status': 'completed'
            }
            
            self.transactions_ref.add(transaction_data)

            logger.info(f"Transferred {amount} BEACON tokens from {from_user_id} to {to_user_id}")
            return True

        except Exception as e:
            logger.error(f"Error transferring tokens: {e}")
            return False

    async def burn_tokens(self, user_id: str, amount: int, burn_type: str, metadata: Dict = None) -> bool:
        """Burn BEACON tokens"""
        try:
            # Check user balance
            user_balance = await self.get_wallet_balance(user_id)
            if not user_balance or user_balance['beacon_balance'] < amount:
                return False

            # Update wallet
            wallet_ref = self.wallets_ref.document(user_id)
            wallet_ref.update({
                'beacon_balance': firestore.Increment(-amount),
                'total_spent': firestore.Increment(amount),
                'last_updated': datetime.now()
            })

            # Record burn transaction
            transaction_data = {
                'user_id': user_id,
                'type': 'burn',
                'burn_type': burn_type,
                'amount': amount,
                'metadata': metadata or {},
                'timestamp': datetime.now(),
                'status': 'completed'
            }
            
            self.transactions_ref.add(transaction_data)

            # Update global burn statistics
            await self.update_burn_statistics(amount)

            logger.info(f"Burned {amount} BEACON tokens for user {user_id}")
            return True

        except Exception as e:
            logger.error(f"Error burning tokens: {e}")
            return False

    async def update_burn_statistics(self, amount: int) -> None:
        """Update global burn statistics"""
        try:
            stats_ref = db.collection('token_statistics').document('global')
            stats_ref.update({
                'total_burned': firestore.Increment(amount),
                'last_burn': datetime.now()
            })
        except Exception as e:
            logger.error(f"Error updating burn statistics: {e}")

    async def get_transaction_history(self, user_id: str, limit: int = 50) -> List[Dict]:
        """Get user's transaction history"""
        try:
            # Get transactions where user is sender or receiver
            transactions = []
            
            # Sent transactions
            sent_query = self.transactions_ref.where('from_user_id', '==', user_id).order_by('timestamp', direction=firestore.Query.DESCENDING).limit(limit)
            sent_docs = sent_query.stream()
            for doc in sent_docs:
                transactions.append(doc.to_dict())

            # Received transactions
            received_query = self.transactions_ref.where('to_user_id', '==', user_id).order_by('timestamp', direction=firestore.Query.DESCENDING).limit(limit)
            received_docs = received_query.stream()
            for doc in received_docs:
                transactions.append(doc.to_dict())

            # Reward transactions
            reward_query = self.transactions_ref.where('user_id', '==', user_id).where('type', '==', 'reward').order_by('timestamp', direction=firestore.Query.DESCENDING).limit(limit)
            reward_docs = reward_query.stream()
            for doc in reward_docs:
                transactions.append(doc.to_dict())

            # Sort by timestamp
            transactions.sort(key=lambda x: x['timestamp'], reverse=True)
            return transactions[:limit]

        except Exception as e:
            logger.error(f"Error getting transaction history: {e}")
            return []

    async def get_token_statistics(self) -> Dict:
        """Get global token statistics"""
        try:
            stats_doc = db.collection('token_statistics').document('global').get()
            if stats_doc.exists:
                return stats_doc.to_dict()
            else:
                # Initialize statistics
                stats = {
                    'total_supply': BEACON_TOKEN_CONFIG['total_supply'],
                    'circulating_supply': 0,
                    'total_burned': 0,
                    'total_minted': 0,
                    'total_transactions': 0,
                    'active_wallets': 0,
                    'last_updated': datetime.now()
                }
                db.collection('token_statistics').document('global').set(stats)
                return stats
        except Exception as e:
            logger.error(f"Error getting token statistics: {e}")
            return {}

    async def connect_wallet(self, user_id: str, wallet_address: str) -> bool:
        """Connect external wallet to user account"""
        try:
            # Validate wallet address
            if not w3.is_address(wallet_address):
                return False

            # Update user wallet
            self.wallets_ref.document(user_id).update({
                'wallet_address': wallet_address,
                'last_updated': datetime.now()
            })

            logger.info(f"Connected wallet {wallet_address} to user {user_id}")
            return True

        except Exception as e:
            logger.error(f"Error connecting wallet: {e}")
            return False

    async def setup_stripe_payment(self, user_id: str, payment_method_id: str) -> bool:
        """Setup Stripe payment method for user"""
        try:
            # Create or get Stripe customer
            user_doc = db.collection('users').document(user_id).get()
            user_data = user_doc.to_dict() if user_doc.exists else {}
            
            stripe_customer_id = user_data.get('stripe_customer_id')
            if not stripe_customer_id:
                customer = stripe.Customer.create(
                    email=user_data.get('email'),
                    metadata={'user_id': user_id}
                )
                stripe_customer_id = customer.id
                
                # Save customer ID to user profile
                db.collection('users').document(user_id).update({
                    'stripe_customer_id': stripe_customer_id
                })

            # Attach payment method to customer
            stripe.PaymentMethod.attach(
                payment_method_id,
                customer=stripe_customer_id
            )

            # Update wallet with payment method
            self.wallets_ref.document(user_id).update({
                'payment_methods': firestore.ArrayUnion([payment_method_id]),
                'last_updated': datetime.now()
            })

            return True

        except Exception as e:
            logger.error(f"Error setting up Stripe payment: {e}")
            return False

    async def purchase_tokens(self, user_id: str, amount_usd: float, payment_method_id: str) -> bool:
        """Purchase BEACON tokens with USD"""
        try:
            # Calculate token amount (1 USD = 100 BEACON tokens)
            token_amount = int(amount_usd * 100)

            # Create Stripe payment intent
            user_doc = db.collection('users').document(user_id).get()
            user_data = user_doc.to_dict() if user_doc.exists else {}
            
            payment_intent = stripe.PaymentIntent.create(
                amount=int(amount_usd * 100),  # Stripe uses cents
                currency='usd',
                customer=user_data.get('stripe_customer_id'),
                payment_method=payment_method_id,
                confirm=True,
                metadata={
                    'user_id': user_id,
                    'token_amount': token_amount,
                    'type': 'token_purchase'
                }
            )

            if payment_intent.status == 'succeeded':
                # Award tokens to user
                await self.award_tokens(user_id, 'purchase', token_amount, {
                    'payment_intent_id': payment_intent.id,
                    'usd_amount': amount_usd
                })
                return True

            return False

        except Exception as e:
            logger.error(f"Error purchasing tokens: {e}")
            return False

# Initialize tokenomics engine
tokenomics_engine = TokenomicsEngine() 