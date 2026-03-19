---
title: "Decision: Remove Google Maps, Use SVG Trace"
type: decision
tags: [decision, 2026-03-19, maps, architecture]
created: 2026-03-19 18:00
updated: 2026-03-19 18:00
related: ["[[module-activity-detail]]", "[[module-route-map]]", "[[issue-2026-03-19-google-maps-api-key-crash]]", "[[session-2026-03-19]]", "[[INDEX]]"]
---

# Decision: Remove Google Maps, Use SVG Trace View

**Date:** 2026-03-19
**Status:** Accepted

## Decision
Use SVG trace view (rendered from decoded polyline coordinates) instead of Google Maps for route display in the activity detail screen.

## Context
- `react-native-maps` defaults to Google Maps on Android
- Google Maps native SDK crashes at initialization if no API key is configured
- The crash is at the native level — JS cannot catch or handle it
- No Google Maps API key is currently provisioned for this project

## Trade-offs
| Gained | Lost |
|---|---|
| Zero-config reliability (no API key needed) | Interactive map (zoom/pan on real map tiles) |
| No Google Maps billing risk | Satellite/terrain view options |
| Simpler dependency tree | Familiar map UX |

## Alternatives Considered
- **Get a Google Maps API key**: adds billing complexity, key management, and potential costs
- **MapLibre/Mapbox**: would require another native dependency and API key
- **OpenStreetMap via RouteMap.tsx**: implemented as backup in the component, but `[id].tsx` uses SVG trace for maximum simplicity

## Future
`RouteMap.tsx` still exists with OSM tiles and can be re-imported if an interactive map is needed later (e.g., in the visuals canvas).
