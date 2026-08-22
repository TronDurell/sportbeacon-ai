# Phase 3B — Private Athlete Connections from Shared Play

Status: merged as PR #21, then corrected on `fix/phase-3b-connection-lifecycle` before live
acceptance. This document is the architecture record. `docs/phase-3b-athlete-connection.md` remains
the earlier candidate design note; this file records what was actually built and where the two
differ. The one behavioural change since the merge is in
[Reconnection after later verified shared play](#reconnection-after-later-verified-shared-play).

## Existing baseline

Phase 3A (`18269eff239c373d0a3d860706f31d1c311ad002`) provides:

- `Place → Run → Participation` with check-in represented as participation status plus timestamps
- Firebase email/password authentication and Firebase ID tokens on every product API
- server-mediated Firestore access under `environments/{appEnv}/...`
- direct client Firestore denial (`allow read, write: if false`)
- fail-closed `APP_ENV` parsing and a route allowlist that 404s anything unknown
- staging Cloud Run with `ENABLE_AUTHENTICATED_PROFILE_ROUTES=true`, production health-only
- Vercel Production requiring explicit promotion

Phase 3B extends that surface. It does not weaken any of it.

## User outcome

Two athletes who actually played the same run can stay in touch without exchanging phone numbers:

`Play → verified shared check-in → controlled visibility → connection request → acceptance → recognized connection`

1. Both athletes check into the same run (Phase 3A).
2. Each athlete independently chooses a per-run visibility level. Everyone starts `hidden`.
3. Only when both are visible does either appear in the other's "People you played with" list.
4. A request is possible only when the target chose `open_to_connect` on that shared run.
5. The recipient accepts or declines. Acceptance produces a connection both athletes see on return to Play.
6. Either athlete can remove, block, or report at any time.
7. If a request was declined or a connection was removed, the two can start over — but only after
   they play another run together, and never after a block.

Nothing is automatic. Choosing a visibility level never creates a connection, and there is no
suggestion engine, public search, follower count, or contact-detail exchange.

## Consent model

Per-run, per-athlete, explicit, revocable, server-authoritative.

| Visibility | Meaning |
| --- | --- |
| `hidden` | Default, including every participation record written before this phase. No co-participant can discover the athlete on that run. |
| `visible_to_run` | Eligible co-players who are themselves visible may see the athlete's safe display name. They cannot send a request. |
| `open_to_connect` | Same visibility, plus eligible co-players may send one connection request. |

Decisions:

- **Visibility is mutual, not one-way.** A hidden athlete is neither listed nor shown a list. Otherwise
  hiding would be a one-way mirror that lets a hidden athlete browse co-players anonymously.
- **Only `checked_in` or `completed` participation is eligible.** `going` is intent, not proof of play.
  A `going`, withdrawn, or unrelated participant is rejected at both consent and discovery.
- **Consent is stored on the participation record, not in a new collection.** The eligibility check
  already loads participation, the athlete+run key is already unique, and Phase 3A already writes both
  participation documents in one transaction. A separate consent collection would duplicate that key
  and add a second transaction for no change in user outcome. This mirrors the Phase 3A decision to
  keep check-in as state on participation rather than an event stream.

## Opaque per-run candidate identity

`Participation.candidateId` is a random 32-hex server value from `secrets.token_hex(16)`. It is
**not** derived from a UID, email, or any private identifier, so it cannot be reversed or correlated
across environments.

- It is minted lazily, inside the consent transaction, the first time an athlete leaves `hidden` on a
  run. Records that stay hidden never get one, so the identifier only exists where consent exists.
  Existing eligible participation is therefore backfilled by use rather than by a migration job.
- It is per-run. The same athlete has different candidate ids on different runs, so two clients cannot
  join candidate ids to recognize the same person across runs.
- A request names a candidate id, and the server re-resolves it against the live eligible-and-visible
  participant set for that run. A stale, guessed, or foreign candidate id resolves to nothing.

## Relationship identity

`AthleteConnection` documents are keyed by `pairKey`:

```
pairKey = sha256("sportbeacon:athlete-connection:v1:" + min(uidA,uidB) + "\0" + max(uidA,uidB))
```

- **Canonical for an unordered pair**, so a request, a reversed duplicate request, and two truly
  concurrent requests all address the same document id. One `set` inside one transaction is enough to
  make two relationships impossible; no uniqueness index or lock table is needed.
- **One-way.** Unlike the candidate design's `{uidA}_{uidB}` document id, a sha256 digest cannot be
  turned back into member UIDs, so the document id is safe even if a key ever appears in a log,
  console, or export. This is the one deliberate divergence from `phase-3b-athlete-connection.md`.
- Clients never see `pairKey`. They see `connectionId`, a separate random opaque id, and the server
  resolves that id **only within the caller's own relationship set**. A caller therefore cannot name a
  relationship they are not a member of, and an unknown id is indistinguishable from someone else's.

Member UIDs are stored inside the document for authorization and for the
`members array_contains uid` query. They are never serialized to a client.

## State machine

```
(none) --request--> pending --accept--> accepted --remove--> removed
                       |                    |                   |
                       +-----decline----> declined              |
                       |                    |                   |
                       |                    +--- later verified shared play ---+
                       |                    |                                  |
                       |                    +----------> pending (new cycle) <-+
                       |
                       +------block-------> blocked  <----block---- any non-blocked state
```

| From | To | Trigger | Who |
| --- | --- | --- | --- |
| *(none)* | `pending` | request on a run both athletes played | either athlete |
| `pending` | `accepted` | accept | recipient only |
| `pending` | `declined` | decline | recipient only |
| `pending` | `blocked` | block | either member |
| `accepted` | `removed` | remove | either member |
| `accepted` | `blocked` | block | either member |
| `declined` | `pending` | request on **later verified shared play** | either athlete |
| `removed` | `pending` | request on **later verified shared play** | either athlete |
| `declined` / `removed` | `blocked` | block | either member |
| `blocked` | — | nothing. Permanently terminal in this phase, and there is no unblock endpoint | — |

Server-enforced rules, all inside one transaction per transition:

| Rule | Enforcement |
| --- | --- |
| Only the authenticated requester can send | Requester UID comes from the verified token, never the body |
| Self-request impossible | The caller's own `candidateId` is rejected, and the caller is skipped when building the co-player set |
| Shared eligible run evidence required | Both sides must hold `checked_in`/`completed` participation on the same run |
| Target must be `open_to_connect` | Re-checked at request time, not trusted from the client's list snapshot |
| Requester must not be hidden | A hidden athlete cannot reach into a run they opted out of |
| Duplicate and reversed duplicates are idempotent | The mutation returns "no change" when the canonical document already exists, and the existing relationship is returned |
| Concurrent requests cannot fork | Both writes target the same `pairKey` document; the transaction serializes them |
| Only the recipient can accept or decline | `recipientUid != uid` is a 403 |
| Accepting or declining twice is safe | A repeated terminal transition by the same recipient is a no-op that returns current state |
| Removal requires an accepted connection | Either member may remove |
| Blocking supersedes pending and accepted | Blocking is allowed from any live state and records `blockedBy` |
| Blocked pairs stay invisible | Discovery skips blocked pairs, so neither athlete reappears on any run |
| A blocked pair cannot be revived through another run | The pair key is run-independent, so a later shared run still resolves to the blocked document |
| A declined or removed pair reopens only on later verified shared play | The request mutation re-checks the gate below inside the same transaction |
| No unblock | Not implemented in this phase |

## Reconnection after later verified shared play

The first cut of this phase made `declined` and `removed` permanently terminal. That contradicted the
acceptance sequence the phase was supposed to prove — connect, remove, reconnect, block — so the
sequence could never have been completed against the implemented state machine. Rewriting the
checklist to hide the contradiction would have shipped a lifecycle nobody could exercise, so the
lifecycle is what changed.

The safety property that made terminal states attractive is preserved by a different gate: **an
athlete cannot ask again just because they want to. They can ask again only because the two of them
actually played together again.** Shared play is scarce, physical, and mutual, so it is a harder
thing to manufacture than a cooling-off timer, and it needs no rate-limit infrastructure.

A request against a `declined` or `removed` relationship reopens it only when **all** of the
following hold. Any single failure returns the same uniform refusal as every other unreachable
outcome:

1. **A different run.** The `runId` is not the relationship's current `qualifyingRunId`. The run that
   produced the previous cycle can never reopen it.
2. **Both athletes hold eligible participation** — `checked_in` or `completed` — on that run. `going`
   is intent, not proof of play, and is rejected here exactly as it is everywhere else in this phase.
3. **Both participation records carry server check-in evidence newer than the ending.** Each side's
   `checkedInAt` must be strictly later than the relationship's `declinedAt` or `removedAt`. A
   `completed` record with no check-in stamp proves nothing about *when* the athletes played and does
   not qualify.
4. **Both athletes are mutually visible on that run.** The caller is not `hidden` and the target is
   discoverable, the same mutual-visibility rule discovery already uses.
5. **The target currently chose `open_to_connect`** on that run, re-read at request time rather than
   trusted from a client snapshot.
6. **Neither athlete blocked the other.** `blocked` is checked before anything else and is terminal.

Why each part is load-bearing:

- **`checkedInAt` is server-authoritative.** It is stamped from the server clock inside the check-in
  transaction; `POST /api/runs/{runId}/check-in` accepts no body at all, so there is no field for a
  client to send and nothing for a client to alter.
- **Check-in is stamped once.** Re-posting a check-in on a run an athlete already checked into is
  idempotent and does not refresh the stamp, so an athlete cannot replay an old run to manufacture
  newer evidence.
- **Strictly later, not "at least as late".** A check-in recorded in the same instant the connection
  ended is not later play, so it does not qualify.
- **An older run cannot be reused.** A run with a different id still fails on the timestamp rule when
  the pair played it before the ending, which is the case rules 1 and 3 cover together.

`blocked` remains permanently terminal, discovery still skips blocked pairs entirely, and a declined
or removed relationship can still be blocked before it is ever reopened — which is the control an
athlete uses when they want a decline to be final.

### Request-cycle audit fields

Reopening rewrites one document. It never creates a second relationship, and the client-facing
`connectionId` is deliberately unchanged so an athlete's own opaque handle stays stable across
cycles.

| Field | Meaning |
| --- | --- |
| `requestCycle` | How many request cycles this pair has had. Starts at `1` and increments on each reopen. |
| `lastRequestedAt` | When the current cycle's request was made. |
| `previousStatus` | The state the current cycle was reopened from: `declined` or `removed`, never `blocked`. |
| `previousStatusAt` | When that previous cycle ended — the boundary the new check-in evidence had to beat. |

Reopening also sets `status` to `pending`, moves `qualifyingRunId`/`qualifyingPlaceId` to the new
run's evidence, rewrites `requesterUid`/`recipientUid` so the roles describe **this** request (a
reversed reconnection is a genuine new request, not a revived old one), and clears `acceptedAt`,
`declinedAt`, and `removedAt` so the new cycle carries no stale outcome. `pairKey`, `members`,
`connectionId`, and `createdAt` are untouched.

