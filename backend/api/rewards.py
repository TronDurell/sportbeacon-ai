from fastapi import FastAPI, HTTPException, Depends, Request
from pydantic import BaseModel
from typing import List, Optional
import os
from datetime import datetime
import uuid
from web3 import Web3
import json
from eth_account import Account
import asyncio

app = FastAPI()

# Web3 Configuration
ALCHEMY_URL = os.getenv('ALCHEMY_URL', 'https://polygon-mumbai.g.alchemy.com/v2/your_key')
w3 = Web3(Web3.HTTPProvider(ALCHEMY_URL))

# Contract ABIs (simplified for demo)
BEACON_TOKEN_ABI = [
    {
        "inputs": [
            {"name": "recipient", "type": "address"},
            {"name": "amount", "type": "uint256"},
            {"name": "reason", "type": "string"}
        ],
        "name": "issueRewards",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{"name": "account", "type": "address"}],
        "name": "balanceOf",
        "outputs": [{"name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    }
]

BEACON_NFT_ABI = [
    {
        "inputs": [
            {"name": "recipient", "type": "address"},
            {"name": "tokenId", "type": "uint256"},
            {"name": "amount", "type": "uint256"},
            {"name": "reason", "type": "string"}
        ],
        "name": "mintNFT",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {"name": "user", "type": "address"},
            {"name": "tokenId", "type": "uint256"}
        ],
        "name": "hasActiveAccess",
        "outputs": [{"name": "", "type": "bool"}],
        "stateMutability": "view",
        "type": "function"
    }
]

# Contract addresses (will be set after deployment)
BEACON_TOKEN_ADDRESS = os.getenv('BEACON_TOKEN_ADDRESS', '0x0000000000000000000000000000000000000000')
BEACON_NFT_ADDRESS = os.getenv('BEACON_NFT_ADDRESS', '0x0000000000000000000000000000000000000000')

# Admin wallet for transactions
ADMIN_PRIVATE_KEY = os.getenv('ADMIN_PRIVATE_KEY', 'your_admin_private_key_here')
admin_account = Account.from_key(ADMIN_PRIVATE_KEY)

# Initialize contracts
beacon_token_contract = w3.eth.contract(
    address=BEACON_TOKEN_ADDRESS,
    abi=BEACON_TOKEN_ABI
)

beacon_nft_contract = w3.eth.contract(
    address=BEACON_NFT_ADDRESS,
    abi=BEACON_NFT_ABI
)

class RewardRequest(BaseModel):
    recipient_address: str
    amount: int  # Amount in wei (18 decimals)
    reason: str
    user_id: str

class NFTMintRequest(BaseModel):
    recipient_address: str
    token_id: int
    amount: int = 1
    reason: str
    user_id: str

class SubscriptionRequest(BaseModel):
    recipient_address: str
    token_id: int  # 5 for monthly, 6 for yearly
    duration_seconds: int
    user_id: str

class BatchRewardRequest(BaseModel):
    rewards: List[RewardRequest]

class BatchNFTRequest(BaseModel):
    nfts: List[NFTMintRequest]

# In-memory storage for demo (replace with database)
reward_history = []
nft_mint_history = []

def is_admin(request: Request):
    """Check if request is from admin"""
    admin_token = request.headers.get('X-Admin-Token')
    if admin_token != os.getenv('ADMIN_TOKEN', 'admin-secret-token'):
        raise HTTPException(status_code=403, detail="Admin access required")
    return True

@app.post("/api/rewards/issue")
async def issue_rewards(
    reward_request: RewardRequest,
    admin: bool = Depends(is_admin)
):
    """
    Issue BEACON tokens to a creator
    """
    try:
        # Validate address
        if not w3.is_address(reward_request.recipient_address):
            raise HTTPException(status_code=400, detail="Invalid recipient address")
        
        # Validate amount
        if reward_request.amount <= 0:
            raise HTTPException(status_code=400, detail="Amount must be positive")
        
        # Build transaction
        nonce = w3.eth.get_transaction_count(admin_account.address)
        
        transaction = beacon_token_contract.functions.issueRewards(
            reward_request.recipient_address,
            reward_request.amount,
            reward_request.reason
        ).build_transaction({
            'chainId': 80001,  # Mumbai testnet
            'gas': 200000,
            'gasPrice': w3.eth.gas_price,
            'nonce': nonce,
        })
        
        # Sign and send transaction
        signed_txn = w3.eth.account.sign_transaction(transaction, ADMIN_PRIVATE_KEY)
        tx_hash = w3.eth.send_raw_transaction(signed_txn.rawTransaction)
        
        # Wait for transaction receipt
        tx_receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
        
        # Record reward
        reward_record = {
            'id': str(uuid.uuid4()),
            'user_id': reward_request.user_id,
            'recipient_address': reward_request.recipient_address,
            'amount': reward_request.amount,
            'reason': reward_request.reason,
            'tx_hash': tx_hash.hex(),
            'block_number': tx_receipt.blockNumber,
            'status': 'success' if tx_receipt.status == 1 else 'failed',
            'timestamp': datetime.utcnow().isoformat()
        }
        reward_history.append(reward_record)
        
        return {
            "message": "Rewards issued successfully",
            "tx_hash": tx_hash.hex(),
            "block_number": tx_receipt.blockNumber,
            "reward_id": reward_record['id']
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to issue rewards: {str(e)}")

@app.post("/api/rewards/batch")
async def batch_issue_rewards(
    batch_request: BatchRewardRequest,
    admin: bool = Depends(is_admin)
):
    """
    Issue BEACON tokens to multiple creators
    """
    try:
        results = []
        
        for reward in batch_request.rewards:
            try:
                # Issue individual reward
                result = await issue_rewards(reward, admin)
                results.append({
                    'recipient': reward.recipient_address,
                    'status': 'success',
                    'tx_hash': result['tx_hash']
                })
            except Exception as e:
                results.append({
                    'recipient': reward.recipient_address,
                    'status': 'failed',
                    'error': str(e)
                })
        
        return {
            "message": "Batch rewards processed",
            "results": results
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process batch rewards: {str(e)}")

@app.post("/api/nft/mint")
async def mint_nft(
    nft_request: NFTMintRequest,
    admin: bool = Depends(is_admin)
):
    """
    Mint NFT to a user
    """
    try:
        # Validate address
        if not w3.is_address(nft_request.recipient_address):
            raise HTTPException(status_code=400, detail="Invalid recipient address")
        
        # Validate token ID
        valid_token_ids = [1, 2, 3, 4, 5, 6]  # Premium Coach, Top Creator, etc.
        if nft_request.token_id not in valid_token_ids:
            raise HTTPException(status_code=400, detail="Invalid token ID")
        
        # Build transaction
        nonce = w3.eth.get_transaction_count(admin_account.address)
        
        transaction = beacon_nft_contract.functions.mintNFT(
            nft_request.recipient_address,
            nft_request.token_id,
            nft_request.amount,
            nft_request.reason
        ).build_transaction({
            'chainId': 80001,  # Mumbai testnet
            'gas': 200000,
            'gasPrice': w3.eth.gas_price,
            'nonce': nonce,
        })
        
        # Sign and send transaction
        signed_txn = w3.eth.account.sign_transaction(transaction, ADMIN_PRIVATE_KEY)
        tx_hash = w3.eth.send_raw_transaction(signed_txn.rawTransaction)
        
        # Wait for transaction receipt
        tx_receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
        
        # Record NFT mint
        nft_record = {
            'id': str(uuid.uuid4()),
            'user_id': nft_request.user_id,
            'recipient_address': nft_request.recipient_address,
            'token_id': nft_request.token_id,
            'amount': nft_request.amount,
            'reason': nft_request.reason,
            'tx_hash': tx_hash.hex(),
            'block_number': tx_receipt.blockNumber,
            'status': 'success' if tx_receipt.status == 1 else 'failed',
            'timestamp': datetime.utcnow().isoformat()
        }
        nft_mint_history.append(nft_record)
        
        return {
            "message": "NFT minted successfully",
            "tx_hash": tx_hash.hex(),
            "block_number": tx_receipt.blockNumber,
            "nft_id": nft_record['id']
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to mint NFT: {str(e)}")

@app.post("/api/nft/subscription")
async def mint_subscription(
    subscription_request: SubscriptionRequest,
    admin: bool = Depends(is_admin)
):
    """
    Mint subscription NFT with expiry
    """
    try:
        # Validate address
        if not w3.is_address(subscription_request.recipient_address):
            raise HTTPException(status_code=400, detail="Invalid recipient address")
        
        # Validate token ID (5 for monthly, 6 for yearly)
        if subscription_request.token_id not in [5, 6]:
            raise HTTPException(status_code=400, detail="Invalid subscription token ID")
        
        # Build transaction
        nonce = w3.eth.get_transaction_count(admin_account.address)
        
        transaction = beacon_nft_contract.functions.mintSubscription(
            subscription_request.recipient_address,
            subscription_request.token_id,
            subscription_request.duration_seconds
        ).build_transaction({
            'chainId': 80001,  # Mumbai testnet
            'gas': 200000,
            'gasPrice': w3.eth.gas_price,
            'nonce': nonce,
        })
        
        # Sign and send transaction
        signed_txn = w3.eth.account.sign_transaction(transaction, ADMIN_PRIVATE_KEY)
        tx_hash = w3.eth.send_raw_transaction(signed_txn.rawTransaction)
        
        # Wait for transaction receipt
        tx_receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
        
        # Record subscription
        subscription_record = {
            'id': str(uuid.uuid4()),
            'user_id': subscription_request.user_id,
            'recipient_address': subscription_request.recipient_address,
            'token_id': subscription_request.token_id,
            'duration_seconds': subscription_request.duration_seconds,
            'expiry': datetime.utcnow().timestamp() + subscription_request.duration_seconds,
            'tx_hash': tx_hash.hex(),
            'block_number': tx_receipt.blockNumber,
            'status': 'success' if tx_receipt.status == 1 else 'failed',
            'timestamp': datetime.utcnow().isoformat()
        }
        nft_mint_history.append(subscription_record)
        
        return {
            "message": "Subscription NFT minted successfully",
            "tx_hash": tx_hash.hex(),
            "block_number": tx_receipt.blockNumber,
            "subscription_id": subscription_record['id'],
            "expiry": subscription_record['expiry']
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to mint subscription: {str(e)}")

@app.get("/api/rewards/balance/{address}")
async def get_token_balance(address: str):
    """
    Get BEACON token balance for an address
    """
    try:
        if not w3.is_address(address):
            raise HTTPException(status_code=400, detail="Invalid address")
        
        balance = beacon_token_contract.functions.balanceOf(address).call()
        
        return {
            "address": address,
            "balance": balance,
            "balance_formatted": w3.from_wei(balance, 'ether')
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get balance: {str(e)}")

@app.get("/api/nft/access/{address}")
async def check_nft_access(address: str, token_id: int):
    """
    Check if address has active access to an NFT
    """
    try:
        if not w3.is_address(address):
            raise HTTPException(status_code=400, detail="Invalid address")
        
        has_access = beacon_nft_contract.functions.hasActiveAccess(address, token_id).call()
        
        return {
            "address": address,
            "token_id": token_id,
            "has_access": has_access
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to check access: {str(e)}")

@app.get("/api/rewards/history")
async def get_reward_history(limit: int = 50):
    """
    Get reward issuance history
    """
    try:
        sorted_rewards = sorted(reward_history, key=lambda x: x['timestamp'], reverse=True)
        return {
            "rewards": sorted_rewards[:limit],
            "total_count": len(reward_history)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get reward history: {str(e)}")

@app.get("/api/nft/history")
async def get_nft_history(limit: int = 50):
    """
    Get NFT minting history
    """
    try:
        sorted_nfts = sorted(nft_mint_history, key=lambda x: x['timestamp'], reverse=True)
        return {
            "nfts": sorted_nfts[:limit],
            "total_count": len(nft_mint_history)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get NFT history: {str(e)}")

@app.post("/api/rewards/auto-issue")
async def auto_issue_rewards(
    admin: bool = Depends(is_admin)
):
    """
    Automatically issue rewards based on milestones and engagement
    """
    try:
        # This would typically:
        # 1. Query database for eligible creators
        # 2. Calculate rewards based on engagement metrics
        # 3. Issue rewards in batch
        
        # For demo purposes, return mock data
        return {
            "message": "Auto-rewards processed",
            "creators_processed": 0,
            "total_rewards_issued": 0
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process auto-rewards: {str(e)}") 