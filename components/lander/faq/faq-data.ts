export interface FaqItem {
  question: string;
  answer: string;
}

export const FAQ_ITEMS: FaqItem[] = [
  {
    question: "Do I need Supabase keys to run the app?",
    answer:
      "No. The app loads without keys and skips auth/database features until you add them.",
  },
  {
    question: "Where does product UI live?",
    answer:
      "Authenticated UI goes in components/app/ and routes under app/main/. Landers stay in components/lander/.",
  },
  {
    question: "How does the prototype subagent work?",
    answer:
      "It reads agents/skills/prototype-subagent and asks branding and functionality questions before implementing features.",
  },
] as const;
