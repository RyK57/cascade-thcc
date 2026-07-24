---
name: terac
description: Terac verified expert labor — MCP + REST patterns for drafting/sourcing experts from the iMessage agent.
---

# Terac Skill

## Role in this product

Terac is the **expert supply layer**. When a user describes a job over iMessage, the agent creates a **DRAFT** opportunity, explains cost/ETA in chat, and only **launches** after explicit confirmation.

## Access

- MCP: `user-terac` (call `terac_get_context` first in agent sessions)
- REST: `https://terac.com/api/external/v2` with `Authorization: Bearer $TERAC_API_KEY`
- Client: `libs/terac/` (`teracRequest`, `listOpportunities`, `getOpportunity`)
- Env: `TERAC_API_KEY`, optional `TERAC_API_BASE_URL`

## Agent + product rules

1. **Draft by default** — `terac_create_opportunity` / REST create draft costs nothing
2. **Never launch** (`terac_launch_draft_opportunity`) unless the user clearly confirms in chat (or operator UI)
3. **One opportunity** unless segments are truly separate deliverables
4. **Filters first** — use `terac_list_filters` / `terac_get_filter_options` IDs; put soft quals in `screening_questions`
5. **Pricing is derived** — don't invent CPI; surface Terac's quote/pricing back to the user in Linq

## Suggested mapping

| Chat concept | Terac |
|--------------|-------|
| Job request | Opportunity (draft → launched) |
| Expert delivers work | Submission (`AWAITING_REVIEW` → approve/reject) |
| User accepts expert | Approve submission + trigger Dynamic payment flow |

## Code patterns

- Keep Terac HTTP in `libs/terac/` — thin functions, one per file
- API routes under `app/api/terac/` validate with Zod then call libs
- Store `opportunity_id`, `submission_id`, status on the job row in Supabase
- Relay status changes back through Linq (`libs/linq`)

## MCP vs app runtime

- **Cursor MCP**: great for drafting opportunities while developing / ops
- **App runtime**: use REST client in `libs/terac/` from webhooks/API routes (do not call MCP from Next.js)

## Docs

- MCP overview: https://terac.com/mcp
- REST reference: https://terac.com/docs/developers/reference/
