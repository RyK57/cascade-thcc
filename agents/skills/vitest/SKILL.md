---
name: vitest
description: Testing conventions for prototype-template.
---

# Vitest

- Config: `vitest.config.ts` with `@/` alias
- Tests mirror source: `tests/<same-path-as-source>.test.ts`
- Run: `pnpm test`
- Test pure functions in `libs/` first — highest ROI
- Use `@testing-library/react` for component tests
- Add a test per feature before marking complete
