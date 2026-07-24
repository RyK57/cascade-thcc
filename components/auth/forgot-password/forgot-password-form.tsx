"use client";

import type { FormEvent } from "react";
import Link from "next/link";
import { useActionState, useState } from "react";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthConfirmation } from "@/components/auth/auth-confirmation";
import { AuthField } from "@/components/auth/auth-field";
import { AuthMessage } from "@/components/auth/auth-message";
import { AuthSubmit } from "@/components/auth/auth-submit";
import { AUTH_COPY } from "@/components/auth/auth-copy";
import { AUTH_LINK, AUTH_LINK_STRONG } from "@/components/auth/auth-styles";
import { validateEmail } from "@/components/auth/auth-validation";
import { useValidatedField } from "@/components/auth/use-validated-field";
import { Button } from "@/components/ui/button";
import { INITIAL_AUTH_STATE } from "@/lib/types/auth";
import { ROUTES } from "@/lib/constants/routes";
import { forgotPasswordAction } from "@/libs/auth/forgot-password";

export function ForgotPasswordForm() {
  const [state, formAction, isPending] = useActionState(
    forgotPasswordAction,
    INITIAL_AUTH_STATE,
  );
  const [editing, setEditing] = useState(false);
  const email = useValidatedField(validateEmail);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (!email.check()) event.preventDefault();
  }

  if (state.success && !editing) {
    return (
      <AuthCard title="Check your email" eyebrow="Step 1 of 2">
        <AuthConfirmation
          detail={
            <>
              We sent a reset link to{" "}
              <span className="text-accent-ink break-words">{email.value}</span>.
            </>
          }
          steps={[
            "Open the newest email from us and follow the link.",
            "Set a new password. The link works once, so use the latest one you were sent.",
          ]}
        >
          <Button size="lg" variant="outline" className="w-full" asChild>
            <Link href={ROUTES.auth.login}>Back to sign in</Link>
          </Button>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className={`${AUTH_LINK} block w-full text-center text-sm text-muted-foreground`}
          >
            Nothing arrived? Check the address and resend
          </button>
        </AuthConfirmation>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title={AUTH_COPY.forgotPassword.title}
      description={AUTH_COPY.forgotPassword.description}
      eyebrow="Step 1 of 2"
      footer={
        <>
          Remembered it?{" "}
          <Link href={ROUTES.auth.login} className={AUTH_LINK_STRONG}>
            Back to sign in
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
        <AuthMessage error={state.error} context="reset" />

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

        <div className="pt-1">
          <AuthSubmit
            label="Send reset link"
            pendingLabel="Sending link…"
            pending={isPending}
          />
        </div>
      </form>
    </AuthCard>
  );
}
