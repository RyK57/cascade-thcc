"use client";

import { DynamicWidget } from "@dynamic-labs/sdk-react-core";
import { isDynamicConfigured } from "@/libs/dynamic";

export function DynamicAuthButton() {
  if (!isDynamicConfigured()) {
    return (
      <span className="text-xs text-muted-foreground">
        Set NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID
      </span>
    );
  }

  return <DynamicWidget />;
}
