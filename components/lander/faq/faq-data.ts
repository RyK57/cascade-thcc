export interface FaqItem {
  question: string;
  answer: string;
}

export const FAQ_ITEMS: FaqItem[] = [
  {
    question: "What is Cascade?",
    answer:
      "An iMessage agent that routes every task to the cheapest capable worker: AI (free), a peer, or a verified Terac expert — paid with Dynamic USDC escrow.",
  },
  {
    question: "Where do experts come from?",
    answer:
      "Terac. Cascade drafts a verified-expert opportunity, shows the live quote, and only launches after you tapback or reply YES. Billed on approval.",
  },
  {
    question: "How do payments work?",
    answer:
      "You fund escrow from your Cascade wallet when a job needs it. The worker is paid only after you approve the deliverable in Messages.",
  },
  {
    question: "Will this spam people cold?",
    answer:
      "No. Linq is two-way and inbound-first. Peer claim pings only go to teammates who already texted the line.",
  },
  {
    question: "What’s the web app for?",
    answer:
      "Sign in, connect your wallet, and fund escrow when Messages sends you a pay link. The primary product surface is still iMessage.",
  },
] as const;
