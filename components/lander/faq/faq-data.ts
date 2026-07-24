export interface FaqItem {
  question: string;
  answer: string;
}

export const FAQ_ITEMS: FaqItem[] = [
  {
    question: "What is Cascade?",
    answer:
      "An agent you text like a person. It answers what it can itself, and hires a vetted professional through Terac for everything else — with the money handled end to end by Dynamic.",
  },
  {
    question: "Where do the professionals come from?",
    answer:
      "Terac. Cascade drafts the brief, shows you the live quote, and only hires after you tapback or reply YES. Their rating moves with what they actually deliver.",
  },
  {
    question: "How do payments work?",
    answer:
      "You fund escrow from your Cascade wallet when a job needs it. The money is held — not spent — until you approve the deliverable in Messages.",
  },
  {
    question: "Do workers get paid in real money?",
    answer:
      "Yes. Payouts settle in stablecoin directly into the worker's own wallet the moment you approve. It's theirs immediately — hold it, spend it, or cash it out. Cascade never takes custody in between.",
  },
  {
    question: "Can I cap what it spends?",
    answer:
      "Set a per-task and per-month budget. Cascade works freely under the cap and stops in the thread for your approval above it, so an agent with your wallet never surprises you.",
  },
  {
    question: "Will this spam people cold?",
    answer:
      "No. Linq is two-way and inbound-first. Claim pings only go to workers who already texted the line.",
  },
  {
    question: "What's the web app for?",
    answer:
      "Sign in, connect your wallet, set budgets, and fund escrow when Messages sends you a pay link. The primary product surface is still iMessage.",
  },
  {
    question: "Is this live with real funds today?",
    answer:
      "The flow you see here is the real one — same escrow, same approval gate, same instant payout. The public demo settles on a test network so you can try it end to end without spending anything.",
  },
] as const;
