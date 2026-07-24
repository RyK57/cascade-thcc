export interface PricingPoint {
  title: string;
  description: string;
}

export const PRICING = {
  headline: "Pay for verified work, not seats.",
  support:
    "There is no SaaS tier maze. You confirm Terac cost in chat, then settle through Dynamic when the work is approved.",
  points: [
    {
      title: "Drafts are free",
      description: "Scoping an expert opportunity on Terac costs nothing until you launch.",
    },
    {
      title: "Launch on confirm",
      description: "The agent shows estimate + ETA in iMessage before any budget is spent.",
    },
    {
      title: "Settle on approval",
      description: "Dynamic coordinates wallet payment when you accept a submission.",
    },
  ] as PricingPoint[],
  cta: "Try the operator view",
} as const;
