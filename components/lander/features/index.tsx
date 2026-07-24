import { FeatureCard } from "./feature-card";
import { FEATURES } from "./features-data";

export function FeaturesSection() {
  return (
    <section id="features" className="border-t border-border/60 py-20">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="mb-10 max-w-2xl">
          <p className="text-sm font-medium uppercase tracking-widest text-primary">
            Features
          </p>
          <h2 className="mt-2 font-secondary text-3xl sm:text-4xl">
            Linq, Terac, and Dynamic in one stack
          </h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {FEATURES.map((feature) => (
            <FeatureCard key={feature.title} feature={feature} />
          ))}
        </div>
      </div>
    </section>
  );
}
