export type HealthPayload = {
  status: string;
  service: string;
  version: string;
};

export function getApiBaseUrl(): string {
  const configured = import.meta.env.VITE_API_BASE_URL;
  if (typeof configured === "string" && configured.trim()) {
    return configured.replace(/\/+$/, "");
  }
  return "http://127.0.0.1:8000";
}

export async function fetchHealth(signal?: AbortSignal): Promise<HealthPayload> {
  const response = await fetch(`${getApiBaseUrl()}/api/health`, { signal });
  if (!response.ok) {
    throw new Error(`Health check failed (${response.status})`);
  }
  const body: unknown = await response.json();
  if (!isHealthPayload(body)) {
    throw new Error("Health response was missing required fields");
  }
  return body;
}

function isHealthPayload(value: unknown): value is HealthPayload {
  if (!value || typeof value !== "object") {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.status === "string" &&
    typeof candidate.service === "string" &&
    typeof candidate.version === "string"
  );
}
