export interface PricingPoint {
  title: string;
  description: string;
}

export const PRICING = {
  headline: "Pay only when humans work.",
  support:
    "AI is free. Every human quote appears in the thread before anything moves, and the money settles in stablecoin through Dynamic.",
  points: [
    {
      title: "AI is free",
      description: "Cascade answers capable tasks in-thread at $0.",
    },
    {
      title: "Workers earn real money",
      description:
        "Payouts land in the worker's own wallet in USDC or ETH — theirs to hold or cash out, with no platform float in between.",
    },
    {
      title: "Set a budget",
      description:
        "Cap what Cascade may spend per task or per month. Anything above the cap waits in the thread for your yes.",
    },
  ] as PricingPoint[],
  cta: "Open Cascade",
} as const;
