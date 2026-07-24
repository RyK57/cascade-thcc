"use client";

import Link from "next/link";
import { useActionState } from "react";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthMessage } from "@/components/auth/auth-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { INITIAL_AUTH_STATE } from "@/lib/types/auth";
import { ROUTES } from "@/lib/constants/routes";
import { forgotPasswordAction } from "@/libs/auth/forgot-password";

export function ForgotPasswordForm() {
  const [state, formAction, isPending] = useActionState(
    forgotPasswordAction,
    INITIAL_AUTH_STATE,
  );

  return (
    <AuthCard
      title="Forgot password"
      description="We will email you a reset link."
    >
      <form action={formAction} className="space-y-4">
        <AuthMessage error={state.error} success={state.success} />
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Sending…" : "Send reset link"}
        </Button>
      </form>
      <p className="mt-4 text-sm text-muted-foreground">
        <Link href={ROUTES.auth.login} className="text-foreground hover:underline">
          Back to sign in
        </Link>
      </p>
    </AuthCard>
  );
}
