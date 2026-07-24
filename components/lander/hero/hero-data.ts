export const HERO = {
  headlineLead: "Cascade is the OpenRouter",
  headlineAccent: "for the real world.",
  support:
    "Text a task over iMessage. Cascade routes to AI, peers, or verified Terac experts — escrowed with sandbox Dynamic USDC.",
  primaryCta: "Open the app",
  secondaryCta: "See how it works",
} as const;

export const HERO_THREAD = [
  {
    from: "user" as const,
    text: "Plan my week around Startup School.",
  },
  {
    from: "agent" as const,
    text: "AI tier — here's a focused plan. Want a peer to stress-test your signup next?",
  },
  {
    from: "user" as const,
    text: "Have someone test my signup on a real phone.",
  },
  {
    from: "agent" as const,
    text: "Peer quote: $12 USDC sandbox escrow. Pay → tapback claim → approve → instant payout.",
  },
] as const;
