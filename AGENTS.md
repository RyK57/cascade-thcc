# Prototype Template — Agent Guide

Read `.cursor/rules/` and `agents/skills/` before implementing features.

**Styling:** props over `className`. Global UI changes go in `components/ui/`. See `.cursor/rules/styling.mdc`.

## Stack

Next.js App Router · pnpm · shadcn/ui · Supabase (optional) · Vitest

## Key paths

- Routes/constants: `lib/constants/routes.ts`
- Auth: `app/auth/*`, `components/auth/*`, `libs/auth/*`
- Lander: `components/lander/*` (hardcoded data)
- App UI: `components/app/*`, `app/main/*`
- Internal tooling: `app/internal/*`
- Seed demo user: `pnpm db:seed`

## Prototype subagent

Start with `agents/skills/prototype-subagent/SKILL.md` — ask branding and functionality questions before building.

For **lander-only** setup (branding + marketing page, no app UI), use the **`lander-builder`** subagent:

```
Use the lander-builder subagent to set up my product lander
```

Defined in `.cursor/agents/lander-builder.md`.

## Implementation auditor

After features, migrations, or backend work, run **`implementation-auditor`** to catch fractures and data drift:

```
Use the implementation-auditor subagent to review my latest changes
```

Defined in `.cursor/agents/implementation-auditor.md`.
