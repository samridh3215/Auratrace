---
title: RouteMap Component
type: module
tags: [module, frontend, component, maps]
created: 2026-03-19 00:00
updated: 2026-03-19 18:00
related: ["[[module-activity-detail]]", "[[module-visuals]]", "[[learning-platform-specific-files]]", "[[learning-strava-polyline-decoding]]", "[[INDEX]]"]
---

# RouteMap Component

**File path:** `Auratrace/app/components/RouteMap.tsx` (native) / `RouteMap.web.tsx` (web)
**Language/Framework:** TypeScript / React Native Maps
**Owned by / part of:** Frontend — shared map renderer

## Purpose
Reusable component that renders a GPS route on a map. Used by both the activity detail screen and the visuals canvas.

## Key Exports / Interfaces
- Default export: `RouteMap` component
- Props: likely accepts decoded coordinate array and display mode (trace / satellite)

## Important Internals
- Native implementation uses `react-native-maps` with **OpenStreetMap tiles** (`PROVIDER_DEFAULT` + `mapType="none"` + `UrlTile` pointing to OSM). No Google Maps API key required.
- Web implementation (`RouteMap.web.tsx`) is a fallback — `react-native-maps` doesn't support web. Expo resolves platform variants automatically via `.web.tsx` suffix.
- Coordinates come from decoded `summary_polyline` (via `@mapbox/polyline`) — passed in by the parent screen.
- **Not currently imported** by `[id].tsx` (which uses SVG-only trace view), but the component still exists for potential future use (e.g., visuals canvas map element).

## Known Gotchas
- `react-native-maps` requires native build — won't work in Expo Go. Must use development build.
- Platform file resolution: Expo checks `.web.tsx` before `.tsx` on web targets. Don't add web-specific logic to the `.tsx` file.
- Google Maps is **not used** — the component uses `PROVIDER_DEFAULT` (Apple Maps on iOS, OSM tiles on Android via `UrlTile`). No API key needed.

## Change Log
| Date & Time | Change Summary |
|---|---|
| 2026-03-19 00:00 | Initial documentation (file has uncommitted changes) |
| 2026-03-19 18:00 | Switched from Google Maps to OpenStreetMap tiles via `UrlTile` (`PROVIDER_DEFAULT` + `mapType="none"`) |
| 2026-03-19 18:00 | Note: not currently imported by `[id].tsx` — SVG trace is used instead; component retained for future use |
