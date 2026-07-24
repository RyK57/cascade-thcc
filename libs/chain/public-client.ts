import { createPublicClient, http } from "viem";
import { baseSepolia } from "viem/chains";
import { getBaseSepoliaRpcUrl } from "@/libs/dynamic/agent-wallet";

function buildClient() {
  return createPublicClient({
    chain: baseSepolia,
    transport: http(getBaseSepoliaRpcUrl()),
  });
}

let client: ReturnType<typeof buildClient> | null = null;

/** Memoized read-only client for Base Sepolia (server-side balance reads). */
export function getPublicClient(): ReturnType<typeof buildClient> {
  if (!client) client = buildClient();
  return client;
}
