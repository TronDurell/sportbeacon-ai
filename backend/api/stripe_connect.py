from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from typing import Optional
import stripe
import os
from datetime import datetime
import uuid

app = FastAPI()

# Initialize Stripe with secret key
stripe.api_key = os.getenv('STRIPE_SECRET_KEY', 'sk_test_your_stripe_secret_key_here')

class ConnectRequest(BaseModel):
    user_id: str
    return_url: str

class PayoutExecuteRequest(BaseModel):
    user_id: str
    amount: float
    currency: str = 'usd'
    description: Optional[str] = None

# In-memory storage for demo (replace with database)
connected_accounts = {}
payout_history = {}

@app.post("/api/payouts/connect")
async def create_stripe_connect_link(connect_request: ConnectRequest):
    """
    Create a Stripe Connect OAuth link for bank account connection.
    """
    try:
        # Create account link for OAuth
        account_link = stripe.AccountLink.create(
            account=None,  # Will be created during OAuth
            refresh_url=f"{os.getenv('BASE_URL', 'http://localhost:3000')}/api/payouts/callback?user_id={connect_request.user_id}",
            return_url=f"{os.getenv('BASE_URL', 'http://localhost:3000')}/api/payouts/callback?user_id={connect_request.user_id}",
            type='account_onboarding',
            collect='eventually_due',
        )
        
        return {
            "oauth_url": account_link.url,
            "user_id": connect_request.user_id,
            "expires_at": account_link.expires_at
        }
        
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=f"Stripe error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create connect link: {str(e)}")

@app.get("/api/payouts/callback")
async def handle_stripe_callback(
    request: Request,
    user_id: str,
    code: Optional[str] = None,
    state: Optional[str] = None
):
    """
    Handle Stripe OAuth callback and store connected account.
    """
    try:
        if not code:
            raise HTTPException(status_code=400, detail="No authorization code provided")
        
        # Exchange authorization code for account ID
        token_response = stripe.OAuth.token(
            grant_type='authorization_code',
            code=code,
        )
        
        account_id = token_response['stripe_user_id']
        
        # Store the connected account
        connected_accounts[user_id] = {
            'account_id': account_id,
            'connected_at': datetime.utcnow(),
            'status': 'active'
        }
        
        # Redirect back to frontend
        frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:3000')
        return RedirectResponse(url=f"{frontend_url}/earnings?connected=true&account_id={account_id}")
        
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=f"Stripe error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process callback: {str(e)}")

@app.get("/api/payouts/account/{user_id}")
async def get_connected_account(user_id: str):
    """
    Get connected account information for a user.
    """
    try:
        if user_id not in connected_accounts:
            raise HTTPException(status_code=404, detail="No connected account found")
        
        account_info = connected_accounts[user_id]
        account_id = account_info['account_id']
        
        # Fetch account details from Stripe
        account = stripe.Account.retrieve(account_id)
        
        return {
            "user_id": user_id,
            "account_id": account_id,
            "connected_at": account_info['connected_at'],
            "status": account_info['status'],
            "charges_enabled": account.charges_enabled,
            "payouts_enabled": account.payouts_enabled,
            "requirements": account.requirements,
            "business_type": account.business_type,
            "country": account.country
        }
        
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=f"Stripe error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch account: {str(e)}")

@app.post("/api/payouts/execute")
async def execute_payout(payout_request: PayoutExecuteRequest):
    """
    Execute a payout to a connected account (admin only).
    """
    try:
        # Validate user has connected account
        if payout_request.user_id not in connected_accounts:
            raise HTTPException(status_code=404, detail="No connected account found")
        
        account_info = connected_accounts[payout_request.user_id]
        account_id = account_info['account_id']
        
        # Validate amount
        if payout_request.amount <= 0:
            raise HTTPException(status_code=400, detail="Payout amount must be positive")
        
        # Convert to cents for Stripe
        amount_cents = int(payout_request.amount * 100)
        
        # Create transfer to connected account
        transfer = stripe.Transfer.create(
            amount=amount_cents,
            currency=payout_request.currency,
            destination=account_id,
            description=payout_request.description or f"Payout to {payout_request.user_id}",
            metadata={
                'user_id': payout_request.user_id,
                'payout_type': 'creator_earnings'
            }
        )
        
        # Record payout
        payout_id = str(uuid.uuid4())
        payout_history[payout_id] = {
            'id': payout_id,
            'user_id': payout_request.user_id,
            'account_id': account_id,
            'amount': payout_request.amount,
            'currency': payout_request.currency,
            'stripe_transfer_id': transfer.id,
            'status': transfer.status,
            'created_at': datetime.utcnow(),
            'description': payout_request.description
        }
        
        return {
            "payout_id": payout_id,
            "stripe_transfer_id": transfer.id,
            "amount": payout_request.amount,
            "currency": payout_request.currency,
            "status": transfer.status,
            "message": "Payout executed successfully"
        }
        
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=f"Stripe error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to execute payout: {str(e)}")

@app.get("/api/payouts/history/{user_id}")
async def get_payout_history(user_id: str):
    """
    Get payout history for a user.
    """
    try:
        user_payouts = [
            payout for payout in payout_history.values()
            if payout['user_id'] == user_id
        ]
        
        # Sort by creation date (newest first)
        user_payouts.sort(key=lambda x: x['created_at'], reverse=True)
        
        return {
            "user_id": user_id,
            "payouts": user_payouts,
            "total_paid": sum(payout['amount'] for payout in user_payouts if payout['status'] == 'paid'),
            "pending_amount": sum(payout['amount'] for payout in user_payouts if payout['status'] == 'pending')
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch payout history: {str(e)}")

@app.delete("/api/payouts/disconnect/{user_id}")
async def disconnect_account(user_id: str):
    """
    Disconnect a user's Stripe account.
    """
    try:
        if user_id not in connected_accounts:
            raise HTTPException(status_code=404, detail="No connected account found")
        
        account_info = connected_accounts[user_id]
        account_id = account_info['account_id']
        
        # Deauthorize the account
        stripe.OAuth.deauthorize(stripe_user_id=account_id)
        
        # Remove from local storage
        del connected_accounts[user_id]
        
        return {
            "message": "Account disconnected successfully",
            "user_id": user_id
        }
        
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=f"Stripe error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to disconnect account: {str(e)}")

@app.get("/api/payouts/balance/{user_id}")
async def get_account_balance(user_id: str):
    """
    Get available balance for payout.
    """
    try:
        # In a real implementation, you would:
        # 1. Calculate total earnings from tips
        # 2. Subtract platform fees
        # 3. Subtract already paid amounts
        
        # For demo purposes, return mock balance
        return {
            "user_id": user_id,
            "available_balance": 150.75,
            "pending_balance": 25.50,
            "total_earned": 200.00,
            "platform_fees": 23.75,
            "currency": "usd"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch balance: {str(e)}") 