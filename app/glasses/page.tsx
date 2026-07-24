import type { Viewport } from "next";
import { GlassesHud } from "./glasses-hud";

export const metadata = {
  title: "Cascade HUD",
  // The glasses runtime only treats a page as a Web App when it declares this.
  other: { "mrbd-web-app-capable": "yes" },
};

// Ray-Ban Display is a fixed 600x600 surface — the root layout's
// width=device-width default would scale the HUD wrong on-glasses.
export const viewport: Viewport = {
  width: 600,
  height: 600,
  initialScale: 1,
  userScalable: false,
};

/**
 * The route's stylesheet, inline because it has to reach <body> (owned by the
 * root layout) without leaking to any other route — a global import would.
 *
 * The HUD is Cascade's own system re-valued for an additive waveguide: the
 * lens emits light and never subtracts it, so pure black is transparent, any
 * fill glows, and the site's faintest steps — a 10% hairline, a 66%-lightness
 * muted step — disappear against a lit room. Hues are untouched; only value
 * moves. Unlayered rules here beat globals.css (@layer base) and Tailwind
 * utilities, so nothing needs !important.
 */
const HUD_CSS = `
  body {
    width: 600px;
    height: 600px;
    margin: 0;
    display: block;
    overflow: hidden;
    background: #000;
  }
  /* First focusable element on the page — it would eat the first pinch. */
  .skip-link { display: none; }

  .hud {
    --hud-fg: hsl(40 22% 95%);          /* --foreground, unchanged */
    --hud-dim: hsl(38 10% 76%);         /* --muted-foreground, lifted from 66% */
    --hud-rule: hsl(40 22% 95% / 26%);  /* --hairline, lifted from 10% */
    --hud-accent: #ea6236;              /* --brand-accent-bright */
    --hud-secondary: #837dff;           /* --brand-secondary-bright */
    --hud-danger: hsl(0 84% 70%);       /* --destructive */

    width: 600px;
    height: 600px;
    display: grid;
    grid-template-rows: 56px 1fr 56px;
    background: #000;
    color: var(--hud-fg);
    font-family: system-ui, -apple-system, sans-serif;
    /* Emilio is 300 weight: right on a screen, too thin to survive a
       waveguide. The site's typographic voice carries through case and
       tracking instead of the display face. */
    font-weight: 600;
    letter-spacing: -0.01em;
    overflow: hidden;
  }

  /* .label-caps at HUD scale — same case and tracking as the site. */
  .hud-caps {
    font-size: 17px;
    line-height: 1;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    font-weight: 600;
  }

  .hud-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 24px;
    border-bottom: 1px solid var(--hud-rule);
  }
  .hud-bracket { color: var(--hud-dim); }

  /* Ambient status: the dot carries the accent, the word stays quiet so the
     list and the pinch affordance keep the eye. */
  .hud-live {
    display: flex;
    align-items: center;
    gap: 9px;
    color: var(--hud-dim);
  }
  .hud-dot {
    /* Block, not inline: width/height are ignored on an inline box, and the
       row gutter is not a flex container the way the header is. */
    display: block;
    width: 11px;
    height: 11px;
    border-radius: 50%;
    background: var(--hud-accent);
  }
  .hud-dot--stale { background: var(--hud-dim); }

  .hud-list { align-content: start; overflow: hidden; }

  .hud-row {
    height: 123px;
    display: grid;
    grid-template-columns: 26px 1fr;
    align-content: center;
    gap: 12px 0;
    padding: 0 24px;
    border-bottom: 1px solid var(--hud-rule);
  }
  .hud-row:last-child { border-bottom: 0; }

  .hud-gutter {
    grid-row: 1 / span 2;
    display: flex;
    align-items: center;
  }

  .hud-meta {
    display: flex;
    align-items: center;
    gap: 10px;
    color: var(--hud-dim);
  }
  .hud-tier--ai { color: var(--hud-secondary); }
  .hud-tier--peer, .hud-tier--expert { color: var(--hud-accent); }
  .hud-price {
    margin-left: auto;
    font-variant-numeric: tabular-nums;
    letter-spacing: 0.06em;
  }

  .hud-title {
    font-size: 26px;
    line-height: 1.22;
    color: var(--hud-dim);
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    overflow: hidden;
  }
  .hud-row--on .hud-title,
  .hud-row--on .hud-price { color: var(--hud-fg); }

  .hud-empty {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 14px;
    padding: 0 24px;
  }
  .hud-empty-lead { font-size: 28px; line-height: 1.2; }
  .hud-empty-sub {
    font-size: 20px;
    line-height: 1.35;
    font-weight: 500;
    color: var(--hud-dim);
  }

  .hud-foot { border-top: 1px solid var(--hud-rule); }
  .hud-legend {
    height: 100%;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
  }
  .hud-legend > * {
    display: flex;
    align-items: center;
    justify-content: center;
    border-left: 1px solid var(--hud-rule);
    color: var(--hud-dim);
    font-size: 16px;
    letter-spacing: 0.16em;
  }
  .hud-legend > :first-child { border-left: 0; }
  /* The only live affordance on screen earns the accent. */
  .hud-legend--live { color: var(--hud-accent); }

  .hud-idle {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--hud-dim);
    font-size: 16px;
    letter-spacing: 0.16em;
  }

  .hud-flash {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 24px;
    color: var(--hud-accent);
    /* The one authored moment: the footer resolving an approval. */
    animation: hud-rise 320ms cubic-bezier(0.16, 1, 0.3, 1);
  }
  .hud-flash--done { color: var(--hud-fg); }
  .hud-flash--fail { color: var(--hud-danger); }

  @keyframes hud-rise {
    from { opacity: 0.4; transform: translateY(4px); }
    to { opacity: 1; transform: none; }
  }
  @media (prefers-reduced-motion: reduce) {
    .hud-flash { animation: none; }
  }
`;

/**
 * Ray-Ban Display web app. Added on-glasses by pasting this URL into the Meta
 * AI app (Developer Mode → App Connections → Web Apps); Neural Band d-pad
 * arrives as arrow keys, index pinch as Enter. Preview on desktop at 600x600
 * with arrow keys.
 */
export default function GlassesPage() {
  return (
    <>
      <style>{HUD_CSS}</style>
      <GlassesHud />
    </>
  );
}
