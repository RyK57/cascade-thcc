"use client";

import type { FormEvent } from "react";
import Link from "next/link";
import { useActionState } from "react";
import { Check, Lock } from "lucide-react";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthField } from "@/components/auth/auth-field";
import { AuthMessage } from "@/components/auth/auth-message";
import { AuthNotice } from "@/components/auth/auth-notice";
import { AuthSubmit } from "@/components/auth/auth-submit";
import { AUTH_COPY, describeDestination } from "@/components/auth/auth-copy";
import { AUTH_LINK, AUTH_LINK_STRONG } from "@/components/auth/auth-styles";
import {
  validateCurrentPassword,
  validateEmail,
} from "@/components/auth/auth-validation";
import { PasswordField } from "@/components/auth/password-field";
import { useValidatedField } from "@/components/auth/use-validated-field";
import { INITIAL_AUTH_STATE } from "@/lib/types/auth";
import { ROUTES } from "@/lib/constants/routes";
import { signInAction } from "@/libs/auth/sign-in";

interface LoginFormProps {
  nextPath?: string;
  /** True after the update-password flow hands control back here. */
  passwordUpdated?: boolean;
}

export function LoginForm({ nextPath, passwordUpdated }: LoginFormProps) {
  const [state, formAction, isPending] = useActionState(
    signInAction,
    INITIAL_AUTH_STATE,
  );
  const email = useValidatedField(validateEmail);
  const password = useValidatedField(validateCurrentPassword);

  // The route guard sends people here with a `next` in the query string. Saying
  // so is the difference between "I was interrupted" and "something broke".
  const destination = describeDestination(nextPath);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const results = [email.check(), password.check()];
    if (results.some((ok) => !ok)) event.preventDefault();
  }

  return (
    <AuthCard
      title={AUTH_COPY.login.title}
      description={AUTH_COPY.login.description}
      footer={
        <>
          No account yet?{" "}
          <Link href={ROUTES.auth.signUp} className={AUTH_LINK_STRONG}>
            Create one
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
        <input type="hidden" name="next" value={nextPath ?? ROUTES.main} />

        {passwordUpdated || destination || state.error ? (
          <div className="space-y-3">
            {passwordUpdated ? (
              <AuthNotice icon={Check} role="status">
                Your new password is saved. Sign in with it to continue.
              </AuthNotice>
            ) : null}

            {destination ? (
              <AuthNotice icon={Lock}>
                {destination === "the page you asked for"
                  ? "That page is behind sign-in. Sign in and we'll take you straight back to it."
                  : `${destination.charAt(0).toUpperCase()}${destination.slice(1)} is behind sign-in — sign in and we'll take you straight there.`}
              </AuthNotice>
            ) : null}

            <AuthMessage error={state.error} context="sign-in" />
          </div>
        ) : null}

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
          autoComplete="current-password"
          required
          // Standalone control, not inline prose, so it earns a full 44px touch
          // target. The negative margin absorbs the extra height so the label
          // row keeps its original rhythm.
          labelAction={
            <Link
              href={ROUTES.auth.forgotPassword}
              className={`${AUTH_LINK} -my-2.5 inline-flex min-h-11 items-center py-2.5 text-[0.8125rem] text-muted-foreground`}
            >
              Forgot password?
            </Link>
          }
          {...password.props}
        />

        <div className="pt-1">
          <AuthSubmit
            label="Sign in"
            pendingLabel="Signing in…"
            pending={isPending}
          />
        </div>
      </form>
    </AuthCard>
  );
}
