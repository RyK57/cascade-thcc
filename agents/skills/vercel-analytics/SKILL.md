---
name: vercel-analytics
description: Vercel Analytics and Speed Insights setup.
---

# Vercel Analytics

- Already wired in `app/layout.tsx` via `@vercel/analytics/next` and `@vercel/speed-insights/next`
- Works automatically on Vercel deploy — no extra client code for basic usage
- For custom events, use `import { track } from '@vercel/analytics'`
