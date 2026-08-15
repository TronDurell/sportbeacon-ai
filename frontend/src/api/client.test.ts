import { afterEach, describe, expect, it, vi } from "vitest";
import { apiFetch, AuthRequiredError } from "./client";

afterEach(() => {
  vi.unstubAllGlobals();
});


describe("authenticated API wrapper", () => {
  it("attaches a bearer token just in time and does not cache it", async () => {
    const getIdToken = vi.fn().mockResolvedValue("header.user-a.sig");
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ authenticated: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const session = {
      currentUser: { getIdToken },
      signOut: vi.fn(),
    };
    await apiFetch("/api/me", session);
    const headers = new Headers(fetchMock.mock.calls[0][1].headers);
    expect(headers.get("Authorization")).toBe("Bearer header.user-a.sig");
    expect(getIdToken).toHaveBeenCalledTimes(1);
    expect(window.localStorage.length).toBe(0);
  });

  it("signs out on 401", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 401 }));
    vi.stubGlobal("fetch", fetchMock);
    const session = {
      currentUser: { getIdToken: vi.fn().mockResolvedValue("header.user-a.sig") },
      signOut: vi.fn().mockResolvedValue(undefined),
    };
    await expect(apiFetch("/api/me", session)).rejects.toBeInstanceOf(AuthRequiredError);
    expect(session.signOut).toHaveBeenCalled();
  });
});
