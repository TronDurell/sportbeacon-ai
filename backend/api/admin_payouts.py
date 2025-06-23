from fastapi import FastAPI, HTTPException, Depends, Request
from pydantic import BaseModel
from typing import List, Optional
import stripe
import os
from datetime import datetime
import uuid
from enum import Enum

app = FastAPI()

# Initialize Stripe
stripe.api_key = os.getenv('STRIPE_SECRET_KEY', 'sk_test_your_stripe_secret_key_here')

class PayoutStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    PAID = "paid"
    FAILED = "failed"
    REJECTED = "rejected"

class PayoutRequest(BaseModel):
    id: str
    user_id: str
    amount: float
    currency: str
    method: str
    status: PayoutStatus
    requested_at: str
    description: Optional[str] = None
    stripe_transfer_id: Optional[str] = None
    approved_by: Optional[str] = None
    approved_at: Optional[str] = None
    failure_reason: Optional[str] = None

class ApprovePayoutRequest(BaseModel):
    payout_id: str
    admin_notes: Optional[str] = None

class RejectPayoutRequest(BaseModel):
    payout_id: str
    reason: str
    admin_notes: Optional[str] = None

class AdminAuditLog(BaseModel):
    id: str
    admin_id: str
    action: str
    payout_id: str
    timestamp: str
    details: dict

# In-memory storage (replace with database)
payout_requests = {}
admin_audit_logs = []

# Mock admin check (replace with real authentication)
def is_admin(request: Request):
    # In production, check JWT token or session for admin role
    admin_token = request.headers.get('X-Admin-Token')
    if admin_token != os.getenv('ADMIN_TOKEN', 'admin-secret-token'):
        raise HTTPException(status_code=403, detail="Admin access required")
    return True

