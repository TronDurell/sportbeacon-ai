import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { apiFetch, ApiError, AuthRequiredError, type AuthSession } from "./api/client";
import { fetchHealth, getApiBaseUrl, type HealthPayload } from "./api/health";
import { AuthProvider } from "./auth/AuthProvider";
import { useAuth } from "./auth/context";
import "./App.css";

type ConnectionState =
  | { status: "loading" }
  | { status: "connected"; health: HealthPayload }
  | { status: "error"; message: string };

const ROADMAP = [
  { id: "groups", title: "Groups & messaging", body: "Coming later. Private athlete identity is the foundation first." },
  { id: "matchmaking", title: "Matchmaking", body: "Prototype engine exists, but it is not part of this athlete workspace." },
] as const;

type PlaceSummary = {
  id: string;
  name: string;
  city: string;
  region: string;
  country: string;
  entranceNotes?: string | null;
  isTestData: boolean;
};

type MyParticipation = {
  status: "going" | "checked_in" | "completed" | "withdrawn";
  joinedAt: string;
  checkedInAt?: string | null;
};

type RunView = {
  id: string;
  sport: string;
  title: string;
  startsAt: string;
  endsAt: string;
  status: "upcoming" | "active" | "completed" | "cancelled";
  isTestData: boolean;
  checkInOpen: boolean;
  place: PlaceSummary;
  myParticipation: MyParticipation | null;
};

type HistoryItem = {
  runId: string;
  runTitle: string;
  placeName: string;
  startsAt: string;
  status: string;
  isTestData: boolean;
};

function formatRunTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const emptyProfile = {
  displayName: "",
  bio: "",
  primarySport: "basketball",
  city: "",
  region: "",
  country: "US",
  shooting: "0.5",
  defense: "0.5",
};

export default function App() {
  return (
    <AuthProvider>
      <AthleteWorkspace />
    </AuthProvider>
  );
}

