import type { MemoryEvent, MemorySnapshot, KPI } from "./types";

export function createMemoryClient() {
  return { 
    writeEvent, 
    writeSnapshot, 
    calculateKPI,
    feedback: async (userId: string, message: string, tags: string[], trace?: string) => ({ ok: true }),
    recall: async (query: any) => [],
    remember: async (data: any) => ({ ok: true }),
    learn: async (id: string, type: string, ownerId: string, data: any) => ({ ok: true }),
    purgeLowValue: async (type: string, ownerId: string, threshold: number) => 0
  };
}

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
