import { HERO } from "./hero-data";

/**
 * The single `h1`. Line breaks are authored rather than left to wrapping so the
 * accent line lands whole at every width; the accent stop is the *ink* value,
 * which is the one that reads on the background.
 */
export function HeroHeading() {
  return (
    <div>
      <h1 className="font-secondary text-[clamp(2.375rem,5.6vw,5rem)] leading-[0.96] text-foreground">
        <span className="block max-w-[13ch] text-balance">
          {HERO.headlineLead}{" "}
        </span>
        <span className="block text-accent-ink">{HERO.headlineAccent}</span>
      </h1>
      <p className="mt-6 max-w-[48ch] text-base leading-relaxed text-pretty text-muted-foreground sm:mt-7 sm:text-lg">
        {HERO.support}
      </p>
    </div>
  );
}
