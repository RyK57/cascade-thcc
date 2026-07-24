export const HERO = {
  headlineLead: "Text a job. Hire experts",
  headlineAccent: "over iMessage.",
  support:
    "Describe the work in chat. We source verified people on Terac and settle pay with Dynamic — in one conversation.",
  primaryCta: "Open the app",
  secondaryCta: "See how it works",
} as const;

export const HERO_THREAD = [
  {
    from: "user" as const,
    text: "Need a senior React eng to review our auth PR today.",
  },
  {
    from: "agent" as const,
    text: "Got it — scoping a Terac draft for React + auth reviewers. Est. ~$84 for 3 experts.",
  },
  {
    from: "user" as const,
    text: "Launch it. Pay from my Dynamic wallet when done.",
  },
  {
    from: "agent" as const,
    text: "Launched. I’ll text you when submissions land for approval.",
  },
] as const;
