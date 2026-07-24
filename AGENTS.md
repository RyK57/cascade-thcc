# Agent Guide

**Product:** Cascade — iMessage agent (Linq) that routes tasks to AI, seeded peers, or Terac experts, with sandbox Dynamic payments.

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

## Cursor Cloud specific instructions

Node 22 + pnpm are preinstalled; the startup update script runs `pnpm install`. Standard commands live in `package.json` and `README.md` (`pnpm dev`, `pnpm build`, `pnpm test`, `pnpm lint`, `pnpm db:seed`).

- **Run:** `pnpm dev` serves the whole app (UI + all API routes) on `http://localhost:3000`. This is the only process needed.
- **The app boots with zero external services configured.** Every integration (Linq, Terac, Dynamic, Supabase, Stripe, AI providers) is gated by an `isXConfigured()` check, so missing keys report `"missing"`/`"skipped"` instead of crashing. Copy `.env.example` → `.env.local` (gitignored) and only add keys for the integration you actually need to exercise end-to-end.
- **Verify health without a browser:** `curl http://localhost:3000/api/health` returns `{"ok":true,...}` with per-integration status.
- **Lint is clean:** `pnpm lint` exits 0. (It previously failed on `components/theme/theme-toggle.tsx`, which no longer exists — the app is dark-only.) Note `next build` does not run ESLint, so lint has to be run on its own.
- **Tests** (`pnpm test`, Vitest) run fully offline and pass without any env vars.
- Exercising the real hiring/payment loop (`POST /api/linq/chats`, `/api/terac/opportunities`, Dynamic wallet login on `/main`) requires the corresponding provider API keys added to `.env.local`.
