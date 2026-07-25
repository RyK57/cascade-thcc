"use client";

import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Clock, MessageSquare } from "lucide-react";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthField } from "@/components/auth/auth-field";
import { AuthNotice } from "@/components/auth/auth-notice";
import { AuthSubmit } from "@/components/auth/auth-submit";
import { AUTH_LINK_STRONG } from "@/components/auth/auth-styles";
import { ROUTES } from "@/lib/constants/routes";

interface PhoneLoginFormProps {
  nextPath?: string;
  /** True when a magic link was already dead by the time it was opened. */
  expired?: boolean;
}

type Step = "phone" | "code";

/**
 * Sign in with the phone you text Cascade from. Two steps so the code field
 * only ever appears once a code is actually on its way.
 */
export function PhoneLoginForm({ nextPath, expired }: PhoneLoginFormProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [pending, setPending] = useState(false);

  async function requestCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);

    if (phone.replace(/[^\d]/g, "").length < 7) {
      setError("Enter your phone number.");
      return;
    }

    setPending(true);
    try {
      const response = await fetch(ROUTES.api.accountCode, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        setError(data?.error ?? "Couldn't send a code. Try again shortly.");
        return;
      }
      setStep("code");
    } catch {
      setError("Couldn't reach Cascade. Check your connection and retry.");
    } finally {
      setPending(false);
    }
  }

  async function submitCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);

    if (!/^\d{6}$/.test(code.trim())) {
      setError("Enter the 6-digit code from your Messages thread.");
      return;
    }

    setPending(true);
    try {
      const response = await fetch(ROUTES.api.accountVerify, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code: code.trim() }),
      });
      const data = (await response.json().catch(() => null)) as {
        error?: string;
        next?: string;
      } | null;

      if (!response.ok) {
        setError(data?.error ?? "That code didn't work. Ask for a new one.");
        return;
      }

      router.replace(nextPath || data?.next || ROUTES.main);
      router.refresh();
    } catch {
      setError("Couldn't reach Cascade. Check your connection and retry.");
    } finally {
      setPending(false);
    }
  }

  if (step === "code") {
    return (
      <AuthCard
        title="Enter your code"
        description={`We texted a 6-digit code to ${phone}.`}
        footer={
          <button
            type="button"
            className={AUTH_LINK_STRONG}
            onClick={() => {
              setStep("phone");
              setCode("");
              setError(undefined);
            }}
          >
            Use a different number
          </button>
        }
      >
        <form onSubmit={submitCode} noValidate className="space-y-5">
          <AuthField
            id="code"
            name="code"
            label="6-digit code"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="000000"
            value={code}
            onValueChange={setCode}
            error={error}
            required
            autoFocus
          />
          <AuthSubmit
            label="Sign in"
            pendingLabel="Checking…"
            pending={pending}
          />
        </form>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Sign in with your phone"
      description="Cascade texts you a code. No password to remember."
      footer={
        <>
          Running the operator console?{" "}
          <Link href={ROUTES.auth.login} className={AUTH_LINK_STRONG}>
            Sign in with email
          </Link>
        </>
      }
    >
      <form onSubmit={requestCode} noValidate className="space-y-5">
        {expired ? (
          <AuthNotice icon={Clock} role="status">
            That sign-in link had already been used or expired. Get a fresh code
            below.
          </AuthNotice>
        ) : (
          <AuthNotice icon={MessageSquare}>
            New here? Cascade will text your first code and introduce itself —
            that thread becomes your account.
          </AuthNotice>
        )}

        <AuthField
          id="phone"
          name="phone"
          label="Phone number"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="+1 (555) 012-3456"
          value={phone}
          onValueChange={setPhone}
          error={error}
          required
          autoFocus
        />

        <AuthSubmit
          label="Text me a code"
          pendingLabel="Sending…"
          pending={pending}
        />
      </form>
    </AuthCard>
  );
}
