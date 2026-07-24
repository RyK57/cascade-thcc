export interface PricingPoint {
  title: string;
  description: string;
}

export const PRICING = {
  headline: "Pay only when humans work.",
  support:
    "AI is free. Peer and expert quotes show in chat. Sandbox Dynamic USDC escrow — never real dollars in this demo.",
  points: [
    {
      title: "AI is free",
      description: "Cascade answers capable tasks in-thread at $0.",
    },
    {
      title: "Peers + credits",
      description:
        "Seeded peers claim jobs; earn credits that stay in a closed loop (never convert to crypto).",
    },
    {
      title: "Experts on confirm",
      description:
        "Terac drafts are free; launch spends only after you tapback YES. Billed on approval.",
    },
  ] as PricingPoint[],
  cta: "Open Cascade",
} as const;
