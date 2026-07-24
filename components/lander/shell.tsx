import { cn } from "@/lib/utils";

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

/** Section frame with optional vertical rules + hairline top border */
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
        "relative border-t border-hairline py-[var(--spacing-section)]",
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

/** Technical all-caps label used across lander sections */
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
