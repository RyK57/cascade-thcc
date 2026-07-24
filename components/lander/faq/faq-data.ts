export interface FaqItem {
  question: string;
  answer: string;
}

export const FAQ_ITEMS: FaqItem[] = [
  {
    question: "Do I hire people by texting?",
    answer:
      "Yes. You message the Linq Number, describe the job, and the agent runs the hiring loop in that same iMessage thread — with RCS/SMS fallback when needed.",
  },
  {
    question: "Where do the experts come from?",
    answer:
      "Terac. The agent drafts a verified-expert opportunity, shows estimated cost, and only launches after you confirm. You can approve or reject submissions from the conversation.",
  },
  {
    question: "How do payments work?",
    answer:
      "Dynamic coordinates wallets and settlement. After you accept work, payment is tied to that approval — not a separate back-office process.",
  },
  {
    question: "Will this spam people cold?",
    answer:
      "No. Linq is built for two-way conversation. The product is inbound-first and opt-in — not blast lists or cold outreach.",
  },
  {
    question: "What’s the operator app for?",
    answer:
      "The web app at /main shows integration status and Dynamic login while you build. The primary product surface is still the iMessage thread.",
  },
] as const;
