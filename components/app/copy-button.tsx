"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CopyState = "idle" | "copied" | "failed";

interface CopyButtonProps {
  /** The exact string written to the clipboard. */
  value: string;
  /** Accessible name, e.g. "Copy wallet address". */
  label: string;
  className?: string;
}

/**
 * Copy affordance with all three outcomes visible: idle, copied, and the
 * failure the Clipboard API throws on insecure origins or denied permission.
 */
export function CopyButton({ value, label, className }: CopyButtonProps) {
  const [state, setState] = useState<CopyState>("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  async function copy() {
    if (timer.current) clearTimeout(timer.current);
    try {
      await navigator.clipboard.writeText(value);
      setState("copied");
    } catch {
      setState("failed");
    }
    timer.current = setTimeout(() => setState("idle"), 2400);
  }

  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={copy}
        aria-label={label}
      >
        {state === "copied" ? (
          <Check className="size-3.5 text-accent-ink" aria-hidden />
        ) : (
          <Copy className="size-3.5" aria-hidden />
        )}
      </Button>
      <span
        role="status"
        aria-live="polite"
        className={cn(
          "text-xs",
          state === "failed" ? "text-destructive" : "text-muted-foreground"
        )}
      >
        {state === "copied" ? "Copied" : null}
        {state === "failed" ? "Couldn’t copy — select it and press ⌘C" : null}
      </span>
    </span>
  );
}
