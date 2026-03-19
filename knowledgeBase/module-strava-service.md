---
title: Strava Service
type: module
tags: [module, backend, strava, api-integration]
created: 2026-03-19 00:00
updated: 2026-03-19 00:00
related: ["[[module-strava-controller]]", "[[module-strava-routes]]", "[[learning-auth-flow]]", "[[INDEX]]"]
---

# Strava Service

**File path:** `backend/src/features/strava/strava.service.js`
**Language/Framework:** JavaScript / Node.js / Axios
**Owned by / part of:** Backend — Strava API integration

## Purpose
All direct calls to the Strava API v3. Handles OAuth token exchange, activity listing, activity detail, and stream data retrieval. Enforces the Run/Walk/Ride activity type filter.

## Key Exports / Interfaces
- `exchangeToken(code)` — exchanges OAuth code for Strava access token
- `getActivities(accessToken)` — fetches user activities, filtered to Run/Walk/Ride
- `getActivityById(accessToken, id)` — fetches single activity detail
- `getActivityStreams(accessToken, id)` — fetches time-series stream data (HR, pace, altitude, cadence)

## Important Internals
- Activity type filtering (Run, Walk, Ride only) is applied here, not in the controller or frontend.
- Uses Axios for HTTP requests to `https://www.strava.com/api/v3/`.
- Strava access tokens are **not stored** — they're obtained from the JWT on each request via the controller.

## Known Gotchas
- Strava access tokens expire in 6 hours. The current implementation does not handle token refresh — if a user's session outlasts the Strava token, API calls will fail silently or with 401.
- Stream data availability depends on the device used during the activity (e.g., no HR stream if no HR monitor).

## Change Log
| Date & Time | Change Summary |
|---|---|
| 2026-03-19 00:00 | Initial documentation |
