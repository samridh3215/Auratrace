---
title: RouteMap Component
type: module
tags: [module, frontend, component, maps]
created: 2026-03-19 00:00
updated: 2026-03-19 00:00
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
- Native implementation uses `react-native-maps` (`MapView` + `Polyline`).
- Web implementation (`RouteMap.web.tsx`) is a fallback — `react-native-maps` doesn't support web. Expo resolves platform variants automatically via `.web.tsx` suffix.
- Coordinates come from decoded `summary_polyline` (via `@mapbox/polyline`) — passed in by the parent screen.
- Has uncommitted changes as of 2026-03-19 (active development).

## Known Gotchas
- `react-native-maps` requires native build — won't work in Expo Go. Must use development build.
- Platform file resolution: Expo checks `.web.tsx` before `.tsx` on web targets. Don't add web-specific logic to the `.tsx` file.

## Change Log
| Date & Time | Change Summary |
|---|---|
| 2026-03-19 00:00 | Initial documentation (file has uncommitted changes) |
