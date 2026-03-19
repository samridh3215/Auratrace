---
title: Strava Polyline Decoding
type: learning
tags: [learning, strava, maps, polyline]
created: 2026-03-19 00:00
updated: 2026-03-19 00:00
related: ["[[module-activity-detail]]", "[[module-route-map]]", "[[INDEX]]"]
---

# 💡 Strava Polyline Decoding

**TL;DR:** Strava stores GPS routes as encoded polyline strings (`summary_polyline`). Decode them with `@mapbox/polyline` to get `[lat, lng]` coordinate arrays.

## The Concept
Google's Encoded Polyline Algorithm compresses a sequence of lat/lng pairs into a compact ASCII string. Strava uses this format in the `map.summary_polyline` field of activity responses.

## Why It Matters Here
The `RouteMap` component needs an array of coordinates. The raw API response contains an encoded string that must be decoded first.

## Example
```ts
import Polyline from '@mapbox/polyline';

const coordinates = Polyline.decode(activity.map.summary_polyline);
// Returns: [[lat, lng], [lat, lng], ...]

// For react-native-maps Polyline component:
const coords = coordinates.map(([lat, lng]) => ({ latitude: lat, longitude: lng }));
```

## Common Mistake
`@mapbox/polyline` returns `[lat, lng]` pairs. Some mapping libraries (e.g., Mapbox GL, Leaflet) expect `[lng, lat]` (GeoJSON order). Always check the expected coordinate order for the specific map library being used.
