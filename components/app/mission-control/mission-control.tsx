"use client";

import { useEffect, useState, type ComponentType } from "react";
import { isDynamicConfigured } from "@/libs/dynamic/config";

interface MissionControlProps {
  jobId: string;
}

/**
 * Lazy loader mirroring dynamic-auth-panel: the panel uses Dynamic hooks +
 * react-query, which only exist inside the lazily-mounted provider subtree.
 */
export function MissionControl({ jobId }: MissionControlProps) {
  const [Panel, setPanel] = useState<ComponentType<MissionControlProps> | null>(
    null
  );

  useEffect(() => {
    if (!isDynamicConfigured()) return;

    let cancelled = false;

    void import("./mission-control-panel").then((module) => {
      if (!cancelled) setPanel(() => module.MissionControlPanel);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!isDynamicConfigured()) {
    return (
      <p className="mx-auto max-w-3xl text-sm text-muted-foreground">
        Wallet checkout isn’t available in this environment right now. Nothing
        was charged — try again from the link in Messages later.
      </p>
    );
  }

  if (!Panel) {
    return (
      <p className="mx-auto max-w-3xl text-sm text-muted-foreground">
        Loading checkout…
      </p>
    );
  }

  return <Panel jobId={jobId} />;
}