Because the roles are the only identity-bearing fields a reopen rewrites, the reopened record is
re-validated before it is persisted, so a rewrite can never leave the members and the pair key
disagreeing.

### Compatibility with stored Phase 3B documents

All four fields are optional with defaults, so a document written before reconnection existed
deserializes as an untouched first cycle: `requestCycle` is `1`, and the other three are absent. No
migration job runs and no document is rewritten until the pair actually reopens. A stored `declined`
or `removed` document that predates the `declinedAt`/`removedAt` markers falls back to `updatedAt`
as the boundary, so an absent marker still yields a real server timestamp to measure new shared play
against rather than an empty boundary that anything could clear.

### Error disclosure

Every "you cannot reach this athlete" outcome — hidden, ineligible, `visible_to_run` only, blocked,
unknown candidate, foreign candidate — returns the same message,
`That athlete is not available to connect from this run`. A caller cannot use status codes or wording
to probe whether an unrelated private athlete exists. Unknown or foreign `connectionId` values all
return `Connection not found`.

## Safety reporting

`POST /api/me/safety-reports` accepts either a `connectionId` (an existing relationship) or a
`runId` + `candidateId` pair (a co-player the reporter has not connected with), a reason code from a
five-value enum, and optional text capped at 500 characters. The server resolves the subject UID
itself, attaches the qualifying run and place, and stamps `createdAt`.

