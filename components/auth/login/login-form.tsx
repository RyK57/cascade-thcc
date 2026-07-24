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
import { signInAction } from "@/libs/auth/sign-in";

interface LoginFormProps {
  nextPath?: string;
}

export function LoginForm({ nextPath = ROUTES.main }: LoginFormProps) {
  const [state, formAction, isPending] = useActionState(
    signInAction,
    INITIAL_AUTH_STATE,
  );

  return (
    <AuthCard title="Sign in" description="Access your prototype workspace.">
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="next" value={nextPath} />
        <AuthMessage error={state.error} success={state.success} />
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
            autoComplete="current-password"
            required
          />
        </div>
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Signing in…" : "Sign in"}
        </Button>
      </form>
      <div className="mt-4 flex flex-col gap-2 text-sm text-muted-foreground">
        <Link href={ROUTES.auth.forgotPassword} className="hover:text-foreground">
          Forgot password?
        </Link>
        <p>
          No account?{" "}
          <Link href={ROUTES.auth.signUp} className="text-foreground hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </AuthCard>
  );
}
