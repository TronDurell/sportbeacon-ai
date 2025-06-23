from fastapi import FastAPI, HTTPException, Depends, Request
from pydantic import BaseModel
from typing import List, Optional
import os
from datetime import datetime
import uuid
from web3 import Web3
import json
from eth_account import Account
from eth_account.messages import encode_defunct
import asyncio

app = FastAPI()

# Web3 Configuration
ALCHEMY_URL = os.getenv('ALCHEMY_URL', 'https://polygon-mumbai.g.alchemy.com/v2/your_key')
w3 = Web3(Web3.HTTPProvider(ALCHEMY_URL))

# Contract ABIs (simplified for demo)
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
        "inputs": [{"name": "account", "type": "address"}],
        "name": "balanceOf",
        "outputs": [{"name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    }
]

BEACON_MARKETPLACE_ABI = [
    {
        "inputs": [
            {"name": "tokenId", "type": "uint256"},
            {"name": "price", "type": "uint256"},
            {"name": "quantity", "type": "uint256"},
            {"name": "metadata", "type": "string"}
        ],
        "name": "createListing",
        "outputs": [{"name": "", "type": "uint256"}],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {"name": "listingId", "type": "uint256"},
            {"name": "quantity", "type": "uint256"}
        ],
        "name": "buyNFT",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [{"name": "listingId", "type": "uint256"}],
        "name": "getListing",
        "outputs": [
            {"name": "listingId", "type": "uint256"},
            {"name": "creator", "type": "address"},
            {"name": "tokenId", "type": "uint256"},
            {"name": "price", "type": "uint256"},
            {"name": "quantity", "type": "uint256"},
            {"name": "sold", "type": "uint256"},
            {"name": "active", "type": "bool"},
            {"name": "metadata", "type": "string"},
            {"name": "createdAt", "type": "uint256"},
            {"name": "updatedAt", "type": "uint256"}
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"name": "creator", "type": "address"}],
        "name": "getCreatorListings",
        "outputs": [{"name": "", "type": "uint256[]"}],
        "stateMutability": "view",
        "type": "function"
    }
]

# Contract addresses (will be set after deployment)
BEACON_NFT_ADDRESS = os.getenv('BEACON_NFT_ADDRESS', '0x0000000000000000000000000000000000000000')
BEACON_MARKETPLACE_ADDRESS = os.getenv('BEACON_MARKETPLACE_ADDRESS', '0x0000000000000000000000000000000000000000')

# Admin wallet for transactions
ADMIN_PRIVATE_KEY = os.getenv('ADMIN_PRIVATE_KEY', 'your_admin_private_key_here')
admin_account = Account.from_key(ADMIN_PRIVATE_KEY)

# Initialize contracts
beacon_nft_contract = w3.eth.contract(
    address=BEACON_NFT_ADDRESS,
    abi=BEACON_NFT_ABI
)

beacon_marketplace_contract = w3.eth.contract(
    address=BEACON_MARKETPLACE_ADDRESS,
    abi=BEACON_MARKETPLACE_ABI
)

class NFTListingRequest(BaseModel):
    name: str
    description: str
    supply: int
    price: int  # Price in wei
    creator_wallet: str
    signature: str
    metadata_uri: Optional[str] = None
    category: Optional[str] = "general"

class NFTBuyRequest(BaseModel):
    listing_id: int
    quantity: int
    buyer_wallet: str
    signature: str

class NFTMetadata(BaseModel):
    name: str
    description: str
    image_uri: Optional[str]
    category: str
    attributes: Optional[dict] = {}

# In-memory storage for demo (replace with database/Firestore)
nft_listings = []
nft_metadata = []
sales_history = []

def verify_signature(message: str, signature: str, expected_address: str) -> bool:
    """
    Verify wallet signature
    """
    try:
        # Create message hash
        message_hash = encode_defunct(text=message)
        
        # Recover address from signature
        recovered_address = Account.recover_message(message_hash, signature=signature)
        
        # Check if recovered address matches expected address
        return recovered_address.lower() == expected_address.lower()
    except Exception as e:
        print(f"Signature verification failed: {e}")
        return False

def is_admin(request: Request):
    """Check if request is from admin"""
    admin_token = request.headers.get('X-Admin-Token')
    if admin_token != os.getenv('ADMIN_TOKEN', 'admin-secret-token'):
        raise HTTPException(status_code=403, detail="Admin access required")
    return True

