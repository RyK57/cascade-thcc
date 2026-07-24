import type { ComponentType, ReactNode, SVGProps } from "react";
import { cn } from "@/lib/utils";

interface AuthNoticeProps {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  children: ReactNode;
  /** `status` is announced politely; use it for anything that appeared after an action. */
  role?: "status" | "note";
  className?: string;
}

/**
 * A quiet inline strip for context the user needs before acting — chiefly "you
 * were sent here, and here is why". Tonal lift only: no border, no radius games,
 * nothing that would make it read as a second card inside the panel.
 */
export function AuthNotice({
  icon: Icon,
  children,
  role = "note",
  className,
}: AuthNoticeProps) {
  return (
    <div
      role={role === "status" ? "status" : undefined}
      className={cn(
        "flex gap-2.5 bg-foreground/[0.055] px-3.5 py-3 text-[0.875rem] leading-relaxed text-muted-foreground",
        className,
      )}
    >
      <Icon aria-hidden className="text-accent-ink mt-0.5 size-4 shrink-0" />
      <p>{children}</p>
    </div>
  );
}
