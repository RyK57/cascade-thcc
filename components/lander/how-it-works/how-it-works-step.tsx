import type { HowItWorksStep } from "./how-it-works-data";

interface HowItWorksStepRowProps {
  item: HowItWorksStep;
  system: string;
}

/**
 * One move in the loop. The ordered list and the accent rail above it carry the
 * sequence, so the cells never have to shout "01 / 02 / 03".
 */
export function HowItWorksStepRow({ item, system }: HowItWorksStepRowProps) {
  return (
    <li className="flex flex-col border-b border-hairline p-6 last:border-b-0 sm:p-8 lg:border-b-0 lg:border-r lg:p-10 lg:last:border-r-0">
      <span className="label-caps text-secondary-ink">{system}</span>
      {/* Fixed offset rather than justify-end, so every title in the row sits
          on the same baseline no matter how long its description runs. */}
      <div className="mt-9 flex flex-col gap-3 sm:mt-16">
        <h3 className="font-secondary text-[1.75rem] leading-[1.04] text-foreground sm:text-[2rem]">
          {item.title}
        </h3>
        <p className="max-w-[44ch] text-sm leading-relaxed text-muted-foreground sm:text-base">
          {item.description}
        </p>
      </div>
    </li>
  );
}
