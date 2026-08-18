import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";

const authState: {
  user: { uid: string; email: string; getIdToken: () => Promise<string> } | null;
  listeners: Array<(user: unknown) => void>;
} = {
  user: null,
  listeners: [],
};

vi.mock("./firebase/app", () => ({
  getFirebaseAuth: () => ({
    get currentUser() {
      return authState.user;
    },
  }),
}));

vi.mock("firebase/auth", () => ({
  onAuthStateChanged: (_auth: unknown, next: (user: unknown) => void) => {
    authState.listeners.push(next);
    next(authState.user);
    return () => undefined;
  },
  createUserWithEmailAndPassword: vi.fn(async () => {
    authState.user = {
      uid: "user-a",
      email: "ada@example.com",
      getIdToken: async () => "header.user-a.sig",
    };
    authState.listeners.forEach((listener) => listener(authState.user));
    return { user: authState.user };
  }),
  signInWithEmailAndPassword: vi.fn(async () => {
    authState.user = {
      uid: "user-a",
      email: "ada@example.com",
      getIdToken: async () => "header.user-a.sig",
    };
    authState.listeners.forEach((listener) => listener(authState.user));
    return { user: authState.user };
  }),
  sendPasswordResetEmail: vi.fn(async () => undefined),
  signOut: vi.fn(async () => {
    authState.user = null;
    authState.listeners.forEach((listener) => listener(null));
  }),
}));

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function healthOk() {
  return jsonResponse({ status: "ok", service: "sportbeacon-ai", version: "0.1.0" });
}

async function signInToWorkspace() {
  render(<App />);
  await userEvent.type(screen.getByLabelText("Email"), "ada@example.com");
  await userEvent.type(screen.getByLabelText("Password"), "secret1");
  await userEvent.click(screen.getByRole("button", { name: "Sign in" }));
  expect(await screen.findByLabelText("Played at")).toBeInTheDocument();
}

async function fillBasketballStatForm(points = "8") {
  fireEvent.change(screen.getByLabelText("Played at"), { target: { value: "2024-04-01T20:00" } });
  await userEvent.type(screen.getByLabelText("Points"), points);
  await userEvent.type(screen.getByLabelText("Assists"), "3");
  await userEvent.type(screen.getByLabelText("Rebounds"), "4");
  await userEvent.type(screen.getByLabelText("Steals"), "1");
  await userEvent.type(screen.getByLabelText("Blocks"), "0");
  await userEvent.type(screen.getByLabelText("FG%"), "48");
  await userEvent.type(screen.getByLabelText("3P%"), "33");
}

function playEndpoints(
  url: string,
  method: string,
  options?: {
    runs?: Array<Record<string, unknown>>;
    history?: Array<Record<string, unknown>>;
    onJoin?: (runId: string) => Response | Promise<Response>;
    onCheckIn?: (runId: string) => Response | Promise<Response>;
  },
): Response | Promise<Response> | null {
  if (url.endsWith("/api/runs") && method === "GET") {
    return jsonResponse({ items: options?.runs ?? [] });
  }
  if (url.endsWith("/api/me/participation") && method === "GET") {
    return jsonResponse({ items: options?.history ?? [] });
  }
  const joinMatch = url.match(/\/api\/runs\/([^/]+)\/join$/);
  if (joinMatch && method === "POST") {
    if (options?.onJoin) {
      return options.onJoin(joinMatch[1]);
    }
    return jsonResponse({ detail: "Not Found" }, 404);
  }
  const checkInMatch = url.match(/\/api\/runs\/([^/]+)\/check-in$/);
  if (checkInMatch && method === "POST") {
    if (options?.onCheckIn) {
      return options.onCheckIn(checkInMatch[1]);
    }
    return jsonResponse({ detail: "Not Found" }, 404);
  }
  return null;
}

