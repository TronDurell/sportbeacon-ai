from fastapi import FastAPI, HTTPException, Request, Response
from pydantic import BaseModel
from typing import Dict, Any, Optional
import stripe
import os
import hmac
import hashlib
from datetime import datetime
import json

app = FastAPI()

# Initialize Stripe
stripe.api_key = os.getenv('STRIPE_SECRET_KEY', 'sk_test_your_stripe_secret_key_here')

# Webhook secrets
STRIPE_WEBHOOK_SECRET = os.getenv('STRIPE_WEBHOOK_SECRET', 'whsec_your_webhook_secret_here')
STRIPE_CONNECT_WEBHOOK_SECRET = os.getenv('STRIPE_CONNECT_WEBHOOK_SECRET', 'whsec_your_connect_webhook_secret_here')

# In-memory storage for webhook events (replace with database)
webhook_events = []
connected_account_updates = {}

class WebhookEvent(BaseModel):
    id: str
    type: str
    created: int
    data: Dict[str, Any]
    livemode: bool
    api_version: str

def verify_webhook_signature(payload: bytes, signature: str, secret: str) -> bool:
    """
    Verify Stripe webhook signature to ensure authenticity.
    """
    try:
        expected_signature = hmac.new(
            secret.encode('utf-8'),
            payload,
            hashlib.sha256
        ).hexdigest()
        
        # Stripe sends signature as "t=timestamp,v1=signature"
        if signature.startswith('t='):
            signature = signature.split(',')[1].split('=')[1]
        
        return hmac.compare_digest(expected_signature, signature)
    except Exception:
        return False

@app.post("/api/stripe/webhook")
async def handle_stripe_webhook(request: Request):
    """
    Handle Stripe webhook events for main account.
    """
    try:
        # Get the raw body
        payload = await request.body()
        signature = request.headers.get('stripe-signature')
        
        if not signature:
            raise HTTPException(status_code=400, detail="No signature provided")
        
        # Verify webhook signature
        if not verify_webhook_signature(payload, signature, STRIPE_WEBHOOK_SECRET):
            raise HTTPException(status_code=400, detail="Invalid signature")
        
        # Parse the event
        event = stripe.Webhook.construct_event(
            payload, signature, STRIPE_WEBHOOK_SECRET
        )
        
        # Store the event
        webhook_event = {
            'id': event['id'],
            'type': event['type'],
            'created': event['created'],
            'data': event['data'],
            'livemode': event['livemode'],
            'api_version': event['api_version'],
            'processed_at': datetime.utcnow().isoformat()
        }
        webhook_events.append(webhook_event)
        
        # Handle different event types
        await process_webhook_event(event)
        
        return {"status": "success"}
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError as e:
        raise HTTPException(status_code=400, detail="Invalid signature")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Webhook processing failed: {str(e)}")

@app.post("/api/stripe/connect/webhook")
async def handle_stripe_connect_webhook(request: Request):
    """
    Handle Stripe Connect webhook events for connected accounts.
    """
    try:
        # Get the raw body
        payload = await request.body()
        signature = request.headers.get('stripe-signature')
        
        if not signature:
            raise HTTPException(status_code=400, detail="No signature provided")
        
        # Verify webhook signature
        if not verify_webhook_signature(payload, signature, STRIPE_CONNECT_WEBHOOK_SECRET):
            raise HTTPException(status_code=400, detail="Invalid signature")
        
        # Parse the event
        event = stripe.Webhook.construct_event(
            payload, signature, STRIPE_CONNECT_WEBHOOK_SECRET
        )
        
        # Store the event
        webhook_event = {
            'id': event['id'],
            'type': event['type'],
            'created': event['created'],
            'data': event['data'],
            'livemode': event['livemode'],
            'api_version': event['api_version'],
            'processed_at': datetime.utcnow().isoformat(),
            'source': 'connect'
        }
        webhook_events.append(webhook_event)
        
        # Handle Connect-specific events
        await process_connect_webhook_event(event)
        
        return {"status": "success"}
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError as e:
        raise HTTPException(status_code=400, detail="Invalid signature")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Connect webhook processing failed: {str(e)}")

async def process_webhook_event(event: Dict[str, Any]):
    """
    Process main Stripe webhook events.
    """
    event_type = event['type']
    
    if event_type == 'transfer.paid':
        await handle_transfer_paid(event['data']['object'])
    elif event_type == 'transfer.failed':
        await handle_transfer_failed(event['data']['object'])
    elif event_type == 'transfer.updated':
        await handle_transfer_updated(event['data']['object'])
    elif event_type == 'account.updated':
        await handle_account_updated(event['data']['object'])
    elif event_type == 'account.application.deauthorized':
        await handle_account_deauthorized(event['data']['object'])
    else:
        # Log unhandled events
        print(f"Unhandled webhook event: {event_type}")

