"use client";

import type { FormEvent } from "react";
import Link from "next/link";
import { useActionState } from "react";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthMessage } from "@/components/auth/auth-message";
import { AuthSubmit } from "@/components/auth/auth-submit";
import { AUTH_COPY, PASSWORD_MIN_LENGTH } from "@/components/auth/auth-copy";
import { AUTH_LINK_STRONG } from "@/components/auth/auth-styles";
import {
  validateConfirmation,
  validateNewPassword,
} from "@/components/auth/auth-validation";
import { PasswordField } from "@/components/auth/password-field";
import { useValidatedField } from "@/components/auth/use-validated-field";
import { INITIAL_AUTH_STATE } from "@/lib/types/auth";
import { ROUTES } from "@/lib/constants/routes";
import { updatePasswordAction } from "@/libs/auth/update-password";

export function UpdatePasswordForm() {
  const [state, formAction, isPending] = useActionState(
    updatePasswordAction,
    INITIAL_AUTH_STATE,
  );

  const password = useValidatedField(validateNewPassword);
  const confirmation = useValidatedField((value) =>
    validateConfirmation(password.value, value),
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const results = [password.check(), confirmation.check()];
    if (results.some((ok) => !ok)) event.preventDefault();
  }

  return (
    <AuthCard
      title={AUTH_COPY.updatePassword.title}
      description={AUTH_COPY.updatePassword.description}
      eyebrow="Step 2 of 2"
      footer={
        <>
          Link expired?{" "}
          <Link
            href={ROUTES.auth.forgotPassword}
            className={AUTH_LINK_STRONG}
          >
            Send a new one
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
        <AuthMessage error={state.error} context="update" />

        <PasswordField
          id="password"
          name="password"
          label="New password"
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
          label="Confirm new password"
          autoComplete="new-password"
          required
          {...confirmation.props}
        />

        <div className="pt-1">
          <AuthSubmit
            label="Save new password"
            pendingLabel="Saving password…"
            pending={isPending}
          />
        </div>
      </form>
    </AuthCard>
  );
}