The response is `{"status": "received"}` and nothing else. Reports are write-only from the client's
perspective: no endpoint reads them back, so a report cannot be enumerated, confirmed, or used to
probe another athlete. No moderation dashboard, notification, or automated enforcement ships here.

## API surface

Every route requires a verified Firebase ID token, derives identity solely from that token, validates
path and body shapes, is scoped to the current environment, and 404s when the phase flag is off.

| Method | Path | Behavior |
| --- | --- | --- |
| `PUT` | `/api/runs/{runId}/me/connection-consent` | Set the caller's visibility for one eligible run |
| `GET` | `/api/runs/{runId}/co-players` | The caller's visibility plus eligible, visible, non-blocked co-players |
| `POST` | `/api/runs/{runId}/connection-requests` | Send one request naming an opaque `candidateId` |
| `GET` | `/api/me/connections` | The caller's incoming, outgoing, and accepted connections |
| `POST` | `/api/me/connections/{connectionId}/accept` | Recipient-only acceptance |
| `POST` | `/api/me/connections/{connectionId}/decline` | Recipient-only decline |
| `POST` | `/api/me/connections/{connectionId}/remove` | Either member ends an accepted connection |
| `POST` | `/api/me/connections/{connectionId}/block` | Either member blocks the other |
| `POST` | `/api/me/safety-reports` | Write-only safety report |