async def process_connect_webhook_event(event: Dict[str, Any]):
    """
    Process Stripe Connect webhook events.
    """
    event_type = event['type']
    
    if event_type == 'account.updated':
        await handle_connect_account_updated(event['data']['object'])
    elif event_type == 'account.application.deauthorized':
        await handle_connect_account_deauthorized(event['data']['object'])
    elif event_type == 'payout.paid':
        await handle_connect_payout_paid(event['data']['object'])
    elif event_type == 'payout.failed':
        await handle_connect_payout_failed(event['data']['object'])
    else:
        # Log unhandled Connect events
        print(f"Unhandled Connect webhook event: {event_type}")

async def handle_transfer_paid(transfer: Dict[str, Any]):
    """
    Handle successful transfer completion.
    """
    try:
        transfer_id = transfer['id']
        amount = transfer['amount'] / 100  # Convert from cents
        currency = transfer['currency']
        destination = transfer['destination']
        
        # Extract metadata
        metadata = transfer.get('metadata', {})
        payout_id = metadata.get('payout_id')
        user_id = metadata.get('user_id')
        
        print(f"Transfer {transfer_id} paid successfully: ${amount} {currency} to {destination}")
        
        # Update payout status in database
        if payout_id:
            # In a real implementation, update the payout record
            print(f"Updating payout {payout_id} status to PAID")
            
        # Send notification to user
        if user_id:
            await send_payout_notification(user_id, 'paid', amount, currency)
            
    except Exception as e:
        print(f"Error handling transfer.paid: {str(e)}")

async def handle_transfer_failed(transfer: Dict[str, Any]):
    """
    Handle failed transfer.
    """
    try:
        transfer_id = transfer['id']
        failure_code = transfer.get('failure_code')
        failure_message = transfer.get('failure_message')
        
        # Extract metadata
        metadata = transfer.get('metadata', {})
        payout_id = metadata.get('payout_id')
        user_id = metadata.get('user_id')
        
        print(f"Transfer {transfer_id} failed: {failure_code} - {failure_message}")
        
        # Update payout status in database
        if payout_id:
            print(f"Updating payout {payout_id} status to FAILED")
            
        # Send notification to user
        if user_id:
            await send_payout_notification(user_id, 'failed', 0, 'usd', failure_message)
            
    except Exception as e:
        print(f"Error handling transfer.failed: {str(e)}")

async def handle_transfer_updated(transfer: Dict[str, Any]):
    """
    Handle transfer status updates.
    """
    try:
        transfer_id = transfer['id']
        status = transfer['status']
        
        print(f"Transfer {transfer_id} status updated to: {status}")
        
        # Update payout status based on transfer status
        if status == 'paid':
            await handle_transfer_paid(transfer)
        elif status == 'failed':
            await handle_transfer_failed(transfer)
            
    except Exception as e:
        print(f"Error handling transfer.updated: {str(e)}")

async def handle_account_updated(account: Dict[str, Any]):
    """
    Handle main account updates.
    """
    try:
        account_id = account['id']
        charges_enabled = account.get('charges_enabled', False)
        payouts_enabled = account.get('payouts_enabled', False)
        
        print(f"Account {account_id} updated - Charges: {charges_enabled}, Payouts: {payouts_enabled}")
        
        # Update account status in database
        # This would typically update the platform's main Stripe account status
        
    except Exception as e:
        print(f"Error handling account.updated: {str(e)}")

async def handle_account_deauthorized(account: Dict[str, Any]):
    """
    Handle account deauthorization.
    """
    try:
        account_id = account['id']
        
        print(f"Account {account_id} deauthorized")
        
        # Update account status in database
        # This would typically mark the account as deauthorized
        
    except Exception as e:
        print(f"Error handling account.application.deauthorized: {str(e)}")

