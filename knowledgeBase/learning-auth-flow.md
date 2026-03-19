---
title: Strava OAuth → JWT Auth Flow
type: learning
tags: [learning, auth, oauth, jwt, strava]
created: 2026-03-19 00:00
updated: 2026-03-19 00:00
related: ["[[module-strava-controller]]", "[[module-strava-service]]", "[[module-dashboard]]", "[[INDEX]]"]
---

# 💡 Strava OAuth → JWT Auth Flow

**TL;DR:** Frontend triggers Strava OAuth via backend; backend issues a 7-day JWT containing the Strava access token; frontend stores and reuses the JWT as Bearer token.

## The Concept
The app uses Strava as its identity provider. The backend acts as the OAuth intermediary, then issues its own JWT so the frontend doesn't need to know about Strava token mechanics.

## Why It Matters Here
Understanding this flow is essential for debugging auth issues or extending the API.

## Example
```
1. Frontend: GET /api/v1/strava/login?redirect_uri=auratrace://callback
2. Backend: 302 → https://www.strava.com/oauth/authorize?...
3. User approves on Strava
4. Strava: 302 → /api/v1/strava/callback?code=XXXX
5. Backend: exchanges code → Strava access token
6. Backend: sign JWT { stravaToken: "...", exp: +7days }
7. Backend: 302 → FRONTEND_URL?token=<JWT>
8. Frontend: stores JWT in SecureStore (native) / localStorage (web)
9. Frontend: all subsequent requests → Authorization: Bearer <JWT>
10. Backend: verifies JWT, extracts embedded Strava token, forwards to Strava API
```

## Common Mistake
The Strava access token inside the JWT expires in **6 hours**, but the JWT itself is valid for **7 days**. After 6h, JWT verification passes but Strava API calls will return 401. No token refresh is currently implemented.