@app.post("/api/nft/list")
async def create_nft_listing(
    listing_request: NFTListingRequest,
    admin: bool = Depends(is_admin)
):
    """
    Create a new NFT listing with signature verification
    """
    try:
        # Validate wallet address
        if not w3.is_address(listing_request.creator_wallet):
            raise HTTPException(status_code=400, detail="Invalid creator wallet address")
        
        # Validate supply and price
        if listing_request.supply <= 0:
            raise HTTPException(status_code=400, detail="Supply must be greater than 0")
        if listing_request.price <= 0:
            raise HTTPException(status_code=400, detail="Price must be greater than 0")
        
        # Create message for signature verification
        message = f"Create NFT Listing: {listing_request.name} - Supply: {listing_request.supply} - Price: {listing_request.price} wei"
        
        # Verify signature
        if not verify_signature(message, listing_request.signature, listing_request.creator_wallet):
            raise HTTPException(status_code=401, detail="Invalid signature")
        
        # Generate unique token ID (in production, this would be more sophisticated)
        token_id = len(nft_listings) + 100  # Start from 100 to avoid conflicts
        
        # Mint NFT to creator first
        nonce = w3.eth.get_transaction_count(admin_account.address)
        
        mint_transaction = beacon_nft_contract.functions.mintNFT(
            listing_request.creator_wallet,
            token_id,
            listing_request.supply,
            f"Creator listing: {listing_request.name}"
        ).build_transaction({
            'chainId': 80001,  # Mumbai testnet
            'gas': 300000,
            'gasPrice': w3.eth.gas_price,
            'nonce': nonce,
        })
        
        # Sign and send mint transaction
        signed_mint_txn = w3.eth.account.sign_transaction(mint_transaction, ADMIN_PRIVATE_KEY)
        mint_tx_hash = w3.eth.send_raw_transaction(signed_mint_txn.rawTransaction)
        mint_receipt = w3.eth.wait_for_transaction_receipt(mint_tx_hash)
        
        # Create listing on marketplace
        nonce = w3.eth.get_transaction_count(admin_account.address)
        
        # Prepare metadata
        metadata = {
            "name": listing_request.name,
            "description": listing_request.description,
            "category": listing_request.category,
            "image_uri": listing_request.metadata_uri,
            "creator": listing_request.creator_wallet,
            "created_at": datetime.utcnow().isoformat()
        }
        
        listing_transaction = beacon_marketplace_contract.functions.createListing(
            token_id,
            listing_request.price,
            listing_request.supply,
            json.dumps(metadata)
        ).build_transaction({
            'chainId': 80001,  # Mumbai testnet
            'gas': 400000,
            'gasPrice': w3.eth.gas_price,
            'nonce': nonce,
        })
        
        # Sign and send listing transaction
        signed_listing_txn = w3.eth.account.sign_transaction(listing_transaction, ADMIN_PRIVATE_KEY)
        listing_tx_hash = w3.eth.send_raw_transaction(signed_listing_txn.rawTransaction)
        listing_receipt = w3.eth.wait_for_transaction_receipt(listing_tx_hash)
        
        # Extract listing ID from events (simplified for demo)
        listing_id = len(nft_listings) + 1
        
        # Store listing data
        listing_record = {
            'id': str(uuid.uuid4()),
            'listing_id': listing_id,
            'token_id': token_id,
            'creator_wallet': listing_request.creator_wallet,
            'name': listing_request.name,
            'description': listing_request.description,
            'supply': listing_request.supply,
            'price': listing_request.price,
            'category': listing_request.category,
            'metadata_uri': listing_request.metadata_uri,
            'mint_tx_hash': mint_tx_hash.hex(),
            'listing_tx_hash': listing_tx_hash.hex(),
            'status': 'active',
            'created_at': datetime.utcnow().isoformat()
        }
        nft_listings.append(listing_record)
        
        # Store metadata
        metadata_record = {
            'token_id': token_id,
            'metadata': metadata,
            'created_at': datetime.utcnow().isoformat()
        }
        nft_metadata.append(metadata_record)
        
        return {
            "message": "NFT listing created successfully",
            "listing_id": listing_id,
            "token_id": token_id,
            "mint_tx_hash": mint_tx_hash.hex(),
            "listing_tx_hash": listing_tx_hash.hex(),
            "price_wei": listing_request.price,
            "price_eth": w3.from_wei(listing_request.price, 'ether')
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create NFT listing: {str(e)}")

@app.post("/api/nft/buy")
async def buy_nft(
    buy_request: NFTBuyRequest,
    admin: bool = Depends(is_admin)
):
    """
    Buy NFT from marketplace with signature verification
    """
    try:
        # Validate wallet address
        if not w3.is_address(buy_request.buyer_wallet):
            raise HTTPException(status_code=400, detail="Invalid buyer wallet address")
        
        # Validate quantity
        if buy_request.quantity <= 0:
            raise HTTPException(status_code=400, detail="Quantity must be greater than 0")
        
        # Get listing details
        listing = next((l for l in nft_listings if l['listing_id'] == buy_request.listing_id), None)
        if not listing:
            raise HTTPException(status_code=404, detail="Listing not found")
        
        if listing['status'] != 'active':
            raise HTTPException(status_code=400, detail="Listing is not active")
        
        # Calculate total price
        total_price = listing['price'] * buy_request.quantity
        
        # Create message for signature verification
        message = f"Buy NFT: Listing {buy_request.listing_id} - Quantity: {buy_request.quantity} - Total Price: {total_price} wei"
        
        # Verify signature
        if not verify_signature(message, buy_request.signature, buy_request.buyer_wallet):
            raise HTTPException(status_code=401, detail="Invalid signature")
        
        # Execute buy transaction
        nonce = w3.eth.get_transaction_count(admin_account.address)
        
        buy_transaction = beacon_marketplace_contract.functions.buyNFT(
            buy_request.listing_id,
            buy_request.quantity
        ).build_transaction({
            'chainId': 80001,  # Mumbai testnet
            'gas': 300000,
            'gasPrice': w3.eth.gas_price,
            'nonce': nonce,
            'value': total_price  # Send ETH with transaction
        })
        
        # Sign and send buy transaction
        signed_buy_txn = w3.eth.account.sign_transaction(buy_transaction, ADMIN_PRIVATE_KEY)
        buy_tx_hash = w3.eth.send_raw_transaction(signed_buy_txn.rawTransaction)
        buy_receipt = w3.eth.wait_for_transaction_receipt(buy_tx_hash)
        
        # Record sale
        sale_record = {
            'id': str(uuid.uuid4()),
            'listing_id': buy_request.listing_id,
            'buyer_wallet': buy_request.buyer_wallet,
            'seller_wallet': listing['creator_wallet'],
            'token_id': listing['token_id'],
            'quantity': buy_request.quantity,
            'price_per_unit': listing['price'],
            'total_price': total_price,
            'tx_hash': buy_tx_hash.hex(),
            'status': 'success' if buy_receipt.status == 1 else 'failed',
            'timestamp': datetime.utcnow().isoformat()
        }
        sales_history.append(sale_record)
        
        # Update listing status if sold out
        # In a real implementation, you'd check the on-chain state
        
        return {
            "message": "NFT purchase successful",
            "listing_id": buy_request.listing_id,
            "quantity": buy_request.quantity,
            "total_price_wei": total_price,
            "total_price_eth": w3.from_wei(total_price, 'ether'),
            "tx_hash": buy_tx_hash.hex(),
            "buyer_wallet": buy_request.buyer_wallet
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to buy NFT: {str(e)}")

@app.get("/api/nft/creator/{creator_address}")
async def get_creator_nfts(creator_address: str):
    """
    Get all NFTs listed by a specific creator
    """
    try:
        # Validate wallet address
        if not w3.is_address(creator_address):
            raise HTTPException(status_code=400, detail="Invalid creator address")
        
        # Get creator's listings
        creator_listings = [l for l in nft_listings if l['creator_wallet'].lower() == creator_address.lower()]
        
        # Add metadata to listings
        for listing in creator_listings:
            metadata = next((m for m in nft_metadata if m['token_id'] == listing['token_id']), None)
            if metadata:
                listing['metadata'] = metadata['metadata']
        
        # Sort by creation date (newest first)
        sorted_listings = sorted(creator_listings, key=lambda x: x['created_at'], reverse=True)
        
        return {
            "creator_address": creator_address,
            "listings": sorted_listings,
            "total_listings": len(sorted_listings)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get creator NFTs: {str(e)}")

@app.get("/api/nft/listings")
async def get_all_listings(
    category: Optional[str] = None,
    min_price: Optional[int] = None,
    max_price: Optional[int] = None,
    limit: int = 50
):
    """
    Get all active NFT listings with optional filters
    """
    try:
        filtered_listings = [l for l in nft_listings if l['status'] == 'active']
        
        # Apply filters
        if category:
            filtered_listings = [l for l in filtered_listings if l['category'] == category]
        
        if min_price is not None:
            filtered_listings = [l for l in filtered_listings if l['price'] >= min_price]
        
        if max_price is not None:
            filtered_listings = [l for l in filtered_listings if l['price'] <= max_price]
        
        # Add metadata to listings
        for listing in filtered_listings:
            metadata = next((m for m in nft_metadata if m['token_id'] == listing['token_id']), None)
            if metadata:
                listing['metadata'] = metadata['metadata']
        
        # Sort by creation date (newest first)
        sorted_listings = sorted(filtered_listings, key=lambda x: x['created_at'], reverse=True)
        
        return {
            "listings": sorted_listings[:limit],
            "total_listings": len(filtered_listings),
            "filters_applied": {
                "category": category,
                "min_price": min_price,
                "max_price": max_price
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get listings: {str(e)}")

@app.get("/api/nft/listing/{listing_id}")
async def get_listing_details(listing_id: int):
    """
    Get detailed information about a specific listing
    """
    try:
        listing = next((l for l in nft_listings if l['listing_id'] == listing_id), None)
        
        if not listing:
            raise HTTPException(status_code=404, detail="Listing not found")
        
        # Add metadata
        metadata = next((m for m in nft_metadata if m['token_id'] == listing['token_id']), None)
        if metadata:
            listing['metadata'] = metadata['metadata']
        
        # Get on-chain listing data if available
        try:
            on_chain_listing = beacon_marketplace_contract.functions.getListing(listing_id).call()
            listing['on_chain_data'] = {
                'creator': on_chain_listing[1],
                'token_id': on_chain_listing[2],
                'price': on_chain_listing[3],
                'quantity': on_chain_listing[4],
                'sold': on_chain_listing[5],
                'active': on_chain_listing[6],
                'available': on_chain_listing[4] - on_chain_listing[5]
            }
        except Exception as e:
            listing['on_chain_data'] = None
        
        return listing
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get listing details: {str(e)}")

@app.get("/api/nft/sales")
async def get_sales_history(
    creator_address: Optional[str] = None,
    buyer_address: Optional[str] = None,
    limit: int = 50
):
    """
    Get sales history with optional filtering
    """
    try:
        filtered_sales = sales_history
        
        if creator_address:
            if not w3.is_address(creator_address):
                raise HTTPException(status_code=400, detail="Invalid creator address")
            filtered_sales = [s for s in sales_history if s['seller_wallet'].lower() == creator_address.lower()]
        
        if buyer_address:
            if not w3.is_address(buyer_address):
                raise HTTPException(status_code=400, detail="Invalid buyer address")
            filtered_sales = [s for s in sales_history if s['buyer_wallet'].lower() == buyer_address.lower()]
        
        # Sort by timestamp (newest first)
        sorted_sales = sorted(filtered_sales, key=lambda x: x['timestamp'], reverse=True)
        
        return {
            "sales": sorted_sales[:limit],
            "total_sales": len(filtered_sales),
            "filters_applied": {
                "creator_address": creator_address,
                "buyer_address": buyer_address
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get sales history: {str(e)}")

@app.get("/api/nft/marketplace-stats")
async def get_marketplace_stats():
    """
    Get marketplace statistics
    """
    try:
        total_listings = len(nft_listings)
        active_listings = len([l for l in nft_listings if l['status'] == 'active'])
        total_sales = len(sales_history)
        
        # Calculate total volume
        total_volume = sum(sale['total_price'] for sale in sales_history if sale['status'] == 'success')
        
        # Calculate category distribution
        categories = {}
        for listing in nft_listings:
            category = listing['category']
            categories[category] = categories.get(category, 0) + 1
        
        return {
            "total_listings": total_listings,
            "active_listings": active_listings,
            "total_sales": total_sales,
            "total_volume_wei": total_volume,
            "total_volume_eth": w3.from_wei(total_volume, 'ether'),
            "category_distribution": categories
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get marketplace stats: {str(e)}") 