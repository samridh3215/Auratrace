---
title: "Issue: Worklets Version Mismatch"
type: issue
tags: [issue, resolved, 2026-03-19, reanimated, worklets, native]
created: 2026-03-19 18:00
updated: 2026-03-19 18:00
related: ["[[module-visuals]]", "[[session-2026-03-19]]", "[[INDEX]]"]
---

# Issue: Worklets Version Mismatch

**Status:** Resolved (package.json fixed; APK rebuild needed)
**Date:** 2026-03-19

## Problem
Reanimated 4.1.6 requires `react-native-worklets@0.7.4` JS, but the APK had worklets 0.5.1 native binary baked in. This caused runtime failures in screens using reanimated (visuals canvas gestures).

## Cause
`react-native-worklets` was accidentally removed from `package.json` during a prior dependency change. The JS bundle couldn't find the expected worklets version, and the native binary was outdated.

## Cascade Effects
- Files importing reanimated triggered "missing default export" warnings
- Gesture handling in visuals screen was broken

## Resolution
Restored `react-native-worklets@0.7.4` to `package.json`. A full APK rebuild (`npx expo run:android`) is needed to pick up the correct native binary — JS-only hot reload is not sufficient for native module version changes.
