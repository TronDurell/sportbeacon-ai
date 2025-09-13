/**
 * SportBeaconAI MCP Server
 * Model Context Protocol server for agent tools integration
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { authMiddleware, requireRole } from './auth.js';
import { MCPServerConfig, JsonRpcRequest, JsonRpcResponse, JsonRpcError, JsonRpcId } from './types.js';
import { setupRateLimiting } from './rateLimiting.js';
import { auditLogger } from './audit.js';
import { setupTools } from './tools/index.js';
import { cfg, port, firebaseProjectId, firebaseServiceAccountKey, allowedOrigins, requireAuth, rateLimitWindowMs, rateLimitMaxRequests, rateLimitPerMethod } from './config.js';

// Import individual tool handlers
import { getPlayerStats } from './tools/getPlayerStats.js';
import { listPendingSubmissions } from './tools/listPendingSubmissions.js';
import { submitStat } from './tools/submitStat.js';
import { verifyStat } from './tools/verifyStat.js';
import { calculateKPI } from './tools/calculateKPI.js';
import { exportDataset } from './tools/exportDataset.js';
import { sendNotification } from './tools/sendNotification.js';
import { updateMemory } from './tools/updateMemory.js';

const app = express();

// Default configuration using parsed environment variables
const defaultConfig: MCPServerConfig = {
  port: port,
  firebase: {
    projectId: firebaseProjectId
  },
  rateLimiting: {
    default: {
      windowMs: rateLimitWindowMs,
      maxRequests: rateLimitMaxRequests
    },
    perMethod: rateLimitPerMethod
  },
  security: {
    allowedOrigins: allowedOrigins,
    requireAuth: requireAuth
  }
};

/**
 * Initialize Firebase Admin SDK
 */
function initializeFirebase() {
  if (getApps().length === 0) {
    const serviceAccount = firebaseServiceAccountKey 
      ? JSON.parse(firebaseServiceAccountKey)
      : undefined;

    if (serviceAccount) {
      initializeApp({
        credential: cert(serviceAccount),
        projectId: defaultConfig.firebase.projectId
      });
    } else {
      // Use default credentials (for local development)
      initializeApp({
        projectId: defaultConfig.firebase.projectId
      });
    }
  }
}

/**
 * Setup Express middleware
 */
