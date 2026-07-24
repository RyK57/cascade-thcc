"use client";

import { useEffect, useState, type ComponentType } from "react";
import { isDynamicConfigured } from "@/libs/dynamic";

export function DynamicAuthPanel() {
  const [Panel, setPanel] = useState<ComponentType | null>(null);

  useEffect(() => {
    if (!isDynamicConfigured()) return;

    let cancelled = false;

    void import("./dynamic-auth-panel-client").then((module) => {
      if (!cancelled) setPanel(() => module.DynamicAuthPanelClient);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!isDynamicConfigured()) {
    return (
      <p className="text-sm text-muted-foreground">
        Set <code>NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID</code>
      </p>
    );
  }

  if (!Panel) {
    return <p className="text-sm text-muted-foreground">Loading Dynamic…</p>;
  }

  return <Panel />;
}
