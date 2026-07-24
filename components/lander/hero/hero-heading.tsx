import { BRAND } from "@/lib/constants/branding";

export function HeroHeading() {
  return (
    <div className="space-y-4 text-center">
      <p className="font-secondary text-5xl leading-tight sm:text-6xl md:text-7xl">
        {BRAND.name}
      </p>
      <h1 className="text-xl font-medium sm:text-2xl md:text-3xl">
        {BRAND.tagline}
      </h1>
      <p className="mx-auto max-w-2xl text-base text-muted-foreground sm:text-lg">
        Hackathon starter with Linq, Terac, and Dynamic wired into the prototype
        template stack.
      </p>
    </div>
  );
}
