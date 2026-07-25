/**
 * Check the Cascade agent wallet's Base Sepolia ETH and top it up from an
 * optional gas-tank EOA. Without GAS_TANK_PRIVATE_KEY this is check-only and
 * prints faucet links.
 *
 * Usage: pnpm agent:fund-gas
 */
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  createPublicClient,
  createWalletClient,
  formatEther,
  getAddress,
  http,
  isAddress,
  type Hex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";
import { getAgentWalletAddress, getBaseSepoliaRpcUrl } from "../libs/dynamic/agent-wallet";
import {
  calculateAgentGasTopUpWei,
  getAgentGasTargetWei,
} from "../libs/dynamic/gas-tank";

const FAUCET_LINKS = [
  "https://www.alchemy.com/faucets/base-sepolia",
  "https://faucet.quicknode.com/base/sepolia",
] as const;

async function loadEnvFile(filename: string): Promise<void> {
  try {
    const contents = await readFile(resolve(process.cwd(), filename), "utf8");
    for (const line of contents.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const separator = trimmed.indexOf("=");
      if (separator === -1) continue;

      const key = trimmed.slice(0, separator).trim();
      if (process.env[key]) continue;

      const rawValue = trimmed.slice(separator + 1).trim();
      process.env[key] = rawValue.replace(/^(['"])(.*)\1$/, "$2");
    }
  } catch {
    // Optional env file.
  }
}

function getGasTankPrivateKey(): Hex | undefined {
  const privateKey = process.env.GAS_TANK_PRIVATE_KEY?.trim();
  if (!privateKey) return undefined;
  if (!/^0x[0-9a-fA-F]{64}$/.test(privateKey)) {
    throw new Error("GAS_TANK_PRIVATE_KEY must be a 32-byte 0x-prefixed key.");
  }
  return privateKey as Hex;
}

function printFaucetInstructions(agentAddress: string): void {
  console.log(`\nFund ${agentAddress} with Base Sepolia ETH:`);
  for (const link of FAUCET_LINKS) console.log(`- ${link}`);
}

function resolveAgentAddress(): `0x${string}` {
  const address =
    process.env.AGENT_WALLET_ADDRESS?.trim() || getAgentWalletAddress();
  if (!address) {
    throw new Error(
      "Set AGENT_WALLET_ADDRESS or AGENT_WALLET_METADATA first."
    );
  }
  if (!isAddress(address)) {
    throw new Error("AGENT_WALLET_ADDRESS is not a valid EVM address.");
  }
  return getAddress(address);
}

async function main(): Promise<void> {
  await loadEnvFile(".env.local");
  await loadEnvFile(".env");

  const agentAddress = resolveAgentAddress();

  const rpcUrl = getBaseSepoliaRpcUrl();
  const publicClient = createPublicClient({
    chain: baseSepolia,
    transport: http(rpcUrl),
  });
  const targetWei = getAgentGasTargetWei();
  const balanceWei = await publicClient.getBalance({
    address: agentAddress,
  });
  const topUpWei = calculateAgentGasTopUpWei(balanceWei, targetWei);

  console.log(`Agent wallet: ${agentAddress}`);
  console.log(`Current gas: ${formatEther(balanceWei)} ETH`);
  console.log(`Target gas:  ${formatEther(targetWei)} ETH`);

  if (topUpWei === 0n) {
    console.log("Gas balance is healthy; no top-up needed.");
    return;
  }

  const privateKey = getGasTankPrivateKey();
  if (!privateKey) {
    console.log(`Gas shortfall: ${formatEther(topUpWei)} ETH`);
    console.log("GAS_TANK_PRIVATE_KEY is unset; no transaction was sent.");
    printFaucetInstructions(agentAddress);
    return;
  }

  const account = privateKeyToAccount(privateKey);
  if (account.address.toLowerCase() === agentAddress.toLowerCase()) {
    throw new Error("Gas tank and agent wallet must be different addresses.");
  }

  const [tankBalanceWei, gas, fees] = await Promise.all([
    publicClient.getBalance({ address: account.address }),
    publicClient.estimateGas({
      account: account.address,
      to: agentAddress,
      value: topUpWei,
    }),
    publicClient.estimateFeesPerGas(),
  ]);
  const maxFeePerGas = fees.maxFeePerGas ?? fees.gasPrice;
  const requiredWei = topUpWei + gas * maxFeePerGas;
  if (tankBalanceWei < requiredWei) {
    throw new Error(
      `Gas tank ${account.address} has ${formatEther(tankBalanceWei)} ETH; ` +
        `${formatEther(requiredWei)} ETH is required for top-up plus gas.`
    );
  }

  const walletClient = createWalletClient({
    account,
    chain: baseSepolia,
    transport: http(rpcUrl),
  });
  const hash = await walletClient.sendTransaction({
    to: agentAddress,
    value: topUpWei,
  });
  const receipt = await publicClient.waitForTransactionReceipt({ hash });

  if (receipt.status !== "success") {
    throw new Error(`Gas top-up reverted: ${hash}`);
  }

  console.log(`Sent ${formatEther(topUpWei)} ETH from ${account.address}.`);
  console.log(`Receipt: https://sepolia.basescan.org/tx/${hash}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
