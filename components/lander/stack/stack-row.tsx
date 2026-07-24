import type { StackItem } from "./stack-data";

interface StackRowProps {
  item: StackItem;
}

/** One cell of the spec grid: platform, the job it does, what it does. */
export function StackRow({ item }: StackRowProps) {
  return (
    <div className="flex h-full flex-col justify-between gap-10 p-6 sm:p-8 lg:gap-14 lg:p-9">
      <span className="label-caps text-muted-foreground">{item.role}</span>
      <div className="space-y-3">
        <h3 className="font-secondary text-[1.625rem] leading-[1.05] text-foreground">
          {item.name}
        </h3>
        <p className="max-w-[38ch] text-sm leading-relaxed text-muted-foreground">
          {item.description}
        </p>
      </div>
    </div>
  );
}
