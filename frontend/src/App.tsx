import { useCallback, useEffect, useState } from "react";
import { fetchHealth, getApiBaseUrl, type HealthPayload } from "./api/health";
import "./App.css";

type ConnectionState =
  | { status: "loading" }
  | { status: "connected"; health: HealthPayload }
  | { status: "error"; message: string };

const FEATURES = [
  {
    id: "insights",
    title: "Player Insights",
    body: "The FastAPI insight engine can analyze submitted game stats. This shell does not load live athlete profiles or display sample statistics.",
  },
  {
    id: "drills",
    title: "Drill Planning",
    body: "Drill recommendations are available through the API when skill inputs are provided. Sign-in and persisted training plans are not part of this shell.",
  },
  {
    id: "matchmaking",
    title: "Matchmaking",
    prototype: true,
    body: "Prototype only. The current team-balancing endpoint is not a production matchmaking product and is not wired into this UI.",
  },
] as const;

export default function App() {
  const [connection, setConnection] = useState<ConnectionState>({
    status: "loading",
  });
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
        const message =
          error instanceof Error ? error.message : "Unable to reach the backend";
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
          <a href="#insights">Insights</a>
          <a href="#drills">Drills</a>
          <a href="#matchmaking">Matchmaking</a>
        </nav>
      </header>

      <main>
        <section id="status" className="health-panel" aria-live="polite">
          <div className="health-copy">
            <h2>Backend connection</h2>
            <p>
              This shell talks to FastAPI at{" "}
              <code>{getApiBaseUrl()}/api/health</code>.
            </p>
          </div>
          <HealthStatus connection={connection} onRetry={retry} />
        </section>

        <section className="feature-grid" aria-label="Product areas">
          {FEATURES.map((feature) => (
            <article
              key={feature.id}
              id={feature.id}
              className="feature-card"
            >
              <div className="card-heading">
                <h2>{feature.title}</h2>
                {"prototype" in feature && feature.prototype ? (
                  <span className="badge">Prototype</span>
                ) : null}
              </div>
              <p>{feature.body}</p>
            </article>
          ))}
        </section>
      </main>
    </div>
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
          {connection.health.service} {connection.health.version} (
          {connection.health.status})
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
