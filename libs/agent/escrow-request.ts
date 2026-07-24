import { jobPayLink } from "@/libs/account/job-pay-link";
import { buildPaymentQuote, quoteLine } from "@/libs/chain";
import { PAY_ASSET, type PayAsset } from "@/libs/dynamic/assets";
import { getAgentWalletAddress } from "@/libs/dynamic/agent-wallet";
import {
  BASE_SEPOLIA_CHAIN_ID,
  explorerAddressUrl,
} from "@/libs/dynamic/sandbox";
import { ensureSandboxTreasury } from "@/libs/dynamic/treasury";
import type { Job } from "@/utils/schema/job";

export const ESCROW_NETWORK = "Base Sepolia";

export interface EscrowRequest {
  asset: PayAsset;
  /** "0.0042 ETH" — what actually leaves the wallet. */
  amountLabel: string;
  /** Amount, USD value, live rate and gas, on one line. */
  quoteLine: string;
  /** Where the funds go: the Cascade agent wallet, or the treasury fallback. */
  destination: string;
  destinationExplorerUrl: string;
  network: string;
  chainId: number;
  payUrl: string;
}

/**
 * Everything a person needs to actually send money, rather than a sentence
 * mentioning that ETH is an option: the converted amount at the live rate, the
 * address it lands on, the network that address is on, and a link that opens
 * the funding transaction for this specific job.
 */
export async function buildEscrowRequest(params: {
  job: Job;
  asset: PayAsset;
  amountCents: number;
}): Promise<EscrowRequest> {
  const { job, asset, amountCents } = params;

  const quote = await buildPaymentQuote({ amountCents, asset });

  // Same precedence the fund route settles against, so the address quoted in
  // the thread is the address that receives.
  const agentAddress = getAgentWalletAddress();
  const destination =
    agentAddress ?? (await ensureSandboxTreasury()).address;

  return {
    asset,
    amountLabel: quote.amountLabel,
    quoteLine: quoteLine(quote),
    destination,
    destinationExplorerUrl: explorerAddressUrl(destination),
    network: ESCROW_NETWORK,
    chainId: BASE_SEPOLIA_CHAIN_ID,
    payUrl: await jobPayLink({
      jobId: job.id,
      phone: job.requesterHandle,
    }),
  };
}

export function isEthRequest(asset: PayAsset): boolean {
  return asset === PAY_ASSET.eth;
}
