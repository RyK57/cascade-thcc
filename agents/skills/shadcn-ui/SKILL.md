---
name: shadcn-ui
description: shadcn/ui patterns for this template. Use when adding or composing UI components.
---

# shadcn/ui in prototype-template

Read `agents/rules/styling.mdc` (or `.cursor/rules/styling.mdc`) before any UI work.

## Core principles

1. **Props over `className`** — `variant`, `size`, and composition slots are the primary styling API
2. **Global changes → `components/ui/`** — if every Button should look different, edit `components/ui/button.tsx`, not 20 call sites
3. **Layout-only `className` in consumers** — flex, grid, gap, max-width on wrappers; not colors on primitives
4. **New variants via `cva`** in `components/ui/` when props are insufficient

## Setup

- Components live in `components/ui/` — add via `pnpm dlx shadcn@latest add <name>`
- Use `cn()` from `@/lib/utils` only inside `components/ui/` or for layout merges
- Buttons, tabs, toggle groups use `primary` / `accent` tokens (mapped to brand accent in `globals.css`)
- Compose product UI in `components/lander/` or `components/app/`, not in `components/ui/`

## Component prop reference (use these first)

```tsx
<Button variant="default" | "destructive" | "outline" | "secondary" | "ghost" | "link" size="default" | "sm" | "lg" | "icon" />
<Badge variant="default" | "secondary" | "destructive" | "outline" />
<Alert variant="default" | "destructive" />
<Toggle variant="default" | "outline" size="default" | "sm" | "lg" />
```

## When lander needs a new look

| Need | Action |
|------|--------|
| All primary CTAs bigger | Add `size` usage or extend `buttonVariants` in `components/ui/button.tsx` |
| Cards need consistent padding | Adjust `Card` in `components/ui/card.tsx` |
| Highlighted pricing tier | Use `variant` on inner `Button` + `Card` composition — not a one-off div with border classes |
| Section needs unique layout | Wrapper in `components/lander/<section>/` with layout `className` only |

## Do not

- Pass `className="bg-primary text-white rounded-full px-10"` to `Button` when `variant` + `size` + theme tokens suffice
- Create raw `<div className="rounded-xl border bg-card p-6">` when `<Card>` exists
- Duplicate the same 10-class string in navbar, hero, and pricing

## Theming hierarchy

1. `app/globals.css` — CSS variables (`--brand-accent`, `--radius`, shadcn tokens)
2. `components/ui/*.tsx` — component variants and defaults
3. `components/lander|app/` — layout composition with props on primitives
