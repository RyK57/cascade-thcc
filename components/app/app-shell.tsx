import { cn } from "@/lib/utils";

interface AppShellProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Width container for the signed-in app. It shares the lander's gutter token
 * but runs a narrower measure: the lander's `--container-shell` (82rem) is
 * sized for full-bleed marketing sections, and at that width a single column of
 * operator content leaves half the viewport empty and pushes row labels and
 * their values an unreadable distance apart.
 */
export function AppShell({ children, className }: AppShellProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-[64rem] px-[var(--spacing-gutter)]",
        className
      )}
    >
      {children}
    </div>
  );
}