These match the paths suggested for this phase. The four state transitions accept no request body:
their subject is the path id and their actor is the token, so a body could only ever be an attempt to
smuggle identity. `uid`, `email`, and similar identity fields are rejected outright, reusing the
Phase 2B `reject_identity_fields` guard.

`GET /api/runs/{runId}/co-players` deliberately has no unauthenticated or roster-shaped sibling. It is
not a run roster: it returns only athletes who consented, only to a caller who consented, and only
when both actually played.

### Response projection

`CoPlayerView` carries `candidateId`, `displayName`, `connectionState`, `canRequest`, `connectionId`,
`runId`, `placeId`, `placeName`, `isTestData`. `ConnectionView` carries `connectionId`, `displayName`,
`status`, `direction`, `runId`, `placeId`, timestamps, `isTestData`.

Never serialized: Firebase UID, email, phone number, auth provider, home area, precise location,
private profile fields, unrelated participation history, `pairKey`, member UIDs, or report content.
The display name is projected field-by-field from the athlete profile at read time — there is no
denormalized public profile copy to drift or leak — and falls back to `SportBeacon athlete` when a
profile has no usable name.

## Route gating

`ENABLE_ATHLETE_CONNECTIONS` must be explicitly `true` **and**
`ENABLE_AUTHENTICATED_PROFILE_ROUTES` must be true before any connection path answers.

Reusing only the Phase 3A flag was rejected: staging already sets
`ENABLE_AUTHENTICATED_PROFILE_ROUTES=true`, so reuse would have published the social surface the moment
this code deployed, with no separate decision. The connections gate is checked *before* the athlete
gate in the middleware, so the social surface cannot be reached through the broader flag. An unset
flag is off; only the literal true value opens it. Production is unaffected: it sets both flags false
and stays health-only.

Development and test still open through `ENABLE_PRODUCT_ROUTES`, matching Phase 3A.

## Firestore layout

```
environments/{appEnv}/runs/{runId}/participants/{uid}          <- + connectionVisibility, candidateId
environments/{appEnv}/athletes/{uid}/participations/{runId}     <- same fields, same transaction
environments/{appEnv}/athleteConnections/{pairKey}
environments/{appEnv}/safetyReports/{reportId}
```

- Consent writes both participation documents in one transaction so a partial write cannot leave an
  athlete visible in one projection and hidden in the other.
