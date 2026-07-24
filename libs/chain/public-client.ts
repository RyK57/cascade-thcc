import { createPublicClient, http } from "viem";
import { baseSepolia } from "viem/chains";
import { getSandboxRpcUrl } from "@/libs/dynamic/sandbox";

function buildClient() {
  return createPublicClient({
    chain: baseSepolia,
    transport: http(getSandboxRpcUrl() || "https://sepolia.base.org"),
  });
}

let client: ReturnType<typeof buildClient> | null = null;

/** Memoized read-only client for Base Sepolia (server-side balance reads). */
export function getPublicClient(): ReturnType<typeof buildClient> {
  if (!client) client = buildClient();
  return client;
}
