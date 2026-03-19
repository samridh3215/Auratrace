---
title: No Redux/MobX — Plain Hooks + Global Cache
type: decision
tags: [decision, frontend, state, architecture]
created: 2026-03-19 00:00
updated: 2026-03-19 00:00
related: ["[[module-cache]]", "[[learning-activity-cache-pattern]]", "[[INDEX]]"]
---

# Decision: No Redux/MobX — Plain Hooks + Global Cache

**Date:** 2026-03-19 00:00
**Made by:** Original project authors

## Context
The app has a relatively simple data flow: login → fetch activities list → view single activity detail. A full state management library would add significant boilerplate for a small screen count.

## Options Considered
1. **Redux Toolkit** — powerful, devtools, boilerplate-heavy for small apps
2. **MobX** — reactive, less boilerplate, but adds a dependency and learning curve
3. **Plain React hooks + module-level cache** — minimal, no dependencies, sufficient for this app's scale

## Decision
Plain React hooks for local/screen state, plus `cache.ts` (module-level singleton) for cross-screen data passing. Chosen because the app's data flow is simple enough that a state library would be over-engineering.

## Trade-offs Accepted
- No global devtools for state inspection.
- Cache has no invalidation or persistence — edge cases (deep links, app restart) require manual fallback handling.
- Scaling to more screens/features may require revisiting this decision.

## Affected Modules
- [[module-cache]]
- [[module-dashboard]]
- [[module-activity-detail]]
