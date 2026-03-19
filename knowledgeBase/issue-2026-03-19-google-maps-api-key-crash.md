---
title: "Issue: Google Maps API Key Crash"
type: issue
tags: [issue, resolved, 2026-03-19, maps, android, crash]
created: 2026-03-19 18:00
updated: 2026-03-19 18:00
related: ["[[module-activity-detail]]", "[[module-route-map]]", "[[decision-2026-03-19-remove-google-maps]]", "[[session-2026-03-19]]", "[[INDEX]]"]
---

# Issue: Google Maps API Key Crash

**Status:** Resolved
**Date:** 2026-03-19

## Problem
`react-native-maps` defaults to Google Maps on Android, which crashes at native SDK initialization if no Google Maps API key is configured. The crash happens before any JS code can intervene (e.g., catch the error or fall back).

## Resolution
Two-pronged fix:
1. **`[id].tsx`**: Removed `RouteMap` import entirely. Activity detail now uses SVG-only trace view rendered from decoded polyline coordinates. No map tiles, no API key needed.
2. **`RouteMap.tsx`**: Switched to OpenStreetMap tiles via `PROVIDER_DEFAULT` + `mapType="none"` + `UrlTile` as a backup for any future use of the component.

## See Also
- [[decision-2026-03-19-remove-google-maps]] — rationale for the trade-off
