import type { ReactNode } from "react";

interface AuthConfirmationProps {
  /** What was sent, and to whom — echoed back so a typo is catchable. */
  detail: ReactNode;
  /** What to do next, in order. */
  steps: string[];
  children: ReactNode;
}

/**
 * The done state. A form that has succeeded should stop being a form: the task
 * is over, and what remains is a short instruction plus the way out. Leaving
 * the fields on screen under a green line invites a second submit nobody wants.
 */
export function AuthConfirmation({
  detail,
  steps,
  children,
}: AuthConfirmationProps) {
  return (
    <div className="space-y-5">
      <p className="text-[0.9375rem] leading-relaxed text-foreground">{detail}</p>
      <ol className="space-y-2.5 border-t border-hairline pt-5">
        {steps.map((step, index) => (
          <li key={step} className="flex gap-3 text-sm leading-relaxed text-muted-foreground">
            <span aria-hidden className="label-caps text-accent-ink mt-1 shrink-0">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
      <div className="space-y-3">{children}</div>
    </div>
  );
}
