---
name: imessage-agent
description: Primary product skill — Cascade iMessage agent (Linq) that routes AI / peers / Terac experts with sandbox Dynamic payments.
---

# Cascade — iMessage task agent

## Product

People text a Linq Number. Cascade triages to AI (free), a seeded peer, or a Terac expert, and coordinates sandbox Dynamic escrow/payouts in the same thread.

## Happy path

```
inbound Linq message or affirming tapback
  → persist message + job
  → triageJob → ai | peer | expert
  → ai: answer + follow-up suggest
  → peer: quote → sandbox fund → broadcast → claim → deliver → approve → payout
  → expert: Terac draft quote → confirm launch → poll submissions → approve → sandbox pay
```

## Hard constraints

- Conversational only — no blast / cold outreach
- Terac: **draft by default**; launch only on explicit confirm
- Dynamic: **sandbox / Base Sepolia only** (simulate when keys missing)
- Secrets stay server-side
- Persist foreign IDs (Linq, Terac, Dynamic, peer assignee)

## Done checklist

- [x] Inbound message creates/updates a job
- [x] Agent reply sends via Linq
- [x] Triage routes three tiers
- [x] Expert search uses Terac draft first
- [x] Payment path goes through sandbox Dynamic helpers
- [x] `pnpm test` + `pnpm build` pass
