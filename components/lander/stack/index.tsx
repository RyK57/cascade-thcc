import { ColorBlock } from "@/components/lander/color-block";
import { LanderSection, LanderShell } from "@/components/lander/shell";
import { STACK, STACK_BLOCKS, STACK_ITEMS } from "./stack-data";
import { StackRow } from "./stack-row";

export function StackSection() {
  return (
    <LanderSection id="stack">
      <LanderShell className="space-y-10">
        <div className="max-w-2xl space-y-3">
          <h2 className="font-secondary text-4xl leading-[1.05] tracking-tight sm:text-5xl">
            {STACK.headline}
          </h2>
          <p className="text-base text-muted-foreground sm:text-lg">
            {STACK.support}
          </p>
        </div>

        <div className="grid gap-px border border-hairline bg-hairline md:grid-cols-2 xl:grid-cols-4">
          {STACK_ITEMS.map((item) => (
            <div key={item.name} className="bg-background">
              <StackRow item={item} />
            </div>
          ))}
        </div>

        <div className="grid gap-px border border-hairline bg-hairline md:grid-cols-2">
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
