import { LanderShell } from "@/components/lander/shell";
import { HeroCta } from "./hero-cta";
import { HeroHeading } from "./hero-heading";

export function Hero() {
  return (
    <section className="relative min-h-[100svh] overflow-hidden rules-x">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,color-mix(in_oklab,var(--brand-accent)_18%,transparent),transparent_60%)]" />
      <LanderShell className="relative z-10 flex min-h-[100svh] flex-col items-center justify-center gap-10 pb-20 pt-28">
        <HeroHeading />
        <HeroCta />
      </LanderShell>
    </section>
  );
}
