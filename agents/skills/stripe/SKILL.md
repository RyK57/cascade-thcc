---
name: stripe
description: Stripe payments integration patterns.
---

# Stripe

- Server client: `libs/payments/stripe-client.ts` via `getStripeClient()`
- Webhooks: `app/api/stripe/webhook/route.ts` (create when needed)
- Never expose secret key client-side
- Use `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` only in client checkout flows
- Validate webhook signatures with `STRIPE_WEBHOOK_SECRET`
