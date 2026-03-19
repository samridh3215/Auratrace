---
title: "Issue: cache.ts Treated as Route"
type: issue
tags: [issue, resolved, 2026-03-19, expo-router, file-structure]
created: 2026-03-19 18:00
updated: 2026-03-19 18:00
related: ["[[module-cache]]", "[[session-2026-03-19]]", "[[INDEX]]"]
---

# Issue: cache.ts Treated as Route

**Status:** Resolved
**Date:** 2026-03-19

## Problem
`Auratrace/app/cache.ts` was located inside the `app/` directory, which Expo Router scans for route files. Since `cache.ts` has no default export (it only exports a named cache object), Expo Router logged a "missing default export" warning and attempted to register it as a route.

## Resolution
Moved the file to `Auratrace/utils/cache.ts` — outside the `app/` directory so Expo Router ignores it. Updated import paths in:
- `dashboard.tsx` → `../utils/cache`
- `[id].tsx` → `../../utils/cache`
