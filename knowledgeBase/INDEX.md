---
title: Knowledge Base Index
type: index
tags: [index]
created: 2026-03-19 00:00
updated: 2026-03-19 00:00
---

# 🗂️ Project Knowledge Base

> Auto-maintained by Claude. Last updated: 2026-03-19 00:00

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
*(none yet)*

## Learnings
- [[learning-platform-specific-files]] — How Expo resolves .web.tsx vs .tsx variants
- [[learning-activity-cache-pattern]] — Why a global cache object is used instead of navigation params
- [[learning-strava-polyline-decoding]] — Strava GPS traces are encoded strings decoded on the frontend
- [[learning-auth-flow]] — Full Strava OAuth → JWT flow across frontend and backend

## Decisions
- [[decision-2026-03-19-no-state-management-lib]] — No Redux/MobX; plain React hooks + global cache

## Tips
- [[tip-env-vars-frontend]] — Frontend API URL configured via EXPO_PUBLIC_API_URL

## Sessions
- [[session-2026-03-19]] — Initial codebase exploration and CLAUDE.md creation
