---
name: react-flow
description: React Flow (@xyflow/react) for node-based UIs and diagrams.
---

# React Flow

- Package: `@xyflow/react`
- Keep graph logic in `libs/<feature>/` (layout, node transforms)
- Keep UI in `components/app/<feature>/` with `"use client"`
- Split: `flow-canvas.tsx`, `flow-node-types.tsx`, `flow-toolbar.tsx`
- Hardcode demo nodes for prototypes; wire to API later
