"use client";

import { useEffect, useState } from "react";
import { initializeClient } from "@dynamic-labs-sdk/client";
import { useInitStatus, useUser } from "@dynamic-labs-sdk/react-hooks";
import { Button } from "@/components/ui/button";
import { DynamicDashboard } from "./dynamic-dashboard";
import { DynamicLogin } from "./dynamic-login";
import { DynamicPending, DynamicStatus } from "./dynamic-status";

/** How long a normal init takes before the wait needs explaining. */
const SLOW_INIT_MS = 8000;

/**
 * Chooses between sign-in and the wallet. Unlike the version it replaces, it
 * says something when the SDK never finishes initialising instead of sitting
 * on "Loading Dynamic…" forever.
 *
 * Must be rendered inside `DynamicProvider`.
 */
export function DynamicAuthPanel() {
  const { data: initStatus, error: initError } = useInitStatus();
  const { data: user } = useUser();
  const [slowElapsed, setSlowElapsed] = useState(false);
  const settled = initStatus === "finished" || initStatus === "failed";
  const slow = slowElapsed && !settled;

  useEffect(() => {
    if (settled) return;
    const timer = setTimeout(() => setSlowElapsed(true), SLOW_INIT_MS);
    return () => clearTimeout(timer);
  }, [settled]);

  const retry = (
    <Button variant="outline" size="sm" onClick={() => void initializeClient()}>
      Try again
    </Button>
  );

  if (initStatus === "failed") {
    return (
      <DynamicStatus
        tone="error"
        title="Couldn’t reach the wallet service"
        description="Dynamic didn’t start up, so you can’t sign in or create a wallet right now. Nothing has been charged. Retry, or reload the page if it keeps failing."
        detail={initError?.message ?? null}
        action={retry}
      />
    );
  }

  if (!settled) {
    return (
      <DynamicPending
        label="Connecting to your wallet…"
        slowNote={
          slow
            ? "This is taking longer than usual — the wallet service may be unreachable from this network."
            : null
        }
        action={slow ? retry : null}
      />
    );
  }

  if (!user) return <DynamicLogin />;
  return <DynamicDashboard />;
}
