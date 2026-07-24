import type { FaqItem } from "./faq-data";

interface FaqItemCardProps {
  item: FaqItem;
}

export function FaqItemCard({ item }: FaqItemCardProps) {
  return (
    <div className="grid gap-3 border-b border-hairline py-8 last:border-b-0 md:grid-cols-[0.9fr_1.1fr] md:gap-10">
      <h3 className="text-lg font-medium tracking-tight text-foreground">
        {item.question}
      </h3>
      <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
        {item.answer}
      </p>
    </div>
  );
}
