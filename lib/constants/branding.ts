export const BRAND = {
  name: "Cascade",
  tagline: "Text a task. AI, peers, or verified experts — paid when you approve.",
  // Kept in step with the --brand-* tokens in app/globals.css, which are the
  // real source of truth for anything rendered. These are the FILL stops:
  // white on them measures 4.65:1 / 4.64:1. The brighter ink stops used for
  // accent *text* on the dark background live in CSS only.
  accent: "#CD471B",
  accentForeground: "#ffffff",
  secondary: "#6761EE",
  secondaryForeground: "#ffffff",
} as const;
