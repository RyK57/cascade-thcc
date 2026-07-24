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
  support: "Linq for the channel, Terac for the people, Dynamic for the money.",
} as const;

export const STACK_ITEMS: StackItem[] = [
  {
    name: "Linq",
    role: "Channel",
    description: "Real iMessage with typing, tapbacks, and status updates.",
  },
  {
    name: "Terac",
    role: "Workers",
    description:
      "Vetted professionals, matched to the task and rated on what they deliver.",
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
    label: "Human tier",
    title: "Quote, then go.",
    description:
      "A live quote lands in the thread. Confirm it and Cascade hires through Terac, holds the money in escrow, and releases it when you approve.",
    tone: "accent",
  },
];
