from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import uuid

app = FastAPI()

class TipRequest(BaseModel):
    recipientId: str
    recipientName: str
    recipientType: str  # 'coach' or 'player'
    amount: float
    paymentMethod: str  # 'stripe' or 'crypto'
    cryptoToken: Optional[str] = None  # 'ETH' or 'USDC'
    senderWallet: Optional[str] = None
    message: Optional[str] = None

class TipResponse(BaseModel):
    tipId: str
    recipientId: str
    recipientName: str
    amount: float
    paymentMethod: str
    cryptoToken: Optional[str]
    senderWallet: Optional[str]
    timestamp: datetime
    message: str

class TipStats(BaseModel):
    totalTips: int
    totalAmount: float
    recentTips: list[TipResponse]

# In-memory storage for demo (replace with database)
tips_database = []
recipient_stats = {}

@app.post("/api/tips", response_model=TipResponse)
async def record_tip(tip_request: TipRequest):
    """
    Record a tip transaction.
    """
    try:
        # Validate recipient type
        if tip_request.recipientType not in ['coach', 'player']:
            raise HTTPException(status_code=400, detail="Invalid recipient type")
        
        # Validate amount
        if tip_request.amount <= 0:
            raise HTTPException(status_code=400, detail="Tip amount must be positive")
        
        # Validate payment method
        if tip_request.paymentMethod not in ['stripe', 'crypto']:
            raise HTTPException(status_code=400, detail="Invalid payment method")
        
        # Validate crypto-specific fields
        if tip_request.paymentMethod == 'crypto':
            if not tip_request.cryptoToken:
                raise HTTPException(status_code=400, detail="Crypto token required for crypto payments")
            if tip_request.cryptoToken not in ['ETH', 'USDC']:
                raise HTTPException(status_code=400, detail="Invalid crypto token")
            if not tip_request.senderWallet:
                raise HTTPException(status_code=400, detail="Sender wallet required for crypto payments")
        
        # Create tip record
        tip_id = str(uuid.uuid4())
        tip_record = {
            "tipId": tip_id,
            "recipientId": tip_request.recipientId,
            "recipientName": tip_request.recipientName,
            "recipientType": tip_request.recipientType,
            "amount": tip_request.amount,
            "paymentMethod": tip_request.paymentMethod,
            "cryptoToken": tip_request.cryptoToken,
            "senderWallet": tip_request.senderWallet,
            "timestamp": datetime.utcnow(),
            "message": tip_request.message or f"Tip from {tip_request.paymentMethod} payment"
        }
        
        # Store tip
        tips_database.append(tip_record)
        
        # Update recipient stats
        if tip_request.recipientId not in recipient_stats:
            recipient_stats[tip_request.recipientId] = {
                "totalTips": 0,
                "totalAmount": 0.0,
                "tipCount": 0
            }
        
        recipient_stats[tip_request.recipientId]["totalTips"] += 1
        recipient_stats[tip_request.recipientId]["totalAmount"] += tip_request.amount
        recipient_stats[tip_request.recipientId]["tipCount"] += 1
        
        # TODO: Send notification to recipient
        # TODO: Update user stats/achievements
        # TODO: Trigger any reward systems
        
        return TipResponse(**tip_record)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to record tip: {str(e)}")

@app.get("/api/tips/recipient/{recipient_id}", response_model=TipStats)
async def get_recipient_tips(recipient_id: str):
    """
    Get tip statistics for a specific recipient.
    """
    recipient_tips = [tip for tip in tips_database if tip["recipientId"] == recipient_id]
    
    if not recipient_tips:
        return TipStats(
            totalTips=0,
            totalAmount=0.0,
            recentTips=[]
        )
    
    total_amount = sum(tip["amount"] for tip in recipient_tips)
    recent_tips = sorted(recipient_tips, key=lambda x: x["timestamp"], reverse=True)[:10]
    
    return TipStats(
        totalTips=len(recipient_tips),
        totalAmount=total_amount,
        recentTips=recent_tips
    )

@app.get("/api/tips/stats")
async def get_tipping_stats():
    """
    Get overall tipping statistics.
    """
    total_tips = len(tips_database)
    total_amount = sum(tip["amount"] for tip in tips_database)
    
    # Payment method breakdown
    stripe_tips = [tip for tip in tips_database if tip["paymentMethod"] == "stripe"]
    crypto_tips = [tip for tip in tips_database if tip["paymentMethod"] == "crypto"]
    
    return {
        "totalTips": total_tips,
        "totalAmount": total_amount,
        "stripeTips": {
            "count": len(stripe_tips),
            "amount": sum(tip["amount"] for tip in stripe_tips)
        },
        "cryptoTips": {
            "count": len(crypto_tips),
            "amount": sum(tip["amount"] for tip in crypto_tips)
        },
        "topRecipients": sorted(
            recipient_stats.items(),
            key=lambda x: x[1]["totalAmount"],
            reverse=True
        )[:5]
    }

@app.post("/api/tips/stripe/create-payment-intent")
async def create_stripe_payment_intent(tip_request: TipRequest):
    """
    Create a Stripe payment intent for tip processing.
    """
    try:
        # In a real implementation, you would:
        # 1. Create a Stripe PaymentIntent
        # 2. Return the client secret
        
        # For demo purposes, return a mock client secret
        return {
            "clientSecret": "pi_mock_secret_" + str(uuid.uuid4()),
            "amount": tip_request.amount * 100,  # Convert to cents
            "currency": "usd"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create payment intent: {str(e)}") 