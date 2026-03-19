---
title: Activity Detail Screen ([id].tsx)
type: module
tags: [module, frontend, screen, maps, charts]
created: 2026-03-19 00:00
updated: 2026-03-19 18:00
related: ["[[module-dashboard]]", "[[module-cache]]", "[[learning-strava-polyline-decoding]]", "[[issue-2026-03-19-id-fetches-on-visuals-route]]", "[[issue-2026-03-19-google-maps-api-key-crash]]", "[[decision-2026-03-19-remove-google-maps]]", "[[INDEX]]"]
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
- Reads activity summary from `utils/cache.ts` (populated by dashboard) to avoid redundant network calls.
- Fetches stream data from `GET /api/v1/strava/activities/:id/streams` for chart data.
- Decodes `summary_polyline` using `@mapbox/polyline` to render an SVG trace view (no map tiles, no Google Maps dependency).
- Charts rendered with `react-native-chart-kit`.
- **No longer imports `RouteMap`** — uses SVG-only trace rendering. Removed: `viewMode` state, `mapRef`, `fitToCoordinates` useEffect, map/trace toggle.

## Known Gotchas
- Polyline decoding returns `[lat, lng]` pairs — verify coordinate order when passing to map libraries (some expect `[lng, lat]`).
- Stream data request is separate from activity detail; both must resolve before full UI renders.
- During route transitions, Expo Router may briefly set `id` to a non-numeric string (e.g. `"visuals"`) while resolving the segment. Always guard `fetchDetailedActivity` with `isNaN(Number(id))` before firing the API call.
- When navigating to the visuals screen, use `activityId` as the param name (not `id`) to avoid collision with the `[id]` dynamic segment: `router.push({ pathname: '/activity/visuals', params: { activityId: String(activity.id) } })`.

## Change Log
| Date & Time | Change Summary |
|---|---|
| 2026-03-19 00:00 | Initial documentation (file has uncommitted changes) |
| 2026-03-19 12:00 | Fixed: added `isNaN(Number(id))` guard in `fetchDetailedActivity` to prevent API calls when `id` is non-numeric (e.g. `"visuals"` during route transitions) |
| 2026-03-19 12:00 | Fixed: navigation to visuals screen now passes `activityId` param instead of `id` to avoid dynamic segment collision |
| 2026-03-19 18:00 | Removed: `RouteMap` import, map/trace toggle, `viewMode` state, `mapRef`, `fitToCoordinates` useEffect — now SVG trace only |
| 2026-03-19 18:00 | Changed: cache import path updated from `../cache` to `../../utils/cache` |
