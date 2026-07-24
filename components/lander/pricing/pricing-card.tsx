import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PricingPlan } from "./pricing-data";

interface PricingCardProps {
  plan: PricingPlan;
}

export function PricingCard({ plan }: PricingCardProps) {
  return (
    <article
      className={`rounded-xl border p-6 ${
        plan.highlighted
          ? "border-primary bg-primary/5 shadow-sm"
          : "border-border/60 bg-card"
      }`}
    >
      <h3 className="text-lg font-medium">{plan.name}</h3>
      <p className="mt-2 font-secondary text-3xl">{plan.price}</p>
      <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>
      <ul className="mt-6 space-y-2">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-center gap-2 text-sm">
            <Check className="size-4 text-primary" />
            {feature}
          </li>
        ))}
      </ul>
      <Button className="mt-6 w-full" variant={plan.highlighted ? "default" : "outline"}>
        Choose {plan.name}
      </Button>
    </article>
  );
}
