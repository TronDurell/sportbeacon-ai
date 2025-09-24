import type { MemoryEvent, MemorySnapshot, KPI, MemoryClient, MemoryResult, MemoryEventKind } from "./types";

export function createMemoryClient(): MemoryClient {
  return { 
    writeEvent: async (userId: string, event: { kind: MemoryEventKind; scope: string; trace?: string; tags?: string[]; data: any }) => ({ ok: true }),
    feedback: async (userId: string, message: string, tags: string[], trace?: string) => ({ ok: true }),
    recall: async (query: { ownerId: string; kind?: MemoryEventKind; limit?: number }) => [],
    remember: async (data: { ownerId: string; kind: MemoryEventKind; scope: string; trace?: string; tags?: string[]; data: any }) => ({ id: "mock" }),
    learn: async (memoryId: string, ownerId: string, feedback: { score: number; note?: string }) => ({ ok: true }),
    purgeLowValue: async (ownerId: string, threshold: number) => ({ purged: 0 })
  };
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
