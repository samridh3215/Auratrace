---
title: Backend Server Entry Point
type: module
tags: [module, backend, express, entry-point]
created: 2026-03-19 00:00
updated: 2026-03-19 00:00
related: ["[[module-backend-app]]", "[[INDEX]]"]
---

# Backend Server Entry Point

**File path:** `backend/src/server.js`
**Language/Framework:** JavaScript / Node.js
**Owned by / part of:** Backend

## Purpose
Application entry point. Validates required environment variables on startup and starts the HTTP server.

## Important Internals
- Required env vars validated at boot: `STRAVA_CLIENT_ID`, `STRAVA_CLIENT_SECRET`, `STRAVA_REDIRECT_URI`, `JWT_SECRET`, `FRONTEND_URL`.
- `PORT` defaults to `8000`.
- Imports and starts the Express app from `app.js`.
- Deployed to Render: `https://auratrace.onrender.com`.

## Change Log
| Date & Time | Change Summary |
|---|---|
| 2026-03-19 00:00 | Initial documentation |
