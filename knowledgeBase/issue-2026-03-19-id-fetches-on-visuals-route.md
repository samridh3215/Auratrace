---
title: "[id].tsx fires fetchDetailedActivity with id=\"visuals\" during route transition"
type: issue
tags: [issue, resolved, frontend, routing, expo-router]
created: 2026-03-19 12:00
updated: 2026-03-19 12:00
related: ["[[module-activity-detail]]", "[[module-visuals]]", "[[INDEX]]"]
---

# Issue: [id].tsx Fires fetchDetailedActivity with id="visuals" During Route Transitions

**Status:** resolved
**Date encountered:** 2026-03-19
**Date resolved:** 2026-03-19

## What Went Wrong

When navigating from the activity detail screen (`/activity/[id]`) to the visuals screen (`/activity/visuals`), Expo Router briefly resolves the route segment `[id]` to the literal string `"visuals"` before the new screen fully mounts. During this transitional state, `[id].tsx` was executing `fetchDetailedActivity` with `id = "visuals"`, firing an API call to `GET /api/v1/strava/activities/visuals` — a request that is guaranteed to 404.

Additionally, the navigation code was passing the activity ID to visuals using `id` as the param name, which conflicted with the `[id]` dynamic segment, causing Expo Router to potentially misroute or override the value.

## Root Cause

Two compounding problems:

1. **No non-numeric guard on `fetchDetailedActivity`**: The function ran whenever `id` changed, with no check that `id` was a valid numeric string before making the API call.

2. **Wrong param name for visuals navigation**: The push call used `params: { id: String(activity.id) }`, which collides with the `[id]` dynamic route segment. Expo Router interprets `id` as the segment value, so the visuals route was receiving the activity's numeric ID in `id` instead of a route-specific param.

## How It Was Fixed

**Guard added in `fetchDetailedActivity`:**
```ts
if (isNaN(Number(id))) return; // e.g. "visuals" during route transition
```

**Navigation param renamed to `activityId`:**
```ts
router.push({
  pathname: '/activity/visuals',
  params: { activityId: String(activity.id) },
});
```

**`visuals.tsx` updated to read the new param name:**
```ts
const { activityId, id } = useLocalSearchParams<{ activityId?: string; id?: string }>();
const resolvedId = activityId ?? id; // activityId is primary, id is fallback
```

## What To Watch For

- Any screen inside a dynamic route (`[id].tsx`) that makes API calls in a `useEffect` keyed on the route param should guard against non-numeric/unexpected param values during transitions.
- When navigating to a named route that lives alongside a dynamic route (e.g. `visuals` next to `[id]`), use a param name that does not shadow the dynamic segment (`activityId`, not `id`).

## Related Issues
- [[issue-2026-03-19-visuals-setup-wizard-not-shown]] — separate but related visuals loading bug resolved on the same date
