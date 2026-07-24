import { cn } from "@/lib/utils";

interface ColorBlockProps {
  label: string;
  title: string;
  description: string;
  tone: "accent" | "secondary";
  meta?: string;
  className?: string;
}

/**
 * The two solid blocks are the only saturated surfaces on the page. Text on
 * them is the full foreground value — an opacity step here drops white below
 * 4.5:1 on both fills, so hierarchy comes from size and the mesh instead.
 */
export function ColorBlock({
  label,
  title,
  description,
  tone,
  meta,
  className,
}: ColorBlockProps) {
  const isAccent = tone === "accent";

  return (
    <div
      className={cn(
        "relative isolate flex min-h-[17rem] flex-col justify-between gap-10 overflow-hidden p-6 sm:min-h-[19rem] sm:p-8 lg:p-10",
        isAccent
          ? "bg-brand-accent text-brand-accent-foreground"
          : "bg-brand-secondary text-brand-secondary-foreground",
        className
      )}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 rules-mesh" />

      <p className="label-caps relative">{label}</p>

      <div className="relative space-y-4">
        {meta ? (
          <div className="flex flex-wrap items-baseline gap-x-5 gap-y-2">
            <h3 className="font-secondary text-[clamp(3.5rem,7vw,5rem)] leading-[0.85]">
              {title}
            </h3>
            <p className="label-caps">{meta}</p>
          </div>
        ) : (
          <h3 className="max-w-[14ch] font-secondary text-[clamp(2rem,3.4vw,2.75rem)] leading-[1.02] text-balance">
            {title}
          </h3>
        )}
        <p className="max-w-[46ch] text-sm leading-relaxed text-pretty sm:text-base">
          {description}
        </p>
      </div>
    </div>
  );
}
