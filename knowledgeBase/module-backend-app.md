---
title: Backend Express App Configuration
type: module
tags: [module, backend, express, middleware]
created: 2026-03-19 00:00
updated: 2026-03-19 00:00
related: ["[[module-backend-server]]", "[[module-strava-routes]]", "[[INDEX]]"]
---

# Backend Express App Configuration

**File path:** `backend/src/app.js`
**Language/Framework:** JavaScript / Express.js 5
**Owned by / part of:** Backend

## Purpose
Configures the Express application: middleware setup, CORS, session management, and mounts the API router.

## Important Internals
- Middleware stack: `cors`, `express-session`, `body-parser`.
- CORS origin set to `FRONTEND_URL` env var.
- API v1 router mounted at `/api/v1` (from `api/v1/index.js`).
- API v2 router exists (`api/v2/index.js`) but is not actively used.
- Health check route at `GET /`.

## Change Log
| Date & Time | Change Summary |
|---|---|
| 2026-03-19 00:00 | Initial documentation |
