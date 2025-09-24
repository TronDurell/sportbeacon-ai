import type { MemoryEvent, MemorySnapshot, KPI, MemoryClient, MemoryResult, MemoryEventKind } from "./types";

export function createMemoryClient(): MemoryClient {
  return { 
    writeEvent: async (userId: string, event: { kind: MemoryEventKind; scope: string; trace?: string; tags?: string[]; data: any }) => ({ ok: true }),
    feedback: async (userId: string, message: string, tags: string[], trace?: string) => ({ ok: true }),
    recall: async (query: { ownerId: string; kind?: MemoryEventKind; limit?: number; scope?: string; tag?: string; minScore?: number }) => [],
    remember: async (data: { ownerId: string; kind: MemoryEventKind; scope: string; trace?: string; tags?: string[]; data?: any; text?: string; tenantId?: string; source?: string; confidence?: number }) => ({ id: "mock" }),
    learn: async (memoryId: string, type: string, ownerId: string, feedback: { score?: number; note?: string; delta?: number; tags?: string[]; reason?: string }) => ({ ok: true }),
    purgeLowValue: async (type: string, ownerId: string, threshold: number) => ({ purged: 0 })
  };
}

export class MemorySDK {
  public current: MemorySDK;
  public uid: string;

  constructor(config: { uid?: string; tenantId?: string; user?: { uid: string } }) {
    this.uid = config.uid || config.user?.uid || 'unknown';
    this.current = this;
  }

  async recall(query: { ownerId: string; kind?: MemoryEventKind; limit?: number; scope?: string; tag?: string; minScore?: number }) {
    return [];
  }

  async remember(data: { ownerId: string; kind: MemoryEventKind; scope: string; trace?: string; tags?: string[]; data?: any; text?: string; tenantId?: string; source?: string; confidence?: number }) {
    return { id: "mock" };
  }

  async learn(memoryId: string, type: string, ownerId: string, feedback: { score?: number; note?: string; delta?: number; tags?: string[]; reason?: string }) {
    return { ok: true };
  }

  async purgeLowValue(type: string, ownerId: string, threshold: number) {
    return { purged: 0 };
  }
}

// Export the client instance for backward compatibility
export const memoryClient: MemoryClient = createMemoryClient();

export async function writeEvent(evt: MemoryEvent): Promise<{ ok: true }> {
  // TODO: wire transport; noop for now
  return { ok: true };
}

export async function writeSnapshot(s: MemorySnapshot): Promise<{ ok: true }> {
  return { ok: true };
}

export function calculateKPI(events: MemoryEvent[], name = "events.count"): KPI {
  return { name, value: events.length, unit: "count" };
}
