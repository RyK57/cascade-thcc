---
name: implementation-auditor
description: Post-implementation audit skill — run after features, migrations, or backend work. Finds fractures, data drift, and duplicate sources of truth.
---

# Implementation Auditor

Project subagent: `.cursor/agents/implementation-auditor.md`

## Invoke

```
Use the implementation-auditor subagent to review my [feature/migration/backend] work
```

## When to run

- After pushing a feature branch
- After adding `supabase/migrations/*.sql`
- After implementing `db/`, `libs/`, or `app/api/`
- Before merging to main

## What it checks

- Layering (`architecture.mdc`)
- Migration ↔ db ↔ schema ↔ API alignment
- Single source of truth (`routes.ts`, `branding.ts`, `utils/schema/`)
- Unwired or broken code
- Optional Supabase null handling
- Test coverage mirror
- Styling rule violations (if UI changed)

## Output

Prioritized report: Critical → Warnings → Solid → Fix order

Does not implement fixes unless user asks.
