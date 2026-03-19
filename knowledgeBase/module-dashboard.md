---
title: Dashboard Screen
type: module
tags: [module, frontend, screen, strava]
created: 2026-03-19 00:00
updated: 2026-03-19 00:00
related: ["[[module-app-layout]]", "[[module-activity-detail]]", "[[module-cache]]", "[[learning-auth-flow]]", "[[INDEX]]"]
---

# Dashboard Screen

**File path:** `Auratrace/app/dashboard.tsx`
**Language/Framework:** TypeScript / React Native / Expo Router
**Owned by / part of:** Frontend — main post-login screen

## Purpose
Lists the authenticated user's Strava activities filtered to Run, Walk, and Ride types. Entry point after login.

## Key Exports / Interfaces
- Default export: `Dashboard` screen component

## Important Internals
- Fetches activities from `GET /api/v1/strava/activities` with Bearer token.
- Stores fetched activities into `cache.ts` so `activity/[id].tsx` can read details without re-fetching.
- JWT retrieved from `expo-secure-store` (native) or `localStorage` (web).
- Activity filtering (Run/Walk/Ride) is enforced on the **backend** — the frontend receives already-filtered results.

## Known Gotchas
- Token storage mechanism differs by platform. Always use the shared auth helper, not raw SecureStore/localStorage directly.

## Change Log
| Date & Time | Change Summary |
|---|---|
| 2026-03-19 00:00 | Initial documentation |
