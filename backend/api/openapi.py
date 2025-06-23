from flask import Blueprint, jsonify, request
from flask_swagger_ui import get_swaggerui_blueprint
import json
import os
from datetime import datetime

# Swagger configuration
SWAGGER_URL = '/docs'
API_URL = '/static/swagger.json'

# Create swagger blueprint
swagger_blueprint = get_swaggerui_blueprint(
    SWAGGER_URL,
    API_URL,
    config={
        'app_name': "SportBeaconAI API"
    }
)

# OpenAPI specification
openapi_spec = {
    "openapi": "3.0.3",
    "info": {
        "title": "SportBeaconAI API",
        "description": "AI-powered sports coaching and personalization platform API",
        "version": "1.0.0",
        "contact": {
            "name": "SportBeaconAI Support",
            "email": "support@sportbeacon.ai",
            "url": "https://sportbeacon.ai"
        },
        "license": {
            "name": "MIT",
            "url": "https://opensource.org/licenses/MIT"
        }
    },
    "servers": [
        {
            "url": "http://localhost:5000",
            "description": "Development server"
        },
        {
            "url": "https://api.sportbeacon.ai",
            "description": "Production server"
        }
    ],
    "paths": {
        "/health": {
            "get": {
                "summary": "Health Check",
                "description": "Basic health check endpoint",
                "tags": ["System"],
                "responses": {
                    "200": {
                        "description": "Service is healthy",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "status": {"type": "string", "example": "healthy"},
                                        "timestamp": {"type": "string", "format": "date-time"},
                                        "service": {"type": "string", "example": "sportbeacon-api"},
                                        "version": {"type": "string", "example": "1.0.0"}
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        "/health/detailed": {
            "get": {
                "summary": "Detailed Health Check",
                "description": "Detailed health check with system metrics",
                "tags": ["System"],
                "responses": {
                    "200": {
                        "description": "Detailed health information",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "status": {"type": "string"},
                                        "timestamp": {"type": "string", "format": "date-time"},
                                        "system": {
                                            "type": "object",
                                            "properties": {
                                                "cpu_percent": {"type": "number"},
                                                "memory_percent": {"type": "number"},
                                                "disk_percent": {"type": "number"}
                                            }
                                        },
                                        "services": {
                                            "type": "object",
                                            "properties": {
                                                "redis": {"type": "object"},
                                                "database": {"type": "object"},
                                                "external_apis": {"type": "object"}
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        "/api/auth/wallet": {
            "post": {
                "summary": "Wallet Authentication",
                "description": "Authenticate user using Web3 wallet",
                "tags": ["Authentication"],
                "requestBody": {
                    "required": True,
                    "content": {
                        "application/json": {
                            "schema": {
                                "type": "object",
                                "required": ["wallet_address", "signature", "message"],
                                "properties": {
                                    "wallet_address": {"type": "string", "example": "0x1234..."},
                                    "signature": {"type": "string", "example": "0xabcd..."},
                                    "message": {"type": "string", "example": "Login to SportBeaconAI"}
                                }
                            }
                        }
                    }
                },
                "responses": {
                    "200": {
                        "description": "Authentication successful",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {"type": "boolean"},
                                        "token": {"type": "string"},
                                        "user": {
                                            "type": "object",
                                            "properties": {
                                                "wallet_address": {"type": "string"},
                                                "username": {"type": "string"},
                                                "profile": {"type": "object"}
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "401": {
                        "description": "Authentication failed"
                    }
                }
            }
        },
        "/api/coach/summary": {
            "post": {
                "summary": "Generate AI Coaching Summary",
                "description": "Generate AI-powered coaching summary for team or player",
                "tags": ["Coaching"],
                "security": [{"bearerAuth": []}],
                "requestBody": {
                    "required": True,
                    "content": {
                        "application/json": {
                            "schema": {
                                "type": "object",
                                "required": ["entity_id", "entity_type"],
                                "properties": {
                                    "entity_id": {"type": "string", "description": "Team or player ID"},
                                    "entity_type": {"type": "string", "enum": ["team", "player"]},
                                    "timeframe": {"type": "string", "enum": ["week", "month", "season"], "default": "week"},
                                    "language": {"type": "string", "enum": ["en", "es", "fr", "de"], "default": "en"}
                                }
                            }
                        }
                    }
                },
                "responses": {
                    "200": {
                        "description": "AI summary generated successfully",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {"type": "boolean"},
                                        "summary": {
                                            "type": "object",
                                            "properties": {
                                                "ai_generated": {"type": "boolean"},
                                                "summary_text": {"type": "string"},
                                                "key_points": {"type": "array", "items": {"type": "string"}},
                                                "motivational_quote": {"type": "string"},
                                                "generated_at": {"type": "string", "format": "date-time"}
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        "/api/coach/voice-feedback": {
            "post": {
                "summary": "Generate Voice Coaching Feedback",
                "description": "Generate AI voice coaching feedback using ElevenLabs",
                "tags": ["Coaching"],
                "security": [{"bearerAuth": []}],
                "requestBody": {
                    "required": True,
                    "content": {
                        "application/json": {
                            "schema": {
                                "type": "object",
                                "required": ["text", "personality"],
                                "properties": {
                                    "text": {"type": "string", "description": "Text to convert to speech"},
                                    "personality": {"type": "string", "enum": ["motivational", "technical", "friendly"], "default": "motivational"},
                                    "voice_id": {"type": "string", "description": "ElevenLabs voice ID"}
                                }
                            }
                        }
                    }
                },
                "responses": {
                    "200": {
                        "description": "Voice feedback generated successfully",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {"type": "boolean"},
                                        "audio_url": {"type": "string"},
                                        "duration": {"type": "number"},
                                        "generated_at": {"type": "string", "format": "date-time"}
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        "/api/highlights/global": {
            "get": {
                "summary": "Get Global Highlights Feed",
                "description": "Retrieve global highlights with filtering and pagination",
                "tags": ["Social"],
                "parameters": [
                    {
                        "name": "sport",
                        "in": "query",
                        "description": "Filter by sport",
                        "schema": {"type": "string"}
                    },
                    {
                        "name": "viral_only",
                        "in": "query",
                        "description": "Show only viral clips",
                        "schema": {"type": "boolean"}
                    },
                    {
                        "name": "page",
                        "in": "query",
                        "description": "Page number",
                        "schema": {"type": "integer", "default": 1}
                    },
                    {
                        "name": "limit",
                        "in": "query",
                        "description": "Items per page",
                        "schema": {"type": "integer", "default": 20}
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Highlights retrieved successfully",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {"type": "boolean"},
                                        "highlights": {
                                            "type": "array",
                                            "items": {
                                                "type": "object",
                                                "properties": {
                                                    "id": {"type": "string"},
                                                    "title": {"type": "string"},
                                                    "description": {"type": "string"},
                                                    "player_name": {"type": "string"},
                                                    "sport": {"type": "string"},
                                                    "thumbnail_url": {"type": "string"},
                                                    "stats": {
                                                        "type": "object",
                                                        "properties": {
                                                            "views": {"type": "integer"},
                                                            "likes": {"type": "integer"},
                                                            "comments": {"type": "integer"},
                                                            "shares": {"type": "integer"},
                                                            "tips": {"type": "integer"}
                                                        }
                                                    },
                                                    "viral_indicators": {
                                                        "type": "object",
                                                        "properties": {
                                                            "is_viral": {"type": "boolean"},
                                                            "is_trending": {"type": "boolean"},
                                                            "viral_score": {"type": "number"}
                                                        }
                                                    }
                                                }
                                            }
                                        },
                                        "pagination": {
                                            "type": "object",
                                            "properties": {
                                                "page": {"type": "integer"},
                                                "limit": {"type": "integer"},
                                                "total": {"type": "integer"},
                                                "pages": {"type": "integer"}
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        "/api/leaderboard/global": {
            "get": {
                "summary": "Get Global Leaderboard",
                "description": "Retrieve global leaderboard with sorting options",
                "tags": ["Social"],
                "parameters": [
                    {
                        "name": "sort_by",
                        "in": "query",
                        "description": "Sort field",
                        "schema": {"type": "string", "enum": ["beacon", "drills", "streak", "score"], "default": "beacon"}
                    },
                    {
                        "name": "sport",
                        "in": "query",
                        "description": "Filter by sport",
                        "schema": {"type": "string"}
                    },
                    {
                        "name": "limit",
                        "in": "query",
                        "description": "Number of players to return",
                        "schema": {"type": "integer", "default": 50}
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Leaderboard retrieved successfully",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {"type": "boolean"},
                                        "players": {
                                            "type": "array",
                                            "items": {
                                                "type": "object",
                                                "properties": {
                                                    "rank": {"type": "integer"},
                                                    "player_id": {"type": "string"},
                                                    "player_name": {"type": "string"},
                                                    "sport": {"type": "string"},
                                                    "stats": {
                                                        "type": "object",
                                                        "properties": {
                                                            "beacon_earned": {"type": "number"},
                                                            "drills_completed": {"type": "integer"},
                                                            "current_streak": {"type": "integer"},
                                                            "avg_score": {"type": "number"}
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        "/api/web3/balance": {
            "get": {
                "summary": "Get BEACON Token Balance",
                "description": "Retrieve user's BEACON token balance",
                "tags": ["Web3"],
                "security": [{"bearerAuth": []}],
                "responses": {
                    "200": {
                        "description": "Balance retrieved successfully",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {"type": "boolean"},
                                        "balance": {"type": "number"},
                                        "wallet_address": {"type": "string"},
                                        "last_updated": {"type": "string", "format": "date-time"}
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        "/api/nft/marketplace": {
            "get": {
                "summary": "Get NFT Marketplace",
                "description": "Retrieve NFT marketplace listings",
                "tags": ["Web3"],
                "parameters": [
                    {
                        "name": "category",
                        "in": "query",
                        "description": "Filter by category",
                        "schema": {"type": "string"}
                    },
                    {
                        "name": "sort_by",
                        "in": "query",
                        "description": "Sort field",
                        "schema": {"type": "string", "enum": ["price", "date", "popularity"], "default": "date"}
                    }
                ],
                "responses": {
                    "200": {
                        "description": "Marketplace listings retrieved successfully",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {"type": "boolean"},
                                        "listings": {
                                            "type": "array",
                                            "items": {
                                                "type": "object",
                                                "properties": {
                                                    "id": {"type": "string"},
                                                    "title": {"type": "string"},
                                                    "description": {"type": "string"},
                                                    "price": {"type": "number"},
                                                    "seller": {"type": "string"},
                                                    "image_url": {"type": "string"},
                                                    "category": {"type": "string"}
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    },
    "components": {
        "securitySchemes": {
            "bearerAuth": {
                "type": "http",
                "scheme": "bearer",
                "bearerFormat": "JWT"
            }
        },
        "schemas": {
            "Error": {
                "type": "object",
                "properties": {
                    "success": {"type": "boolean", "example": False},
                    "error": {"type": "string"},
                    "message": {"type": "string"},
                    "timestamp": {"type": "string", "format": "date-time"}
                }
            },
            "SportRule": {
                "type": "object",
                "properties": {
                    "name": {"type": "string"},
                    "displayName": {"type": "string"},
                    "primaryStats": {"type": "array", "items": {"type": "string"}},
                    "secondaryStats": {"type": "array", "items": {"type": "string"}},
                    "scoringMetrics": {"type": "array", "items": {"type": "string"}},
                    "icon": {"type": "string"},
                    "colorScheme": {
                        "type": "object",
                        "properties": {
                            "primary": {"type": "string"},
                            "secondary": {"type": "string"},
                            "accent": {"type": "string"}
                        }
                    }
                }
            }
        }
    },
    "tags": [
        {
            "name": "System",
            "description": "System health and monitoring endpoints"
        },
        {
            "name": "Authentication",
            "description": "User authentication and authorization"
        },
        {
            "name": "Coaching",
            "description": "AI coaching and voice feedback"
        },
        {
            "name": "Social",
            "description": "Social features, highlights, and leaderboards"
        },
        {
            "name": "Web3",
            "description": "Blockchain integration and token management"
        }
    ]
}

def create_openapi_blueprint():
    """Create and register OpenAPI documentation blueprint."""
    
    # Create static directory if it doesn't exist
    static_dir = os.path.join(os.path.dirname(__file__), 'static')
    os.makedirs(static_dir, exist_ok=True)
    
    # Write OpenAPI spec to static file
    spec_path = os.path.join(static_dir, 'swagger.json')
    with open(spec_path, 'w') as f:
        json.dump(openapi_spec, f, indent=2)
    
    return swagger_blueprint

def get_openapi_spec():
    """Get OpenAPI specification as JSON."""
    return jsonify(openapi_spec)

# API endpoints for OpenAPI spec
openapi_bp = Blueprint('openapi', __name__)

@openapi_bp.route('/openapi.json')
def openapi_json():
    """Serve OpenAPI specification as JSON."""
    return get_openapi_spec()

@openapi_bp.route('/docs')
def docs_redirect():
    """Redirect to Swagger UI."""
    return jsonify({
        "message": "API Documentation",
        "swagger_ui": "/docs/",
        "openapi_spec": "/openapi.json",
        "timestamp": datetime.now().isoformat()
    }) 