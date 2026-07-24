import { cn } from "@/lib/utils";
import { LanderLabel } from "./shell";

interface ColorBlockProps {
  label: string;
  title: string;
  description: string;
  tone: "accent" | "secondary";
  meta?: string;
  className?: string;
}

export function ColorBlock({
  label,
  title,
  description,
  tone,
  meta,
  className,
}: ColorBlockProps) {
  return (
    <div
      className={cn(
        "flex min-h-56 flex-col justify-between gap-8 p-6 sm:min-h-64 sm:p-8",
        tone === "accent" && "bg-brand-accent text-brand-accent-foreground",
        tone === "secondary" &&
          "bg-brand-secondary text-brand-secondary-foreground",
        className
      )}
    >
      <LanderLabel
        bracketed
        className={
          tone === "accent"
            ? "text-brand-accent-foreground/70"
            : "text-brand-secondary-foreground/70"
        }
      >
        {label}
      </LanderLabel>

      <div className="space-y-3">
        {meta ? (
          <div className="flex flex-wrap items-end gap-4">
            <p className="font-secondary text-6xl leading-none sm:text-7xl">
              {title}
            </p>
            <p className="label-caps pb-2 opacity-80">{meta}</p>
          </div>
        ) : (
          <h3 className="font-secondary text-3xl leading-tight sm:text-4xl">
            {title}
          </h3>
        )}
        <p className="max-w-md text-sm leading-relaxed opacity-85">
          {description}
        </p>
      </div>
    </div>
  );
}