function workspaceFetch(options?: {
  onPostStat?: (init?: RequestInit) => Promise<Response> | Response;
  stats?: Array<{ statId: string; points: number; occurredAt: string }>;
  runs?: Array<Record<string, unknown>>;
  history?: Array<Record<string, unknown>>;
  onJoin?: (runId: string) => Response | Promise<Response>;
  onCheckIn?: (runId: string) => Response | Promise<Response>;
}) {
  const stats = options?.stats ?? [];
  return vi.fn().mockImplementation(async (input: RequestInfo, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method || "GET";
    const play = playEndpoints(url, method, options);
    if (play) {
      return play;
    }
    if (url.endsWith("/api/health")) {
      return healthOk();
    }
    if (url.endsWith("/api/me/profile")) {
      return jsonResponse({
        displayName: "Ada",
        homeArea: { city: "Richmond", region: "VA", country: "US" },
        primarySport: "basketball",
      });
    }
    if (url.endsWith("/api/me/stats/basketball") && method === "POST") {
      if (options?.onPostStat) {
        return options.onPostStat(init);
      }
      const created = { statId: `s${stats.length + 1}`, points: 8, occurredAt: "2024-04-01T20:00:00Z" };
      stats.push(created);
      return jsonResponse(created);
    }
    if (url.includes("/api/me/stats")) {
      return jsonResponse({ items: [...stats] });
    }
    if (url.endsWith("/api/me/insights") && method === "POST") {
      return jsonResponse({ top_skills: ["points"], growth_areas: ["rebounds"] });
    }
    return jsonResponse({}, 404);
  });
}

