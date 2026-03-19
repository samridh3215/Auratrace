---
title: "Issue: Visuals Screen Not Mounting"
type: issue
tags: [issue, resolved, 2026-03-19, expo-router, navigation, layout]
created: 2026-03-19 18:00
updated: 2026-03-19 18:00
related: ["[[module-app-layout]]", "[[module-visuals]]", "[[learning-expo-router-nested-layouts]]", "[[session-2026-03-19]]", "[[INDEX]]"]
---

# Issue: Visuals Screen Not Mounting

**Status:** Resolved
**Date:** 2026-03-19

## Problem
The visuals screen showed "Loading..." forever. The `console.log` for params never fired, meaning the component wasn't mounting at all.

## Cause
The `app/activity/` directory contained multiple route files (`[id].tsx` and `visuals.tsx`) but had no `_layout.tsx`. Without a layout file, Expo Router couldn't resolve `visuals` as a sibling route to `[id]` within the `activity` group.

Additionally, the root `_layout.tsx` didn't register the `activity` directory as a `<Stack.Screen>`.

## Resolution
1. Created `app/activity/_layout.tsx` with a Stack navigator that declares screens for `[id]` and `visuals`
2. Registered the `activity` route group in root `_layout.tsx` as `<Stack.Screen name="activity">`

## See Also
- [[learning-expo-router-nested-layouts]] — general pattern for nested layouts
