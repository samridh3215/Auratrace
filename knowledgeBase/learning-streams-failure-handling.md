---
title: Streams Endpoint Returns 404 for Many Activity Types
type: learning
tags: [learning, strava, streams, error-handling]
created: 2026-03-19 00:00
updated: 2026-03-19 00:00
related: ["[[issue-2026-03-19-visuals-setup-wizard-not-shown]]", "[[module-strava-service]]", "[[module-visuals]]", "[[module-activity-detail]]", "[[INDEX]]"]
---

# 💡 Streams Endpoint Returns 404 for Many Activity Types

**TL;DR:** `GET /api/v1/strava/activities/:id/streams` throws for many activities (manual entries, short walks, no-sensor activities). Treat it as optional data, never block critical UI on it.

## The Concept
Strava stream data (heart rate, pace, altitude, cadence) only exists when the activity was recorded with a compatible device. Manual activities or simple walks without a GPS watch return 404 from the streams endpoint.

## Why It Matters Here
Any code that awaits the streams fetch inside a shared try-catch block will skip all subsequent logic (like showing the setup wizard) when the streams request fails. This creates silent failures that look like the screen "broken" even though the activity data loaded fine.

## Example

```ts
// BAD — streams failure blocks setup wizard
try {
    const actRes = await fetchActivity(id);
    setActivity(actRes.data);
    const streamRes = await fetchStreams(id); // throws for manual activities
    setStreamsData(streamRes.data);
    setShowSetup(true); // ← never runs
} catch (err) { ... }

// GOOD — streams isolated, setup wizard always runs
try {
    const act = await fetchActivity(id);
    setActivity(act);
    setShowSetup(true); // ← runs regardless of streams
    try {
        const streamRes = await fetchStreams(id);
        setStreamsData(streamRes.data);
    } catch (streamErr) {
        console.error('Streams unavailable:', streamErr);
    }
} catch (err) { ... }
```

## Common Mistake
Awaiting streams in the same try block as the activity fetch, then doing critical UI setup after the streams call. Streams should always be treated as optional/best-effort data.
