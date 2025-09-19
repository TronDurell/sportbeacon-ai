import type { MemoryEvent, MemorySnapshot, KPI } from "./types";

export function createMemoryClient() {
  return { writeEvent, writeSnapshot, calculateKPI };
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
