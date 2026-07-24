---
name: supabase
description: Supabase auth, CRUD, and migrations for prototype-template.
---

# Supabase

- Clients: `utils/supabase/client.ts` (browser), `server.ts` (RSC/actions), `middleware.ts`
- Session helpers: `utils/supabase/session.ts`
- **Optional**: app runs without env keys — `isSupabaseConfigured()` gates all Supabase usage
- CRUD only in `db/<domain>/index.ts` — never in components
- Migrations in `supabase/migrations/` — one concern per SQL file
- Enable RLS on all tables; add policies per prototype needs
- Use Zod schemas from `utils/schema/` at API boundaries
