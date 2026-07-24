import { HeroCta } from "./hero-cta";
import { HeroHeading } from "./hero-heading";

export function Hero() {
  return (
    <section className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center gap-8 px-4 py-20 sm:px-6">
      <HeroHeading />
      <HeroCta />
    </section>
  );
}
