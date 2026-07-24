import {
  LanderSection,
  LanderShell,
  SectionHead,
} from "@/components/lander/shell";
import { FaqAccordion } from "./faq-accordion";
import { FAQ_ITEMS } from "./faq-data";

export function FaqSection() {
  return (
    <LanderSection id="faq" rules>
      <LanderShell className="grid gap-10 lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)] lg:gap-20">
        <SectionHead
          title="Straight answers"
          support="What Cascade does, who does the work, and where the money is."
          className="lg:sticky lg:top-32 lg:self-start"
        />
        <FaqAccordion items={FAQ_ITEMS} />
      </LanderShell>
    </LanderSection>
  );
}
