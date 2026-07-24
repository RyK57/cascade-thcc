export interface HowItWorksStep {
  step: string;
  /** Which platform does the work in this move. */
  system: string;
  title: string;
  description: string;
}

export const HOW_IT_WORKS = {
  label: "Cascade over iMessage",
  headline: "Cheapest capable worker, every time.",
  support:
    "One triage call decides who does the job, the quote lands in the thread, and money never moves before you answer.",
  cta: "See the loop",
  ctaHref: "#stack",
} as const;

/** The control promise, pulled out of the loop and given its own weight. */
export const CONFIRM_GATE = {
  headline: "Nothing spends until you say yes.",
  description:
    "AI is free. Anything with a human on the other end posts a live price card in the thread, and a tapback or a plain YES is the only thing that releases budget — up to the cap you set.",
} as const;

export const HOW_IT_WORKS_STEPS: HowItWorksStep[] = [
  {
    step: "01",
    system: "Linq",
    title: "Text the task",
    description:
      "Message Cascade like you'd message a person. One triage call decides whether it answers itself or hires someone.",
  },
  {
    step: "02",
    system: "Confirm",
    title: "Confirm the quote",
    description:
      "AI answers free. Hiring a professional shows a price card first — tapback or YES before anything spends.",
  },
  {
    step: "03",
    system: "Dynamic",
    title: "Pay and get paid",
    description:
      "Your money sits in escrow while the work happens. Approve it and the worker is paid in stablecoin, straight to their wallet.",
  },
] as const;
