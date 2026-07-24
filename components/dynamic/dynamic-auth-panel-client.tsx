"use client";

import { useInitStatus, useUser } from "@dynamic-labs-sdk/react-hooks";
import { DynamicDashboard } from "./dynamic-dashboard";
import { DynamicLogin } from "./dynamic-login";

export function DynamicAuthPanelClient() {
  const { data: initStatus } = useInitStatus();
  const { data: user } = useUser();

  if (initStatus !== "finished") {
    return <p className="text-sm text-muted-foreground">Loading Dynamic…</p>;
  }

  if (!user) return <DynamicLogin />;
  return <DynamicDashboard />;
}
