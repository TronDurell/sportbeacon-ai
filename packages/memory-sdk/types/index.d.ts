declare module "@sportbeacon/memory-sdk" {
  export type MemoryEventKind = 'note' | 'feedback' | 'observation' | 'tool' | 'result';
  
  export interface MemoryEvent {
    t?: any;
    kind: MemoryEventKind;
    scope: 'web' | 'mobile' | 'functions';
    trace?: string;
    tags?: string[];
    data: unknown;
  }
  
  export interface MemorySnapshot {
    t?: any;
    version: number;
    summary: string;
    vector?: number[];
  }
  
  export interface MemoryClientOpts {
    app?: any;
    projectId?: string;
  }
  
  export interface MemoryClient {
    writeEvent(uid: string, event: Omit<MemoryEvent, 't'>): Promise<string>;
    writeSnapshot(uid: string, snap: Omit<MemorySnapshot, 't'>, snapshotId?: string): Promise<string>;
    feedback(uid: string, message: string, tags?: string[], trace?: string): Promise<string>;
  }
  
  export function memoryClient(opts?: MemoryClientOpts): MemoryClient;
  
  // Legacy compatibility types
  export interface KPIEventData {
    name: string;
    value: number;
    ts?: string;
    meta?: Record<string, unknown>;
  }
  
  export function writeEvent(e: any): Promise<void>;
  export function writeSnapshot<T = unknown>(key: string, value: T): Promise<void>;
  export function calculateKPI(input: unknown): Promise<any[]>;
  
  // TODO: Add more specific types as needed
  export interface UserWritingStyle {
    tone?: "professional" | "formal" | "casual" | "friendly";
    length?: "short" | "medium" | "long";
    complexity?: "simple" | "moderate" | "complex";
    preferences?: string[];
  }
  
  export interface MCPRequest {
    method: string;
    params?: unknown;
    id?: string | number;
    jsonrpc?: string;
  }
}
