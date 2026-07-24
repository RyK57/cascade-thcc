import type { FaqItem } from "./faq-data";

interface FaqItemCardProps {
  item: FaqItem;
}

export function FaqItemCard({ item }: FaqItemCardProps) {
  return (
    <article className="rounded-xl border border-border/60 bg-card p-6">
      <h3 className="text-base font-medium">{item.question}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{item.answer}</p>
    </article>
  );
}
