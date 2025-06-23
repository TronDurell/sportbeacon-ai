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
BEACON_DAO_ABI = [
    {
        "inputs": [
            {"name": "targets", "type": "address[]"},
            {"name": "values", "type": "uint256[]"},
            {"name": "calldatas", "type": "bytes[]"},
            {"name": "description", "type": "string"},
            {"name": "category", "type": "string"},
            {"name": "funding", "type": "uint256"}
        ],
        "name": "propose",
        "outputs": [{"name": "", "type": "uint256"}],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{"name": "proposalId", "type": "uint256"}],
        "name": "state",
        "outputs": [{"name": "", "type": "uint8"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"name": "proposalId", "type": "uint256"}],
        "name": "proposalVotes",
        "outputs": [
            {"name": "againstVotes", "type": "uint256"},
            {"name": "forVotes", "type": "uint256"},
            {"name": "abstainVotes", "type": "uint256"}
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"name": "account", "type": "address"}],
        "name": "getVotingPower",
        "outputs": [{"name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"name": "account", "type": "address"}],
        "name": "canPropose",
        "outputs": [{"name": "", "type": "bool"}],
        "stateMutability": "view",
        "type": "function"
    }
]

# Contract addresses (will be set after deployment)
BEACON_DAO_ADDRESS = os.getenv('BEACON_DAO_ADDRESS', '0x0000000000000000000000000000000000000000')

# Admin wallet for transactions
ADMIN_PRIVATE_KEY = os.getenv('ADMIN_PRIVATE_KEY', 'your_admin_private_key_here')
admin_account = Account.from_key(ADMIN_PRIVATE_KEY)

# Initialize contract
beacon_dao_contract = w3.eth.contract(
    address=BEACON_DAO_ADDRESS,
    abi=BEACON_DAO_ABI
)

class ProposalRequest(BaseModel):
    targets: List[str]
    values: List[int]
    calldatas: List[str]
    description: str
    category: str
    funding: int
    user_id: str

class VoteRequest(BaseModel):
    proposal_id: int
    support: int  # 0 = against, 1 = for, 2 = abstain
    user_id: str

class ProposalMetadata(BaseModel):
    proposal_id: int
    description: str
    category: str
    funding: int
    state: str
    votes_for: int
    votes_against: int
    votes_abstain: int
    proposer: str
    created_at: str

# In-memory storage for demo (replace with database)
proposals = []
votes = []

def is_admin(request: Request):
    """Check if request is from admin"""
    admin_token = request.headers.get('X-Admin-Token')
    if admin_token != os.getenv('ADMIN_TOKEN', 'admin-secret-token'):
        raise HTTPException(status_code=403, detail="Admin access required")
    return True

