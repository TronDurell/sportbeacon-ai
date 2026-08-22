import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { apiFetch, ApiError, AuthRequiredError, type AuthSession } from "../api/client";
import type { RunConnectionContext } from "./eligibility";

type ConnectionVisibility = "hidden" | "visible_to_run" | "open_to_connect";

type CoPlayerConnectionState =
  | "none"
  | "pending_outgoing"
  | "pending_incoming"
  | "accepted"
  | "declined"
  | "removed";

type CoPlayer = {
  candidateId: string;
  displayName: string;
  connectionState: CoPlayerConnectionState;
  canRequest: boolean;
  connectionId: string | null;
  runId: string;
  placeId: string;
  placeName: string;
  isTestData: boolean;
};

type CoPlayerList = {
  runId: string;
  myVisibility: ConnectionVisibility;
  discoverable: boolean;
  items: CoPlayer[];
  isTestData: boolean;
};

type Connection = {
  connectionId: string;
  displayName: string;
  status: "pending" | "accepted" | "declined" | "removed" | "blocked";
  direction: "incoming" | "outgoing" | "mutual";
  runId: string;
  placeId: string;
  isTestData: boolean;
};

type ConnectionLists = {
  incoming: Connection[];
  outgoing: Connection[];
  accepted: Connection[];
};

const REASON_CODES = [
  { value: "unwanted_contact", label: "Unwanted contact" },
  { value: "harassment", label: "Harassment" },
  { value: "unsafe_behavior", label: "Unsafe behavior" },
  { value: "impersonation", label: "Impersonation" },
  { value: "other", label: "Something else" },
] as const;

const VISIBILITY_CHOICES: Array<{
  value: ConnectionVisibility;
  label: string;
  description: string;
}> = [
  {
    value: "hidden",
    label: "Hidden",
    description:
      "Nobody who played this run can find you here. This is the default and it never removes you from the game itself.",
  },
  {
    value: "visible_to_run",
    label: "Visible to this run",
    description:
      "Co-players from this run who are also visible can see your display name only. They cannot send you a request.",
  },
  {
    value: "open_to_connect",
    label: "Open to connect",
    description:
      "Co-players from this run who are also visible can see your display name and send you one connection request.",
  },
];

const PRIVACY_NOTE =
  "SportBeacon never shares your email, phone number, exact location, or home area. Only athletes who checked into this same run can ever see you here.";

/** Never trust the shape of a response body: a stale backend must not blank the app. */
function asList<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function normalizeConnections(payload: Partial<ConnectionLists> | undefined): ConnectionLists {
  return {
    incoming: asList<Connection>(payload?.incoming),
    outgoing: asList<Connection>(payload?.outgoing),
    accepted: asList<Connection>(payload?.accepted),
  };
}

function safeMessage(caught: unknown, fallback: string): string {
  if (caught instanceof AuthRequiredError) {
    return "Sign in required.";
  }
  if (caught instanceof ApiError) {
    return caught.message;
  }
  return caught instanceof Error ? caught.message : fallback;
}

function stateLabel(state: CoPlayerConnectionState): string {
  switch (state) {
    case "pending_outgoing":
      return "Request sent";
    case "pending_incoming":
      return "Wants to connect";
    case "accepted":
      return "Connected";
    case "declined":
      return "Request declined";
    case "removed":
      return "Connection removed";
    default:
      return "Not connected";
  }
}

