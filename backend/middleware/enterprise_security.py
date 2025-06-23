"""
Enterprise Security Middleware for SportBeaconAI
Provides role-based access control, audit logging, and circuit breakers
"""

import asyncio
import logging
import time
from datetime import datetime
from typing import Dict, List, Optional, Any, Callable
from functools import wraps
import firebase_admin
from firebase_admin import firestore
import jwt
from flask import request, jsonify, g
import redis
import json

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Firebase
db = firestore.client()

# Redis for circuit breakers and rate limiting
redis_client = redis.Redis(host='localhost', port=6379, db=0)

class EnterpriseSecurityMiddleware:
    """Enterprise security middleware with RBAC, audit logging, and circuit breakers"""
    
    def __init__(self):
        self.audit_logs_ref = db.collection('audit_logs')
        self.user_roles_ref = db.collection('user_roles')
        self.api_keys_ref = db.collection('api_keys')
        
        # Circuit breaker configuration
        self.circuit_breakers = {
            'openai': {
                'failure_threshold': 5,
                'recovery_timeout': 60,
                'expected_exception': Exception
            },
            'elevenlabs': {
                'failure_threshold': 3,
                'recovery_timeout': 30,
                'expected_exception': Exception
            },
            'stripe': {
                'failure_threshold': 10,
                'recovery_timeout': 120,
                'expected_exception': Exception
            }
        }
        
        # Rate limiting configuration
        self.rate_limits = {
            'api': {'requests': 1000, 'window': 3600},  # 1000 requests per hour
            'admin': {'requests': 100, 'window': 3600},  # 100 requests per hour
            'federation': {'requests': 500, 'window': 3600},  # 500 requests per hour
        }

    # Role-Based Access Control
    async def check_permission(self, user_id: str, resource: str, action: str) -> bool:
        """Check if user has permission for specific resource and action"""
        try:
            # Get user roles
            user_roles = await self.get_user_roles(user_id)
            
            # Check permissions for each role
            for role in user_roles:
                permissions = await self.get_role_permissions(role)
                if self.has_permission(permissions, resource, action):
                    return True
            
            return False
            
        except Exception as e:
            logger.error(f"Error checking permission: {e}")
            return False

    async def get_user_roles(self, user_id: str) -> List[str]:
        """Get user roles from database"""
        try:
            doc = self.user_roles_ref.document(user_id).get()
            if doc.exists:
                return doc.to_dict().get('roles', [])
            return ['user']  # Default role
            
        except Exception as e:
            logger.error(f"Error getting user roles: {e}")
            return ['user']

    async def get_role_permissions(self, role: str) -> Dict[str, List[str]]:
        """Get permissions for a specific role"""
        role_permissions = {
            'admin': {
                'users': ['read', 'write', 'delete'],
                'leagues': ['read', 'write', 'delete'],
                'federations': ['read', 'write', 'delete'],
                'analytics': ['read', 'write'],
                'privacy': ['read', 'write'],
                'plugins': ['read', 'write', 'delete'],
                'system': ['read', 'write', 'delete']
            },
            'moderator': {
                'users': ['read', 'write'],
                'leagues': ['read', 'write'],
                'federations': ['read'],
                'analytics': ['read'],
                'privacy': ['read'],
                'plugins': ['read'],
                'system': ['read']
            },
            'coach': {
                'users': ['read'],
                'leagues': ['read', 'write'],
                'federations': ['read'],
                'analytics': ['read'],
                'privacy': ['read'],
                'plugins': ['read'],
                'system': ['read']
            },
            'user': {
                'users': ['read'],
                'leagues': ['read'],
                'federations': ['read'],
                'analytics': ['read'],
                'privacy': ['read'],
                'plugins': ['read'],
                'system': ['read']
            }
        }
        
        return role_permissions.get(role, {})

    def has_permission(self, permissions: Dict[str, List[str]], resource: str, action: str) -> bool:
        """Check if permissions include specific resource and action"""
        if resource in permissions:
            return action in permissions[resource] or 'admin' in permissions[resource]
        return False

    # Audit Logging
    async def log_audit_event(self, event_type: str, user_id: str = None, details: Dict[str, Any] = None) -> None:
        """Log audit event for compliance and security"""
        try:
            audit_data = {
                'event_type': event_type,
                'user_id': user_id,
                'admin_id': getattr(g, 'admin_user_id', None),
                'ip_address': request.remote_addr,
                'user_agent': request.headers.get('User-Agent'),
                'request_method': request.method,
                'request_path': request.path,
                'request_params': dict(request.args),
                'timestamp': datetime.now(),
                'details': details or {},
                'session_id': request.headers.get('X-Session-ID'),
                'api_key': request.headers.get('X-API-Key')
            }
            
            self.audit_logs_ref.add(audit_data)
            
        except Exception as e:
            logger.error(f"Error logging audit event: {e}")

    # Circuit Breaker Pattern
    def circuit_breaker(self, service_name: str):
        """Circuit breaker decorator for external services"""
        def decorator(func):
            @wraps(func)
            async def wrapper(*args, **kwargs):
                circuit_key = f"circuit_breaker:{service_name}"
                
                # Check if circuit is open
                if redis_client.get(f"{circuit_key}:open"):
                    raise Exception(f"Circuit breaker for {service_name} is open")
                
                try:
                    # Execute function
                    result = await func(*args, **kwargs)
                    
                    # Reset failure count on success
                    redis_client.delete(f"{circuit_key}:failures")
                    return result
                    
                except Exception as e:
                    # Increment failure count
                    failures = redis_client.incr(f"{circuit_key}:failures")
                    
                    # Check if threshold exceeded
                    config = self.circuit_breakers.get(service_name, {})
                    threshold = config.get('failure_threshold', 5)
                    
                    if failures >= threshold:
                        # Open circuit
                        redis_client.setex(
                            f"{circuit_key}:open",
                            config.get('recovery_timeout', 60),
                            "1"
                        )
                        logger.warning(f"Circuit breaker opened for {service_name}")
                    
                    raise e
            
            return wrapper
        return decorator

    # Rate Limiting
    def rate_limit(self, limit_type: str = 'api'):
        """Rate limiting decorator"""
        def decorator(func):
            @wraps(func)
            async def wrapper(*args, **kwargs):
                # Get client identifier
                client_id = self.get_client_id()
                limit_config = self.rate_limits.get(limit_type, {})
                
                # Check rate limit
                if not await self.check_rate_limit(client_id, limit_type, limit_config):
                    raise Exception(f"Rate limit exceeded for {limit_type}")
                
                return await func(*args, **kwargs)
            
            return wrapper
        return decorator

    def get_client_id(self) -> str:
        """Get unique client identifier"""
        # Use API key if available, otherwise use IP
        api_key = request.headers.get('X-API-Key')
        if api_key:
            return f"api:{api_key}"
        return f"ip:{request.remote_addr}"

    async def check_rate_limit(self, client_id: str, limit_type: str, config: Dict[str, Any]) -> bool:
        """Check if client is within rate limits"""
        try:
            key = f"rate_limit:{limit_type}:{client_id}"
            current = redis_client.get(key)
            
            if current is None:
                # First request
                redis_client.setex(key, config['window'], 1)
                return True
            
            current_count = int(current)
            if current_count >= config['requests']:
                return False
            
            # Increment counter
            redis_client.incr(key)
            return True
            
        except Exception as e:
            logger.error(f"Error checking rate limit: {e}")
            return True  # Allow on error

    # API Key Validation
    async def validate_api_key(self, api_key: str) -> Optional[Dict[str, Any]]:
        """Validate API key and return key details"""
        try:
            doc = self.api_keys_ref.document(api_key).get()
            if doc.exists:
                key_data = doc.to_dict()
                
                # Check if key is active
                if not key_data.get('active', False):
                    return None
                
                # Check expiration
                if 'expires_at' in key_data:
                    expires_at = key_data['expires_at']
                    if expires_at < datetime.now():
                        return None
                
                return key_data
            
            return None
            
        except Exception as e:
            logger.error(f"Error validating API key: {e}")
            return None

    # JWT Token Validation
    def validate_jwt_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Validate JWT token"""
        try:
            # Decode token (replace with your secret key)
            payload = jwt.decode(token, 'your-secret-key', algorithms=['HS256'])
            return payload
            
        except jwt.ExpiredSignatureError:
            logger.warning("JWT token expired")
            return None
        except jwt.InvalidTokenError:
            logger.warning("Invalid JWT token")
            return None
        except Exception as e:
            logger.error(f"Error validating JWT token: {e}")
            return None

    # Input Validation and Sanitization
    def validate_input(self, data: Dict[str, Any], schema: Dict[str, Any]) -> Dict[str, Any]:
        """Validate and sanitize input data"""
        validated_data = {}
        
        for field, field_schema in schema.items():
            if field in data:
                value = data[field]
                
                # Type validation
                expected_type = field_schema.get('type')
                if expected_type and not isinstance(value, expected_type):
                    raise ValueError(f"Invalid type for {field}")
                
                # Length validation
                if 'max_length' in field_schema and len(str(value)) > field_schema['max_length']:
                    raise ValueError(f"{field} exceeds maximum length")
                
                # Pattern validation
                if 'pattern' in field_schema:
                    import re
                    if not re.match(field_schema['pattern'], str(value)):
                        raise ValueError(f"{field} does not match required pattern")
                
                # Sanitize string values
                if isinstance(value, str):
                    value = self.sanitize_string(value)
                
                validated_data[field] = value
        
        return validated_data

    def sanitize_string(self, value: str) -> str:
        """Sanitize string input"""
        import html
        
        # HTML escape
        value = html.escape(value)
        
        # Remove potentially dangerous characters
        value = value.replace('<script>', '').replace('</script>', '')
        value = value.replace('javascript:', '')
        
        return value

    # Security Headers
    def add_security_headers(self, response):
        """Add security headers to response"""
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'DENY'
        response.headers['X-XSS-Protection'] = '1; mode=block'
        response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
        response.headers['Content-Security-Policy'] = "default-src 'self'; script-src 'self' 'unsafe-inline'"
        return response

    # GDPR/COPPA Compliance
    async def check_data_compliance(self, user_id: str, data_type: str) -> bool:
        """Check if data processing complies with GDPR/COPPA"""
        try:
            # Get user data
            user_doc = db.collection('users').document(user_id).get()
            if not user_doc.exists:
                return False
            
            user_data = user_doc.to_dict()
            
            # Check COPPA compliance
            if self.is_coppa_user(user_data):
                # Additional restrictions for COPPA users
                if data_type in ['location', 'personal_info', 'behavioral']:
                    return False
            
            # Check GDPR consent
            if 'gdpr_consent' in user_data and not user_data['gdpr_consent']:
                return False
            
            return True
            
        except Exception as e:
            logger.error(f"Error checking data compliance: {e}")
            return False

    def is_coppa_user(self, user_data: Dict[str, Any]) -> bool:
        """Check if user is under COPPA age threshold"""
        age = user_data.get('age', 0)
        return age < 13

# Initialize middleware
enterprise_security = EnterpriseSecurityMiddleware()

# Decorators for easy use
def require_permission(resource: str, action: str):
    """Decorator to require specific permission"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            user_id = g.get('user_id')
            if not user_id:
                return jsonify({'error': 'Authentication required'}), 401
            
            if not await enterprise_security.check_permission(user_id, resource, action):
                return jsonify({'error': 'Insufficient permissions'}), 403
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator

def require_role(role: str):
    """Decorator to require specific role"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            user_id = g.get('user_id')
            if not user_id:
                return jsonify({'error': 'Authentication required'}), 401
            
            user_roles = await enterprise_security.get_user_roles(user_id)
            if role not in user_roles:
                return jsonify({'error': 'Insufficient role'}), 403
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator

def audit_log(event_type: str):
    """Decorator to log audit events"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            user_id = g.get('user_id')
            
            # Execute function
            result = await func(*args, **kwargs)
            
            # Log audit event
            await enterprise_security.log_audit_event(
                event_type,
                user_id=user_id,
                details={
                    'function': func.__name__,
                    'args': str(args),
                    'kwargs': str(kwargs),
                    'result': str(result)
                }
            )
            
            return result
        return wrapper
    return decorator

# Example usage:
# @require_permission('users', 'read')
# @audit_log('user_data_access')
# async def get_user_data(user_id):
#     return user_data 