@app.get("/api/admin/payouts/pending")
async def get_pending_payouts(admin: bool = Depends(is_admin)):
    """
    Get all payout requests awaiting admin approval.
    """
    try:
        pending_payouts = [
            payout for payout in payout_requests.values()
            if payout['status'] == PayoutStatus.PENDING
        ]
        
        # Sort by request date (oldest first)
        pending_payouts.sort(key=lambda x: x['requested_at'])
        
        return {
            "pending_count": len(pending_payouts),
            "payouts": pending_payouts
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch pending payouts: {str(e)}")

@app.get("/api/admin/payouts/all")
async def get_all_payouts(
    admin: bool = Depends(is_admin),
    status: Optional[PayoutStatus] = None,
    limit: int = 50,
    offset: int = 0
):
    """
    Get all payout requests with optional filtering.
    """
    try:
        all_payouts = list(payout_requests.values())
        
        # Filter by status if provided
        if status:
            all_payouts = [p for p in all_payouts if p['status'] == status]
        
        # Sort by request date (newest first)
        all_payouts.sort(key=lambda x: x['requested_at'], reverse=True)
        
        # Pagination
        total_count = len(all_payouts)
        paginated_payouts = all_payouts[offset:offset + limit]
        
        return {
            "total_count": total_count,
            "payouts": paginated_payouts,
            "limit": limit,
            "offset": offset
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch payouts: {str(e)}")

@app.post("/api/admin/payouts/approve")
async def approve_payout(
    approve_request: ApprovePayoutRequest,
    admin: bool = Depends(is_admin)
):
    """
    Admin approves a payout request and triggers Stripe transfer.
    """
    try:
        payout_id = approve_request.payout_id
        
        if payout_id not in payout_requests:
            raise HTTPException(status_code=404, detail="Payout request not found")
        
        payout = payout_requests[payout_id]
        
        if payout['status'] != PayoutStatus.PENDING:
            raise HTTPException(status_code=400, detail="Payout is not in pending status")
        
        # Check if user has connected Stripe account
        user_id = payout['user_id']
        
        # In a real implementation, fetch connected account from database
        connected_accounts = {}  # Replace with database query
        if user_id not in connected_accounts:
            raise HTTPException(status_code=400, detail="User has no connected Stripe account")
        
        account_info = connected_accounts[user_id]
        account_id = account_info['account_id']
        
        # Validate amount
        amount = payout['amount']
        if amount <= 0:
            raise HTTPException(status_code=400, detail="Invalid payout amount")
        
        # Convert to cents for Stripe
        amount_cents = int(amount * 100)
        
        try:
            # Create transfer to connected account
            transfer = stripe.Transfer.create(
                amount=amount_cents,
                currency=payout['currency'],
                destination=account_id,
                description=payout['description'] or f"Approved payout for {user_id}",
                metadata={
                    'payout_id': payout_id,
                    'user_id': user_id,
                    'admin_notes': approve_request.admin_notes
                }
            )
            
            # Update payout status
            payout['status'] = PayoutStatus.APPROVED
            payout['stripe_transfer_id'] = transfer.id
            payout['approved_by'] = 'admin'  # Replace with actual admin ID
            payout['approved_at'] = datetime.utcnow().isoformat()
            
            # Log admin action
            audit_log = {
                'id': str(uuid.uuid4()),
                'admin_id': 'admin',  # Replace with actual admin ID
                'action': 'approve_payout',
                'payout_id': payout_id,
                'timestamp': datetime.utcnow().isoformat(),
                'details': {
                    'amount': amount,
                    'currency': payout['currency'],
                    'stripe_transfer_id': transfer.id,
                    'admin_notes': approve_request.admin_notes
                }
            }
            admin_audit_logs.append(audit_log)
            
            return {
                "message": "Payout approved successfully",
                "payout_id": payout_id,
                "stripe_transfer_id": transfer.id,
                "status": PayoutStatus.APPROVED
            }
            
        except stripe.error.StripeError as e:
            # Update payout status to failed
            payout['status'] = PayoutStatus.FAILED
            payout['failure_reason'] = str(e)
            
            # Log failure
            audit_log = {
                'id': str(uuid.uuid4()),
                'admin_id': 'admin',
                'action': 'approve_payout_failed',
                'payout_id': payout_id,
                'timestamp': datetime.utcnow().isoformat(),
                'details': {
                    'error': str(e),
                    'admin_notes': approve_request.admin_notes
                }
            }
            admin_audit_logs.append(audit_log)
            
            raise HTTPException(status_code=400, detail=f"Stripe transfer failed: {str(e)}")
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to approve payout: {str(e)}")

@app.post("/api/admin/payouts/reject")
async def reject_payout(
    reject_request: RejectPayoutRequest,
    admin: bool = Depends(is_admin)
):
    """
    Admin rejects a payout request.
    """
    try:
        payout_id = reject_request.payout_id
        
        if payout_id not in payout_requests:
            raise HTTPException(status_code=404, detail="Payout request not found")
        
        payout = payout_requests[payout_id]
        
        if payout['status'] != PayoutStatus.PENDING:
            raise HTTPException(status_code=400, detail="Payout is not in pending status")
        
        # Update payout status
        payout['status'] = PayoutStatus.REJECTED
        payout['failure_reason'] = reject_request.reason
        payout['approved_by'] = 'admin'  # Replace with actual admin ID
        payout['approved_at'] = datetime.utcnow().isoformat()
        
        # Log admin action
        audit_log = {
            'id': str(uuid.uuid4()),
            'admin_id': 'admin',
            'action': 'reject_payout',
            'payout_id': payout_id,
            'timestamp': datetime.utcnow().isoformat(),
            'details': {
                'reason': reject_request.reason,
                'admin_notes': reject_request.admin_notes
            }
        }
        admin_audit_logs.append(audit_log)
        
        return {
            "message": "Payout rejected successfully",
            "payout_id": payout_id,
            "status": PayoutStatus.REJECTED
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to reject payout: {str(e)}")

@app.get("/api/admin/payouts/{payout_id}")
async def get_payout_details(
    payout_id: str,
    admin: bool = Depends(is_admin)
):
    """
    Get detailed information about a specific payout request.
    """
    try:
        if payout_id not in payout_requests:
            raise HTTPException(status_code=404, detail="Payout request not found")
        
        payout = payout_requests[payout_id]
        
        # Get related audit logs
        related_logs = [
            log for log in admin_audit_logs
            if log['payout_id'] == payout_id
        ]
        
        return {
            "payout": payout,
            "audit_logs": related_logs
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch payout details: {str(e)}")

@app.get("/api/admin/audit-logs")
async def get_audit_logs(
    admin: bool = Depends(is_admin),
    action: Optional[str] = None,
    limit: int = 50,
    offset: int = 0
):
    """
    Get admin audit logs with optional filtering.
    """
    try:
        logs = admin_audit_logs.copy()
        
        # Filter by action if provided
        if action:
            logs = [log for log in logs if log['action'] == action]
        
        # Sort by timestamp (newest first)
        logs.sort(key=lambda x: x['timestamp'], reverse=True)
        
        # Pagination
        total_count = len(logs)
        paginated_logs = logs[offset:offset + limit]
        
        return {
            "total_count": total_count,
            "logs": paginated_logs,
            "limit": limit,
            "offset": offset
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch audit logs: {str(e)}")

@app.get("/api/admin/dashboard/stats")
async def get_admin_dashboard_stats(admin: bool = Depends(is_admin)):
    """
    Get admin dashboard statistics.
    """
    try:
        all_payouts = list(payout_requests.values())
        
        stats = {
            "total_payouts": len(all_payouts),
            "pending_payouts": len([p for p in all_payouts if p['status'] == PayoutStatus.PENDING]),
            "approved_payouts": len([p for p in all_payouts if p['status'] == PayoutStatus.APPROVED]),
            "paid_payouts": len([p for p in all_payouts if p['status'] == PayoutStatus.PAID]),
            "failed_payouts": len([p for p in all_payouts if p['status'] == PayoutStatus.FAILED]),
            "rejected_payouts": len([p for p in all_payouts if p['status'] == PayoutStatus.REJECTED]),
            "total_amount_pending": sum(p['amount'] for p in all_payouts if p['status'] == PayoutStatus.PENDING),
            "total_amount_paid": sum(p['amount'] for p in all_payouts if p['status'] == PayoutStatus.PAID),
            "recent_audit_actions": len([log for log in admin_audit_logs if log['timestamp'] > (datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)).isoformat()])
        }
        
        return stats
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch dashboard stats: {str(e)}") 