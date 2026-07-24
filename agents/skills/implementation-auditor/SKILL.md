---
name: implementation-auditor
description: Post-implementation audit — layering, Linq/Terac/Dynamic wiring, data drift, and conversational channel safety.
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
- After Linq webhook / Terac launch / Dynamic payment changes
- Before merging to main

## What it checks

- Layering (`architecture.mdc`) + product loop (`product.mdc`)
- Migration ↔ db ↔ schema ↔ API alignment
- Single source of truth (`routes.ts`, `branding.ts`, `utils/schema/`)
- Linq/Terac/Dynamic secrets not leaked to client
- Terac launch not possible without explicit confirmation path
- No blast/cold-outreach messaging patterns
- Chat ↔ job ↔ opportunity ↔ payment IDs persisted
- Unwired or broken code
- Test coverage mirror
- Styling rule violations (if UI changed)

## Output

Prioritized report: Critical → Warnings → Solid → Fix order

Does not implement fixes unless user asks.
