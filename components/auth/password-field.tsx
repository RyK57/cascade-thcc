"use client";

import { useId, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { AuthField, type AuthFieldProps } from "./auth-field";
import { passwordStrength } from "./auth-validation";

type PasswordFieldProps = Omit<AuthFieldProps, "type" | "detail" | "detailId"> & {
  /** Show the strength meter. Only where a password is being chosen. */
  showStrength?: boolean;
};

/**
 * A password field you can read back. Mistyped passwords are the single largest
 * source of failed sign-ins, and the reveal control costs one button; the
 * strength meter appears only where a password is being chosen, and grades the
 * margin above the rule rather than inventing rules the server does not enforce.
 */
export function PasswordField({
  showStrength = false,
  value,
  hint,
  ...props
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const strengthId = useId();
  const strength = showStrength && value ? passwordStrength(value) : null;

  return (
    <AuthField
      {...props}
      value={value}
      // The standing rule is guidance until there is something to grade; after
      // that the meter says the same thing with more precision.
      hint={strength ? undefined : hint}
      type={visible ? "text" : "password"}
      inputClassName="pr-11"
      detailId={strength ? strengthId : undefined}
      detail={
        strength ? (
          <div className="space-y-1.5 pt-0.5">
            <div aria-hidden className="flex gap-1">
              {[1, 2, 3, 4].map((step) => (
                <span
                  key={step}
                  className={cn(
                    "h-[3px] flex-1 transition-colors duration-200",
                    step <= strength.score ? "bg-brand-accent" : "bg-foreground/15",
                  )}
                />
              ))}
            </div>
            <p
              id={strengthId}
              className="text-[0.8125rem] leading-snug text-muted-foreground"
            >
              <span className="text-foreground">{strength.label}.</span>{" "}
              {strength.hint}
            </p>
          </div>
        ) : null
      }
    >
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        aria-pressed={visible}
        aria-label={visible ? "Hide password" : "Show password"}
        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
      >
        {visible ? (
          <EyeOff aria-hidden className="size-4" />
        ) : (
          <Eye aria-hidden className="size-4" />
        )}
      </button>
    </AuthField>
  );
}
