import { LanderLabel } from "@/components/lander/shell";
import type { StackItem } from "./stack-data";

interface StackRowProps {
  item: StackItem;
}

export function StackRow({ item }: StackRowProps) {
  return (
    <div className="flex flex-col gap-4 p-6 sm:p-8">
      <LanderLabel bracketed>{item.role}</LanderLabel>
      <div className="flex flex-1 flex-col justify-end gap-2 pt-8">
        <h3 className="text-lg font-medium uppercase tracking-[0.14em]">
          {item.name}
        </h3>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {item.description}
        </p>
      </div>
    </div>
  );
}
