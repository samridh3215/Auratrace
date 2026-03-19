---
title: Root App Layout (_layout.tsx)
type: module
tags: [module, frontend, expo-router, navigation]
created: 2026-03-19 00:00
updated: 2026-03-19 18:00
related: ["[[module-dashboard]]", "[[module-activity-detail]]", "[[learning-auth-flow]]", "[[learning-expo-router-nested-layouts]]", "[[issue-2026-03-19-visuals-screen-not-mounting]]", "[[INDEX]]"]
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
- The `(tabs)/` group has been **deleted** (was unused Expo template scaffolding).
- The `activity` route group is registered as `<Stack.Screen name="activity">` — it delegates to `app/activity/_layout.tsx` which defines its own Stack navigator for `[id]` and `visuals`.

## Known Gotchas
- React Compiler is **disabled** in this project (`app.json`). Do not rely on automatic memoization.
- New Architecture is **enabled** — bridgeless mode, use only new-arch-compatible libraries.

## Change Log
| Date & Time | Change Summary |
|---|---|
| 2026-03-19 00:00 | Initial documentation |
| 2026-03-19 18:00 | Deleted: `(tabs)/` route group (unused Expo template) |
| 2026-03-19 18:00 | Added: `activity` route group registered as `<Stack.Screen name="activity">` |
| 2026-03-19 18:00 | Created: `app/activity/_layout.tsx` — nested Stack layout for `[id]` and `visuals` screens |
