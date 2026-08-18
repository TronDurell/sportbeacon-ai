# Phase 3A — MVP Core Sports Loop

Status: implemented on `feat/mvp-core-sports-loop`. This document is the architecture record for the first playable vertical slice.

## Existing baseline

Phase 2B (squash SHA `99c67f8614d08d638f4c66005bd5bffcd7df5226`) provides:

- Firebase email/password authentication in the Vite app
- private persisted athlete profiles and basketball statistics
- authenticated insights and drill recommendations from persisted data
- server-mediated Firestore access under `environments/{appEnv}/...`
- direct client Firestore denial (`allow read, write: if false`)
- fail-closed `APP_ENV` and route gating
- staging Cloud Run with `ENABLE_AUTHENTICATED_PROFILE_ROUTES=true`
- production Cloud Run remaining health-only
- Vercel frontend deployment and required GitHub CI

Phase 3A does not redesign or weaken those controls.

## User outcome

An authenticated athlete can answer **Can I play basketball today?** by:

1. viewing basketball runs;
2. seeing the Place for each run;
3. distinguishing upcoming vs active;
4. opening a run;
5. joining (`I'm going`);
6. checking in when the run is in the check-in window;
7. seeing participation recorded;
8. refreshing or signing back in and retaining that history.

No manual Firestore editing is required. Development and staging use explicitly labeled test fixtures. Those fixtures are not live municipal data.

## Existing relevant code

| Path | Classification | Phase 3A use |
| --- | --- | --- |
| `backend/api.py`, `me_routes.py`, `token_auth.py`, `athlete_repository.py` | Canonical | Extend the same auth + server-mediated Firestore pattern |
| `backend/runtime_env.py` | Canonical | Fail-closed env and flags |
| `frontend/src/App.tsx`, `frontend/src/api/client.ts` | Canonical | Add Play without replacing Profile/Stats/Insights |
| `firestore.rules` | Canonical | Keep deny-all client access |
| `backend/services/venue_service.py`, `backend/routes/venues.js` | Legacy / prototype | Mapbox venue lookup. Not reused. |
| `backend/workout_partner.py` | Prototype | In-memory sample venues and distance ranking. Not reused. |
| `backend/routes/player-locations.js` | Unsafe / out of scope | Continuous location adjacent. Not reused. |
| `backend/matchmaking_service.py`, `ai/matchmaking_engine.py` | Prototype engines | Unauthenticated product APIs remain gated. Not the sports loop. |
| `frontend/components/*`, `frontend/services/eventService.ts`, `frontend/services/communityFeed.ts` | Legacy Vite-excluded UI | Not imported by `frontend/src/main.tsx`. Not reused. |
| `backend/app.js` and Express routes | Legacy Node | Install-only. Not the active backend. |

## Canonical model proposal

```
Athlete → Place → Run → Participation (with CheckIn timestamps)
```

Future (not implemented):

```
Shared verified participation → AthleteConnection → Community return
```

### Place

A real sports/recreation location. Not a residence. Not a RecTrac row.

Minimum fields: `id`, `name`, `city`, `region`, `country`, `sportCapabilities`, optional public venue `latitude`/`longitude`, optional `entranceNotes`, `isTestData`, `createdAt`, `updatedAt`.

Optional future-compatible `externalRefs[]` (`provider`, `externalId`, optional `sourceMetadata`). Never required.

### Run

A playable sports session at a Place.

Minimum fields: `id`, `sport`, `placeId`, `title`, `startsAt`, `endsAt`, stored `status` (`scheduled` or `cancelled`), `createdBy`, optional `capacity`, `visibility`, `isTestData`, `createdAt`, `updatedAt`.

API `status` is computed from server UTC time:

| Computed status | Rule |
| --- | --- |
| `cancelled` | stored status is `cancelled` |
| `completed` | `now > endsAt` |
| `active` | `startsAt <= now <= endsAt` |
| `upcoming` | `now < startsAt` |

`active` and `completed` are not persisted as separate organizer states in Phase 3A.

### Participation

One authoritative record per `athlete + run`.

Fields: `uid` (server-assigned), `runId`, `status` (`going` \| `checked_in` \| `completed` \| `withdrawn`), `joinedAt`, optional `checkedInAt`, denormalized `runTitle`, `placeId`, `placeName`, `sport`, `startsAt`, `isTestData`.

Join is idempotent. Duplicate concurrent joins cannot create a second logical record.

### CheckIn

**Decision: Check-in is a state and timestamp on Participation, not a separate document.**

Phase 3A has no audit/compliance requirement for an independent check-in event stream. A second collection would duplicate the athlete+run key and add index/authorization cost without changing the user outcome.

Check-in is authenticated, server-authoritative, bound to the verified token UID, bound to an existing Run, and idempotent. If no participation exists and the run is inside the check-in window, check-in atomically creates `checked_in` participation.

Check-in window: `startsAt - 30 minutes <= now <= endsAt`, and the run is not cancelled or completed.

## Privacy model

