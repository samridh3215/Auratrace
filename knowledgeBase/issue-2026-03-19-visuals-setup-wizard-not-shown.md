---
title: Visuals screen setup wizard not shown when streams fetch fails
type: issue
tags: [issue, resolved, frontend, visuals, streams]
created: 2026-03-19 00:00
updated: 2026-03-19 12:00
related: ["[[module-visuals]]", "[[module-cache]]", "[[learning-streams-failure-handling]]", "[[INDEX]]"]
---

# Issue: Visuals Screen Setup Wizard Not Shown / Activity Fails to Load

**Status:** resolved
**Date encountered:** 2026-03-19
**Date resolved:** 2026-03-19

## What Went Wrong
After the map background bug fix (which added `RouteMap` conditional rendering to `visuals.tsx`), the visuals screen appeared to fail loading the Strava activity. The canvas rendered empty with no setup wizard.

## Root Cause
`setShowSetup(true)` was called **after** the streams API fetch inside a single try block:

```ts
const streamRes = await axios.get(...streams...); // throws for many activities
setStreamsData(streamRes.data);
if (elements.length === 0) {
    setShowSetup(true); // ← never reached if streams fetch throws
}
```

Many activities (manual entries, short walks) return 404 from the streams endpoint. This caused the catch block to run, skipping `setShowSetup(true)`. The activity data WAS loaded (`setActivity(act)` ran before the streams call), but the setup wizard never appeared, so the canvas was empty.

Additionally, `visuals.tsx` was making a redundant API call to fetch activity detail that `[id].tsx` had already fetched and stored in `GlobalActivityCache`.

## How It Was Fixed

1. **Read from `GlobalActivityCache` first** — avoids redundant API call and works when token is expired but cache is warm.
2. **Moved `setShowSetup(true)` before the streams fetch** — setup wizard now shows regardless of streams availability.
3. **Isolated streams fetch in its own try-catch** — streams failure is logged but does not affect the canvas setup.

```ts
// Use cached activity if available, otherwise fetch from API
let act = GlobalActivityCache[id];
if (!act) {
    const actRes = await axios.get(...);
    act = actRes.data;
}
setActivity(act);
// ... decode polyline ...

if (elements.length === 0) {
    setShowSetup(true); // ← now runs before streams
}

// Streams failure won't block canvas
try {
    const streamRes = await axios.get(...streams...);
    setStreamsData(streamRes.data);
} catch (streamErr) {
    console.error('Streams fetch failed:', streamErr);
}
```

## What To Watch For
- Any new API calls added inside `loadInitialData` should be isolated in their own try-catch if they're optional/non-critical.
- The pattern: critical setup actions (`setShowSetup`, `setActivity`) must not be blocked by optional data fetches.

## Additional Fix (2026-03-19 12:00)
During a second bug fix pass, the streams 404 handling was tightened further: a 404 response from the streams endpoint is now silently ignored entirely (no console error logged), since it is an expected condition for manual and GPS-less activities. All other error codes are still logged. This removes noise from error tracking for the common case.

Also related: `useLocalSearchParams` in `visuals.tsx` was updated to read `activityId` as the primary param (with `id` as fallback) to align with the navigation change made in `[id].tsx` on the same date — see [[issue-2026-03-19-id-fetches-on-visuals-route]].

## Spawned Learnings
- [[learning-streams-failure-handling]] — streams endpoint returns 404 for many activity types
