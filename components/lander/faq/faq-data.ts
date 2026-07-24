export interface FaqItem {
  question: string;
  answer: string;
}

export const FAQ_ITEMS: FaqItem[] = [
  {
    question: "What is Cascade?",
    answer:
      "An iMessage agent that routes every task to the cheapest capable worker: AI (free), a seeded peer, or a verified Terac expert — paid with sandbox Dynamic USDC.",
  },
  {
    question: "Where do experts come from?",
    answer:
      "Terac. Cascade drafts a verified-expert opportunity, shows the live quote, and only launches after you tapback or reply YES. Billed on approval.",
  },
  {
    question: "How do sandbox payments work?",
    answer:
      "Dynamic sandbox + Base Sepolia testnet only — no real dollars. Escrow to the Cascade treasury, then instant sandbox payout on approve (simulated when server-wallet keys are missing).",
  },
  {
    question: "Will this spam people cold?",
    answer:
      "No. Linq is two-way and inbound-first. Peer claim pings only go to seeded teammates who already texted the line.",
  },
  {
    question: "What’s the /main app for?",
    answer:
      "Sandbox wallet pay for a job (?job=), open job list, and integration status. The primary product surface is still iMessage.",
  },
] as const;
