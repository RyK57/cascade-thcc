---
name: framer-motion
description: Animation patterns with Framer Motion. Use for lander and app transitions.
---

# Framer Motion

- Import from `framer-motion` in **client** components only (`"use client"`)
- Keep motion wrappers in separate files: `components/*/hero/hero-motion.tsx`
- Prefer `motion` + `variants` over inline animation objects
- Respect `prefers-reduced-motion`
- Animate layout changes and page entrances — avoid animating every element