| Resource | Phase 3A visibility |
| --- | --- |
| Place | Authenticated athletes may read venue-safe fields through the API. No residential addresses. |
| Run | Discoverable to authenticated athletes according to server policy (`visibility=authenticated`). |
| Participation | The athlete sees only their own participation. No participant roster. No fabricated attendance. Aggregate counts are omitted. |
| Athlete profile / stats | Unchanged: private, server-mediated, UID from verified token. |

The browser still cannot read or write Firestore. Places and Runs are **not** opened as public client-readable collections in this phase.

No continuous GPS, background location, location trails, or precise athlete movement history.

## API design

All routes require a verified Firebase bearer token. Request bodies cannot set `uid` or impersonate another athlete.

| Method | Path | Behavior |
| --- | --- | --- |
| `GET` | `/api/runs` | Active and upcoming basketball runs in the near-term window, with Place and the caller's participation. |
| `GET` | `/api/runs/{runId}` | One run with Place and the caller's participation. |
| `POST` | `/api/runs/{runId}/join` | Idempotent join. Rejects cancelled/completed runs. |
| `POST` | `/api/runs/{runId}/check-in` | Idempotent check-in inside the window. May create participation. |
| `GET` | `/api/me/participation` | Caller's participation history, newest first. |

Not exposed: Place CRUD, Run CRUD, leave, rosters, geospatial search, organizer dashboards.

Route gating reuses `ENABLE_AUTHENTICATED_PROFILE_ROUTES` so staging does not need a new Cloud Run flag. Invalid `APP_ENV` still fail-closes these paths to 404.

## Firestore layout

Environment isolation is preserved.

```
environments/{appEnv}/places/{placeId}
environments/{appEnv}/runs/{runId}
environments/{appEnv}/runs/{runId}/participants/{uid}
environments/{appEnv}/athletes/{uid}/participations/{runId}
```

Why this layout:

- Join/check-in is a direct document at `participants/{uid}` — natural uniqueness and cheap transactions.
- Athlete history is a direct subcollection under the athlete — no collection-group query in Phase 3A.
- The two participation documents are written in one transaction and store the same snapshot fields so fixture time-rolls do not erase history.
- Lookup by Place is `runs.placeId` filtered in the service after a `sport` query. Phase 3A data volume is fixture-scale.
- Future `AthleteConnection` can derive from shared `runId` values in athlete participation history without a follower graph.

Discovery query: `runs` where `sport == basketball` (single-field, auto-indexed), then Python filters the time window and cancelled state. **No composite index is added.** A later geospatial/city+time query should add an index only when that query exists.

City/region from the athlete profile is a **sort preference**, not a hard hide. Phase 3A does not implement radius search. This is intentional so labeled test runs remain findable while home-area matching is proven as a hint.

## Integration boundary

```
External Provider (RecTrac, TeamSideline, municipal API, venue system)
        → Adapter (future)
        → SportBeacon Place / Run domain
```

Canonical Place and Run documents never require provider fields. `externalRefs` is optional and additive. Adapters may later upsert Places/Runs and attach `provider` + `externalId`. They must not become the primary key.

Python `ProviderAdapter` protocol documents the future shape. No RecTrac (or other) network integration ships in this PR.

## Explicit non-goals

Athlete-to-athlete connections, participant social graph, group chat, messaging, Beacon Alerts, push notifications, live location / “on the way”, geofencing, maps/navigation, RecTrac/TeamSideline/municipal sync, media uploads, video AI, recruiting, public athlete profiles, followers, teams/leagues/tournaments, payments, wearables, organizer dashboards, fake live occupancy.

Optional `runId` on manual basketball stats is **deferred to Phase 3B**. The current stat model remains valid without it. Linking stats to runs is useful but not required to prove Discover → Join → Check In → Persist.

## Test strategy

- Application-stack FastAPI tests with the in-memory sports-loop repository prove serialization, status calculation, timezone boundaries, discovery, join/check-in idempotency, ownership, lifecycle rejections, and history.
- Runtime-gate tests prove invalid `APP_ENV` hides Phase 3 routes and staging allowlisting still hides legacy product APIs.
- Firestore emulator tests prove environment-scoped persistence and continued client deny-all, including new collections.
- Frontend Vitest tests prove Play rendering, join/check-in request guards, empty state, safe errors, and Phase 2B auth/profile/stats/insights/drills regressions.
- Production remains health-only.

## Product metrics preparation

No analytics vendor is added. Domain events that a later telemetry layer can count:

- run viewed (`GET /api/runs/{runId}`)
- run joined (`POST .../join` creating or returning `going`)
- athlete checked in (`POST .../check-in`)
- repeat participation (history length per athlete)

Structured logs record join/check-in failures with `runId` and reason. They do not record bearer tokens, credentials, full athlete records, or email.

## Rollback

Staging Cloud Run: point traffic at the previous ready revision of `sportbeacon-api-staging`. Frontend Preview is branch-scoped and disappears when the draft PR is closed. Production is not modified.
