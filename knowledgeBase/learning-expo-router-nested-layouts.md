---
title: "Learning: Expo Router Nested Layouts"
type: learning
tags: [learning, expo-router, navigation, layout]
created: 2026-03-19 18:00
updated: 2026-03-19 18:00
related: ["[[module-app-layout]]", "[[issue-2026-03-19-visuals-screen-not-mounting]]", "[[INDEX]]"]
---

# Expo Router Nested Layouts

Directories under `app/` that contain multiple route files **must** have their own `_layout.tsx` to work correctly.

## The Rule
- If `app/foo/` has `bar.tsx` and `baz.tsx`, then `app/foo/_layout.tsx` must exist and declare a navigator (Stack, Tabs, etc.) for those routes.
- Without it, sibling routes inside the directory cannot navigate to each other.
- The **parent** layout (e.g., root `_layout.tsx`) must also register the directory as a `<Stack.Screen name="foo">`.

## Symptoms When Missing
- Navigation to sibling routes shows blank screen or "Loading..." forever
- Component never mounts (no lifecycle logs fire)
- No explicit error — just silent failure

## Example
```
app/
  _layout.tsx          ← must have <Stack.Screen name="activity">
  activity/
    _layout.tsx        ← must exist with its own <Stack>
    [id].tsx
    visuals.tsx
```
