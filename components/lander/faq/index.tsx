import { LanderLabel, LanderSection, LanderShell } from "@/components/lander/shell";
import { FaqItemCard } from "./faq-item";
import { FAQ_ITEMS } from "./faq-data";

export function FaqSection() {
  return (
    <LanderSection id="faq">
      <LanderShell>
        <div className="mb-4 max-w-2xl space-y-4">
          <LanderLabel bracketed>FAQ</LanderLabel>
          <h2 className="font-secondary text-4xl leading-[1.05] tracking-tight sm:text-5xl">
            Straight answers
          </h2>
        </div>
        <div className="border-t border-hairline">
          {FAQ_ITEMS.map((item) => (
            <FaqItemCard key={item.question} item={item} />
          ))}
        </div>
      </LanderShell>
    </LanderSection>
  );
}
