export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export class AuthRequiredError extends Error {
  constructor() {
    super("Sign in required");
  }
}

type TokenSource = {
  getIdToken: () => Promise<string>;
};

export type AuthSession = {
  currentUser: TokenSource | null;
  signOut: () => Promise<void>;
};

export function getApiBaseUrl(): string {
  const configured = import.meta.env.VITE_API_BASE_URL;
  if (typeof configured === "string" && configured.trim()) {
    return configured.replace(/\/+$/, "");
  }
  return "http://127.0.0.1:8000";
}

export async function apiFetch<T>(
  path: string,
  session: AuthSession,
  init: RequestInit = {},
): Promise<T> {
  const user = session.currentUser;
  if (!user) {
    throw new AuthRequiredError();
  }
  const token = await user.getIdToken();
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers,
  });
  if (response.status === 401) {
    await session.signOut();
    throw new AuthRequiredError();
  }
  if (!response.ok) {
    let detail = `Request failed (${response.status})`;
    try {
      const body: unknown = await response.json();
      if (body && typeof body === "object" && "detail" in body) {
        const value = (body as { detail: unknown }).detail;
        if (typeof value === "string") {
          detail = value;
        }
      }
    } catch {
      // Keep the generic failure message.
    }
    throw new ApiError(detail, response.status);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}
