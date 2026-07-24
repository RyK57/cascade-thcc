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
import { signUpAction } from "@/libs/auth/sign-up";

export function SignUpForm() {
  const [state, formAction, isPending] = useActionState(
    signUpAction,
    INITIAL_AUTH_STATE,
  );

  return (
    <AuthCard title="Create account" description="Start building your prototype.">
      <form action={formAction} className="space-y-4">
        <AuthMessage error={state.error} success={state.success} />
        <div className="space-y-2">
          <Label htmlFor="fullName">Full name</Label>
          <Input id="fullName" name="fullName" autoComplete="name" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
        </div>
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Creating account…" : "Sign up"}
        </Button>
      </form>
      <p className="mt-4 text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href={ROUTES.auth.login} className="text-foreground hover:underline">
          Sign in
        </Link>
      </p>
    </AuthCard>
  );
}
