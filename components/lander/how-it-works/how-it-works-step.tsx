import type { HowItWorksStep } from "./how-it-works-data";

interface HowItWorksStepRowProps {
  item: HowItWorksStep;
}

export function HowItWorksStepRow({ item }: HowItWorksStepRowProps) {
  return (
    <li className="flex gap-3">
      <span
        aria-hidden
        className="mt-1.5 size-2 shrink-0 bg-brand-secondary"
      />
      <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
        <span className="font-medium text-foreground">{item.title}. </span>
        {item.description}
      </p>
    </li>
  );
}
