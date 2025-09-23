export type MemoryEvent = { ts: number; actor: string; verb: string; object?: string; [k: string]: unknown };
export type MemorySnapshot = { ts: number; key: string; data: unknown };
export type KPI = { name: string; value: number; unit?: string };
export type MemoryEventKind = 'observation' | 'feedback' | 'note' | 'tool' | 'result';
