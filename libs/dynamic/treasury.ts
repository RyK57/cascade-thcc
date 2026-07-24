import {
  getTreasuryWallet,
  upsertTreasuryWallet,
  type TreasuryWallet,
} from "@/db/treasury";
import { createPayout } from "@/db/payouts";
import { PAYOUT_STATUS } from "@/utils/schema/payout";
import {
  BASE_SEPOLIA_CHAIN_ID,
  BASE_SEPOLIA_USDC_ADDRESS,
  explorerTxUrl,
  getSandboxRpcUrl,
  isServerWalletConfigured,
} from "./sandbox";

const SIMULATED_TREASURY =
  process.env.DYNAMIC_SANDBOX_TREASURY_ADDRESS?.trim() ||
  "0xCascadeSandboxTreasury000000000000001";

/**
 * Resolve the sandbox treasury address. Uses persisted wallet when present;
 * otherwise a deterministic sandbox placeholder (no mainnet, no real funds).
 */
export async function ensureSandboxTreasury(): Promise<TreasuryWallet> {
  const existing = await getTreasuryWallet();
  if (existing) return existing;

  if (isServerWalletConfigured()) {
    try {
      const created = await createServerWalletAccount();
      return upsertTreasuryWallet({
        address: created.address,
        walletMetadata: created.walletMetadata,
      });
    } catch (error) {
      console.warn(
        "[dynamic] server wallet create failed; using simulated treasury",
        error
      );
    }
  }

  return upsertTreasuryWallet({
    address: SIMULATED_TREASURY,
    walletMetadata: { mode: "simulated", chainId: BASE_SEPOLIA_CHAIN_ID },
  });
}

async function createServerWalletAccount(): Promise<{
  address: string;
  walletMetadata: Record<string, unknown>;
}> {
  // Dynamic server-wallet SDK is a native addon — load only when configured.
  // Use a runtime specifier so Vitest/Vite does not eagerly resolve optional deps.
  const specifier = "@dynamic-labs-wallet/" + "node-evm";
  const mod = await import(/* webpackIgnore: true */ specifier);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const DynamicEvmWalletClient =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (mod as any).DynamicEvmWalletClient ?? (mod as any).default;

  const environmentId = process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID!;
  const apiToken =
    process.env.DYNAMIC_API_KEY?.trim() ||
    process.env.DYNAMIC_SERVER_API_KEY?.trim();
  if (!apiToken) throw new Error("DYNAMIC_API_KEY required for server wallet");

  const client = new DynamicEvmWalletClient({ environmentId });
  await client.authenticateApiToken(apiToken);

  const { walletMetadata, externalServerKeyShares } =
    await client.createWalletAccount({
      thresholdSignatureScheme: "TWO_OF_TWO",
      password: process.env.DYNAMIC_TREASURY_PASSWORD!,
      backUpToDynamic: true,
    });

  console.info(
    "[dynamic] created sandbox server wallet; persist DYNAMIC_SERVER_KEY_SHARES securely",
    {
      shareBytes: JSON.stringify(externalServerKeyShares).length,
    }
  );

  return {
    address: walletMetadata.accountAddress as string,
    walletMetadata: walletMetadata as Record<string, unknown>,
  };
}

export interface PayoutResult {
  txHash: string;
  status: "simulated" | "broadcast";
  explorerUrl: string;
}

/**
 * Pay a peer from the sandbox treasury. When server-wallet keys are missing,
 * records a simulated Sepolia tx hash (no real funds).
 */
export async function payoutFromTreasury(params: {
  jobId: string;
  toAddress: string;
  amountUsdcCents: number;
}): Promise<PayoutResult> {
  await ensureSandboxTreasury();

  if (isServerWalletConfigured() && getSandboxRpcUrl()) {
    try {
      const broadcast = await broadcastUsdcTransfer(params);
      await createPayout({
        jobId: params.jobId,
        txHash: broadcast.txHash,
        amountUsdcCents: params.amountUsdcCents,
        status: PAYOUT_STATUS.broadcast,
      });
      return {
        txHash: broadcast.txHash,
        status: "broadcast",
        explorerUrl: explorerTxUrl(broadcast.txHash),
      };
    } catch (error) {
      console.warn("[dynamic] broadcast failed; simulating payout", error);
    }
  }

  const txHash = `0xsim${crypto.randomUUID().replace(/-/g, "")}`;
  await createPayout({
    jobId: params.jobId,
    txHash,
    amountUsdcCents: params.amountUsdcCents,
    status: PAYOUT_STATUS.simulated,
  });
  return {
    txHash,
    status: "simulated",
    explorerUrl: explorerTxUrl(txHash),
  };
}

async function broadcastUsdcTransfer(params: {
  toAddress: string;
  amountUsdcCents: number;
}): Promise<{ txHash: string }> {
  const specifier = "@dynamic-labs-wallet/" + "node-evm";
  const mod = await import(/* webpackIgnore: true */ specifier);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { createDelegatedEvmWalletClient } = mod as any;
  const { encodeFunctionData, erc20Abi, parseUnits } = await import("viem");

  const treasury = await getTreasuryWallet();
  if (!treasury?.walletMetadata) {
    throw new Error("Treasury metadata missing");
  }

  const keyShares = JSON.parse(process.env.DYNAMIC_SERVER_KEY_SHARES!);
  const client = createDelegatedEvmWalletClient({
    environmentId: process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID!,
    apiKey: process.env.DYNAMIC_API_KEY!,
  });

  const amount = parseUnits(String(params.amountUsdcCents / 100), 6);
  const to = params.toAddress as `0x${string}`;
  const target = BASE_SEPOLIA_USDC_ADDRESS as `0x${string}`;
  const { transactionHash } = await client.sendSponsoredTransaction({
    walletMetadata: treasury.walletMetadata,
    externalServerKeyShares: keyShares,
    chainId: BASE_SEPOLIA_CHAIN_ID,
    rpcUrl: getSandboxRpcUrl(),
    calls: [
      {
        target,
        data: encodeFunctionData({
          abi: erc20Abi,
          functionName: "transfer",
          args: [to, amount],
        }),
        value: BigInt(0),
      },
    ],
  });

  return { txHash: transactionHash as string };
}
