/**
 * One-time bootstrap: creates the agent's server-side wallet on Dynamic.
 *
 * NOTE: @dynamic-labs-wallet/node is darwin/linux only (native binary) — run
 * this on a Mac, Linux box, WSL, or a Vercel/Cursor Cloud shell, not Windows.
 *
 * Usage:
 *   NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID=... DYNAMIC_API_KEY=... \
 *   AGENT_WALLET_PASSWORD=... pnpm agent:create-wallet
 *
 * Then put the printed walletMetadata JSON in .env.local as
 * AGENT_WALLET_METADATA='<one-line JSON>' and fund the address:
 * - Gas: any Base Sepolia ETH faucet
 * - USDC: https://faucet.circle.com (Base Sepolia)
 */
import type { DynamicEvmWalletClient } from "@dynamic-labs-wallet/node-evm";

type CreateWalletArgs = Parameters<DynamicEvmWalletClient["createWalletAccount"]>[0];

async function main() {
  const environmentId = process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID?.trim();
  const apiToken =
    process.env.DYNAMIC_API_TOKEN?.trim() || process.env.DYNAMIC_API_KEY?.trim();
  const password = process.env.AGENT_WALLET_PASSWORD?.trim();

  if (!environmentId || !apiToken || !password) {
    console.error(
      "Set NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID, DYNAMIC_API_KEY, and AGENT_WALLET_PASSWORD."
    );
    process.exit(1);
  }

  if (process.platform === "win32") {
    console.error(
      "@dynamic-labs-wallet/node has no Windows binary. Run this script on macOS/Linux/WSL."
    );
    process.exit(1);
  }

  const { DynamicEvmWalletClient: Client } = await import(
    "@dynamic-labs-wallet/node-evm"
  );
  const client = new Client({ environmentId });
  await client.authenticateApiToken(apiToken);

  const { walletMetadata } = await client.createWalletAccount({
    thresholdSignatureScheme:
      "TWO_OF_TWO" as CreateWalletArgs["thresholdSignatureScheme"],
    password,
    backUpToDynamic: true,
  });

  console.log("Agent wallet created.");
  console.log("Address:", walletMetadata.accountAddress);
  console.log("\nAdd this line to .env.local (single line, single quotes):");
  console.log(`AGENT_WALLET_METADATA='${JSON.stringify(walletMetadata)}'`);
  console.log(
    "\nThen fund the address above with Base Sepolia ETH (gas) — its USDC arrives via escrow deposits."
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
