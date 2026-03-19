---
title: Frontend API URL via EXPO_PUBLIC_API_URL
type: tip
tags: [tip, expo, env, configuration]
created: 2026-03-19 00:00
updated: 2026-03-19 00:00
related: ["[[module-dashboard]]", "[[INDEX]]"]
---

# 🔧 Frontend API URL via EXPO_PUBLIC_API_URL

**Context:** When configuring or changing the backend API endpoint for the frontend.

## The Tip
The backend base URL is read from the `EXPO_PUBLIC_API_URL` environment variable in `Auratrace/.env`. Current value: `https://auratrace.onrender.com/api/v1`.

## Why
Expo only exposes env vars prefixed with `EXPO_PUBLIC_` to client-side code (for security). Variables without this prefix are not accessible in the app bundle.

## Example
```
# Auratrace/.env
EXPO_PUBLIC_API_URL=https://auratrace.onrender.com/api/v1

# Usage in code:
const BASE_URL = process.env.EXPO_PUBLIC_API_URL;
```
