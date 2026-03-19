---
title: Activity Detail Screen ([id].tsx)
type: module
tags: [module, frontend, screen, maps, charts]
created: 2026-03-19 00:00
updated: 2026-03-19 00:00
related: ["[[module-dashboard]]", "[[module-route-map]]", "[[module-cache]]", "[[learning-strava-polyline-decoding]]", "[[INDEX]]"]
---

# Activity Detail Screen

**File path:** `Auratrace/app/activity/[id].tsx`
**Language/Framework:** TypeScript / React Native / Expo Router
**Owned by / part of:** Frontend — activity detail view

## Purpose
Displays full detail for a single Strava activity: GPS route map, stats grid (distance, time, elevation, HR, calories), and time-series charts for heart rate, pace, altitude, and cadence.

## Key Exports / Interfaces
- Default export: dynamic route screen, receives `id` param via `useLocalSearchParams()`

## Important Internals
- Reads activity summary from `cache.ts` (populated by dashboard) to avoid redundant network calls.
- Fetches stream data from `GET /api/v1/strava/activities/:id/streams` for chart data.
- Decodes `summary_polyline` using `@mapbox/polyline` to get lat/lng coordinate arrays passed to `RouteMap`.
- Charts rendered with `react-native-chart-kit`.
- Has uncommitted changes as of 2026-03-19 (active development).

## Known Gotchas
- Polyline decoding returns `[lat, lng]` pairs — verify coordinate order when passing to map libraries (some expect `[lng, lat]`).
- Stream data request is separate from activity detail; both must resolve before full UI renders.

## Change Log
| Date & Time | Change Summary |
|---|---|
| 2026-03-19 00:00 | Initial documentation (file has uncommitted changes) |
