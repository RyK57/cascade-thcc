"use client";

import { useEffect, useState } from "react";
import { useSendEmailOTP, useVerifyOTP } from "@dynamic-labs-sdk/react-hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const RESEND_COOLDOWN_SECONDS = 30;
const CODE_LENGTH = 6;

function looksLikeEmail(value: string): boolean {
  const trimmed = value.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

interface FieldErrorProps {
  id: string;
  title: string;
  detail?: string | null;
}

function FieldError({ id, title, detail }: FieldErrorProps) {
  return (
    <div
      id={id}
      role="alert"
      className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2"
    >
      <p className="text-sm font-medium text-destructive">{title}</p>
      {detail ? (
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          {detail}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Email → one-time code, with the three things the previous version dropped on
 * the floor: both mutation errors rendered, a way back to the email field once
 * a code has been sent, and a resend that can't be hammered.
 */
export function DynamicLogin() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  /** Set once a code is out; also the value we resend to. */
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  const {
    mutate: sendEmailOTP,
    data: otpVerification,
    error: sendError,
    isPending: isSending,
    reset: resetSend,
  } = useSendEmailOTP();

  const {
    mutate: verifyOTP,
    error: verifyError,
    isPending: isVerifying,
    reset: resetVerify,
  } = useVerifyOTP();

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  function send(address: string) {
    resetVerify();
    sendEmailOTP(
      { email: address },
      {
        onSuccess: () => {
          setSentTo(address);
          setCooldown(RESEND_COOLDOWN_SECONDS);
        },
      }
    );
  }

  function changeEmail() {
    setSentTo(null);
    setCode("");
    setCooldown(0);
    resetSend();
    resetVerify();
  }

  const emailValid = looksLikeEmail(email);

  // ── Step 1: which address gets the code ────────────────────────────────
  if (!sentTo) {
    return (
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (emailValid && !isSending) send(email.trim());
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="dynamic-email">Email</Label>
          <Input
            id="dynamic-email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            value={email}
            aria-invalid={sendError ? true : undefined}
            aria-describedby={sendError ? "dynamic-email-error" : undefined}
            onChange={(event) => setEmail(event.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            We send a six-digit code. No password, no seed phrase.
          </p>
        </div>

        {sendError ? (
          <FieldError
            id="dynamic-email-error"
            title="We couldn’t send that code"
            detail={`${sendError.message} — check the address and try again.`}
          />
        ) : null}

        <Button type="submit" disabled={!emailValid || isSending}>
          {isSending ? "Sending…" : "Email me a code"}
        </Button>
      </form>
    );
  }

  // ── Step 2: the code, with a way back ──────────────────────────────────
  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (otpVerification && code.length === CODE_LENGTH && !isVerifying) {
          verifyOTP({ otpVerification, verificationToken: code });
        }
      }}
    >
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm">
        <span className="text-muted-foreground">Code sent to</span>
        <span className="font-medium break-all text-foreground">{sentTo}</span>
        <Button
          type="button"
          variant="link"
          size="xs"
          className="h-auto px-0 text-accent-ink"
          onClick={changeEmail}
        >
          Change
        </Button>
      </div>

      <div className="space-y-2">
        <Label htmlFor="dynamic-otp">Verification code</Label>
        <Input
          id="dynamic-otp"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={CODE_LENGTH}
          placeholder="123456"
          value={code}
          aria-invalid={verifyError ? true : undefined}
          aria-describedby={verifyError ? "dynamic-otp-error" : undefined}
          className="max-w-[12rem] font-mono tracking-[0.3em]"
          onChange={(event) =>
            setCode(
              event.target.value.replace(/\D/g, "").slice(0, CODE_LENGTH)
            )
          }
        />
      </div>

      {verifyError ? (
        <FieldError
          id="dynamic-otp-error"
          title="That code didn’t work"
          detail={`${verifyError.message} — codes expire after a few minutes. Re-type the six digits, or send a new one.`}
        />
      ) : null}

      {sendError ? (
        <FieldError
          id="dynamic-resend-error"
          title="Couldn’t send a new code"
          detail={`${sendError.message} — wait a moment and try again.`}
        />
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="submit"
          disabled={!otpVerification || code.length < CODE_LENGTH || isVerifying}
        >
          {isVerifying ? "Verifying…" : "Verify"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={cooldown > 0 || isSending}
          onClick={() => send(sentTo)}
        >
          {isSending
            ? "Resending…"
            : cooldown > 0
              ? `Resend in ${cooldown}s`
              : "Resend code"}
        </Button>
      </div>
    </form>
  );
}
