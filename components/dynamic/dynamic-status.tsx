"use client";

import { CircleAlert, Info, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

type StatusTone = "muted" | "error";

interface DynamicStatusProps {
  tone: StatusTone;
  title: string;
  /** Names the problem in plain language. */
  description: string;
  /** The raw SDK message, when there is one worth quoting. */
  detail?: string | null;
  /** Recovery — a retry button, a link out. */
  action?: React.ReactNode;
}

/**
 * The wallet's non-happy paths, rendered rather than swallowed. Every branch
 * that used to return `null` or a bare "Loading Dynamic…" comes through here.
 */
export function DynamicStatus({
  tone,
  title,
  description,
  detail,
  action,
}: DynamicStatusProps) {
  const Icon = tone === "error" ? TriangleAlert : Info;

  return (
    <div role={tone === "error" ? "alert" : "status"} className="flex gap-3">
      <Icon
        aria-hidden
        className={cn(
          "mt-0.5 size-4 shrink-0",
          tone === "error" ? "text-destructive" : "text-muted-foreground"
        )}
      />
      <div className="min-w-0 space-y-2">
        <p
          className={cn(
            "text-sm font-medium",
            tone === "error" ? "text-destructive" : "text-foreground"
          )}
        >
          {title}
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
        {detail ? (
          <p className="font-mono text-xs break-words text-muted-foreground">
            {detail}
          </p>
        ) : null}
        {action ? <div className="pt-1">{action}</div> : null}
      </div>
    </div>
  );
}

interface DynamicPendingProps {
  label: string;
  /** Shown once the wait stops looking normal. */
  slowNote?: string | null;
  action?: React.ReactNode;
}

/** Skeleton that holds the login form's height so nothing jumps on arrival. */
export function DynamicPending({ label, slowNote, action }: DynamicPendingProps) {
  return (
    <div>
      <div aria-hidden className="space-y-3">
        <div className="h-3 w-24 animate-pulse rounded-sm bg-foreground/10" />
        <div className="h-10 w-full animate-pulse rounded-lg bg-foreground/10" />
        <div className="h-10 w-32 animate-pulse rounded-full bg-foreground/10" />
      </div>
      <p role="status" className="mt-4 text-sm text-muted-foreground">
        {label}
      </p>
      {slowNote ? (
        <div className="mt-3 flex items-start gap-2">
          <CircleAlert
            aria-hidden
            className="mt-0.5 size-3.5 shrink-0 text-muted-foreground"
          />
          <p className="text-sm leading-relaxed text-muted-foreground">
            {slowNote}
          </p>
        </div>
      ) : null}
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}
