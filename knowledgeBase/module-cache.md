---
title: Activity Cache (cache.ts)
type: module
tags: [module, frontend, state, cache]
created: 2026-03-19 00:00
updated: 2026-03-19 18:00
related: ["[[module-dashboard]]", "[[module-activity-detail]]", "[[decision-2026-03-19-no-state-management-lib]]", "[[learning-activity-cache-pattern]]", "[[issue-2026-03-19-cache-treated-as-route]]", "[[INDEX]]"]
---

# Activity Cache

**File path:** `Auratrace/utils/cache.ts` *(moved from `app/cache.ts` — see [[issue-2026-03-19-cache-treated-as-route]])*
**Language/Framework:** TypeScript
**Owned by / part of:** Frontend — cross-screen data layer

## Purpose
A simple global in-memory object that holds activity data fetched by the dashboard so that the activity detail screen can access it without making a redundant network request.

## Key Exports / Interfaces
- Exported cache object (likely a plain JS object or Map keyed by activity ID)

## Important Internals
- Not persisted — lives only for the duration of the app session.
- Dashboard writes to it after fetching activities; `[id].tsx` reads from it.
- Avoids passing large data payloads through Expo Router navigation params (which are serialized to strings).

## Known Gotchas
- Cache is lost on app reload/restart. If a user deep-links directly to an activity detail, the cache will be empty and the screen must fall back to fetching.
- No invalidation strategy — stale data persists until app is restarted.

## Change Log
| Date & Time | Change Summary |
|---|---|
| 2026-03-19 00:00 | Initial documentation |
| 2026-03-19 18:00 | Moved: `app/cache.ts` → `utils/cache.ts` (Expo Router treated it as a route, warned about missing default export) |
| 2026-03-19 18:00 | Import paths updated in `dashboard.tsx` (`../utils/cache`) and `[id].tsx` (`../../utils/cache`) |
