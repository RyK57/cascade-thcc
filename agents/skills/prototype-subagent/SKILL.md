---
name: prototype-subagent
description: Legacy template spin-up skill. For this repo, prefer imessage-agent — the product is already defined (Linq + Terac + Dynamic expert hiring over iMessage).
---

# Prototype Subagent (legacy)

This repo is no longer a blank prototype-template.

**Use instead:** `agents/skills/imessage-agent/SKILL.md`

## Product (already decided)

iMessage agent via **Linq** → source experts via **Terac** → coordinate payments via **Dynamic**.

## If branding is still open

Ask only what's missing:

1. Final product name + tagline? → `lib/constants/branding.ts` + `--brand-accent`
2. Logo? → `public/logo.png`
3. Theme default (light / dark / system)?

Do **not** re-ask "what does the product do?" — see `agents/rules/product.mdc`.

## Implementation order

Follow `imessage-agent` skill:

1. Schemas → migrations → `db/`
2. `libs/agent` + linq/terac/dynamic helpers
3. Webhook + API routes
4. Operator UI on `/main`
5. Tests + `pnpm build`
