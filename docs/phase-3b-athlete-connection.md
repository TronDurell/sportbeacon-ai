# Phase 3B candidate — Shared Play → Athlete Connection → Return

Phase 3A proved `Place → Run → Join → Check In → Participation History`.

Superseded. This is the original candidate design note, kept for history. The implemented slice and the
decisions that diverged from this note are recorded in `docs/phase-3b-athlete-connections.md`.

## Product intent

After two athletes check in to the same Run, SportBeacon should be able to help them stay connected **because they played together**, not because they exchanged phone numbers.

Candidate loop:

`Play → Shared verified participation → Athlete Connection → Community return`

## How athletes safely discover who they played with

- Source of truth: overlapping `checked_in` (or later `completed`) participation on the same `runId`.
- `going` without check-in is intent only and should not create a connection by itself.
- Discovery should be opt-in. Phase 3A stores no roster for other athletes to read.
- A later API might return **first name / display name only after both athletes consent**, never a dump of every participant UID to the browser.

## Consent model

Suggested states:

1. `hidden` — default. Other athletes cannot see this athlete on a run.
2. `visible_to_run` — athlete allows co-participants on that run to see a limited identity card.
3. `open_to_connect` — athlete allows a connection request from a co-participant.

Consent must be explicit, revocable, and per-run or per-athlete with a clear default of hidden. Server-authoritative. The browser cannot write another athlete's visibility.

## Connection model

`AthleteConnection` should be derived from shared verified participation:

- `played_together` evidence: `runId`, `placeId`, `checkedInAt` pair
- `requested` / `accepted` / `declined` / `blocked`
- no generic follower graph
- no phone-number exchange requirement

Store under environment isolation, for example:

`environments/{appEnv}/athleteConnections/{uidA}_{uidB}`

with canonical unordered pair keys and server-verified UIDs.

## Privacy implications

- Rosters are sensitive. Do not expose emails, UIDs of strangers, or home areas.
- Place venue coordinates are not athlete locations.
- Still no continuous GPS.
- Blocking and report/abuse paths are required before any social surface ships.
- Direct client Firestore access remains denied.

## Recurring run / community signals

Once connections exist, later signals can include:

- same Place + same weekday/time
- repeat check-ins with the same athletes
- "this community is active" without fake occupancy numbers

These are derived metrics, not a separate social network product.

## Notification requirements

Phase 3B should decide, before building:

- in-app only vs push
- what events are allowed (connection request, run reminder for a Place the athlete already joined)
- quiet hours and opt-in
- no Beacon Alerts, group chat, or live location in the first connection slice

## Recommended 3B slice

The smallest next slice is:

1. consent to be visible to co-participants on a run the athlete checked into;
2. list those co-participants' display names;
3. request/accept a connection;
4. show connected athletes on return to Play.

Stop before messaging, media, recruiting, and maps.
