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
      "Yes. Payouts settle directly into the worker's own wallet the moment you approve — in USDC by default, or ETH. It's theirs immediately: hold it, spend it, or cash it out. Cascade never takes custody in between.",
  },
  {
    question: "Can I cap what it spends?",
    answer:
      "Set a per-task and per-month budget. Cascade works freely under the cap and stops in the thread for your approval above it, so an agent with your wallet never surprises you.",
  },
  {
    question: "Which currencies can I pay in?",
    answer:
      "USDC or ETH. Prices are quoted in dollars either way — pick ETH and Cascade converts at the live rate and shows you the exact amount, the rate it used, and the network fee before you confirm.",
  },
  {
    question: "How long does a professional take?",
    answer:
      "Longer than AI, and Cascade says so before quoting. Hiring a person takes two confirmations: one for the turnaround estimate, then one for the price. Nothing is charged at the first.",
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
