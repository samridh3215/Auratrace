---
title: Expo Platform-Specific File Resolution (.web.tsx)
type: learning
tags: [learning, expo, react-native, web, platform]
created: 2026-03-19 00:00
updated: 2026-03-19 00:00
related: ["[[module-route-map]]", "[[INDEX]]"]
---

# 💡 Expo Platform-Specific File Resolution (.web.tsx)

**TL;DR:** Expo automatically resolves `Component.web.tsx` over `Component.tsx` when bundling for web — use this to swap out native-only libraries.

## The Concept
Metro (and Expo's web bundler) checks for platform-specific suffixes before falling back to the generic file. Priority: `.web.tsx` > `.tsx` on web; `.native.tsx` > `.tsx` on native.

## Why It Matters Here
`react-native-maps` doesn't support web. `RouteMap.web.tsx` provides a web-safe fallback (e.g., a static image or leaflet-based map) without any conditional logic in the consuming components.

## Example
```
// Import in dashboard.tsx:
import RouteMap from './components/RouteMap';

// On native → resolves to: RouteMap.tsx      (react-native-maps)
// On web   → resolves to: RouteMap.web.tsx   (web fallback)
```

## Common Mistake
Adding web-specific code inside the `.tsx` file using `Platform.OS === 'web'` checks — this bloats the native bundle. Always use the file-suffix approach for library-level incompatibilities.
