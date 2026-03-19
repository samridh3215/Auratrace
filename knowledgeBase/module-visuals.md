---
title: Visuals Screen (Design Canvas)
type: module
tags: [module, frontend, screen, canvas, export]
created: 2026-03-19 00:00
updated: 2026-03-19 00:00
related: ["[[module-activity-detail]]", "[[module-route-map]]", "[[INDEX]]"]
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
- Has uncommitted changes as of 2026-03-19 (active development).

## Known Gotchas
- `react-native-view-shot` capture must happen after layout; async timing issues can cause blank exports.
- Reanimated 4.x + new arch: ensure worklets are correctly annotated with `'worklet'` directive.

## Change Log
| Date & Time | Change Summary |
|---|---|
| 2026-03-19 00:00 | Initial documentation (file has uncommitted changes) |
