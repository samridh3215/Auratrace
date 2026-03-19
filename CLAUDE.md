# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Auratrace** is a monorepo containing a React Native/Expo mobile+web app (`Auratrace/`) and an Express.js backend (`backend/`) that integrates with the Strava API to visualize and create shareable workout graphics.

---

## Commands

### Frontend (`Auratrace/`)

```bash
cd Auratrace
npx expo start          # Start dev server
npx expo run:android    # Run on Android
npx expo run:ios        # Run on iOS
npx expo start --web    # Run web version
npx expo lint           # Lint
```

### Backend (`backend/`)

```bash
cd backend
npm run dev    # Start with nodemon (watch mode)
npm start      # Start production server
```

---

## Architecture

### Frontend

- **Framework**: Expo + React Native 0.81, React 19 (new arch enabled, React compiler disabled)
- **Routing**: Expo Router (file-based). Root layout at `Auratrace/app/_layout.tsx` uses a Stack navigator.
- **State**: No Redux/MobX — React hooks + local state. `Auratrace/app/cache.ts` is a global object for passing activity data between screens without re-fetching.
- **Auth**: JWT stored via `expo-secure-store` on native, `localStorage` on web. Sent as `Authorization: Bearer <token>` header.
- **API base URL**: Configured in `Auratrace/.env` as `EXPO_PUBLIC_API_URL` → `https://auratrace.onrender.com/api/v1`.
- **Platform-specific files**: `RouteMap.tsx` (native) vs `RouteMap.web.tsx` (web fallback) — Expo resolves via `.web.tsx` suffix.

### Key Screens

| File | Purpose |
|------|---------|
| `app/index.tsx` | Login — initiates Strava OAuth via deep link |
| `app/dashboard.tsx` | Activity list filtered to Run/Walk/Ride |
| `app/activity/[id].tsx` | Activity detail: map, stats grid, HR/pace/altitude charts |
| `app/activity/visuals.tsx` | Drag-and-drop visual design canvas for shareable graphics |
| `app/components/RouteMap.tsx` | Reusable map component using `react-native-maps` |

### Backend

- **Framework**: Express.js 5
- **Structure**: `backend/src/server.js` (entry + env validation) → `app.js` (Express config) → `api/v1/index.js` (router) → `features/strava/` (routes → controller → service)
- **Auth flow**: Frontend hits `/strava/login?redirect_uri=<deep_link>` → Strava OAuth → backend exchanges code for Strava token → creates JWT (7-day expiry) → redirects to frontend with JWT in query params.
- **Activity filtering**: Only Run, Walk, Ride types are returned (enforced in `strava.service.js`).
- **Polyline decoding**: Strava GPS traces are encoded strings decoded via `@mapbox/polyline` on the frontend.

### Backend API Routes (`/api/v1/strava/`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/login` | Start Strava OAuth |
| GET | `/callback` | Strava OAuth callback, issues JWT |
| GET | `/activities` | List user activities (requires Bearer token) |
| GET | `/activities/:id` | Single activity detail |
| GET | `/activities/:id/streams` | Stream data (HR, pace, altitude, cadence) |
| GET | `/logout` | Logout |

### Backend Required Env Vars

```
STRAVA_CLIENT_ID
STRAVA_CLIENT_SECRET
STRAVA_REDIRECT_URI
JWT_SECRET
FRONTEND_URL
PORT (default: 8000)
```

### Design Tokens

Defined in `Auratrace/constants/theme.ts`. Core palette:
- Background: `#0A0A0E` (dark), `#12131A` / `#1C1C24` (cards)
- Primary Blue: `#2D60FF`
- Strava Orange: `#FC4C02`
- Accent Red: `#F2215A`
- Muted text: `#8A8D9F`
