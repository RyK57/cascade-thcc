import { ColorBlock } from "@/components/lander/color-block";
import {
  LanderSection,
  LanderShell,
  SectionHead,
} from "@/components/lander/shell";
import { STACK, STACK_BLOCKS, STACK_ITEMS } from "./stack-data";
import { StackRow } from "./stack-row";

export function StackSection() {
  return (
    <LanderSection id="stack">
      <LanderShell>
        <SectionHead title={STACK.headline} support={STACK.support} />

        <div className="mt-14 grid gap-px border border-hairline bg-hairline md:mt-20 md:grid-cols-2 xl:grid-cols-4 lg:mt-24">
          {STACK_ITEMS.map((item) => (
            <div key={item.name} className="bg-background">
              <StackRow item={item} />
            </div>
          ))}
        </div>

        <div className="mt-px grid gap-px border border-hairline border-t-0 bg-hairline md:grid-cols-2">
          {STACK_BLOCKS.map((block) => (
            <ColorBlock
              key={block.label}
              label={block.label}
              title={block.title}
              meta={block.meta}
              description={block.description}
              tone={block.tone}
            />
          ))}
        </div>
      </LanderShell>
    </LanderSection>
  );
}
