from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta
import uuid

app = FastAPI()

class TipRecord(BaseModel):
    tipId: str
    senderName: Optional[str] = None
    amount: float
    paymentMethod: str
    cryptoToken: Optional[str] = None
    timestamp: datetime
    message: Optional[str] = None

class EarningsStats(BaseModel):
    totalEarnings: float
    thisWeek: float
    thisMonth: float
    allTime: float
    stripeEarnings: float
    cryptoEarnings: float
    tipCount: int
    recentTips: List[TipRecord]

class PayoutRequest(BaseModel):
    userId: str
    amount: float
    method: str  # 'stripe' or 'crypto'

class PayoutSettings(BaseModel):
    method: str  # 'stripe' or 'crypto'
    stripeAccountId: Optional[str] = None
    walletAddress: Optional[str] = None
    isConnected: bool = False

# In-memory storage for demo (replace with database)
creator_earnings = {}
payout_settings = {}
payout_requests = []

# Mock data for demonstration
def generate_mock_earnings(user_id: str) -> EarningsStats:
    """Generate mock earnings data for demonstration purposes."""
    import random
    
    # Generate random tip history
    tips = []
    total_amount = 0
    stripe_amount = 0
    crypto_amount = 0
    
    # Generate tips over the last 30 days
    for i in range(random.randint(5, 20)):
        amount = random.choice([1, 3, 5, 10, 25, 50])
        payment_method = random.choice(['stripe', 'crypto'])
        crypto_token = random.choice(['ETH', 'USDC']) if payment_method == 'crypto' else None
        
        tip = {
            "tipId": str(uuid.uuid4()),
            "senderName": f"Fan_{random.randint(1, 100)}",
            "amount": amount,
            "paymentMethod": payment_method,
            "cryptoToken": crypto_token,
            "timestamp": datetime.utcnow() - timedelta(days=random.randint(0, 30)),
            "message": random.choice([
                "Great coaching!",
                "Amazing performance!",
                "Keep it up!",
                "Thanks for the tips!",
                None
            ])
        }
        
        tips.append(tip)
        total_amount += amount
        
        if payment_method == 'stripe':
            stripe_amount += amount
        else:
            crypto_amount += amount
    
    # Sort tips by timestamp (most recent first)
    tips.sort(key=lambda x: x.timestamp, reverse=True)
    
    # Calculate time-based earnings
    now = datetime.utcnow()
    week_ago = now - timedelta(days=7)
    month_ago = now - timedelta(days=30)
    
    this_week = sum(tip['amount'] for tip in tips if tip['timestamp'] >= week_ago)
    this_month = sum(tip['amount'] for tip in tips if tip['timestamp'] >= month_ago)
    
    return EarningsStats(
        totalEarnings=total_amount,
        thisWeek=this_week,
        thisMonth=this_month,
        allTime=total_amount,
        stripeEarnings=stripe_amount,
        cryptoEarnings=crypto_amount,
        tipCount=len(tips),
        recentTips=tips[:10]  # Last 10 tips
    )

@app.get("/api/earnings/{user_id}", response_model=EarningsStats)
async def get_creator_earnings(user_id: str):
    """
    Get earnings statistics for a specific creator.
    """
    try:
        # Check if we have cached data
        if user_id not in creator_earnings:
            # Generate mock data for new users
            creator_earnings[user_id] = generate_mock_earnings(user_id)
        
        return creator_earnings[user_id]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch earnings: {str(e)}")

@app.get("/api/earnings/{user_id}/tips", response_model=List[TipRecord])
async def get_creator_tips(user_id: str, limit: int = 50, offset: int = 0):
    """
    Get paginated list of tips for a creator.
    """
    try:
        if user_id not in creator_earnings:
            creator_earnings[user_id] = generate_mock_earnings(user_id)
        
        tips = creator_earnings[user_id].recentTips
        return tips[offset:offset + limit]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch tips: {str(e)}")

@app.get("/api/earnings/{user_id}/summary")
async def get_earnings_summary(user_id: str):
    """
    Get a summary of earnings for quick display.
    """
    try:
        if user_id not in creator_earnings:
            creator_earnings[user_id] = generate_mock_earnings(user_id)
        
        stats = creator_earnings[user_id]
        
        return {
            "totalEarnings": stats.totalEarnings,
            "thisWeek": stats.thisWeek,
            "thisMonth": stats.thisMonth,
            "tipCount": stats.tipCount,
            "paymentBreakdown": {
                "stripe": {
                    "amount": stats.stripeEarnings,
                    "percentage": (stats.stripeEarnings / stats.totalEarnings * 100) if stats.totalEarnings > 0 else 0
                },
                "crypto": {
                    "amount": stats.cryptoEarnings,
                    "percentage": (stats.cryptoEarnings / stats.totalEarnings * 100) if stats.totalEarnings > 0 else 0
                }
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch summary: {str(e)}")

@app.post("/api/payouts/request")
async def request_payout(payout_request: PayoutRequest):
    """
    Request a payout for a creator.
    """
    try:
        # Validate payout amount
        if payout_request.amount <= 0:
            raise HTTPException(status_code=400, detail="Payout amount must be positive")
        
        # Check if user has enough earnings
        if payout_request.userId not in creator_earnings:
            raise HTTPException(status_code=404, detail="No earnings found for user")
        
        available_earnings = creator_earnings[payout_request.userId].totalEarnings
        if payout_request.amount > available_earnings:
            raise HTTPException(status_code=400, detail="Insufficient earnings for payout")
        
        # Create payout request record
        payout_record = {
            "id": str(uuid.uuid4()),
            "userId": payout_request.userId,
            "amount": payout_request.amount,
            "method": payout_request.method,
            "status": "pending",
            "requestedAt": datetime.utcnow(),
            "processedAt": None
        }
        
        payout_requests.append(payout_record)
        
        # In a real implementation, you would:
        # 1. Validate payout settings
        # 2. Create Stripe transfer or crypto transaction
        # 3. Update earnings balance
        # 4. Send notifications
        
        return {
            "payoutId": payout_record["id"],
            "status": "pending",
            "message": "Payout request submitted successfully"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to request payout: {str(e)}")

@app.get("/api/payouts/{user_id}/history")
async def get_payout_history(user_id: str):
    """
    Get payout history for a creator.
    """
    try:
        user_payouts = [p for p in payout_requests if p["userId"] == user_id]
        return {
            "payouts": user_payouts,
            "totalPaid": sum(p["amount"] for p in user_payouts if p["status"] == "completed")
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch payout history: {str(e)}")

@app.get("/api/payouts/settings/{user_id}", response_model=PayoutSettings)
async def get_payout_settings(user_id: str):
    """
    Get payout settings for a creator.
    """
    try:
        if user_id not in payout_settings:
            # Return default settings
            return PayoutSettings(
                method="stripe",
                isConnected=False
            )
        
        return payout_settings[user_id]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch payout settings: {str(e)}")

@app.put("/api/payouts/settings/{user_id}")
async def update_payout_settings(user_id: str, settings: PayoutSettings):
    """
    Update payout settings for a creator.
    """
    try:
        # Validate settings
        if settings.method == "crypto" and not settings.walletAddress:
            raise HTTPException(status_code=400, detail="Wallet address required for crypto payouts")
        
        if settings.method == "stripe" and not settings.stripeAccountId:
            raise HTTPException(status_code=400, detail="Stripe account required for bank transfers")
        
        # Save settings
        payout_settings[user_id] = settings
        
        return {
            "message": "Payout settings updated successfully",
            "settings": settings
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update payout settings: {str(e)}") 