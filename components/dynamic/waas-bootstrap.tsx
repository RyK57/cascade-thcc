"use client";

import { useOnEvent } from "@dynamic-labs-sdk/react-hooks";
import {
  createWaasWalletAccounts,
  getChainsMissingWaasWalletAccounts,
} from "@dynamic-labs-sdk/client/waas";

export function WaasBootstrap() {
  useOnEvent({
    event: "userChanged",
    listener: async (user) => {
      if (!user) return;
      const missingChains = getChainsMissingWaasWalletAccounts();
      if (missingChains.length === 0) return;
      await createWaasWalletAccounts({ chains: missingChains });
    },
  });

  return null;
}