function AthleteWorkspace() {
  const { view } = useAuth();
  const [connection, setConnection] = useState<ConnectionState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  const retry = useCallback(() => {
    setConnection({ status: "loading" });
    setAttempt((current) => current + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchHealth(controller.signal)
      .then((health) => {
        if (!controller.signal.aborted) {
          setConnection({ status: "connected", health });
        }
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return;
        }
        const message = error instanceof Error ? error.message : "Unable to reach the backend";
        setConnection({ status: "error", message });
      });
    return () => controller.abort();
  }, [attempt]);

  return (
    <div className="app-shell">
      <header className="site-header">
        <div>
          <p className="eyebrow">Grassroots sports platform</p>
          <h1>SportBeaconAI</h1>
        </div>
        <nav aria-label="Primary">
          <a href="#status">Status</a>
          <a href="#account">Account</a>
          <a href="#play">Play</a>
          <a href="#history">History</a>
          <a href="#profile">Profile</a>
          <a href="#stats">Stats</a>
          <a href="#insights">Insights</a>
        </nav>
      </header>
      <main>
        <section id="status" className="health-panel" aria-live="polite">
          <div className="health-copy">
            <h2>Backend connection</h2>
            <p>
              Health check: <code>{getApiBaseUrl()}/api/health</code>
            </p>
          </div>
          <HealthStatus connection={connection} onRetry={retry} />
        </section>
        <AccountSection />
        {view.status === "signedIn" ? <SignedInPanels /> : null}
        <section className="feature-grid" aria-label="Later product areas">
          {ROADMAP.map((item) => (
            <article key={item.id} id={item.id} className="feature-card" aria-disabled="true">
              <div className="card-heading">
                <h2>{item.title}</h2>
                <span className="badge">Later</span>
              </div>
              <p>{item.body}</p>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}

function AccountSection() {
  const { view, signIn, signUp, resetPassword, signOut } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup" | "reset">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      if (mode === "signup") {
        await signUp(email, password);
      } else if (mode === "signin") {
        await signIn(email, password);
      } else {
        try {
          await resetPassword(email);
        } catch {
          // Unexpected client failures still use the same public message.
        }
        setMessage("If that account exists, a reset email is on its way.");
      }
    } catch (error: unknown) {
      setMessage(error instanceof Error ? error.message : "Authentication failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section id="account" className="health-panel">
      <div className="health-copy">
        <h2>Athlete account</h2>
        <p>Email and password only. Your profile stays private.</p>
      </div>
      {view.status === "loading" ? (
        <div className="status-chip loading" data-testid="auth-status">
          Checking authentication…
        </div>
      ) : null}
      {view.status === "error" ? (
        <div className="status-chip error" data-testid="auth-status">
          <strong>Authentication unavailable</strong>
          <span>{view.message}</span>
        </div>
      ) : null}
      {view.status === "signedOut" ? (
        <form className="stack-form" onSubmit={onSubmit} data-testid="auth-status">
          <p>
            <strong>Signed out</strong>
          </p>
          <label>
            Email
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          {mode !== "reset" ? (
            <label>
              Password
              <input
                type="password"
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                required
                minLength={6}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>
          ) : null}
          {message ? <p className="form-message">{message}</p> : null}
          <button type="submit" disabled={busy}>
            {mode === "signup" ? "Create account" : mode === "reset" ? "Send reset email" : "Sign in"}
          </button>
          <div className="text-actions">
            <button type="button" className="linkish" onClick={() => setMode("signin")}>
              Use sign in
            </button>
            <button type="button" className="linkish" onClick={() => setMode("signup")}>
              Need an account?
            </button>
            <button type="button" className="linkish" onClick={() => setMode("reset")}>
              Forgot password?
            </button>
          </div>
        </form>
      ) : null}
      {view.status === "signedIn" ? (
        <div className="status-chip connected" data-testid="auth-status">
          <strong>Signed in</strong>
          <span>Private athlete workspace</span>
          <button type="button" onClick={() => void signOut()}>
            Sign out
          </button>
        </div>
      ) : null}
    </section>
  );
}

function SignedInPanels() {
  const { session } = useAuth();
  const [profile, setProfile] = useState(emptyProfile);
  const [profileState, setProfileState] = useState("Load your private profile to continue.");
  const [stats, setStats] = useState<Array<{ statId: string; points: number; occurredAt: string }>>([]);
  const [statState, setStatState] = useState("No stats yet.");
  const [statSaving, setStatSaving] = useState(false);
  const statSavingRef = useRef(false);
  const [insightState, setInsightState] = useState("Insights use your persisted basketball stats.");
  const [drillState, setDrillState] = useState("Drills use your persisted profile skills.");
  const [historyTick, setHistoryTick] = useState(0);

  const loadProfile = useCallback(async () => {
    try {
      const data = await apiFetch<{
        displayName: string;
        bio?: string;
        primarySport: string;
        homeArea: { city: string; region: string; country: string };
        skillsBySport?: { basketball?: { skill_levels?: { shooting?: number; defense?: number } } };
      }>("/api/me/profile", session);
      setProfile({
        displayName: data.displayName,
        bio: data.bio || "",
        primarySport: data.primarySport,
        city: data.homeArea.city,
        region: data.homeArea.region,
        country: data.homeArea.country,
        shooting: String(data.skillsBySport?.basketball?.skill_levels?.shooting ?? 0.5),
        defense: String(data.skillsBySport?.basketball?.skill_levels?.defense ?? 0.5),
      });
      setProfileState("Profile loaded from your private record.");
    } catch (error: unknown) {
      if (error instanceof ApiError && error.status === 404) {
        setProfileState("No profile yet. Save one to finish onboarding.");
        return;
      }
      if (error instanceof AuthRequiredError) {
        setProfileState("Sign in required.");
        return;
      }
      setProfileState(error instanceof Error ? error.message : "Unable to load profile");
    }
  }, [session]);

  const loadStats = useCallback(async () => {
    try {
      const data = await apiFetch<{ items: Array<{ statId: string; points: number; occurredAt: string }> }>(
        "/api/me/stats",
        session,
      );
      setStats(data.items);
      setStatState(data.items.length ? `${data.items.length} saved game${data.items.length === 1 ? "" : "s"}.` : "No stats yet.");
    } catch (error: unknown) {
      setStatState(error instanceof Error ? error.message : "Unable to load stats");
    }
  }, [session]);

  useEffect(() => {
    void loadProfile();
    void loadStats();
  }, [loadProfile, loadStats]);

  async function saveProfile(event: FormEvent) {
    event.preventDefault();
    try {
      await apiFetch("/api/me/profile", session, {
        method: "PUT",
        body: JSON.stringify({
          displayName: profile.displayName,
          bio: profile.bio || null,
          primarySport: "basketball",
          sports: ["basketball"],
          skillsBySport: {
            basketball: {
              skill_levels: {
                shooting: Number(profile.shooting),
                defense: Number(profile.defense),
              },
              growth_areas: ["shooting"],
              top_skills: ["defense"],
            },
          },
          trainingPreferences: {},
          homeArea: {
            city: profile.city,
            region: profile.region,
            country: profile.country,
          },
          onboardingComplete: true,
        }),
      });
      setProfileState("Profile saved.");
    } catch (error: unknown) {
      setProfileState(error instanceof Error ? error.message : "Unable to save profile");
    }
  }

  async function saveStat(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (statSavingRef.current) {
      return;
    }
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    statSavingRef.current = true;
    setStatSaving(true);
    try {
      await apiFetch("/api/me/stats/basketball", session, {
        method: "POST",
        body: JSON.stringify({
          occurredAt: new Date(String(form.get("occurredAt"))).toISOString(),
          points: Number(form.get("points")),
          assists: Number(form.get("assists")),
          rebounds: Number(form.get("rebounds")),
          steals: Number(form.get("steals")),
          blocks: Number(form.get("blocks")),
          field_goal_percentage: Number(form.get("fg")),
          three_point_percentage: Number(form.get("tp")),
          result: form.get("result"),
          source: { kind: "manual" },
        }),
      });
      formElement.reset();
      await loadStats();
    } catch (error: unknown) {
      setStatState(error instanceof Error ? error.message : "Unable to save stat");
    } finally {
      statSavingRef.current = false;
      setStatSaving(false);
    }
  }

  async function runInsights() {
    try {
      const data = await apiFetch<{ top_skills: string[]; growth_areas: string[] }>(
        "/api/me/insights",
        session,
        { method: "POST" },
      );
      setInsightState(`Top skills: ${data.top_skills.join(", ") || "n/a"}. Growth: ${data.growth_areas.join(", ") || "n/a"}.`);
    } catch (error: unknown) {
      setInsightState(error instanceof Error ? error.message : "Unable to generate insights");
    }
  }

  async function runDrills() {
    try {
      const data = await apiFetch<{ recommended_drills: Array<{ name?: string }> }>(
        "/api/me/drills/recommend",
        session,
        { method: "POST", body: "{}" },
      );
      const names = data.recommended_drills.map((item) => item.name).filter(Boolean);
      setDrillState(names.length ? names.join(", ") : "No drills returned.");
    } catch (error: unknown) {
      setDrillState(error instanceof Error ? error.message : "Unable to recommend drills");
    }
  }

  return (
    <>
      <PlayPanel session={session} onParticipationChange={() => setHistoryTick((value) => value + 1)} />
      <ParticipationHistory session={session} refreshKey={historyTick} />
      <section id="profile" className="health-panel">
        <div className="health-copy">
          <h2>Private athlete profile</h2>
          <p>Approximate home area only. Exact addresses are not stored.</p>
        </div>
        <form className="stack-form" onSubmit={saveProfile}>
          <label>
            Display name
            <input
              required
              value={profile.displayName}
              onChange={(event) => setProfile({ ...profile, displayName: event.target.value })}
            />
          </label>
          <label>
            Bio
            <textarea
              maxLength={280}
              value={profile.bio}
              onChange={(event) => setProfile({ ...profile, bio: event.target.value })}
            />
          </label>
          <label>
            City
            <input
              required
              value={profile.city}
              onChange={(event) => setProfile({ ...profile, city: event.target.value })}
            />
          </label>
          <label>
            Region / state
            <input
              required
              value={profile.region}
              onChange={(event) => setProfile({ ...profile, region: event.target.value })}
            />
          </label>
          <label>
            Country
            <input
              required
              value={profile.country}
              onChange={(event) => setProfile({ ...profile, country: event.target.value })}
            />
          </label>
          <label>
            Shooting skill (0-1)
            <input
              required
              type="number"
              min={0}
              max={1}
              step="0.05"
              value={profile.shooting}
              onChange={(event) => setProfile({ ...profile, shooting: event.target.value })}
            />
          </label>
          <label>
            Defense skill (0-1)
            <input
              required
              type="number"
              min={0}
              max={1}
              step="0.05"
              value={profile.defense}
              onChange={(event) => setProfile({ ...profile, defense: event.target.value })}
            />
          </label>
          <p className="form-message">{profileState}</p>
          <button type="submit">Save profile</button>
        </form>
      </section>
      <section id="stats" className="health-panel">
        <div className="health-copy">
          <h2>Basketball stats</h2>
          <p>Manual entries only. These feed your private insight engine.</p>
        </div>
        <form className="stack-form" onSubmit={saveStat}>
          <label>
            Played at
            <input name="occurredAt" type="datetime-local" required />
          </label>
          <label>
            Points
            <input name="points" type="number" min={0} max={200} required />
          </label>
          <label>
            Assists
            <input name="assists" type="number" min={0} max={50} required />
          </label>
          <label>
            Rebounds
            <input name="rebounds" type="number" min={0} max={80} required />
          </label>
          <label>
            Steals
            <input name="steals" type="number" min={0} max={30} required />
          </label>
          <label>
            Blocks
            <input name="blocks" type="number" min={0} max={30} required />
          </label>
          <label>
            FG%
            <input name="fg" type="number" min={0} max={100} step="0.1" required />
          </label>
          <label>
            3P%
            <input name="tp" type="number" min={0} max={100} step="0.1" required />
          </label>
          <label>
            Result
            <select name="result" required defaultValue="win">
              <option value="win">Win</option>
              <option value="loss">Loss</option>
            </select>
          </label>
          <p className="form-message">{statState}</p>
          <button type="submit" disabled={statSaving}>
            Save game
          </button>
        </form>
        <ul className="stat-list">
          {stats.map((item) => (
            <li key={item.statId}>
              {item.occurredAt}: {item.points} points
            </li>
          ))}
        </ul>
      </section>
      <section id="insights" className="health-panel">
        <div className="health-copy">
          <h2>Insights and drills</h2>
          <p>Generated from your persisted record, not from pasted stats.</p>
        </div>
        <div className="text-actions">
          <button type="button" onClick={() => void runInsights()}>
            Generate insights
          </button>
          <button type="button" onClick={() => void runDrills()}>
            Recommend drills
          </button>
        </div>
        <p data-testid="insight-state">{insightState}</p>
        <p data-testid="drill-state">{drillState}</p>
      </section>
    </>
  );
}

function PlayPanel({
  session,
  onParticipationChange,
}: {
  session: AuthSession;
  onParticipationChange: () => void;
}) {
  const [runs, setRuns] = useState<RunView[]>([]);
  const [state, setState] = useState("Looking for basketball runs…");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const joinLock = useRef(false);
  const checkInLock = useRef(false);

  const loadRuns = useCallback(async () => {
    try {
      const data = await apiFetch<{ items: RunView[] }>("/api/runs", session);
      setRuns(data.items);
      setState(
        data.items.length
          ? "These are SportBeacon runs, not a live municipal schedule."
          : "No basketball runs are listed right now. SportBeacon does not invent live municipal schedules.",
      );
      setError("");
    } catch (caught: unknown) {
      if (caught instanceof AuthRequiredError) {
        setState("Sign in required.");
        return;
      }
      setError(caught instanceof Error ? caught.message : "Unable to load runs");
    }
  }, [session]);

  useEffect(() => {
    void loadRuns();
  }, [loadRuns]);

  function replaceRun(updated: RunView) {
    setRuns((current) => current.map((item) => (item.id === updated.id ? updated : item)));
  }

  async function joinRun(runId: string) {
    if (joinLock.current) {
      return;
    }
    joinLock.current = true;
    setError("");
    try {
      const updated = await apiFetch<RunView>(`/api/runs/${runId}/join`, session, { method: "POST" });
      replaceRun(updated);
      onParticipationChange();
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "Unable to join this run");
    } finally {
      joinLock.current = false;
    }
  }

  async function checkIn(runId: string) {
    if (checkInLock.current) {
      return;
    }
    checkInLock.current = true;
    setError("");
    try {
      const updated = await apiFetch<RunView>(`/api/runs/${runId}/check-in`, session, { method: "POST" });
      replaceRun(updated);
      onParticipationChange();
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "Unable to check in");
    } finally {
      checkInLock.current = false;
    }
  }

  const selected = runs.find((item) => item.id === selectedId) ?? null;

  return (
    <section id="play" className="health-panel">
      <div className="health-copy">
        <h2>Play today</h2>
        <p>Find a basketball run, see where it is, and check in when you arrive.</p>
      </div>
      <p data-testid="play-state">{state}</p>
      {error ? (
        <p className="form-message" data-testid="play-error">
          {error}
        </p>
      ) : null}
      {runs.length === 0 ? (
        <p data-testid="play-empty">No basketball runs are listed right now.</p>
      ) : (
        <ul className="run-list">
          {runs.map((run) => (
            <li key={run.id} className="run-card" data-testid={`run-card-${run.id}`}>
              <div className="card-heading">
                <h3>{run.title}</h3>
                <span className="badge">{run.status === "active" ? "Active" : "Upcoming"}</span>
              </div>
              <p>
                {run.place.name} · {run.place.city}, {run.place.region}
              </p>
              <p>
                {formatRunTime(run.startsAt)} – {formatRunTime(run.endsAt)}
              </p>
              {run.isTestData ? <p className="test-data-label">Test data — not a live municipal listing</p> : null}
              <p data-testid={`run-participation-${run.id}`}>
                {run.myParticipation?.status === "checked_in"
                  ? "Checked in"
                  : run.myParticipation?.status === "going"
                    ? "You're going"
                    : "Not joined"}
              </p>
              <div className="text-actions">
                <button type="button" onClick={() => setSelectedId(run.id)}>
                  View
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {selected ? (
        <div className="run-detail" data-testid="run-detail">
          <h3>{selected.title}</h3>
          <p>
            {selected.place.name} · {selected.place.city}, {selected.place.region}
          </p>
          {selected.place.entranceNotes ? <p>{selected.place.entranceNotes}</p> : null}
          <p>
            {formatRunTime(selected.startsAt)} – {formatRunTime(selected.endsAt)}
          </p>
          <p>Status: {selected.status}</p>
          {selected.myParticipation?.status === "checked_in" ? (
            <p data-testid="checkin-complete">Checked in</p>
          ) : (
            <div className="text-actions">
              {selected.myParticipation?.status === "going" ? null : (
                <button type="button" onClick={() => void joinRun(selected.id)}>
                  I&apos;m going
                </button>
              )}
              {selected.checkInOpen ? (
                <button type="button" onClick={() => void checkIn(selected.id)}>
                  Check in
                </button>
              ) : null}
            </div>
          )}
        </div>
      ) : null}
    </section>
  );
}

function ParticipationHistory({
  session,
  refreshKey,
}: {
  session: AuthSession;
  refreshKey: number;
}) {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [state, setState] = useState("Your sports memory starts with runs you join.");

  const loadHistory = useCallback(async () => {
    try {
      const data = await apiFetch<{ items: HistoryItem[] }>("/api/me/participation", session);
      setItems(data.items);
      setState(
        data.items.length
          ? `${data.items.length} recorded run${data.items.length === 1 ? "" : "s"}.`
          : "No participation recorded yet.",
      );
    } catch (caught: unknown) {
      setState(caught instanceof Error ? caught.message : "Unable to load participation history");
    }
  }, [session]);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory, refreshKey]);

  return (
    <section id="history" className="health-panel">
      <div className="health-copy">
        <h2>Participation history</h2>
        <p>Runs you joined or checked into stay with your private athlete record.</p>
      </div>
      <p data-testid="history-state">{state}</p>
      <ul className="stat-list">
        {items.map((item) => (
          <li key={item.runId} data-testid={`history-item-${item.runId}`}>
            {item.runTitle} · {item.placeName} · {formatRunTime(item.startsAt)} · {item.status.replace("_", " ")}
            {item.isTestData ? " · Test data" : ""}
          </li>
        ))}
      </ul>
    </section>
  );
}

function HealthStatus({
  connection,
  onRetry,
}: {
  connection: ConnectionState;
  onRetry: () => void;
}) {
  if (connection.status === "loading") {
    return (
      <div className="status-chip loading" data-testid="health-status">
        Checking backend…
      </div>
    );
  }
  if (connection.status === "connected") {
    return (
      <div className="status-chip connected" data-testid="health-status">
        <strong>Connected</strong>
        <span>
          {connection.health.service} {connection.health.version} ({connection.health.status})
        </span>
      </div>
    );
  }
  return (
    <div className="status-chip error" data-testid="health-status">
      <strong>Backend unreachable</strong>
      <span>{connection.message}</span>
      <button type="button" onClick={onRetry}>
        Retry
      </button>
    </div>
  );
}
