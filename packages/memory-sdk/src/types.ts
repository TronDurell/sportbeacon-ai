export type MemoryEvent = { 
  ts: number; 
  actor: string; 
  verb: string; 
  object?: string; 
  kind: MemoryEventKind;
  timestamp: number;
  score?: number;
  note?: string;
  [k: string]: unknown 
};

export type MemorySnapshot = { ts: number; key: string; data: unknown };
export type KPI = { name: string; value: number; unit?: string };
export type MemoryEventKind = 'observation' | 'feedback' | 'note' | 'tool' | 'result';

export type MemoryResult = {
  id: string;
  createdAt?: string | number;
  score?: number;
  data?: unknown;
};

export type Memory = {
  id: string;
  text: string;
  score?: number;
  createdAt?: string | number;
  data?: unknown;
};

export type MemoryClient = {
  writeEvent: (userId: string, event: { kind: MemoryEventKind; scope: string; trace?: string; tags?: string[]; data: any }) => Promise<{ ok: boolean }>;
  feedback: (userId: string, message: string, tags: string[], trace: string) => Promise<{ ok: boolean }>;
  recall: (query: { ownerId: string; kind?: MemoryEventKind; limit?: number }) => Promise<Memory[]>;
  remember: (data: { ownerId: string; kind: MemoryEventKind; scope: string; trace?: string; tags?: string[]; data: any }) => Promise<{ id: string }>;
  learn: (memoryId: string, ownerId: string, feedback: { score: number; note?: string }) => Promise<{ ok: boolean }>;
  purgeLowValue: (ownerId: string, threshold: number) => Promise<{ purged: number }>;
};