- `athleteConnections` is a flat environment-level collection because a relationship belongs to two
  athletes, not one. Nesting it under either athlete would force a duplicate mirror and a second
  transaction, which is exactly the fork this design prevents.
- `members array_contains uid` is a single-field query and needs **no composite index**. Sorting and
  status partitioning happen in Python at fixture scale, matching the Phase 3A choice.
- `safetyReports` is keyed by an opaque report id and is never queried by a client path.
- Client access to all four paths remains denied by `firestore.rules`; the rules file is unchanged
  because it is already deny-all for every document.

## Frontend

`frontend/src/connections/AthleteConnections.tsx` adds two components to the existing mobile-first
shell without redesigning Discover, Join, Check In, profile, insights, or drills:

- `RunConnectionPanel` appears inside an opened run **only** once
  `connectionsAreAvailable(run)` confirms the caller's own participation is `checked_in` or
  `completed`. Before that the run shows "Check in on this run to see who you played with."
  The panel offers the three visibility levels as a labeled radio group, each with plain-language
  consequences, plus a standing note that SportBeacon never shares email, phone number, exact
  location, or home area.
- `ConnectionsPanel` is a top-level Play section listing incoming requests, sent requests, and
  connected athletes, each with the actions that are legal for that state and an inline
  report disclosure.

UX and accessibility decisions:

- Status text lives in `aria-live="polite"` regions so a screen reader hears the result of a
  visibility change or a request without moving focus.
- Every action button is a real `<button>` with an explicit `aria-label` naming the athlete, so
  "Block" is never ambiguous when several cards are on screen.
- Empty states say hidden athletes are still playing the game, so an empty list never implies the
  court was empty.
- In-flight guards prevent a double tap from sending two requests or two transitions.
- Response bodies are coerced to their expected shape before render, so a stale or partial backend
  response degrades to an empty list instead of blanking the app.
- Fixture co-players stay labeled `Test data — staging fixture athlete`. No athlete is invented and
  no fixture auto-accepts in the product experience.
- The server decides whether a request is possible; the panel only puts that decision in plain
  language. A declined or removed co-player is described as reconnectable **only** when the server
  already set `canRequest`, at which point the action reads `Reconnect` and the card explains that
  playing this run together after the last ending is what earned the new request. Until then the card
  says the pair needs a later run they both check into — it never promises immediate reconnection.
- Removal and blocking are stated as different things wherever either is offered: removal ends the
  connection and needs a later shared run before anyone can ask again, blocking is permanent and
  cannot be undone.

## Acceptance fixtures

Reconnection needs a *later* run both athletes checked into, and the labeled fixture set previously
had exactly one run with an open check-in window, so the sequence could not be walked end to end
without hand-editing Firestore. Two further labeled TEST DATA runs at the same test place —
`test-run-basketball-active-second` and `test-run-basketball-active-third` — now open alongside
`test-run-basketball-active`, staggered so they list in session order.

They are ordinary fixture runs and change nothing else: no synthetic athlete account is created,
nobody is auto-joined or auto-accepted, consent still starts `hidden` on every one of them, and they
follow the existing rule that fixtures never load in production.

## Explicit non-goals

Messaging or chat, media or feeds, public profiles or public rosters, follower mechanics, friend
suggestions outside verified shared play, groups or team management, recruiting, maps or heat maps,
notifications of any kind, municipal connectors, tournaments, payments, scheduling, client-side
Firebase database access, new Firebase services, new IAM roles or secrets, production Cloud Run
changes, Vercel Production deployment, and service-account key rotation.

Unblock is intentionally absent, and so is any broad rate-limit or cooling-off infrastructure:
the later shared run *is* the anti-harassment gate for this phase.

## Test strategy