export function RunConnectionPanel({
  session,
  run,
  onConnectionsChanged,
}: {
  session: AuthSession;
  run: RunConnectionContext;
  onConnectionsChanged: () => void;
}) {
  const [list, setList] = useState<CoPlayerList | null>(null);
  const [state, setState] = useState("Choose who can see you on this run.");
  const busy = useRef(false);

  const load = useCallback(async (notice?: string) => {
    try {
      const raw = await apiFetch<CoPlayerList>(`/api/runs/${run.id}/co-players`, session);
      const data: CoPlayerList = { ...raw, items: asList<CoPlayer>(raw?.items) };
      setList(data);
      if (notice) {
        setState(notice);
      } else if (!data.discoverable) {
        setState("You are hidden on this run. No co-player can find you here.");
      } else if (data.items.length === 0) {
        setState(
          "No co-player from this run has chosen to be visible yet. Hidden athletes are still playing.",
        );
      } else {
        setState(
          `${data.items.length} co-player${data.items.length === 1 ? "" : "s"} from this run chose to be visible.`,
        );
      }
    } catch (caught: unknown) {
      setState(safeMessage(caught, "Unable to load co-players"));
    }
  }, [run.id, session]);

  useEffect(() => {
    void load();
  }, [load]);

  async function chooseVisibility(visibility: ConnectionVisibility) {
    if (busy.current) {
      return;
    }
    busy.current = true;
    try {
      await apiFetch(`/api/runs/${run.id}/me/connection-consent`, session, {
        method: "PUT",
        body: JSON.stringify({ visibility }),
      });
      await load();
    } catch (caught: unknown) {
      setState(safeMessage(caught, "Unable to update your run visibility"));
    } finally {
      busy.current = false;
    }
  }

  async function sendRequest(candidate: CoPlayer) {
    if (busy.current) {
      return;
    }
    busy.current = true;
    try {
      await apiFetch(`/api/runs/${run.id}/connection-requests`, session, {
        method: "POST",
        body: JSON.stringify({ candidateId: candidate.candidateId }),
      });
      await load(`Connection request sent to ${candidate.displayName}.`);
      onConnectionsChanged();
    } catch (caught: unknown) {
      setState(safeMessage(caught, "Unable to send that connection request"));
    } finally {
      busy.current = false;
    }
  }

  const visibility = list?.myVisibility ?? "hidden";

  return (
    <div className="connection-panel" data-testid="run-connection-panel">
      <h4>People you played with</h4>
      <fieldset className="visibility-choices">
        <legend>Who can see you on this run</legend>
        {VISIBILITY_CHOICES.map((choice) => (
          <label key={choice.value} className="visibility-choice">
            <input
              type="radio"
              name={`connection-visibility-${run.id}`}
              value={choice.value}
              checked={visibility === choice.value}
              onChange={() => void chooseVisibility(choice.value)}
            />
            <span>
              <strong>{choice.label}</strong>
              <span className="choice-description">{choice.description}</span>
            </span>
          </label>
        ))}
      </fieldset>
      <p className="privacy-note">{PRIVACY_NOTE}</p>
      <p data-testid="co-player-state" aria-live="polite">
        {state}
      </p>
      {list && list.items.length > 0 ? (
        <ul className="co-player-list">
          {list.items.map((item) => (
            <li key={item.candidateId} data-testid={`co-player-${item.candidateId}`}>
              <div className="card-heading">
                <strong>{item.displayName}</strong>
                <span className="badge">{stateLabel(item.connectionState)}</span>
              </div>
              {item.isTestData ? (
                <p className="test-data-label">Test data — staging fixture athlete</p>
              ) : null}
              <div className="text-actions">
                {item.canRequest ? (
                  <button
                    type="button"
                    onClick={() => void sendRequest(item)}
                    aria-label={`Send a connection request to ${item.displayName}`}
                  >
                    Connect
                  </button>
                ) : (
                  <span className="choice-description">
                    {item.connectionState === "none"
                      ? `${item.displayName} is visible but not open to requests.`
                      : stateLabel(item.connectionState)}
                  </span>
                )}
              </div>
              <SafetyReportForm
                session={session}
                subjectName={item.displayName}
                payload={{ runId: run.id, candidateId: item.candidateId }}
                testId={`report-co-player-${item.candidateId}`}
              />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function ConnectionsPanel({
  session,
  refreshKey,
}: {
  session: AuthSession;
  refreshKey: number;
}) {
  const [lists, setLists] = useState<ConnectionLists>({
    incoming: [],
    outgoing: [],
    accepted: [],
  });
  const [state, setState] = useState("Connections come from runs you actually played.");
  const busy = useRef(false);

  const load = useCallback(async () => {
    try {
      const data = normalizeConnections(
        await apiFetch<Partial<ConnectionLists>>("/api/me/connections", session),
      );
      setLists(data);
      const total = data.incoming.length + data.outgoing.length + data.accepted.length;
      setState(
        total === 0
          ? "No connections yet. Check into a run and choose to be visible to start."
          : `${data.accepted.length} connected · ${data.incoming.length} incoming · ${data.outgoing.length} sent.`,
      );
    } catch (caught: unknown) {
      setState(safeMessage(caught, "Unable to load your connections"));
    }
  }, [session]);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  async function act(connection: Connection, action: "accept" | "decline" | "remove" | "block") {
    if (busy.current) {
      return;
    }
    busy.current = true;
    try {
      await apiFetch(`/api/me/connections/${connection.connectionId}/${action}`, session, {
        method: "POST",
      });
      await load();
    } catch (caught: unknown) {
      setState(safeMessage(caught, "Unable to update that connection"));
    } finally {
      busy.current = false;
    }
  }

  return (
    <section id="connections" className="health-panel">
      <div className="health-copy">
        <h2>Athlete connections</h2>
        <p>
          Built only from runs you both checked into. No public search, no follower counts, and no
          contact details are ever exchanged.
        </p>
      </div>
      <p data-testid="connections-state" aria-live="polite">
        {state}
      </p>
      <ConnectionGroup
        heading="Incoming requests"
        testId="connections-incoming"
        items={lists.incoming}
        emptyLabel="No incoming requests."
        renderActions={(item) => (
          <>
            <button
              type="button"
              onClick={() => void act(item, "accept")}
              aria-label={`Accept the connection request from ${item.displayName}`}
            >
              Accept
            </button>
            <button
              type="button"
              onClick={() => void act(item, "decline")}
              aria-label={`Decline the connection request from ${item.displayName}`}
            >
              Decline
            </button>
            <button
              type="button"
              onClick={() => void act(item, "block")}
              aria-label={`Block ${item.displayName}`}
            >
              Block
            </button>
          </>
        )}
        session={session}
      />
      <ConnectionGroup
        heading="Requests you sent"
        testId="connections-outgoing"
        items={lists.outgoing}
        emptyLabel="No requests waiting on a reply."
        renderActions={(item) => (
          <button
            type="button"
            onClick={() => void act(item, "block")}
            aria-label={`Block ${item.displayName}`}
          >
            Block
          </button>
        )}
        session={session}
      />
      <ConnectionGroup
        heading="Connected athletes"
        testId="connections-accepted"
        items={lists.accepted}
        emptyLabel="No accepted connections yet."
        renderActions={(item) => (
          <>
            <button
              type="button"
              onClick={() => void act(item, "remove")}
              aria-label={`Remove your connection with ${item.displayName}`}
            >
              Remove
            </button>
            <button
              type="button"
              onClick={() => void act(item, "block")}
              aria-label={`Block ${item.displayName}`}
            >
              Block
            </button>
          </>
        )}
        session={session}
      />
    </section>
  );
}

function ConnectionGroup({
  heading,
  testId,
  items,
  emptyLabel,
  renderActions,
  session,
}: {
  heading: string;
  testId: string;
  items: Connection[];
  emptyLabel: string;
  renderActions: (item: Connection) => JSX.Element;
  session: AuthSession;
}) {
  return (
    <div className="connection-group" data-testid={testId}>
      <h3>{heading}</h3>
      {items.length === 0 ? (
        <p className="form-message">{emptyLabel}</p>
      ) : (
        <ul className="co-player-list">
          {items.map((item) => (
            <li key={item.connectionId} data-testid={`connection-${item.connectionId}`}>
              <div className="card-heading">
                <strong>{item.displayName}</strong>
                <span className="badge">{item.status === "accepted" ? "Connected" : "Pending"}</span>
              </div>
              {item.isTestData ? (
                <p className="test-data-label">Test data — staging fixture athlete</p>
              ) : null}
              <div className="text-actions">{renderActions(item)}</div>
              <SafetyReportForm
                session={session}
                subjectName={item.displayName}
                payload={{ connectionId: item.connectionId }}
                testId={`report-connection-${item.connectionId}`}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SafetyReportForm({
  session,
  subjectName,
  payload,
  testId,
}: {
  session: AuthSession;
  subjectName: string;
  payload: { connectionId: string } | { runId: string; candidateId: string };
  testId: string;
}) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const details = String(form.get("details") || "").trim();
    setSending(true);
    try {
      await apiFetch("/api/me/safety-reports", session, {
        method: "POST",
        body: JSON.stringify({
          ...payload,
          reasonCode: String(form.get("reasonCode")),
          ...(details ? { details } : {}),
        }),
      });
      setMessage("Report received. Our safety team reviews reports privately.");
    } catch (caught: unknown) {
      setMessage(safeMessage(caught, "Unable to send that report"));
    } finally {
      setSending(false);
    }
  }

  return (
    <details className="report-disclosure" data-testid={testId}>
      <summary>Report a safety concern</summary>
      <form className="stack-form" onSubmit={submit}>
        <label>
          {`Reason for reporting ${subjectName}`}
          <select name="reasonCode" defaultValue="unwanted_contact" required>
            {REASON_CODES.map((reason) => (
              <option key={reason.value} value={reason.value}>
                {reason.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          {`What happened with ${subjectName} (optional)`}
          <textarea name="details" maxLength={500} rows={2} />
        </label>
        <div className="text-actions">
          <button type="submit" disabled={sending}>
            Send report
          </button>
        </div>
        {message ? (
          <p className="form-message" aria-live="polite">
            {message}
          </p>
        ) : null}
      </form>
    </details>
  );
}
