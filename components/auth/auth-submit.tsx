"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AuthSubmitProps {
  label: string;
  /** Present tense, so the button says what is happening right now. */
  pendingLabel: string;
  pending: boolean;
}

/** Primary action. Names what it does, and keeps naming it while it works. */
export function AuthSubmit({ label, pendingLabel, pending }: AuthSubmitProps) {
  return (
    <Button
      type="submit"
      size="lg"
      // A submitting button is not an inactive one: keep the fill at full
      // strength so "Signing in…" stays at the 4.65:1 the accent measures.
      className={pending ? "w-full disabled:opacity-100" : "w-full"}
      disabled={pending}
      aria-live="polite"
    >
      {pending ? (
        <>
          <Loader2 aria-hidden className="size-4 animate-spin" />
          {pendingLabel}
        </>
      ) : (
        label
      )}
    </Button>
  );
}
