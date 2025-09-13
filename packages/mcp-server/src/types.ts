/**
 * SportBeaconAI MCP Server Types
 * Model Context Protocol (MCP) implementation for agent tools
 */

// Core MCP Types
export type DateRange = { from: string; to: string }; // ISO strings
export type ToolResult<T> = { ok: true; data: T } | { ok: false; error: string };
export type PlayerId = string;
export type TeamId = string;
export type SubmissionId = string;
export type UserId = string;
export type LeagueId = string;

// JSON-RPC ID type for proper typing
export type JsonRpcId = string | number | null;

// JSON-RPC 2.0 Types
export interface JsonRpcRequest {
  jsonrpc: '2.0';
  method: string;
  params?: any;
  id: JsonRpcId;
}

export interface JsonRpcResponse {
  jsonrpc: '2.0';
  result?: any;
  error?: JsonRpcError;
  id: JsonRpcId;
}

export interface JsonRpcError {
  code: number;
  message: string;
  data?: any;
}

// Authentication Types
export interface AuthContext {
  uid: string;
  role: 'coach' | 'admin' | 'athlete' | 'agent-service';
  teamId?: string;
  leagueId?: string;
  permissions: string[];
}

export interface ServiceAccount {
  type: 'service_account';
  project_id: string;
  private_key_id: string;
  private_key: string;
  client_email: string;
  client_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_x509_cert_url: string;
  client_x509_cert_url: string;
}

// Tool Parameter Types
export interface GetPlayerStatsParams {
  playerId: PlayerId;
  range: DateRange;
}

export interface ListPendingSubmissionsParams {
  teamId: TeamId;
  range?: DateRange;
}

export interface SubmitStatParams {
  playerId: PlayerId;
  payload: StatInput;
}

export interface VerifyStatParams {
  submissionId: SubmissionId;
}

export interface CalculateKPIParams {
  target: PlayerId | TeamId;
  range: DateRange;
}

export interface ExportDatasetParams {
  filter: {
    teamId?: TeamId;
    range: DateRange;
  };
  format: 'csv' | 'json';
}

export interface SendNotificationParams {
  target: {
    userId?: string;
    group?: string;
  };
  message: string;
}

export interface UpdateMemoryParams {
  context: {
    scope: 'player' | 'team' | 'system';
    key: string;
    value: unknown;
  };
}

// Data Types
export interface StatInput {
  type: string;
  value: number;
  unit: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface Stat {
  id: string;
  playerId: PlayerId;
  type: string;
  value: number;
  unit: string;
  timestamp: string;
  verified: boolean;
  metadata?: Record<string, any>;
}

export interface Submission {
  id: SubmissionId;
  playerId: PlayerId;
  teamId: TeamId;
  stats: StatInput[];
  status: 'pending' | 'verified' | 'flagged';
  submittedAt: string;
  verifiedAt?: string;
  verifiedBy?: string;
  notes?: string;
}

export interface KPIMap {
  [key: string]: {
    value: number;
    trend: 'up' | 'down' | 'stable';
    change: number;
    period: string;
  };
}

// Rate Limiting Types
export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (req: any) => string;
}

// Audit Types
export interface AuditEvent {
  timestamp: string;
  uid: string;
  role: string;
  method: string;
  argsHash: string;
  resultSummary: string;
  duration: number;
  success: boolean;
}

// Tool Schema Types
export interface ToolSchema {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, any>;
    required: string[];
  };
  returns: {
    type: 'object';
    properties: Record<string, any>;
  };
}

// MCP Server Configuration
export interface MCPServerConfig {
  port: number;
  firebase: {
    projectId: string;
    serviceAccount?: ServiceAccount;
  };
  rateLimiting: {
    default: RateLimitConfig;
    perMethod: Record<string, RateLimitConfig>;
  };
  security: {
    allowedOrigins: string[];
    requireAuth: boolean;
  };
}
