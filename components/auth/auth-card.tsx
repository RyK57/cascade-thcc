import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface AuthCardProps {
  /** Rendered as the page's one and only <h1>. */
  title: string;
  description?: ReactNode;
  /** Bracketed technical marker, e.g. "Step 1 of 2". Only where sequence matters. */
  eyebrow?: string;
  children: ReactNode;
  /** Sits below the panel, on the page ground — never a second box inside the first. */
  footer?: ReactNode;
  className?: string;
}

/**
 * The auth panel. A square hairline plate on the near-black ground — the same
 * drafting vocabulary the marketing surface uses for its panels, so crossing
 * from the landing page into a password field does not read as a second company.
 */
export function AuthCard({
  title,
  description,
  eyebrow,
  children,
  footer,
  className,
}: AuthCardProps) {
  return (
    <div className="w-full max-w-[25rem]">
      <Card
        className={cn(
          "gap-6 rounded-none border border-hairline bg-card pt-8 pb-7 ring-0",
          "shadow-[0_28px_60px_-30px_rgba(0,0,0,0.85)]",
          "[--card-spacing:--spacing(6)]",
          className,
        )}
      >
        <CardHeader className="flex flex-col gap-0">
          {eyebrow ? (
            <p className="label-caps mb-5 text-muted-foreground">[ {eyebrow} ]</p>
          ) : null}
          <CardTitle
            as="h1"
            className="font-secondary text-[1.75rem] leading-[1.08] tracking-[-0.02em] text-balance text-foreground"
          >
            {title}
          </CardTitle>
          {description ? (
            <p className="mt-2.5 text-[0.9375rem] leading-relaxed text-muted-foreground">
              {description}
            </p>
          ) : null}
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
      {footer ? (
        <div className="mt-6 text-center text-sm text-muted-foreground">
          {footer}
        </div>
      ) : null}
    </div>
  );
}