beforeEach(() => {
  authState.user = null;
  authState.listeners = [];
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("SportBeaconAI athlete workspace", () => {
  it("renders signed-out authentication and roadmap labels", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(healthOk()));
    render(<App />);
    expect(screen.getByRole("heading", { name: "SportBeaconAI" })).toBeInTheDocument();
    expect(await screen.findByText("Signed out")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Matchmaking" })).toBeInTheDocument();
    expect(screen.getAllByText("Later").length).toBeGreaterThan(0);
    await waitFor(() => {
      expect(screen.getByTestId("health-status")).toHaveTextContent("Connected");
    });
  });

  it("shows a retry control when health fails", async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error("network down"))
      .mockResolvedValue(healthOk());
    vi.stubGlobal("fetch", fetchMock);
    render(<App />);
    expect(await screen.findByText("Backend unreachable")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Retry" }));
    await waitFor(() => {
      expect(screen.getByTestId("health-status")).toHaveTextContent("Connected");
    });
  });

  it("transitions from signed-out to signed-in after sign-up", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(async (input: RequestInfo, init?: RequestInit) => {
        const url = String(input);
        const method = init?.method || "GET";
        const play = playEndpoints(url, method);
        if (play) {
          return play;
        }
        if (url.endsWith("/api/health")) {
          return healthOk();
        }
        if (url.endsWith("/api/me/profile")) {
          return jsonResponse({ detail: "Athlete profile not found" }, 404);
        }
        if (url.includes("/api/me/stats")) {
          return jsonResponse({ items: [] });
        }
        return jsonResponse({}, 404);
      }),
    );
    render(<App />);
    await userEvent.click(screen.getByRole("button", { name: "Need an account?" }));
    await userEvent.type(screen.getByLabelText("Email"), "ada@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "secret1");
    await userEvent.click(screen.getByRole("button", { name: "Create account" }));
    expect(await screen.findByText("Signed in")).toBeInTheDocument();
    expect(await screen.findByText("No profile yet. Save one to finish onboarding.")).toBeInTheDocument();
  });

  it("signs in and signs out without storing a token", async () => {
    const { signOut } = await import("firebase/auth");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(async (input: RequestInfo, init?: RequestInit) => {
        const url = String(input);
        const method = init?.method || "GET";
        const play = playEndpoints(url, method);
        if (play) {
          return play;
        }
        if (url.endsWith("/api/health")) {
          return healthOk();
        }
        if (url.endsWith("/api/me/profile")) {
          return jsonResponse({ detail: "Athlete profile not found" }, 404);
        }
        return jsonResponse({ items: [] });
      }),
    );
    render(<App />);
    await userEvent.type(screen.getByLabelText("Email"), "ada@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "secret1");
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));
    expect(await screen.findByText("Signed in")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Sign out" }));
    expect(await screen.findByText("Signed out")).toBeInTheDocument();
    expect(signOut).toHaveBeenCalled();
    expect(window.localStorage.length).toBe(0);
    expect(window.sessionStorage.length).toBe(0);
  });

  it("shows reset confirmation without storing a token", async () => {
    const { sendPasswordResetEmail } = await import("firebase/auth");
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(healthOk()));
    render(<App />);
    await userEvent.click(screen.getByRole("button", { name: "Forgot password?" }));
    await userEvent.type(screen.getByLabelText("Email"), "ada@example.com");
    await userEvent.click(screen.getByRole("button", { name: "Send reset email" }));
    expect(
      await screen.findByText("If that account exists, a reset email is on its way."),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Firebase/i)).not.toBeInTheDocument();
    expect(sendPasswordResetEmail).toHaveBeenCalled();
    expect(window.localStorage.length).toBe(0);
    expect(window.sessionStorage.length).toBe(0);
    const logged = [...logSpy.mock.calls, ...errorSpy.mock.calls, ...warnSpy.mock.calls]
      .flat()
      .map(String)
      .join(" ");
    expect(logged).not.toContain("ada@example.com");
    logSpy.mockRestore();
    errorSpy.mockRestore();
    warnSpy.mockRestore();
  });

  it("shows the same reset confirmation when Firebase rejects", async () => {
    const { sendPasswordResetEmail } = await import("firebase/auth");
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    vi.mocked(sendPasswordResetEmail).mockRejectedValueOnce(
      Object.assign(new Error("Firebase: Error (auth/user-not-found)."), {
        code: "auth/user-not-found",
      }),
    );
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(healthOk()));
    render(<App />);
    await userEvent.click(screen.getByRole("button", { name: "Forgot password?" }));
    await userEvent.type(screen.getByLabelText("Email"), "ada@example.com");
    await userEvent.click(screen.getByRole("button", { name: "Send reset email" }));
    expect(
      await screen.findByText("If that account exists, a reset email is on its way."),
    ).toBeInTheDocument();
    expect(screen.queryByText(/auth\/user-not-found/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Firebase: Error/i)).not.toBeInTheDocument();
    const logged = [...logSpy.mock.calls, ...errorSpy.mock.calls, ...warnSpy.mock.calls]
      .flat()
      .map(String)
      .join(" ");
    expect(logged).not.toContain("ada@example.com");
    expect(logged).not.toContain("auth/user-not-found");
    expect(logged).not.toContain("Firebase: Error");
    logSpy.mockRestore();
    errorSpy.mockRestore();
    warnSpy.mockRestore();
  });

  it("saves a profile, records a stat, and shows insight and drill results", async () => {
    const fetchMock = vi.fn().mockImplementation(async (input: RequestInfo, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method || "GET";
      const play = playEndpoints(url, method);
      if (play) {
        return play;
      }
      if (url.endsWith("/api/health")) {
        return healthOk();
      }
      if (url.endsWith("/api/me/profile") && method === "PUT") {
        return jsonResponse({ displayName: "Ada" });
      }
      if (url.endsWith("/api/me/profile")) {
        return jsonResponse({ detail: "Athlete profile not found" }, 404);
      }
      if (url.endsWith("/api/me/stats/basketball") && method === "POST") {
        return jsonResponse({ statId: "s1", points: 12, occurredAt: "2024-04-01T20:00:00Z" });
      }
      if (url.includes("/api/me/stats")) {
        return jsonResponse({
          items: [{ statId: "s1", points: 12, occurredAt: "2024-04-01T20:00:00Z" }],
        });
      }
      if (url.endsWith("/api/me/insights")) {
        return jsonResponse({ top_skills: ["points"], growth_areas: ["rebounds"] });
      }
      if (url.endsWith("/api/me/drills/recommend")) {
        return jsonResponse({ recommended_drills: [{ name: "Form shooting" }] });
      }
      return jsonResponse({}, 404);
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<App />);
    await userEvent.click(screen.getByRole("button", { name: "Need an account?" }));
    await userEvent.type(screen.getByLabelText("Email"), "ada@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "secret1");
    await userEvent.click(screen.getByRole("button", { name: "Create account" }));
    expect(await screen.findByLabelText("Display name")).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText("Display name"), "Ada");
    await userEvent.type(screen.getByLabelText("City"), "Richmond");
    await userEvent.type(screen.getByLabelText("Region / state"), "VA");
    await userEvent.clear(screen.getByLabelText("Country"));
    await userEvent.type(screen.getByLabelText("Country"), "US");
    await userEvent.click(screen.getByRole("button", { name: "Save profile" }));
    expect(await screen.findByText("Profile saved.")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Played at"), { target: { value: "2024-04-01T20:00" } });
    await userEvent.type(screen.getByLabelText("Points"), "12");
    await userEvent.type(screen.getByLabelText("Assists"), "3");
    await userEvent.type(screen.getByLabelText("Rebounds"), "4");
    await userEvent.type(screen.getByLabelText("Steals"), "1");
    await userEvent.type(screen.getByLabelText("Blocks"), "0");
    await userEvent.type(screen.getByLabelText("FG%"), "48");
    await userEvent.type(screen.getByLabelText("3P%"), "33");
    await userEvent.click(screen.getByRole("button", { name: "Save game" }));
    expect(await screen.findByText(/12 points/)).toBeInTheDocument();
    expect(screen.queryByText(/reading 'reset'/i)).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Generate insights" }));
    expect(await screen.findByTestId("insight-state")).toHaveTextContent("Top skills: points");
    await userEvent.click(screen.getByRole("button", { name: "Recommend drills" }));
    expect(await screen.findByTestId("drill-state")).toHaveTextContent("Form shooting");

    const insightCall = fetchMock.mock.calls.find(([url, init]) =>
      String(url).endsWith("/api/me/insights") && (init as RequestInit | undefined)?.method === "POST",
    );
    const headers = new Headers(insightCall?.[1]?.headers);
    expect(headers.get("Authorization")).toBe("Bearer header.user-a.sig");
    expect(window.localStorage.length).toBe(0);
  });

  it("shows insight and drill empty-error states", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(async (input: RequestInfo, init?: RequestInit) => {
        const url = String(input);
        const method = init?.method || "GET";
        const play = playEndpoints(url, method);
        if (play) {
          return play;
        }
        if (url.endsWith("/api/health")) {
          return healthOk();
        }
        if (url.endsWith("/api/me/profile")) {
          return jsonResponse({
            displayName: "Ada",
            homeArea: { city: "Richmond", region: "VA", country: "US" },
            primarySport: "basketball",
          });
        }
        if (url.includes("/api/me/stats")) {
          return jsonResponse({ items: [] });
        }
        if (url.endsWith("/api/me/insights") && method === "POST") {
          return jsonResponse({ detail: "Add at least one basketball stat before generating insights" }, 422);
        }
        if (url.endsWith("/api/me/drills/recommend") && method === "POST") {
          return jsonResponse({ detail: "Basketball skill levels are required before recommending drills" }, 422);
        }
        return jsonResponse({}, 404);
      }),
    );
    render(<App />);
    await userEvent.type(screen.getByLabelText("Email"), "ada@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "secret1");
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));
    await userEvent.click(await screen.findByRole("button", { name: "Generate insights" }));
    expect(await screen.findByTestId("insight-state")).toHaveTextContent(
      "Add at least one basketball stat before generating insights",
    );
    await userEvent.click(screen.getByRole("button", { name: "Recommend drills" }));
    expect(await screen.findByTestId("drill-state")).toHaveTextContent(
      "Basketball skill levels are required before recommending drills",
    );
  });

  it("resets the basketball form after one successful save without a currentTarget exception", async () => {
    const saved: Array<{ statId: string; points: number; occurredAt: string }> = [];
    const fetchMock = workspaceFetch({
      stats: saved,
      onPostStat: () => {
        const created = { statId: "s1", points: 8, occurredAt: "2024-04-01T20:00:00Z" };
        saved.push(created);
        return jsonResponse(created);
      },
    });
    vi.stubGlobal("fetch", fetchMock);
    await signInToWorkspace();
    expect(screen.getByText("No stats yet.")).toBeInTheDocument();
    await fillBasketballStatForm("8");
    await userEvent.click(screen.getByRole("button", { name: "Save game" }));
    expect(await screen.findByText("2024-04-01T20:00:00Z: 8 points")).toBeInTheDocument();
    expect(screen.getByText("1 saved game.")).toBeInTheDocument();
    expect(screen.queryByText(/reading 'reset'/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Cannot read properties of null/i)).not.toBeInTheDocument();
    expect(screen.getByLabelText("Points")).toHaveValue(null);
    expect(screen.getByLabelText("Played at")).toHaveValue("");
    const postCalls = fetchMock.mock.calls.filter(
      ([url, init]) => String(url).endsWith("/api/me/stats/basketball") && (init as RequestInit | undefined)?.method === "POST",
    );
    expect(postCalls).toHaveLength(1);
    await userEvent.click(screen.getByRole("button", { name: "Generate insights" }));
    expect(await screen.findByTestId("insight-state")).toHaveTextContent("Top skills: points");
  });

  it("ignores a second Save click while a basketball stat request is in flight", async () => {
    let releasePost: () => void = () => undefined;
    const gate = new Promise<void>((resolve) => {
      releasePost = resolve;
    });
    const saved: Array<{ statId: string; points: number; occurredAt: string }> = [];
    const fetchMock = workspaceFetch({
      stats: saved,
      onPostStat: async () => {
        await gate;
        const created = { statId: `s${saved.length + 1}`, points: 8, occurredAt: "2024-04-01T20:00:00Z" };
        saved.push(created);
        return jsonResponse(created);
      },
    });
    vi.stubGlobal("fetch", fetchMock);
    await signInToWorkspace();
    await fillBasketballStatForm("8");
    const saveButton = screen.getByRole("button", { name: "Save game" });
    await userEvent.click(saveButton);
    await userEvent.click(saveButton);
    releasePost();
    expect(await screen.findByText("2024-04-01T20:00:00Z: 8 points")).toBeInTheDocument();
    expect(screen.getAllByText(/8 points/)).toHaveLength(1);
    const postCalls = fetchMock.mock.calls.filter(
      ([url, init]) => String(url).endsWith("/api/me/stats/basketball") && (init as RequestInit | undefined)?.method === "POST",
    );
    expect(postCalls).toHaveLength(1);
  });

  it("keeps entered basketball values when save fails", async () => {
    const fetchMock = workspaceFetch({
      onPostStat: () => jsonResponse({ detail: "Played at is required" }, 422),
    });
    vi.stubGlobal("fetch", fetchMock);
    await signInToWorkspace();
    await fillBasketballStatForm("8");
    await userEvent.click(screen.getByRole("button", { name: "Save game" }));
    expect(await screen.findByText("Played at is required")).toBeInTheDocument();
    expect(screen.queryByText("1 saved game.")).not.toBeInTheDocument();
    expect(screen.queryByText(/8 points/)).not.toBeInTheDocument();
    expect(screen.getByLabelText("Points")).toHaveValue(8);
    expect(screen.getByLabelText("Played at")).toHaveValue("2024-04-01T20:00");
  });

  it("renders active and upcoming runs with their places", async () => {
    const fetchMock = workspaceFetch({ runs: sampleRuns() });
    vi.stubGlobal("fetch", fetchMock);
    await signInToWorkspace();
    expect(await screen.findByTestId("run-card-test-run-basketball-active")).toHaveTextContent("TEST DATA — Lunch pickup run");
    expect(screen.getByTestId("run-card-test-run-basketball-active")).toHaveTextContent("TEST DATA — Richmond Rec Gym");
    expect(screen.getByTestId("run-card-test-run-basketball-active")).toHaveTextContent("Active");
    expect(screen.getByTestId("run-card-test-run-basketball-upcoming")).toHaveTextContent("TEST DATA — Evening open gym");
    expect(screen.getByTestId("run-card-test-run-basketball-upcoming")).toHaveTextContent("Upcoming");
    expect(screen.getAllByText(/not a live municipal listing/i).length).toBeGreaterThan(0);
  });

  it("shows an intentional empty Play state", async () => {
    vi.stubGlobal("fetch", workspaceFetch({ runs: [] }));
    await signInToWorkspace();
    expect(await screen.findByTestId("play-empty")).toHaveTextContent("No basketball runs are listed right now.");
    expect(screen.getByTestId("play-state")).toHaveTextContent("does not invent live municipal schedules");
  });

  it("joins a run once and keeps the state after remount", async () => {
    const runs = sampleRuns();
    const history: Array<Record<string, unknown>> = [];
    const fetchMock = workspaceFetch({
      runs,
      history,
      onJoin: (runId) => {
        const run = runs.find((item) => item.id === runId);
        if (!run) {
          return jsonResponse({ detail: "Run not found" }, 404);
        }
        run.myParticipation = { status: "going", joinedAt: "2026-08-15T18:00:00Z" };
        history.splice(0, history.length, {
          runId,
          runTitle: run.title,
          placeName: run.place.name,
          startsAt: run.startsAt,
          status: "going",
          isTestData: true,
        });
        return jsonResponse(run);
      },
    });
    vi.stubGlobal("fetch", fetchMock);
    const { unmount } = render(<App />);
    await userEvent.type(screen.getByLabelText("Email"), "ada@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "secret1");
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));
    expect(await screen.findByText("TEST DATA — Evening open gym")).toBeInTheDocument();
    await userEvent.click(screen.getAllByRole("button", { name: "View" })[1]);
    await userEvent.click(screen.getByRole("button", { name: "I'm going" }));
    expect(await screen.findByText("You're going")).toBeInTheDocument();
    const joinCalls = fetchMock.mock.calls.filter(
      ([url, init]) => String(url).endsWith("/join") && (init as RequestInit | undefined)?.method === "POST",
    );
    expect(joinCalls).toHaveLength(1);
    unmount();
    render(<App />);
    expect(await screen.findByText("You're going")).toBeInTheDocument();
    expect(await screen.findByTestId("history-item-test-run-basketball-upcoming")).toHaveTextContent("going");
  });

  it("ignores a second I'm going click while join is in flight", async () => {
    const runs = sampleRuns();
    let releaseJoin: () => void = () => undefined;
    const gate = new Promise<void>((resolve) => {
      releaseJoin = resolve;
    });
    const fetchMock = workspaceFetch({
      runs,
      onJoin: async (runId) => {
        await gate;
        const run = runs.find((item) => item.id === runId)!;
        run.myParticipation = { status: "going", joinedAt: "2026-08-15T18:00:00Z" };
        return jsonResponse(run);
      },
    });
    vi.stubGlobal("fetch", fetchMock);
    await signInToWorkspace();
    await userEvent.click(screen.getAllByRole("button", { name: "View" })[1]);
    const joinButton = screen.getByRole("button", { name: "I'm going" });
    await userEvent.click(joinButton);
    await userEvent.click(joinButton);
    releaseJoin();
    expect(await screen.findByText("You're going")).toBeInTheDocument();
    const joinCalls = fetchMock.mock.calls.filter(
      ([url, init]) => String(url).endsWith("/join") && (init as RequestInit | undefined)?.method === "POST",
    );
    expect(joinCalls).toHaveLength(1);
  });

  it("checks in once when eligible and guards a repeated click", async () => {
    const runs = sampleRuns();
    runs[0].myParticipation = { status: "going", joinedAt: "2026-08-15T17:30:00Z" };
    let releaseCheckIn: () => void = () => undefined;
    const gate = new Promise<void>((resolve) => {
      releaseCheckIn = resolve;
    });
    const fetchMock = workspaceFetch({
      runs,
      onCheckIn: async (runId) => {
        await gate;
        const run = runs.find((item) => item.id === runId)!;
        run.myParticipation = {
          status: "checked_in",
          joinedAt: "2026-08-15T17:30:00Z",
          checkedInAt: "2026-08-15T18:01:00Z",
        };
        return jsonResponse(run);
      },
    });
    vi.stubGlobal("fetch", fetchMock);
    await signInToWorkspace();
    await userEvent.click(screen.getAllByRole("button", { name: "View" })[0]);
    const checkInButton = screen.getByRole("button", { name: "Check in" });
    await userEvent.click(checkInButton);
    await userEvent.click(checkInButton);
    releaseCheckIn();
    expect(await screen.findByTestId("checkin-complete")).toHaveTextContent("Checked in");
    expect(screen.queryByRole("button", { name: "Check in" })).not.toBeInTheDocument();
    const checkInCalls = fetchMock.mock.calls.filter(
      ([url, init]) => String(url).endsWith("/check-in") && (init as RequestInit | undefined)?.method === "POST",
    );
    expect(checkInCalls).toHaveLength(1);
  });

  it("does not show Check in before the window and shows a safe join error", async () => {
    const runs = sampleRuns();
    const fetchMock = workspaceFetch({
      runs,
      onJoin: () => jsonResponse({ detail: "This run is not open to join" }, 409),
    });
    vi.stubGlobal("fetch", fetchMock);
    await signInToWorkspace();
    await userEvent.click(screen.getAllByRole("button", { name: "View" })[1]);
    expect(screen.queryByRole("button", { name: "Check in" })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "I'm going" }));
    expect(await screen.findByTestId("play-error")).toHaveTextContent("This run is not open to join");
    expect(screen.queryByText(/traceback/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/firestore/i)).not.toBeInTheDocument();
  });
});

