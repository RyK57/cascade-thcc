#!/usr/bin/env tsx
/**
 * One-time bootstrap of the Cascade sandbox treasury: creates a Dynamic MPC
 * server wallet (TWO_OF_TWO), persists it to treasury_wallets, and writes the
 * server key shares + password into .env.local so payoutFromTreasury can
 * broadcast real sponsored USDC transfers on Base Sepolia.
 *
 * Usage: node --import tsx scripts/bootstrap-treasury.ts
 * Idempotent: re-running with an existing real treasury + env shares is a no-op.
 */
import { randomBytes } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const ENV_FILE = ".env.local";

async function loadEnvFile(filename: string) {
  const path = resolve(process.cwd(), filename);
  try {
    const contents = await readFile(path, "utf8");
    for (const line of contents.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const index = trimmed.indexOf("=");
      if (index === -1) continue;
      const key = trimmed.slice(0, index).trim();
      const value = trimmed.slice(index + 1).trim();
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // optional env file
  }
}

async function upsertEnvVars(vars: Record<string, string>) {
  const path = resolve(process.cwd(), ENV_FILE);
  let contents = "";
  try {
    contents = await readFile(path, "utf8");
  } catch {
    // create fresh
  }
  for (const [key, value] of Object.entries(vars)) {
    const line = `${key}=${value}`;
    const pattern = new RegExp(`^${key}=.*$`, "m");
    contents = pattern.test(contents)
      ? contents.replace(pattern, line)
      : `${contents.trimEnd()}\n${line}\n`;
  }
  await writeFile(path, contents.endsWith("\n") ? contents : `${contents}\n`);
}

async function main() {
  await loadEnvFile(".env.local");
  await loadEnvFile(".env");

  const environmentId = process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID?.trim();
  const apiToken = process.env.DYNAMIC_API_KEY?.trim();
  if (!environmentId || !apiToken) {
    console.error(
      "Set NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID and DYNAMIC_API_KEY first."
    );
    process.exit(1);
  }

  const { getTreasuryWallet, upsertTreasuryWallet } = await import(
    "../db/treasury"
  );

  const existing = await getTreasuryWallet();
  const hasRealTreasury =
    existing?.walletMetadata &&
    (existing.walletMetadata as { mode?: string }).mode !== "simulated";
  if (hasRealTreasury && process.env.DYNAMIC_SERVER_KEY_SHARES?.trim()) {
    console.log("Treasury already bootstrapped:");
    console.log(`- address: ${existing!.address}`);
    process.exit(0);
  }

  const password =
    process.env.DYNAMIC_TREASURY_PASSWORD?.trim() ||
    randomBytes(24).toString("base64url");

  const { DynamicEvmWalletClient } = await import(
    "@dynamic-labs-wallet/node-evm"
  );
  const client = new DynamicEvmWalletClient({ environmentId });
  await client.authenticateApiToken(apiToken);

  console.log("Creating MPC server wallet (TWO_OF_TWO)…");
  const created = await client.createWalletAccount({
    // String value matches the ThresholdSignatureScheme enum at runtime.
    thresholdSignatureScheme: "TWO_OF_TWO" as never,
    password,
    backUpToDynamic: true,
  });

  const address = created.walletMetadata.accountAddress as string;
  await upsertTreasuryWallet({
    address,
    walletMetadata: created.walletMetadata as unknown as Record<
      string,
      unknown
    >,
  });

  await upsertEnvVars({
    DYNAMIC_TREASURY_PASSWORD: password,
    DYNAMIC_SERVER_KEY_SHARES: JSON.stringify(created.externalServerKeyShares),
    DYNAMIC_SANDBOX_RPC_URL:
      process.env.DYNAMIC_SANDBOX_RPC_URL?.trim() || "https://sepolia.base.org",
  });

  console.log("Treasury bootstrapped:");
  console.log(`- address: ${address}`);
  console.log(`- key shares + password written to ${ENV_FILE} (gitignored)`);
  console.log(
    `- fund it with Base Sepolia test USDC: https://faucet.circle.com (send to ${address})`
  );
}

main().catch((error) => {
  console.error("Bootstrap failed:", error);
  process.exit(1);
});
