import { LanderShell } from "@/components/lander/shell";
import { HeroCta } from "./hero-cta";
import { HeroHeading } from "./hero-heading";
import { ThreadPanel } from "./thread-panel";

/**
 * Height comes from content, not `100svh` — on a phone that guaranteed a first
 * screen of headline and two buttons with no proof on it. The thread panel now
 * shares the fold at every width.
 */
export function Hero() {
  return (
    <section className="relative overflow-hidden rules-x">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_95%_45%_at_50%_0%,color-mix(in_oklab,var(--brand-accent)_16%,transparent),transparent_62%)] lg:bg-[radial-gradient(ellipse_44%_58%_at_76%_44%,color-mix(in_oklab,var(--brand-accent)_18%,transparent),transparent_68%)]"
      />
      <LanderShell className="relative z-10 grid items-center gap-11 pb-16 pt-9 sm:pt-12 md:gap-14 md:pb-20 md:pt-16 lg:grid-cols-[minmax(0,1.04fr)_minmax(0,0.96fr)] lg:gap-x-16 lg:pb-28 lg:pt-24">
        <div>
          <HeroHeading />
          <HeroCta className="mt-9 lg:mt-11" />
        </div>
        <ThreadPanel className="lg:min-h-[30rem]" />
      </LanderShell>
    </section>
  );
}
