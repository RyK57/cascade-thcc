#!/usr/bin/env tsx
/**
 * Smoke test for the real payout pipeline: sends a sponsored (gasless)
 * zero-value USDC transfer from the treasury to itself on Base Sepolia.
 * Proves MPC signing + Fireblocks relayer + 7702 auto-delegation end to end
 * without needing any USDC balance. Prints a Basescan link on success.
 *
 * Usage: node --import tsx scripts/smoke-sponsored-tx.ts
 */
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

async function loadEnvFile(filename: string) {
  try {
    const contents = await readFile(resolve(process.cwd(), filename), "utf8");
    for (const line of contents.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const index = trimmed.indexOf("=");
      if (index === -1) continue;
      const key = trimmed.slice(0, index).trim();
      if (!process.env[key]) process.env[key] = trimmed.slice(index + 1).trim();
    }
  } catch {
    // optional
  }
}

async function main() {
  await loadEnvFile(".env.local");
  await loadEnvFile(".env");

  const { DynamicEvmWalletClient } = await import(
    "@dynamic-labs-wallet/node-evm"
  );
  const { encodeFunctionData, erc20Abi } = await import("viem");
  const { getTreasuryWallet } = await import("../db/treasury");
  const { BASE_SEPOLIA_CHAIN_ID, BASE_SEPOLIA_USDC_ADDRESS, explorerTxUrl } =
    await import("../libs/dynamic/sandbox");

  const treasury = await getTreasuryWallet();
  if (!treasury?.walletMetadata) {
    throw new Error("No treasury — run scripts/bootstrap-treasury.ts first");
  }
  console.log(`treasury: ${treasury.address}`);

  const client = new DynamicEvmWalletClient({
    environmentId: process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID!,
  });
  await client.authenticateApiToken(process.env.DYNAMIC_API_KEY!);
  console.log("authenticated; sending sponsored 0-value USDC transfer…");

  const { transactionHash } = await client.sendSponsoredTransaction({
    walletMetadata: treasury.walletMetadata as never,
    externalServerKeyShares: JSON.parse(process.env.DYNAMIC_SERVER_KEY_SHARES!),
    password: process.env.DYNAMIC_TREASURY_PASSWORD,
    autoDelegate: true,
    chainId: BASE_SEPOLIA_CHAIN_ID,
    rpcUrl: process.env.DYNAMIC_SANDBOX_RPC_URL,
    calls: [
      {
        target: BASE_SEPOLIA_USDC_ADDRESS as `0x${string}`,
        data: encodeFunctionData({
          abi: erc20Abi,
          functionName: "transfer",
          args: [treasury.address as `0x${string}`, BigInt(0)],
        }),
        value: BigInt(0),
      },
    ],
  });
  console.log(`REAL TX: ${explorerTxUrl(transactionHash)}`);
}

main().catch((error) => {
  console.error("FAILED:", error instanceof Error ? error.message : error);
  process.exit(1);
});
