---
title: Strava Routes
type: module
tags: [module, backend, strava, routing]
created: 2026-03-19 00:00
updated: 2026-03-19 00:00
related: ["[[module-strava-controller]]", "[[module-backend-app]]", "[[INDEX]]"]
---

# Strava Routes

**File path:** `backend/src/features/strava/strava.routes.js`
**Language/Framework:** JavaScript / Express.js
**Owned by / part of:** Backend — API route definitions

## Purpose
Defines all Express routes for the Strava feature and wires them to controller handlers. Mounted at `/api/v1/strava/`.

## Key Exports / Interfaces
- Express Router with these routes:

| Method | Path | Handler |
|--------|------|---------|
| GET | `/login` | `login` |
| GET | `/callback` | `callback` |
| GET | `/activities` | `getActivities` |
| GET | `/activities/:id` | `getActivityById` |
| GET | `/activities/:id/streams` | `getActivityStreams` |
| GET | `/logout` | `logout` |

## Change Log
| Date & Time | Change Summary |
|---|---|
| 2026-03-19 00:00 | Initial documentation |
