"use client";

import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import { isDynamicConfigured } from "@/libs/dynamic";

interface DynamicProviderProps {
  children: ReactNode;
}

export function DynamicProvider({ children }: DynamicProviderProps) {
  const [ClientProvider, setClientProvider] = useState<ComponentType<{
    children: ReactNode;
  }> | null>(null);

  useEffect(() => {
    if (!isDynamicConfigured()) return;

    let cancelled = false;

    void import("./dynamic-provider-client").then((module) => {
      if (!cancelled) setClientProvider(() => module.DynamicProviderClient);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!isDynamicConfigured() || !ClientProvider) return <>{children}</>;

  return <ClientProvider>{children}</ClientProvider>;
}
