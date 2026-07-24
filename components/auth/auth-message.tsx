import Link from "next/link";
import { CircleAlert } from "lucide-react";
import { mapAuthError, type AuthErrorContext } from "./auth-copy";
import { AUTH_LINK_STRONG } from "./auth-styles";

interface AuthMessageProps {
  /** Raw error from a server action. Never rendered as-is. */
  error?: string;
  context: AuthErrorContext;
}

/**
 * Failure, in the product's own words. Supabase's strings are written for the
 * developer reading a stack trace; `mapAuthError` turns each one into a problem
 * plus a way out, and unknown codes fall back to copy that still offers a route
 * forward instead of a shrug.
 *
 * A tinted strip rather than a bordered alert: the panel around it is already a
 * box, and a box inside a box is the nesting this surface refuses.
 */
export function AuthMessage({ error, context }: AuthMessageProps) {
  if (!error) return null;

  const { message, action } = mapAuthError(error, context);

  return (
    <div
      role="alert"
      className="flex gap-2.5 bg-destructive/12 px-3.5 py-3 text-[0.875rem] leading-relaxed text-destructive"
    >
      <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
      <p>
        {message}
        {action ? (
          <>
            {" "}
            <Link href={action.href} className={`${AUTH_LINK_STRONG} underline`}>
              {action.label}
            </Link>
          </>
        ) : null}
      </p>
    </div>
  );
}
