import { PricingCard } from "./pricing-card";
import { PRICING_PLANS } from "./pricing-data";

export function PricingSection() {
  return (
    <section id="pricing" className="border-t border-border/60 bg-muted/30 py-20">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="mb-10 max-w-2xl">
          <p className="text-sm font-medium uppercase tracking-widest text-primary">
            Pricing
          </p>
          <h2 className="mt-2 font-secondary text-3xl sm:text-4xl">
            Simple plans for fast prototypes
          </h2>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          {PRICING_PLANS.map((plan) => (
            <PricingCard key={plan.name} plan={plan} />
          ))}
        </div>
      </div>
    </section>
  );
}
