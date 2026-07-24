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
import { usdcUnitsFromCents } from "./usdc";

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
    let broadcast: { txHash: string } | null = null;
    try {
      broadcast = await broadcastUsdcTransfer(params);
    } catch (error) {
      console.warn("[dynamic] broadcast failed; simulating payout", error);
    }

    if (broadcast) {
      // Only the broadcast may fall back to simulation. Once funds have moved,
      // a failed ledger write must not downgrade this to a fabricated
      // `0xsim…` hash — that records real money as never sent.
      await createPayout({
        jobId: params.jobId,
        txHash: broadcast.txHash,
        amountUsdcCents: params.amountUsdcCents,
        status: PAYOUT_STATUS.broadcast,
      }).catch((error) => {
        console.error(
          "[dynamic] treasury transfer sent but not recorded",
          broadcast.txHash,
          error
        );
      });
      return {
        txHash: broadcast.txHash,
        status: "broadcast",
        explorerUrl: explorerTxUrl(broadcast.txHash),
      };
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

/**
 * Whether a sponsored-transaction failure means sponsorship isn't available,
 * as opposed to an ambiguous network failure. Fails closed: anything that
 * could have broadcast is not retried.
 */
export function isSponsorshipUnavailable(error: unknown): boolean {
  const message = (
    error instanceof Error ? error.message : String(error ?? "")
  ).toLowerCase();

  // Ambiguous: the transaction may already be on-chain.
  if (
    /timeout|timed out|etimedout|econnreset|econnrefused|socket|aborted|network error|fetch failed|already known|nonce too low/.test(
      message
    )
  ) {
    return false;
  }

  return /sponsor|gasless|paymaster|not enabled|not supported|unsupported|disabled|forbidden|unauthorized|payment required|quota|insufficient (sponsor|gas) (credit|balance)/.test(
    message
  );
}

async function broadcastUsdcTransfer(params: {
  toAddress: string;
  amountUsdcCents: number;
}): Promise<{ txHash: string }> {
  const specifier = "@dynamic-labs-wallet/" + "node-evm";
  const mod = await import(/* webpackIgnore: true */ specifier);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { DynamicEvmWalletClient } = mod as any;
  const { encodeFunctionData, erc20Abi } = await import("viem");

  const treasury = await getTreasuryWallet();
  if (!treasury?.walletMetadata) {
    throw new Error("Treasury metadata missing");
  }

  const keyShares = JSON.parse(process.env.DYNAMIC_SERVER_KEY_SHARES!);
  // Sponsored (gasless) txs live on DynamicEvmWalletClient, not the delegated
  // client — delegated signing is for end-user wallets via delegation webhooks.
  const client = new DynamicEvmWalletClient({
    environmentId: process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID!,
  });
  await client.authenticateApiToken(process.env.DYNAMIC_API_KEY!);

  // Integer cents → 6-decimal base units. Avoids routing money through a
  // float divide and back out via String(), which the rest of the codebase
  // already sidesteps with this helper.
  const amount = usdcUnitsFromCents(params.amountUsdcCents);
  const to = params.toAddress as `0x${string}`;
  const target = BASE_SEPOLIA_USDC_ADDRESS as `0x${string}`;
  const transferData = encodeFunctionData({
    abi: erc20Abi,
    functionName: "transfer",
    args: [to, amount],
  });

  try {
    const { transactionHash } = await client.sendSponsoredTransaction({
      walletMetadata: treasury.walletMetadata,
      externalServerKeyShares: keyShares,
      password: process.env.DYNAMIC_TREASURY_PASSWORD,
      autoDelegate: true,
      chainId: BASE_SEPOLIA_CHAIN_ID,
      rpcUrl: getSandboxRpcUrl(),
      calls: [{ target, data: transferData, value: BigInt(0) }],
    });
    return { txHash: transactionHash as string };
  } catch (error) {
    // Sponsorship may be disabled for the environment — fall back to a
    // self-funded tx (treasury needs Base Sepolia gas ETH from a faucet).
    // Only for errors that mean sponsorship is unavailable: a timeout or
    // dropped connection can follow a transaction that actually broadcast,
    // and retrying those would send the transfer twice.
    if (!isSponsorshipUnavailable(error)) throw error;
    console.warn("[dynamic] sponsored tx unavailable; trying self-funded", error);
  }

  const walletClient = await client.getWalletClient({
    walletMetadata: treasury.walletMetadata,
    password: process.env.DYNAMIC_TREASURY_PASSWORD,
    externalServerKeyShares: keyShares,
    chainId: BASE_SEPOLIA_CHAIN_ID,
    rpcUrl: getSandboxRpcUrl(),
  });
  const txHash = await walletClient.sendTransaction({
    to: target,
    data: transferData,
    value: BigInt(0),
  });
  return { txHash: txHash as string };
}
