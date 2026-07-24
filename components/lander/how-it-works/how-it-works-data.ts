export interface HowItWorksStep {
  step: string;
  title: string;
  description: string;
}

export const HOW_IT_WORKS = {
  label: "Conversation-native hiring",
  headline: "One thread from job to paid.",
  cta: "See the hiring loop",
  ctaHref: "#stack",
} as const;

export const HOW_IT_WORKS_STEPS: HowItWorksStep[] = [
  {
    step: "01",
    title: "Text the job",
    description:
      "Message the Linq Number like a coworker. Role, timeline, and what “done” looks like — all in chat.",
  },
  {
    step: "02",
    title: "Meet verified experts",
    description:
      "The agent drafts a Terac opportunity, shows estimated cost, and launches only after you confirm.",
  },
  {
    step: "03",
    title: "Pay through Dynamic",
    description:
      "Approve work in the thread. Wallet checkout and payouts stay tied to that approval.",
  },
] as const;
