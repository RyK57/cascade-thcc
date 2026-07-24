/**
 * Focus treatment for the bare links on auth surfaces. Buttons and inputs get
 * theirs from the primitives; anchors do not, and a password screen is the last
 * place a keyboard user should lose the caret.
 */
export const AUTH_LINK = [
  "rounded-xs underline-offset-4 outline-none transition-colors",
  "hover:text-foreground hover:underline",
  "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
].join(" ");

/** Same, for links that already read as foreground text. */
export const AUTH_LINK_STRONG = `${AUTH_LINK} text-foreground`;
