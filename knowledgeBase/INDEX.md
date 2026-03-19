---
title: Knowledge Base Index
type: index
tags: [index]
created: 2026-03-19 00:00
updated: 2026-03-19 18:00
---

# Project Knowledge Base

> Auto-maintained by Claude. Last updated: 2026-03-19 18:00

## Modules
- [[module-app-layout]] — Root Expo Router stack layout and auth gate
- [[module-dashboard]] — Activity list screen with filtering
- [[module-activity-detail]] — Activity detail: map, stats, HR/pace charts
- [[module-visuals]] — Drag-and-drop visual design canvas for shareable graphics
- [[module-route-map]] — Reusable react-native-maps component with web fallback
- [[module-cache]] — Global in-memory activity cache (cross-screen data passing)
- [[module-backend-server]] — Express entry point and env validation
- [[module-backend-app]] — Express app configuration and middleware
- [[module-strava-routes]] — API route definitions for Strava endpoints
- [[module-strava-controller]] — Request handlers for Strava API
- [[module-strava-service]] — Strava API integration logic and activity filtering

## Recent Issues
- [[issue-2026-03-19-visuals-setup-wizard-not-shown]] — Streams fetch failure blocked setup wizard in visuals screen (resolved)
- [[issue-2026-03-19-id-fetches-on-visuals-route]] — [id].tsx fired API fetch with id="visuals" during route transitions (resolved)
- [[issue-2026-03-19-worklets-version-mismatch]] — Reanimated needed worklets 0.7.4 but dependency was missing from package.json (resolved)
- [[issue-2026-03-19-google-maps-api-key-crash]] — react-native-maps crashes on Android without Google Maps API key (resolved)
- [[issue-2026-03-19-cache-treated-as-route]] — app/cache.ts treated as route by Expo Router; moved to utils/ (resolved)
- [[issue-2026-03-19-visuals-screen-not-mounting]] — Visuals screen wouldn't mount without activity/_layout.tsx (resolved)

## Learnings
- [[learning-streams-failure-handling]] — Streams endpoint 404s for many activities; always isolate it
- [[learning-platform-specific-files]] — How Expo resolves .web.tsx vs .tsx variants
- [[learning-activity-cache-pattern]] — Why a global cache object is used instead of navigation params
- [[learning-strava-polyline-decoding]] — Strava GPS traces are encoded strings decoded on the frontend
- [[learning-auth-flow]] — Full Strava OAuth → JWT flow across frontend and backend
- [[learning-expo-router-nested-layouts]] — Directories under app/ with multiple routes need their own _layout.tsx

## Decisions
- [[decision-2026-03-19-no-state-management-lib]] — No Redux/MobX; plain React hooks + global cache
- [[decision-2026-03-19-remove-google-maps]] — SVG trace view instead of Google Maps for zero-config reliability

## Tips
- [[tip-env-vars-frontend]] — Frontend API URL configured via EXPO_PUBLIC_API_URL

## Sessions
- [[session-2026-03-19]] — Initial codebase exploration + Part 2: cleanup, layout fixes, Google Maps removal
