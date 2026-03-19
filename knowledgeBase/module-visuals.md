---
title: Visuals Screen (Design Canvas)
type: module
tags: [module, frontend, screen, canvas, export]
created: 2026-03-19 00:00
updated: 2026-03-19 18:00
related: ["[[module-activity-detail]]", "[[module-route-map]]", "[[issue-2026-03-19-visuals-setup-wizard-not-shown]]", "[[INDEX]]"]
---

# Visuals Screen

**File path:** `Auratrace/app/activity/visuals.tsx`
**Language/Framework:** TypeScript / React Native / Expo Router
**Owned by / part of:** Frontend — shareable graphic creator

## Purpose
A drag-and-drop design canvas for creating shareable workout graphics. Users compose a visual from layered elements and export/share the result.

## Key Exports / Interfaces
- Default export: `Visuals` screen component

## Important Internals
- Canvas elements available: custom photo or transparent background, text overlays (title/stats), route map (trace or satellite), performance graphs (HR, pace, altitude, cadence).
- Composition guides: rule-of-thirds and golden-ratio grid overlays.
- Export: uses `react-native-view-shot` to capture the canvas as an image.
- Share: `expo-sharing` for system share sheet; `expo-media-library` to save to camera roll.
- Gestures (drag, resize) handled by `react-native-gesture-handler` + `react-native-reanimated`.
- Image picker for custom backgrounds via `expo-image-picker`.
- Color picker uses HSL area + hue bar + hex input (no eyedropper — removed in Part 2).

## Known Gotchas
- `react-native-view-shot` capture must happen after layout; async timing issues can cause blank exports.
- Reanimated 4.x + new arch: ensure worklets are correctly annotated with `'worklet'` directive.
- Streams endpoint returns 404 for many activities — always isolate the streams fetch in its own try-catch so failures don't block `setShowSetup(true)` or other critical setup.
- Reads from `GlobalActivityCache` first to avoid redundant API calls; falls back to API if cache is cold.

## Change Log
| Date & Time | Change Summary |
|---|---|
| 2026-03-19 00:00 | Initial documentation (file has uncommitted changes) |
| 2026-03-19 00:00 | Fixed: streams fetch isolated; setShowSetup moved before streams call; GlobalActivityCache read added |
| 2026-03-19 12:00 | Fixed: `useLocalSearchParams` now reads `activityId` (primary) with `id` as fallback, to match updated navigation param from `[id].tsx` |
| 2026-03-19 12:00 | Fixed: 404 on streams endpoint is now silently ignored (expected for manual/GPS-less activities); other errors are logged |
| 2026-03-19 18:00 | Removed: eyedropper/color-picker overlay (`pickingColor` state, crosshair, magnifier, `sampleColorWeb` function, `Droplets` icon import) |
| 2026-03-19 18:00 | Removed: `onTogglePicker` prop from `AdvancedColorPicker` component |
| 2026-03-19 18:00 | Added: debug `console.log` for params on mount |
