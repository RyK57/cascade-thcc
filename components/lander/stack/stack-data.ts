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
  headline: "The hiring loop explains itself.",
  support: "Three systems, one conversation — message, source, settle.",
} as const;

export const STACK_ITEMS: StackItem[] = [
  {
    name: "Linq",
    role: "Channel",
    description: "Real iMessage with RCS and SMS fallback on the same thread.",
  },
  {
    name: "Terac",
    role: "Experts",
    description: "Verified human labor. Draft free; launch when you say go.",
  },
  {
    name: "Dynamic",
    role: "Payments",
    description: "Wallets and settlement tied to approved submissions.",
  },
  {
    name: "Confirm",
    role: "Control",
    description: "Cost and scope stay in chat before any budget is spent.",
  },
];

export const STACK_BLOCKS: StackBlock[] = [
  {
    label: "Draft → launch",
    title: "$0",
    meta: "Drafts are free",
    description:
      "Scoping a Terac opportunity costs nothing. Launch only after you confirm estimate and ETA in iMessage.",
    tone: "secondary",
  },
  {
    label: "Verified completion",
    title: "Approve, then pay.",
    description:
      "Dynamic coordinates wallet payment when you accept a submission — settlement follows the work, not a spreadsheet.",
    tone: "accent",
  },
];
