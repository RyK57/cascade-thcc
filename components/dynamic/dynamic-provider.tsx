"use client";

import { DynamicContextProvider } from "@dynamic-labs/sdk-react-core";
import { EthereumWalletConnectors } from "@dynamic-labs/ethereum";
import { getDynamicEnvironmentId } from "@/libs/dynamic";

interface DynamicProviderProps {
  children: React.ReactNode;
}

export function DynamicProvider({ children }: DynamicProviderProps) {
  const environmentId = getDynamicEnvironmentId();

  if (!environmentId) return <>{children}</>;

  return (
    <DynamicContextProvider
      theme="auto"
      settings={{
        environmentId,
        walletConnectors: [EthereumWalletConnectors],
      }}
    >
      {children}
    </DynamicContextProvider>
  );
}
