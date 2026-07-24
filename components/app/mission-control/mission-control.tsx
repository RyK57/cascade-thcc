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
      <p className="mx-auto max-w-3xl px-4 py-8 text-sm text-muted-foreground">
        Set <code>NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID</code> to open checkout.
      </p>
    );
  }

  if (!Panel) {
    return (
      <p className="mx-auto max-w-3xl px-4 py-8 text-sm text-muted-foreground">
        Loading Mission Control…
      </p>
    );
  }

  return <Panel jobId={jobId} />;
}
