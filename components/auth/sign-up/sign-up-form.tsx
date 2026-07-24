"use client";

import type { FormEvent } from "react";
import Link from "next/link";
import { useActionState, useState } from "react";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthConfirmation } from "@/components/auth/auth-confirmation";
import { AuthField } from "@/components/auth/auth-field";
import { AuthMessage } from "@/components/auth/auth-message";
import { AuthSubmit } from "@/components/auth/auth-submit";
import { AUTH_COPY, PASSWORD_MIN_LENGTH } from "@/components/auth/auth-copy";
import { AUTH_LINK, AUTH_LINK_STRONG } from "@/components/auth/auth-styles";
import {
  validateConfirmation,
  validateEmail,
  validateNewPassword,
} from "@/components/auth/auth-validation";
import { PasswordField } from "@/components/auth/password-field";
import { useValidatedField } from "@/components/auth/use-validated-field";
import { Button } from "@/components/ui/button";
import { INITIAL_AUTH_STATE } from "@/lib/types/auth";
import { ROUTES } from "@/lib/constants/routes";
import { signUpAction } from "@/libs/auth/sign-up";

export function SignUpForm() {
  const [state, formAction, isPending] = useActionState(
    signUpAction,
    INITIAL_AUTH_STATE,
  );
  // See ForgotPasswordForm: keyed on the result object so a fresh result
  // clears it, instead of a boolean that never reset and left a successful
  // resend with no visible confirmation.
  const [editedFrom, setEditedFrom] = useState<typeof state | null>(null);
  const editing = editedFrom === state;

  const fullName = useValidatedField(() => undefined);
  const email = useValidatedField(validateEmail);
  const password = useValidatedField(validateNewPassword);
  const confirmation = useValidatedField((value) =>
    validateConfirmation(password.value, value),
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const results = [email.check(), password.check(), confirmation.check()];
    if (results.some((ok) => !ok)) event.preventDefault();
  }

  if (state.success && !editing) {
    return (
      <AuthCard title="Confirm your email">
        <AuthConfirmation
          detail={
            <>
              We sent a confirmation link to{" "}
              <span className="text-accent-ink break-words">{email.value}</span>.
            </>
          }
          steps={[
            "Open the email and follow the link. That confirms the address is yours.",
            "Come back and sign in with the password you just chose.",
          ]}
        >
          <Button size="lg" className="w-full" asChild>
            <Link href={ROUTES.auth.login}>Go to sign in</Link>
          </Button>
          <button
            type="button"
            onClick={() => setEditedFrom(state)}
            className={`${AUTH_LINK} block w-full text-center text-sm text-muted-foreground`}
          >
            Wrong address? Edit it and send again
          </button>
        </AuthConfirmation>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title={AUTH_COPY.signUp.title}
      description={AUTH_COPY.signUp.description}
      footer={
        <>
          Already have an account?{" "}
          <Link href={ROUTES.auth.login} className={AUTH_LINK_STRONG}>
            Sign in
          </Link>
        </>
      }
    >
      <form
        action={formAction}
        onSubmit={handleSubmit}
        noValidate
        aria-busy={isPending}
        className="space-y-5"
      >
        <AuthMessage error={state.error} context="sign-up" />

        <AuthField
          id="fullName"
          name="fullName"
          label="Full name"
          autoComplete="name"
          hint="Optional. It's the name people you hire will see."
          {...fullName.props}
        />

        <AuthField
          id="email"
          name="email"
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          required
          {...email.props}
        />

        <PasswordField
          id="password"
          name="password"
          label="Password"
          autoComplete="new-password"
          required
          showStrength
          hint={`At least ${PASSWORD_MIN_LENGTH} characters.`}
          {...password.props}
          onBlur={() => {
            password.props.onBlur();
            confirmation.revalidate();
          }}
        />

        <PasswordField
          id="confirmPassword"
          name="confirmPassword"
          label="Confirm password"
          autoComplete="new-password"
          required
          {...confirmation.props}
        />

        <div className="pt-1">
          <AuthSubmit
            label="Create account"
            pendingLabel="Creating account…"
            pending={isPending}
          />
        </div>
      </form>
    </AuthCard>
  );
}
