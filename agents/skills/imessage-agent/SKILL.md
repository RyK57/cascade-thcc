---
name: imessage-agent
description: Primary product skill — iMessage agent (Linq) that sources Terac experts and coordinates Dynamic payments. Use for any feature touching the hiring conversation loop.
---

# iMessage Expert Agent

## Product

People text a Linq Number. The agent clarifies the job, finds verified experts on Terac, and coordinates payment through Dynamic — all in a conversational iMessage thread.

## When to use this skill

- Building webhook handlers or agent turns
- Job intake / expert matching flows
- Payment confirmation in chat
- Operator dashboard that mirrors chat state
- Anything that spans Linq + Terac + Dynamic

## Happy path (implement against this)

```
inbound Linq message
  → persist message + chat
  → libs/agent: interpret intent
  → if needs experts: libs/terac draft opportunity (no spend)
  → reply on Linq with options + estimated cost
  → on user confirm: terac launch (spend) OR refine draft
  → track submissions; relay updates over Linq
  → on accept work: libs/dynamic payment coordination
  → confirm paid/settled in thread + db
```

## Implementation order for new slices

1. Zod schemas (`utils/schema/`) for job / opportunity / payment links
2. Supabase migration + `db/` CRUD
3. `libs/agent/` turn handler (pure-ish; calls linq/terac/dynamic helpers)
4. `app/api/linq/webhook` (or equivalent) ingest
5. Outbound reply via `libs/linq`
6. Minimal `/main` operator view if humans need to supervise
7. Tests mirroring `libs/` and API routes

## Skills to load with this

- `agents/skills/linq/SKILL.md`
- `agents/skills/terac/SKILL.md`
- `agents/skills/dynamic-payments/SKILL.md`
- `agents/skills/supabase/SKILL.md`
- `agents/rules/product.mdc` + `architecture.mdc`

## Hard constraints

- Conversational only — no blast / cold outreach patterns (see `product.mdc`)
- Terac: **draft by default**; launch only on explicit user confirmation
- Secrets stay server-side
- Persist foreign IDs (Linq chat/message, Terac opportunity/submission, Dynamic payment refs)

## Done checklist

- [ ] Inbound message can create/update a job thread in DB
- [ ] Agent reply sends via Linq to the same chat
- [ ] Expert search uses Terac draft first
- [ ] Payment path goes through Dynamic helpers
- [ ] `pnpm test` + `pnpm build` pass