async def handle_connect_account_updated(account: Dict[str, Any]):
    """
    Handle connected account updates.
    """
    try:
        account_id = account['id']
        charges_enabled = account.get('charges_enabled', False)
        payouts_enabled = account.get('payouts_enabled', False)
        requirements = account.get('requirements', {})
        
        print(f"Connect account {account_id} updated - Charges: {charges_enabled}, Payouts: {payouts_enabled}")
        
        # Store account update
        connected_account_updates[account_id] = {
            'account_id': account_id,
            'charges_enabled': charges_enabled,
            'payouts_enabled': payouts_enabled,
            'requirements': requirements,
            'updated_at': datetime.utcnow().isoformat()
        }
        
        # Find user associated with this account and update their status
        user_id = find_user_by_stripe_account(account_id)
        if user_id:
            await update_user_payout_eligibility(user_id, payouts_enabled, requirements)
            
    except Exception as e:
        print(f"Error handling connect account.updated: {str(e)}")

async def handle_connect_account_deauthorized(account: Dict[str, Any]):
    """
    Handle connected account deauthorization.
    """
    try:
        account_id = account['id']
        
        print(f"Connect account {account_id} deauthorized")
        
        # Find user associated with this account and update their status
        user_id = find_user_by_stripe_account(account_id)
        if user_id:
            await update_user_payout_eligibility(user_id, False, {})
            
    except Exception as e:
        print(f"Error handling connect account.application.deauthorized: {str(e)}")

async def handle_connect_payout_paid(payout: Dict[str, Any]):
    """
    Handle successful payout to connected account.
    """
    try:
        payout_id = payout['id']
        amount = payout['amount'] / 100
        currency = payout['currency']
        account_id = payout['destination']
        
        print(f"Connect payout {payout_id} paid: ${amount} {currency} to {account_id}")
        
        # Update payout status in database
        # This would typically update the payout record to reflect the final status
        
    except Exception as e:
        print(f"Error handling connect payout.paid: {str(e)}")

async def handle_connect_payout_failed(payout: Dict[str, Any]):
    """
    Handle failed payout to connected account.
    """
    try:
        payout_id = payout['id']
        failure_code = payout.get('failure_code')
        failure_message = payout.get('failure_message')
        
        print(f"Connect payout {payout_id} failed: {failure_code} - {failure_message}")
        
        # Update payout status in database
        # This would typically update the payout record to reflect the failure
        
    except Exception as e:
        print(f"Error handling connect payout.failed: {str(e)}")

async def send_payout_notification(user_id: str, status: str, amount: float, currency: str, message: str = None):
    """
    Send notification to user about payout status.
    """
    try:
        # In a real implementation, this would send an email, push notification, etc.
        notification = {
            'user_id': user_id,
            'type': 'payout_status',
            'status': status,
            'amount': amount,
            'currency': currency,
            'message': message,
            'sent_at': datetime.utcnow().isoformat()
        }
        
        print(f"Notification sent to {user_id}: {status} payout of {amount} {currency}")
        
        # Store notification in database
        # send_email_notification(user_id, notification)
        # send_push_notification(user_id, notification)
        
    except Exception as e:
        print(f"Error sending payout notification: {str(e)}")

def find_user_by_stripe_account(account_id: str) -> Optional[str]:
    """
    Find user ID associated with a Stripe account ID.
    """
    # In a real implementation, query the database
    # For now, return None
    return None

async def update_user_payout_eligibility(user_id: str, payouts_enabled: bool, requirements: Dict[str, Any]):
    """
    Update user's payout eligibility based on Stripe account status.
    """
    try:
        # In a real implementation, update the user's payout settings
        print(f"Updating user {user_id} payout eligibility: {payouts_enabled}")
        
        # Check if requirements are complete
        if requirements:
            missing_requirements = requirements.get('currently_due', [])
            if missing_requirements:
                print(f"User {user_id} has missing requirements: {missing_requirements}")
                
    except Exception as e:
        print(f"Error updating user payout eligibility: {str(e)}")

@app.get("/api/webhooks/events")
async def get_webhook_events(limit: int = 50):
    """
    Get recent webhook events (for admin dashboard).
    """
    try:
        # Sort by processed_at (newest first)
        sorted_events = sorted(webhook_events, key=lambda x: x['processed_at'], reverse=True)
        
        return {
            "events": sorted_events[:limit],
            "total_count": len(webhook_events)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch webhook events: {str(e)}")

@app.get("/api/webhooks/connect/accounts")
async def get_connect_account_updates(limit: int = 50):
    """
    Get recent connected account updates (for admin dashboard).
    """
    try:
        # Sort by updated_at (newest first)
        sorted_updates = sorted(
            connected_account_updates.values(), 
            key=lambda x: x['updated_at'], 
            reverse=True
        )
        
        return {
            "updates": sorted_updates[:limit],
            "total_count": len(connected_account_updates)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch account updates: {str(e)}") 