- `tests/test_athlete_connections_api.py` covers the privacy and authorization matrix end to end
  through the FastAPI stack with in-memory repositories: hidden defaults, mutual visibility, one-sided
  hiding, `going` rejection, unrelated-run rejection, missing/invalid tokens, candidate-id opacity,
  self-request rejection, target not open, duplicate and reversed idempotency, concurrent requests,
  recipient-only accept and decline, removal, blocking superseding pending and accepted state,
  blocked rediscovery prevention across a second run, report authorization and validation, payload
  scanning for private material, and log hygiene. The reconnection rows are covered in the same file:
  a declined or removed pair refused on the same run, refused on a run they played *before* the
  ending, refused when either side lacks a server check-in stamp, refused when the check-in is
  simultaneous with the ending rather than later, refused when a replayed check-in fails to re-stamp,
  refused while either athlete is only `going`, refused while the target is not `open_to_connect`,
  allowed on genuinely later shared play from either direction, idempotent under duplicate and
  concurrent reversed later-run requests, stable in pair document and opaque connection id across
  cycles, correct in every audit field, never reopenable once blocked, blockable while still
  declined, compatible with a stored document that has no audit fields, and free of private or
  server-only material in both responses and logs.
- `tests/test_production_api_safety.py` proves every connection path stays 404 in production, including
  when `ENABLE_AUTHENTICATED_PROFILE_ROUTES` is true.
- `tests/test_runtime_fail_closed.py` proves an invalid or missing `APP_ENV` hides the connection paths
  and that staging needs the explicit flag.
- `tests/test_firestore_emulator.py` proves environment-scoped persistence for `athleteConnections` and
  `safetyReports`, that consent lands on both participation documents, and that direct client access to
  the new collections is still denied.
- `frontend/src/App.test.tsx` covers the locked-before-check-in state, hidden-by-default copy, consent
  change, safe-identity-only rendering, `visible_to_run` withholding the request action, sending exactly
  one request, safe server refusals, accept, decline, remove, block, the report receipt, and malformed
  response tolerance — alongside the existing Phase 2B and 3A regressions. It also covers the
  reconnect action and its explanation appearing only when the server allows it, the same-run case
  offering no action and stating the later-run requirement instead, and removal being described
  differently from a permanent block.

## Corrected two-account acceptance procedure

The sequence below is the one this lifecycle actually supports. It needs two real accounts on the
Preview URL and a staging backend running with `ENABLE_ATHLETE_CONNECTIONS=true`.

1. Account A and Account B each join and check into **Run 1** (`TEST DATA — Lunch pickup run`).
2. Both choose `open_to_connect` on Run 1. Confirm each sees only the other's display name — no
   email, phone number, location, or home area.
3. A sends a request to B. B sees it under Incoming requests and accepts.
4. Both refresh, navigate away to Play, and return: the connection is still under Connected athletes.
5. A removes the connection. It disappears for both, and the panel states that a new request needs a
   later run they both check into.
6. On Run 1, neither account can reconnect: the co-player card offers no Connect or Reconnect action
   and explains the later-run requirement. A replayed request against Run 1 is refused.
7. Both join and check into **Run 2** (`TEST DATA — Second pickup run (later session)`).
8. Both choose `open_to_connect` on Run 2.
9. The card now offers **Reconnect** and explains that playing this run together after the last
   ending is what allows it. Either account may send it; B accepts.
10. B blocks A.
11. On Run 2 and on **Run 3** (`TEST DATA — Third pickup run (latest session)`), neither account can
    rediscover or reconnect with the other, in either direction, no matter how many further runs they
    both check into. There is no unblock control anywhere in the UI.
12. Safety reporting still works from both a connection card and a co-player card, returns only
    `Report received. Our safety team reviews reports privately.`, and exposes no way to read a report
    back.
13. Production stays health-only, IAM is unchanged, and a direct browser Firestore read of
    `environments/staging/athleteConnections` still returns 401/403.

## Rollback

- Frontend: the Vercel Preview is branch-scoped and disappears with the draft PR. Production is
  untouched and still requires explicit promotion.
- Backend: set `ENABLE_ATHLETE_CONNECTIONS=false` on the staging service. Every connection path
  returns to 404 immediately with no data migration, because consent defaults to hidden and the new
  collections are additive. Reverting to the previous staging revision is the stronger option and
  leaves Phase 3A fully working.
- Data: no destructive migration was performed. Participation documents gained additive fields that
  default to hidden, so a rollback silently returns every athlete to hidden.
