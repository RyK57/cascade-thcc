export interface PricingPlan {
  name: string;
  price: string;
  description: string;
  features: string[];
  highlighted?: boolean;
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    name: "Starter",
    price: "$0",
    description: "For quick landers and internal demos.",
    features: ["Lander template", "Auth scaffold", "Optional Supabase"],
  },
  {
    name: "Prototype",
    price: "$29",
    description: "For teams shipping weekly experiments.",
    features: ["Everything in Starter", "Internal tooling", "AI + Stripe stubs"],
    highlighted: true,
  },
  {
    name: "Launch",
    price: "Custom",
    description: "For products moving beyond prototype.",
    features: ["Custom domains", "Team workflows", "Priority support"],
  },
] as const;
