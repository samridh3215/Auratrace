---
title: Root App Layout (_layout.tsx)
type: module
tags: [module, frontend, expo-router, navigation]
created: 2026-03-19 00:00
updated: 2026-03-19 00:00
related: ["[[module-dashboard]]", "[[module-activity-detail]]", "[[learning-auth-flow]]", "[[INDEX]]"]
---

# Root App Layout

**File path:** `Auratrace/app/_layout.tsx`
**Language/Framework:** TypeScript / Expo Router
**Owned by / part of:** Frontend navigation shell

## Purpose
Root Stack navigator for the entire app. Controls which screens are available and handles the top-level navigation structure. Serves as the auth gate — unauthenticated users land on `index.tsx` (login), authenticated users proceed to `dashboard.tsx`.

## Key Exports / Interfaces
- Default export: `RootLayout` component wrapping `<Stack>`

## Important Internals
- Uses Expo Router's file-based routing; every file under `app/` becomes a route automatically.
- Stack screens declared here determine header visibility/styling for each route.
- The `(tabs)/` group exists in the file system but is not used in the main navigation flow.

## Known Gotchas
- React Compiler is **disabled** in this project (`app.json`). Do not rely on automatic memoization.
- New Architecture is **enabled** — bridgeless mode, use only new-arch-compatible libraries.

## Change Log
| Date & Time | Change Summary |
|---|---|
| 2026-03-19 00:00 | Initial documentation |
