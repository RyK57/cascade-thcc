---
name: stripe
description: Stripe scaffold only — Dynamic is the primary payment rail for this product. Use only if the user explicitly asks for Stripe.
---

# Stripe Skill (secondary)

**Dynamic is the primary payment system** for this product (`agents/skills/dynamic-payments/SKILL.md`).

Stripe remains in the template scaffold (`libs/payments/`) but should not be wired into the iMessage hiring loop unless the user explicitly requests it.

If asked to use Stripe:

1. Confirm they want Stripe **in addition to** or **instead of** Dynamic
2. Keep secrets server-side (`STRIPE_*`)
3. Still mirror payment outcomes back to the Linq job thread