function setupMiddleware() {
  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: false, // Disable for API
    crossOriginEmbedderPolicy: false
  }));

  // CORS configuration
  app.use(cors({
    origin: defaultConfig.security.allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Rate limiting
  setupRateLimiting(app, defaultConfig.rateLimiting);

  // Authentication middleware
  const serviceAccount = firebaseServiceAccountKey 
    ? JSON.parse(firebaseServiceAccountKey)
    : undefined;
  app.use(authMiddleware(serviceAccount));
}

/**
 * Setup MCP tool routes
 */
function setupRoutes() {
  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });
  });

  // MCP schema endpoint
  app.get('/mcp/schema', (req, res) => {
    const schema = {
      name: 'SportBeaconAI MCP Server',
      version: '1.0.0',
      description: 'Model Context Protocol server for SportBeaconAI agent tools',
      tools: [
        {
          name: 'getPlayerStats',
          description: 'Retrieve player statistics for a given date range',
          parameters: {
            type: 'object',
            properties: {
              playerId: { type: 'string', description: 'Player ID' },
              range: { 
                type: 'object',
                properties: {
                  from: { type: 'string', format: 'date-time' },
                  to: { type: 'string', format: 'date-time' }
                },
                required: ['from', 'to']
              }
            },
            required: ['playerId', 'range']
          }
        },
        {
          name: 'listPendingSubmissions',
          description: 'List pending stat submissions for a team',
          parameters: {
            type: 'object',
            properties: {
              teamId: { type: 'string', description: 'Team ID' },
              range: { 
                type: 'object',
                properties: {
                  from: { type: 'string', format: 'date-time' },
                  to: { type: 'string', format: 'date-time' }
                }
              }
            },
            required: ['teamId']
          }
        },
        {
          name: 'submitStat',
          description: 'Submit new player statistics',
          parameters: {
            type: 'object',
            properties: {
              playerId: { type: 'string', description: 'Player ID' },
              payload: {
                type: 'object',
                properties: {
                  type: { type: 'string' },
                  value: { type: 'number' },
                  unit: { type: 'string' },
                  timestamp: { type: 'string', format: 'date-time' },
                  metadata: { type: 'object' }
                },
                required: ['type', 'value', 'unit', 'timestamp']
              }
            },
            required: ['playerId', 'payload']
          }
        },
        {
          name: 'verifyStat',
          description: 'Verify a stat submission',
          parameters: {
            type: 'object',
            properties: {
              submissionId: { type: 'string', description: 'Submission ID' }
            },
            required: ['submissionId']
          }
        },
        {
          name: 'calculateKPI',
          description: 'Calculate KPIs for a player or team',
          parameters: {
            type: 'object',
            properties: {
              target: { type: 'string', description: 'Player ID or Team ID' },
              range: { 
                type: 'object',
                properties: {
                  from: { type: 'string', format: 'date-time' },
                  to: { type: 'string', format: 'date-time' }
                },
                required: ['from', 'to']
              }
            },
            required: ['target', 'range']
          }
        },
        {
          name: 'exportDataset',
          description: 'Export dataset in specified format',
          parameters: {
            type: 'object',
            properties: {
              filter: {
                type: 'object',
                properties: {
                  teamId: { type: 'string' },
                  range: { 
                    type: 'object',
                    properties: {
                      from: { type: 'string', format: 'date-time' },
                      to: { type: 'string', format: 'date-time' }
                    },
                    required: ['from', 'to']
                  }
                },
                required: ['range']
              },
              format: { type: 'string', enum: ['csv', 'json'] }
            },
            required: ['filter', 'format']
          }
        },
        {
          name: 'sendNotification',
          description: 'Send notification to user or group',
          parameters: {
            type: 'object',
            properties: {
              target: {
                type: 'object',
                properties: {
                  userId: { type: 'string' },
                  group: { type: 'string' }
                }
              },
              message: { type: 'string' }
            },
            required: ['target', 'message']
          }
        },
        {
          name: 'updateMemory',
          description: 'Update memory context for learning',
          parameters: {
            type: 'object',
            properties: {
              context: {
                type: 'object',
                properties: {
                  scope: { type: 'string', enum: ['player', 'team', 'system'] },
                  key: { type: 'string' },
                  value: { type: 'object' }
                },
                required: ['scope', 'key', 'value']
              }
            },
            required: ['context']
          }
        }
      ]
    };
    
    res.json(schema);
  });

  // Main MCP endpoint
  app.post('/mcp', async (req, res) => {
    const startTime = Date.now();
    const auth = (req as any).auth;
    
    try {
      const request: JsonRpcRequest = req.body;
      
      // Validate JSON-RPC request
      if (!request.jsonrpc || request.jsonrpc !== '2.0' || !request.method) {
        const error: JsonRpcError = {
          code: -32600,
          message: 'Invalid Request'
        };
        return res.json({
          jsonrpc: '2.0',
          error,
          id: request.id
        });
      }

      // Route to appropriate tool handler
      let result: any;
      switch (request.method) {
        case 'getPlayerStats':
          result = await getPlayerStats(request.params, auth);
          break;
        case 'listPendingSubmissions':
          result = await listPendingSubmissions(request.params, auth);
          break;
        case 'submitStat':
          result = await submitStat(request.params, auth);
          break;
        case 'verifyStat':
          result = await verifyStat(request.params, auth);
          break;
        case 'calculateKPI':
          result = await calculateKPI(request.params, auth);
          break;
        case 'exportDataset':
          result = await exportDataset(request.params, auth);
          break;
        case 'sendNotification':
          result = await sendNotification(request.params, auth);
          break;
        case 'updateMemory':
          result = await updateMemory(request.params, auth);
          break;
        default:
          const error: JsonRpcError = {
            code: -32601,
            message: 'Method not found'
          };
          return res.json({
            jsonrpc: '2.0',
            error,
            id: request.id
          });
      }

      // Log audit event
      const duration = Date.now() - startTime;
      await auditLogger.log({
        timestamp: new Date().toISOString(),
        uid: auth.uid,
        role: auth.role,
        method: request.method,
        argsHash: JSON.stringify(request.params).slice(0, 50),
        resultSummary: result.ok ? 'success' : 'error',
        duration,
        success: result.ok
      });

      // Return successful response
      const response: JsonRpcResponse = {
        jsonrpc: '2.0',
        result: result.ok ? result.data : null,
        id: request.id
      };

      if (!result.ok) {
        response.error = {
          code: -32603,
          message: result.error
        };
      }

      res.json(response);

    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Log error audit event
      await auditLogger.log({
        timestamp: new Date().toISOString(),
        uid: auth?.uid || 'unknown',
        role: auth?.role || 'unknown',
        method: req.body?.method || 'unknown',
        argsHash: JSON.stringify(req.body?.params || {}).slice(0, 50),
        resultSummary: 'error',
        duration,
        success: false
      });

      const errorResponse: JsonRpcResponse = {
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'Internal error'
        },
        id: req.body?.id || null
      };

      res.status(500).json(errorResponse);
    }
  });

  // 404 handler
  app.use('*', (req, res) => {
    res.status(404).json({
      jsonrpc: '2.0',
      error: { code: -32601, message: 'Not found' },
      id: null
    });
  });
}

/**
 * Start the MCP server
 */
async function startServer() {
  try {
    // Initialize Firebase
    initializeFirebase();
    
    // Setup middleware
    setupMiddleware();
    
    // Setup routes
    setupRoutes();
    
    // Start server
    app.listen(port, () => {
      console.log(`🚀 SportBeaconAI MCP Server running on port ${port}`);
      console.log(`📋 Schema available at: http://localhost:${port}/mcp/schema`);
      console.log(`🔧 MCP endpoint: http://localhost:${port}/mcp`);
      console.log(`❤️  Health check: http://localhost:${port}/health`);
    });
    
  } catch (error) {
    console.error('Failed to start MCP server:', error);
    process.exit(1);
  }
}

// Start server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startServer();
}

export { startServer, defaultConfig };
