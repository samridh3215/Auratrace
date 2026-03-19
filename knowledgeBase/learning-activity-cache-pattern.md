---
title: Global Activity Cache Pattern
type: learning
tags: [learning, state, navigation, react-native]
created: 2026-03-19 00:00
updated: 2026-03-19 00:00
related: ["[[module-cache]]", "[[module-dashboard]]", "[[module-activity-detail]]", "[[decision-2026-03-19-no-state-management-lib]]", "[[INDEX]]"]
---

# 💡 Global Activity Cache Pattern

**TL;DR:** A plain JS module-level object (`cache.ts`) is used to pass activity data between screens instead of navigation params or a state library.

## The Concept
Expo Router serializes navigation params to strings (URL query params). Passing complex activity objects this way is fragile and lossy. A module-level singleton object persists in memory for the app's lifetime and can be read/written from any screen.

## Why It Matters Here
Dashboard writes fetched activities into `cache`, then navigates to `activity/[id]`. The detail screen reads from `cache` by ID instead of fetching again or receiving params.

## Example
```ts
// cache.ts
export const activityCache: Record<string, Activity> = {};

// dashboard.tsx
import { activityCache } from '../cache';
activityCache[activity.id] = activity;
router.push(`/activity/${activity.id}`);

// activity/[id].tsx
import { activityCache } from '../cache';
const { id } = useLocalSearchParams();
const activity = activityCache[id];
```

## Common Mistake
Assuming the cache is populated when navigating directly to an activity URL (e.g., push notification deep link). Always implement a fetch fallback in the detail screen for when the cache is empty.
