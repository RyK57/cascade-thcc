"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DynamicProvider as DynamicSdkProvider } from "@dynamic-labs-sdk/react-hooks";
import { useState } from "react";
import { dynamicClient } from "@/libs/dynamic/dynamic-client";
import { WaasBootstrap } from "./waas-bootstrap";

interface DynamicProviderClientProps {
  children: React.ReactNode;
}

export function DynamicProviderClient({ children }: DynamicProviderClientProps) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <DynamicSdkProvider client={dynamicClient}>
        <WaasBootstrap />
        {children}
      </DynamicSdkProvider>
    </QueryClientProvider>
  );
}
