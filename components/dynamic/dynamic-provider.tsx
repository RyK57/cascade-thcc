"use client";

import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { isDynamicConfigured } from "@/libs/dynamic/config";
import { DynamicPending, DynamicStatus } from "./dynamic-status";

interface DynamicProviderProps {
  children: ReactNode;
}

/**
 * Scoping boundary for the Dynamic SDK. Mount this around the surfaces that
 * actually call Dynamic hooks — never in the root layout, where it made every
 * page (including `/` and `/auth/*`, which have no wallet UI) pay for a CORS
 * handshake it could not complete.
 *
 * Children only render once the SDK provider is mounted, so a Dynamic hook can
 * never run outside its context, and every failure mode below renders
 * something a person can read and act on.
 *
 * Imports `libs/dynamic/config` directly rather than the `libs/dynamic` barrel:
 * the barrel re-exports the treasury module, which reaches into the server-only
 * Supabase client.
 */
export function DynamicProvider({ children }: DynamicProviderProps) {
  const configured = isDynamicConfigured();
  const [ClientProvider, setClientProvider] = useState<ComponentType<{
    children: ReactNode;
  }> | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!configured) return;

    let cancelled = false;

    void import("./dynamic-provider-client")
      .then((module) => {
        if (!cancelled) setClientProvider(() => module.DynamicProviderClient);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [configured, attempt]);

  if (!configured) {
    return (
      <DynamicStatus
        tone="muted"
        title="Wallet sign-in is off in this environment"
        description="Dynamic isn’t connected here, so no wallet can be created and no payment can be set up. Nothing on this page will move money."
      />
    );
  }

  if (failed) {
    return (
      <DynamicStatus
        tone="error"
        title="The wallet didn’t load"
        description="The browser couldn’t fetch the wallet code — usually a dropped connection. Nothing has been charged. Try again, or reload the page."
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setFailed(false);
              setAttempt((value) => value + 1);
            }}
          >
            Try again
          </Button>
        }
      />
    );
  }

  if (!ClientProvider) {
    return <DynamicPending label="Loading your wallet…" />;
  }

  return <ClientProvider>{children}</ClientProvider>;
}
