# Agent Guide

**Product:** iMessage agent (Linq) that finds verified experts (Terac) and coordinates payments (Dynamic).

Read before implementing:

1. `agents/rules/product.mdc` — product loop + channel constraints
2. `agents/rules/architecture.mdc` — layering + domain folders
3. `agents/rules/styling.mdc` — UI conventions
4. `.cursor/rules/*` — same rules mirrored for Cursor

**Primary skill:** `agents/skills/imessage-agent/SKILL.md`

## Stack

Next.js App Router · pnpm · shadcn/ui · Supabase · Vitest  
Integrations: **Linq** · **Terac** · **Dynamic**

## Key paths

| Area | Path |
|------|------|
| Product rules | `agents/rules/product.mdc` |
| Linq | `libs/linq/`, `app/api/linq/`, `agents/skills/linq/` |
| Terac | `libs/terac/`, `app/api/terac/`, `agents/skills/terac/` |
| Dynamic | `libs/dynamic/`, `components/dynamic/`, `agents/skills/dynamic-payments/` |
| Agent logic | `libs/agent/` (create as features land) |
| Routes | `lib/constants/routes.ts` |
| Branding | `lib/constants/branding.ts` |
| Lander | `components/lander/*` |
| App / operator UI | `components/app/*`, `app/main/*` |
| Internal tooling | `app/internal/*` |

## Skills map

| Skill | Use when |
|-------|----------|
| `imessage-agent` | Any end-to-end hiring conversation feature |
| `linq` | Messaging, webhooks, CLI, conversational channel rules |
| `terac` | Expert opportunities, drafts vs launch, submissions |
| `dynamic-payments` | Wallets, payouts, payment state |
| `supabase` | Auth, migrations, CRUD |
| `implementation-auditor` | After features/migrations/backend work |
| `zod-schemas` / `vitest` / `shadcn-ui` | As needed |

## Hard product rules (short)

- Conversational iMessage only — no blast/cold outreach
- Terac drafts are free; **launch only on explicit confirm**
- Dynamic is the payment rail (not Stripe-first)
- Secrets server-side only

## Subagents

```
Use the implementation-auditor subagent to review my latest changes
```

Defined in `.cursor/agents/implementation-auditor.md`.
