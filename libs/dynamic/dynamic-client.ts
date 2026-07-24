import { createDynamicClient, initializeClient } from "@dynamic-labs-sdk/client";
import { addEvmExtension } from "@dynamic-labs-sdk/evm";
import { BRAND } from "@/lib/constants/branding";

const environmentId =
  process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID?.trim() ?? "";

function getUniversalLink(): string {
  if (typeof window !== "undefined") return window.location.origin;
  return process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000";
}

export const isDynamicClientReady = Boolean(environmentId);

export const dynamicClient = createDynamicClient({
  autoInitialize: false,
  environmentId: environmentId || "missing-environment-id",
  metadata: {
    name: BRAND.name,
    // IMPORTANT: the property is `universalLink`, not `url`
    universalLink: getUniversalLink(),
  },
});

// Register extensions immediately, before initialization completes.
// Extension functions take NO arguments — do not pass the client instance.
addEvmExtension();

if (isDynamicClientReady) {
  void initializeClient();
}
