export const HERO = {
  headlineLead: "Cascade routes every task",
  headlineAccent: "over iMessage.",
  support:
    "AI answers free. Anything it can't do goes to a vetted professional through Terac — who gets paid in USDC or ETH the moment you approve.",
  primaryCta: "Open the app",
  secondaryCta: "See how it works",
  trust: "Escrow held until you approve in Messages.",
} as const;

/** Chrome for the thread artifact. Kept beside the messages it annotates. */
export const THREAD = {
  channel: "Live on iMessage",
  agent: "Cascade",
  stamp: "Today 9:41",
  notes: ["AI free", "Quote first", "Paid on approval"],
} as const;

/** Speaker names, announced to screen readers before each message. */
export const THREAD_SPEAKERS = {
  user: "You",
  agent: "Cascade",
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
    text: "Quote: $12 USDC (or 0.0048 ETH) + ~$0.01 gas, held in escrow. Approve and it lands in their wallet.",
  },
] as const;
