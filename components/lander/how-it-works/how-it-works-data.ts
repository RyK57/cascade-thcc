export interface HowItWorksStep {
  step: string;
  title: string;
  description: string;
}

export const HOW_IT_WORKS = {
  label: "Cascade over iMessage",
  headline: "Cheapest capable worker, every time.",
  cta: "See the loop",
  ctaHref: "#stack",
} as const;

export const HOW_IT_WORKS_STEPS: HowItWorksStep[] = [
  {
    step: "01",
    title: "Text the task",
    description:
      "Message Cascade on Linq. One triage call routes to AI, a peer, or a Terac expert.",
  },
  {
    step: "02",
    title: "Confirm the quote",
    description:
      "AI answers free. Peers and experts show a price card — tapback or YES before anything spends.",
  },
  {
    step: "03",
    title: "Sandbox pay + deliver",
    description:
      "Escrow test USDC via Dynamic, approve the deliverable in-thread, payout fires with confetti.",
  },
] as const;
