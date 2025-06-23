from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional
import json
from eth_account.messages import encode_defunct
from web3 import Web3
from web3.auto import w3

app = FastAPI()

class Web3AuthRequest(BaseModel):
    wallet_address: str
    message: str
    signature: str
    nonce: Optional[str] = None

class Web3AuthResponse(BaseModel):
    success: bool
    wallet_address: str
    user_id: Optional[str] = None
    message: str

# In-memory storage for demo (replace with database)
wallet_users = {}

@app.post("/web3/auth", response_model=Web3AuthResponse)
async def authenticate_wallet(auth_request: Web3AuthRequest):
    """
    Authenticate a wallet using EIP-712 signature verification.
    """
    try:
        # Verify signature
        message_hash = encode_defunct(text=auth_request.message)
        recovered_address = w3.eth.account.recover_message(message_hash, signature=auth_request.signature)
        
        # Check if recovered address matches provided address
        if recovered_address.lower() != auth_request.wallet_address.lower():
            raise HTTPException(status_code=400, detail="Invalid signature")
        
        # Generate or retrieve user ID
        user_id = wallet_users.get(auth_request.wallet_address)
        if not user_id:
            user_id = f"user_{len(wallet_users) + 1}"
            wallet_users[auth_request.wallet_address] = user_id
        
        return Web3AuthResponse(
            success=True,
            wallet_address=auth_request.wallet_address,
            user_id=user_id,
            message="Authentication successful"
        )
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Authentication failed: {str(e)}")

@app.get("/web3/verify/{wallet_address}")
async def verify_wallet_ownership(wallet_address: str):
    """
    Check if a wallet address is registered.
    """
    user_id = wallet_users.get(wallet_address)
    return {
        "wallet_address": wallet_address,
        "is_registered": user_id is not None,
        "user_id": user_id
    }

@app.post("/web3/logout")
async def logout_wallet(wallet_address: str):
    """
    Logout a wallet (optional - for session management).
    """
    # In a real implementation, you might invalidate sessions here
    return {"message": "Logged out successfully", "wallet_address": wallet_address} 