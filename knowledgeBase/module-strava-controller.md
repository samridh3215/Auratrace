---
title: Strava Controller
type: module
tags: [module, backend, strava, controller]
created: 2026-03-19 00:00
updated: 2026-03-19 00:00
related: ["[[module-strava-service]]", "[[module-strava-routes]]", "[[learning-auth-flow]]", "[[INDEX]]"]
---

# Strava Controller

**File path:** `backend/src/features/strava/strava.controller.js`
**Language/Framework:** JavaScript / Express.js
**Owned by / part of:** Backend — HTTP request handlers

## Purpose
Express request handlers for all Strava-related endpoints. Extracts Bearer tokens from headers, calls the service layer, and formats HTTP responses.

## Key Exports / Interfaces
- `login(req, res)` — redirects to Strava OAuth consent URL
- `callback(req, res)` — handles OAuth redirect, issues JWT, redirects to frontend
- `getActivities(req, res)`
- `getActivityById(req, res)`
- `getActivityStreams(req, res)`
- `logout(req, res)`

## Important Internals
- JWT is issued with 7-day expiry using `jsonwebtoken`. Payload includes the Strava access token so it can be forwarded to the service layer per-request.
- After OAuth callback, backend redirects to `FRONTEND_URL` with `?token=<JWT>` in query params.
- Bearer token from `Authorization` header is verified and decoded to extract the embedded Strava token.

## Known Gotchas
- The Strava access token (6h TTL) is embedded in the JWT (7d TTL). After 6h, the JWT is still valid but Strava API calls will fail. No refresh logic exists.

## Change Log
| Date & Time | Change Summary |
|---|---|
| 2026-03-19 00:00 | Initial documentation |
