---
name: zod-schemas
description: Zod validation and type inference conventions.
---

# Zod

- All shared schemas in `utils/schema/<domain>.ts`
- Export schema + inferred type: `export type User = z.infer<typeof userSchema>`
- Parse at boundaries: API routes, server actions, external webhooks
- Use `.safeParse()` in routes; throw or return 400 on failure
- Keep create/update schemas as `.pick()` / `.omit()` from base schemas