@app.post("/api/dao/proposals")
async def create_proposal(
    proposal_request: ProposalRequest,
    admin: bool = Depends(is_admin)
):
    """
    Create a new DAO proposal
    """
    try:
        # Validate addresses
        for target in proposal_request.targets:
            if not w3.is_address(target):
                raise HTTPException(status_code=400, detail=f"Invalid target address: {target}")
        
        # Validate arrays length
        if len(proposal_request.targets) != len(proposal_request.values) or len(proposal_request.values) != len(proposal_request.calldatas):
            raise HTTPException(status_code=400, detail="Arrays length mismatch")
        
        # Build transaction
        nonce = w3.eth.get_transaction_count(admin_account.address)
        
        transaction = beacon_dao_contract.functions.propose(
            proposal_request.targets,
            proposal_request.values,
            proposal_request.calldatas,
            proposal_request.description,
            proposal_request.category,
            proposal_request.funding
        ).build_transaction({
            'chainId': 80001,  # Mumbai testnet
            'gas': 500000,
            'gasPrice': w3.eth.gas_price,
            'nonce': nonce,
        })
        
        # Sign and send transaction
        signed_txn = w3.eth.account.sign_transaction(transaction, ADMIN_PRIVATE_KEY)
        tx_hash = w3.eth.send_raw_transaction(signed_txn.rawTransaction)
        
        # Wait for transaction receipt
        tx_receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
        
        # Extract proposal ID from events (simplified for demo)
        proposal_id = len(proposals) + 1
        
        # Record proposal
        proposal_record = {
            'id': str(uuid.uuid4()),
            'proposal_id': proposal_id,
            'user_id': proposal_request.user_id,
            'targets': proposal_request.targets,
            'values': proposal_request.values,
            'calldatas': proposal_request.calldatas,
            'description': proposal_request.description,
            'category': proposal_request.category,
            'funding': proposal_request.funding,
            'proposer': admin_account.address,
            'tx_hash': tx_hash.hex(),
            'block_number': tx_receipt.blockNumber,
            'status': 'success' if tx_receipt.status == 1 else 'failed',
            'created_at': datetime.utcnow().isoformat()
        }
        proposals.append(proposal_record)
        
        return {
            "message": "Proposal created successfully",
            "proposal_id": proposal_id,
            "tx_hash": tx_hash.hex(),
            "block_number": tx_receipt.blockNumber
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create proposal: {str(e)}")

@app.post("/api/dao/vote")
async def cast_vote(
    vote_request: VoteRequest,
    admin: bool = Depends(is_admin)
):
    """
    Cast a vote on a proposal
    """
    try:
        # Validate support value
        if vote_request.support not in [0, 1, 2]:
            raise HTTPException(status_code=400, detail="Invalid support value. Use 0=against, 1=for, 2=abstain")
        
        # Build transaction
        nonce = w3.eth.get_transaction_count(admin_account.address)
        
        transaction = beacon_dao_contract.functions.castVote(
            vote_request.proposal_id,
            vote_request.support
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
        
        # Record vote
        vote_record = {
            'id': str(uuid.uuid4()),
            'proposal_id': vote_request.proposal_id,
            'user_id': vote_request.user_id,
            'support': vote_request.support,
            'voter': admin_account.address,
            'tx_hash': tx_hash.hex(),
            'block_number': tx_receipt.blockNumber,
            'status': 'success' if tx_receipt.status == 1 else 'failed',
            'timestamp': datetime.utcnow().isoformat()
        }
        votes.append(vote_record)
        
        return {
            "message": "Vote cast successfully",
            "proposal_id": vote_request.proposal_id,
            "support": vote_request.support,
            "tx_hash": tx_hash.hex(),
            "block_number": tx_receipt.blockNumber
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to cast vote: {str(e)}")

@app.get("/api/dao/proposals")
async def get_proposals(limit: int = 50, category: Optional[str] = None):
    """
    Get all proposals with optional filtering
    """
    try:
        filtered_proposals = proposals
        
        if category:
            filtered_proposals = [p for p in proposals if p['category'] == category]
        
        # Sort by creation date (newest first)
        sorted_proposals = sorted(filtered_proposals, key=lambda x: x['created_at'], reverse=True)
        
        return {
            "proposals": sorted_proposals[:limit],
            "total_count": len(filtered_proposals)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get proposals: {str(e)}")

@app.get("/api/dao/proposals/{proposal_id}")
async def get_proposal(proposal_id: int):
    """
    Get a specific proposal by ID
    """
    try:
        # Find proposal in local storage
        proposal = next((p for p in proposals if p['proposal_id'] == proposal_id), None)
        
        if not proposal:
            raise HTTPException(status_code=404, detail="Proposal not found")
        
        # Get on-chain data
        try:
            state = beacon_dao_contract.functions.state(proposal_id).call()
            votes_data = beacon_dao_contract.functions.proposalVotes(proposal_id).call()
            
            # Convert state to string
            state_names = ['Pending', 'Active', 'Canceled', 'Defeated', 'Succeeded', 'Queued', 'Expired', 'Executed']
            state_name = state_names[state] if state < len(state_names) else 'Unknown'
            
            proposal['on_chain_state'] = state_name
            proposal['votes_for'] = votes_data[1]
            proposal['votes_against'] = votes_data[0]
            proposal['votes_abstain'] = votes_data[2]
            
        except Exception as e:
            # If on-chain call fails, use local data
            proposal['on_chain_state'] = 'Unknown'
            proposal['votes_for'] = 0
            proposal['votes_against'] = 0
            proposal['votes_abstain'] = 0
        
        return proposal
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get proposal: {str(e)}")

@app.get("/api/dao/voting-power/{address}")
async def get_voting_power(address: str):
    """
    Get voting power for an address
    """
    try:
        if not w3.is_address(address):
            raise HTTPException(status_code=400, detail="Invalid address")
        
        voting_power = beacon_dao_contract.functions.getVotingPower(address).call()
        
        return {
            "address": address,
            "voting_power": voting_power,
            "voting_power_formatted": w3.from_wei(voting_power, 'ether')
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get voting power: {str(e)}")

@app.get("/api/dao/can-propose/{address}")
async def can_propose(address: str):
    """
    Check if an address can create proposals
    """
    try:
        if not w3.is_address(address):
            raise HTTPException(status_code=400, detail="Invalid address")
        
        can_propose_result = beacon_dao_contract.functions.canPropose(address).call()
        
        return {
            "address": address,
            "can_propose": can_propose_result
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to check proposal eligibility: {str(e)}")

@app.get("/api/dao/votes/{proposal_id}")
async def get_proposal_votes(proposal_id: int):
    """
    Get all votes for a specific proposal
    """
    try:
        proposal_votes = [v for v in votes if v['proposal_id'] == proposal_id]
        
        # Sort by timestamp (newest first)
        sorted_votes = sorted(proposal_votes, key=lambda x: x['timestamp'], reverse=True)
        
        return {
            "proposal_id": proposal_id,
            "votes": sorted_votes,
            "total_votes": len(sorted_votes)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get proposal votes: {str(e)}")

@app.get("/api/dao/stats")
async def get_dao_stats():
    """
    Get DAO statistics
    """
    try:
        total_proposals = len(proposals)
        active_proposals = len([p for p in proposals if p.get('on_chain_state') == 'Active'])
        total_votes = len(votes)
        
        # Calculate category distribution
        categories = {}
        for proposal in proposals:
            category = proposal['category']
            categories[category] = categories.get(category, 0) + 1
        
        return {
            "total_proposals": total_proposals,
            "active_proposals": active_proposals,
            "total_votes": total_votes,
            "category_distribution": categories
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get DAO stats: {str(e)}")

@app.post("/api/dao/execute/{proposal_id}")
async def execute_proposal(
    proposal_id: int,
    admin: bool = Depends(is_admin)
):
    """
    Execute a successful proposal
    """
    try:
        # Find proposal
        proposal = next((p for p in proposals if p['proposal_id'] == proposal_id), None)
        
        if not proposal:
            raise HTTPException(status_code=404, detail="Proposal not found")
        
        # Build transaction
        nonce = w3.eth.get_transaction_count(admin_account.address)
        
        transaction = beacon_dao_contract.functions.execute(
            proposal['targets'],
            proposal['values'],
            proposal['calldatas'],
            w3.keccak(text=proposal['description'])
        ).build_transaction({
            'chainId': 80001,  # Mumbai testnet
            'gas': 500000,
            'gasPrice': w3.eth.gas_price,
            'nonce': nonce,
        })
        
        # Sign and send transaction
        signed_txn = w3.eth.account.sign_transaction(transaction, ADMIN_PRIVATE_KEY)
        tx_hash = w3.eth.send_raw_transaction(signed_txn.rawTransaction)
        
        # Wait for transaction receipt
        tx_receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
        
        return {
            "message": "Proposal executed successfully",
            "proposal_id": proposal_id,
            "tx_hash": tx_hash.hex(),
            "block_number": tx_receipt.blockNumber
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to execute proposal: {str(e)}") 