function sampleRuns() {
  return [
    {
      id: "test-run-basketball-active",
      sport: "basketball",
      title: "TEST DATA — Lunch pickup run",
      startsAt: "2026-08-15T17:15:00Z",
      endsAt: "2026-08-15T19:15:00Z",
      status: "active",
      isTestData: true,
      checkInOpen: true,
      place: {
        id: "test-place-richmond-rec-gym",
        name: "TEST DATA — Richmond Rec Gym",
        city: "Richmond",
        region: "VA",
        country: "US",
        isTestData: true,
      },
      myParticipation: null as { status: string; joinedAt: string; checkedInAt?: string } | null,
    },
    {
      id: "test-run-basketball-upcoming",
      sport: "basketball",
      title: "TEST DATA — Evening open gym",
      startsAt: "2026-08-15T21:00:00Z",
      endsAt: "2026-08-15T23:00:00Z",
      status: "upcoming",
      isTestData: true,
      checkInOpen: false,
      place: {
        id: "test-place-richmond-rec-gym",
        name: "TEST DATA — Richmond Rec Gym",
        city: "Richmond",
        region: "VA",
        country: "US",
        isTestData: true,
      },
      myParticipation: null as { status: string; joinedAt: string; checkedInAt?: string } | null,
    },
  ];
}
