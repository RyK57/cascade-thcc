---
name: supabase
description: Supabase auth, CRUD, and migrations for the iMessage expert agent (jobs, chats, payments persistence).
---

# Supabase Skill

## Role in this product

Supabase persists the hiring loop: users, Linq chats/messages, jobs, Terac opportunity/submission IDs, and Dynamic payment state.

## Conventions

- Clients: `utils/supabase/` (`client`, `server`, `admin`, `middleware`)
- CRUD: `db/<domain>/index.ts` — never in React components
- Schemas: `utils/schema/` (Zod) before migrations
- Migrations: `supabase/migrations/`
- Env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

## Suggested domains

| Domain | Purpose |
|--------|---------|
| `users` | App users (web + phone identity links) |
| `chats` / `messages` | Linq thread mirror + idempotency keys |
| `jobs` | Job intake from chat |
| `opportunities` | Terac opportunity/submission links |
| `payments` | Dynamic payment state machine |

## Rules

- When Supabase is not configured, degrade gracefully (existing auth scaffold pattern)
- Store external IDs (`linq_chat_id`, `terac_opportunity_id`, `dynamic_*`) as columns — single source of truth in DB
- Prefer server components / server actions / API routes for reads/writes
- After migrations: run implementation-auditor

## MCP

`plugin-supabase-supabase` is available for project/SQL/migration ops. Prefer local migrations in-repo for app schema changes, then apply intentionally.
