export interface StackItem {
  name: string;
  role: string;
  description: string;
}

export interface StackBlock {
  label: string;
  title: string;
  description: string;
  tone: "accent" | "secondary";
  meta?: string;
}

export const STACK = {
  headline: "Three platforms. One thread.",
  support:
    "Linq for the channel, Terac for credentialed work, Dynamic for the money.",
} as const;

export const STACK_ITEMS: StackItem[] = [
  {
    name: "Linq",
    role: "Channel",
    description: "Real iMessage with typing, tapbacks, and status updates.",
  },
  {
    name: "Terac",
    role: "Specialists",
    description:
      "Vetted professionals, brought in only when a task needs a real credential.",
  },
  {
    name: "Dynamic",
    role: "Payments",
    description:
      "Stablecoin escrow, and payouts straight into the worker's own wallet.",
  },
  {
    name: "Confirm",
    role: "Control",
    description: "Cost and scope stay in chat before any budget is spent.",
  },
];

export const STACK_BLOCKS: StackBlock[] = [
  {
    label: "AI tier",
    title: "$0",
    meta: "Instant",
    description:
      "Plans, drafts, and summaries answered in-thread with a related follow-up suggestion.",
    tone: "secondary",
  },
  {
    label: "Human tiers",
    title: "Quote, then go.",
    description:
      "A live quote lands in the thread. Confirm it and Cascade hires — the network for hands-on work, a Terac professional when it needs a credential — holds the money in escrow, and releases it when you approve.",
    tone: "accent",
  },
];
