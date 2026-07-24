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
  support: "Linq for chat, peers + Terac for humans, Dynamic sandbox for money.",
} as const;

export const STACK_ITEMS: StackItem[] = [
  {
    name: "Linq",
    role: "Channel",
    description: "Real iMessage with typing, tapbacks, and status updates.",
  },
  {
    name: "Peers + Terac",
    role: "Workers",
    description: "Seeded peers for quick human work; Terac for verified experts.",
  },
  {
    name: "Dynamic",
    role: "Sandbox pay",
    description: "Base Sepolia USDC escrow and payouts — no real dollars.",
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
    label: "Peer → expert",
    title: "Quote, then go.",
    description:
      "Peers claim by tapback. Experts launch on Terac only after you confirm the live quote.",
    tone: "accent",
  },
];
