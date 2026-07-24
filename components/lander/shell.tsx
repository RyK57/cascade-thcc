import { cn } from "@/lib/utils";

/** Cream focus ring on a background offset — matches the button primitive. */
export const FOCUS_RING =
  "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

interface LanderShellProps {
  children: React.ReactNode;
  className?: string;
}

/** Full-width shell with gutters + max width from design tokens */
export function LanderShell({ children, className }: LanderShellProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-[var(--container-shell)] px-[var(--spacing-gutter)]",
        className
      )}
    >
      {children}
    </div>
  );
}

interface LanderSectionProps {
  id?: string;
  children: React.ReactNode;
  className?: string;
  rules?: boolean;
}

/**
 * Section frame: hairline top border, optional drafting column rules, and the
 * page's vertical rhythm. Padding opens up with the viewport so the sheet
 * breathes on desktop instead of scaling one fixed block everywhere.
 */
export function LanderSection({
  id,
  children,
  className,
  rules = false,
}: LanderSectionProps) {
  return (
    <section
      id={id}
      className={cn(
        "relative border-t border-hairline",
        "py-[calc(var(--spacing-section)*0.75)] md:py-[var(--spacing-section)] lg:py-[calc(var(--spacing-section)*1.3)]",
        rules && "rules-x",
        className
      )}
    >
      {children}
    </section>
  );
}

interface LanderLabelProps {
  children: React.ReactNode;
  className?: string;
  bracketed?: boolean;
}

/**
 * Technical all-caps label. Caps are the machine voice and live *inside* the
 * product artifacts (thread panel, spec grid, colour blocks) — never as an
 * eyebrow above a section heading. The bracketed form is the channel signature
 * and is used exactly once on the page.
 */
export function LanderLabel({
  children,
  className,
  bracketed = false,
}: LanderLabelProps) {
  return (
    <p className={cn("label-caps text-muted-foreground", className)}>
      {bracketed ? `[ ${children} ]` : children}
    </p>
  );
}

interface SectionHeadProps {
  title: React.ReactNode;
  support?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

/**
 * Shared section opening. The heading carries the section's identity on its
 * own, and the space above a heading always exceeds the space below it.
 */
export function SectionHead({
  title,
  support,
  action,
  className,
}: SectionHeadProps) {
  return (
    <div
      className={cn(
        "grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:gap-16",
        className
      )}
    >
      <div>
        <h2 className="max-w-[17ch] font-secondary text-[clamp(2.125rem,4.4vw,3.5rem)] leading-[0.98] text-balance text-foreground">
          {title}
        </h2>
        {support ? (
          <p className="mt-6 max-w-[52ch] text-base leading-relaxed text-pretty text-muted-foreground sm:text-lg">
            {support}
          </p>
        ) : null}
      </div>
      {action ? <div className="lg:pb-2">{action}</div> : null}
    </div>
  );
}
