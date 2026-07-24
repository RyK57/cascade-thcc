---
name: linq
description: Linq iMessage/RCS/SMS integration — CLI, SDK, webhooks, and conversational messaging rules for this project.
---

# Linq Skill

## Role in this product

Linq is the **conversational channel**. Users text the agent; the agent replies on the same thread. Prefer two-way dialogue over one-way notifications.

## Packages & env

- SDK: `@linqapp/sdk` (`LinqAPIV3`)
- CLI: `@linqapp/cli` (`linq`) — Node 22+, prefer `2.5.0+`
- Env: `LINQ_API_V3_API_KEY` (alias `LINQ_API_KEY`)
- Client helpers: `libs/linq/`
- API: `app/api/linq/`

```ts
import LinqAPIV3 from "@linqapp/sdk";
import { createLinqClient, sendTextMessage } from "@/libs/linq";
```

## CLI quick checks

```bash
linq whoami
linq doctor
linq tokens show
linq webhooks listen --forward-to http://localhost:3000/api/linq/webhook
```

## Implementation patterns

1. **Webhook first** — production agent turns start from Linq webhook events (`message.received`, etc.)
2. **Verify signatures** on permanent webhook subscriptions (`x-webhook-signature`)
3. **Idempotency** — dedupe by Linq message ID in DB before running the agent
4. **Reply in-thread** — use chat ID from the inbound event; don't open random new chats for the same person/job unless intentional
5. **Effects/reactions** — optional delight (`--effect`, reactions); never rely on them for critical state

## Free / inbound-first lines

If the account is inbound-first: the contact must text the Linq Number before outbound works. Design onboarding copy accordingly ("Text this number to get started").

## Do / Don't

| Do | Don't |
|----|-------|
| Clarify job details in chat | Blast many numbers |
| Use E.164 phones | Invent non-conversational reminder spam |
| Persist `chat.id` + `message.id` | Put API keys in client bundles |
| Forward webhooks to local API while building | Treat Linq as email/SMS marketing |

## Docs

- CLI: https://linqapp.com/cli · https://github.com/linq-team/linq-cli
- API: https://apidocs.linqapp.com / https://docs.linqapp.com
- Examples: https://linqapp.com/s/example-apps
