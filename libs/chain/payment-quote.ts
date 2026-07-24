import { formatEther } from "viem";
import {
  assetSpec,
  formatAssetAmount,
  formatUsd,
  PAY_ASSET,
  type PayAsset,
} from "@/libs/dynamic/assets";
import { centsToEth, getEthUsdPrice } from "./eth-price";
import { getPublicClient } from "./public-client";

/** Gas a plain ETH send vs an ERC-20 transfer costs, before the price. */
const GAS_UNITS: Record<PayAsset, bigint> = {
  [PAY_ASSET.eth]: 21_000n,
  [PAY_ASSET.usdc]: 65_000n,
};

export interface PaymentQuote {
  asset: PayAsset;
  amountCents: number;
  /** "12.00 USDC" or "0.0421 ETH" */
  amountLabel: string;
  /** "$12.00" — the USD the amount represents, when we can price it. */
  usdLabel: string | null;
  /** "~$0.01" network fee, when we can estimate it. */
  feeLabel: string | null;
  /** "$12.01" all-in, when both parts are known. */
  totalLabel: string | null;
  /** "1 ETH ≈ $2,850" — the rate the conversion used. */
  rateLabel: string | null;
}

async function estimateFeeUsdCents(
  asset: PayAsset,
  ethUsd: number | null
): Promise<number | null> {
  if (ethUsd === null) return null;
  try {
    const gasPriceWei = await getPublicClient().getGasPrice();
    const feeWei = gasPriceWei * GAS_UNITS[asset];
    const feeEth = Number(formatEther(feeWei));
    if (!Number.isFinite(feeEth)) return null;
    return feeEth * ethUsd * 100;
  } catch {
    // Quote without a fee line rather than blocking on the RPC.
    return null;
  }
}

function formatFeeUsd(cents: number): string {
  // Sub-cent fees are normal on an L2; "$0.00" reads as free.
  if (cents > 0 && cents < 1) return "<$0.01";
  return formatUsd(cents);
}

/**
 * Turn a USD-denominated price into something a person can agree to: how much
 * of the chosen asset leaves their wallet, what that is worth right now, and
 * what the network will charge on top.
 */
export async function buildPaymentQuote(params: {
  amountCents: number;
  asset: PayAsset;
}): Promise<PaymentQuote> {
  const { amountCents, asset } = params;

  if (assetSpec(asset).isStable) {
    const feeCents = await estimateFeeUsdCents(asset, await getEthUsdPrice());
    return {
      asset,
      amountCents,
      amountLabel: formatAssetAmount(amountCents / 100, asset),
      usdLabel: formatUsd(amountCents),
      feeLabel: feeCents === null ? null : `~${formatFeeUsd(feeCents)}`,
      totalLabel:
        feeCents === null ? null : formatUsd(amountCents + Math.round(feeCents)),
      rateLabel: null,
    };
  }

  const ethUsd = await getEthUsdPrice();
  if (ethUsd === null) {
    // No rate: say what we're charging in dollars and don't invent an amount.
    return {
      asset,
      amountCents,
      amountLabel: formatUsd(amountCents),
      usdLabel: formatUsd(amountCents),
      feeLabel: null,
      totalLabel: null,
      rateLabel: null,
    };
  }

  const feeCents = await estimateFeeUsdCents(asset, ethUsd);
  return {
    asset,
    amountCents,
    amountLabel: formatAssetAmount(centsToEth(amountCents, ethUsd), asset),
    usdLabel: formatUsd(amountCents),
    feeLabel: feeCents === null ? null : `~${formatFeeUsd(feeCents)}`,
    totalLabel:
      feeCents === null ? null : formatUsd(amountCents + Math.round(feeCents)),
    rateLabel: `1 ETH ≈ ${formatUsd(Math.round(ethUsd * 100))}`,
  };
}

/**
 * One line for a confirmation message:
 * "0.0421 ETH (≈ $12.00, 1 ETH ≈ $2,850) + ~$0.01 network fee → $12.01 total"
 */
export function quoteLine(quote: PaymentQuote): string {
  const parts: string[] = [quote.amountLabel];

  const context = [
    quote.asset === PAY_ASSET.eth && quote.usdLabel ? `≈ ${quote.usdLabel}` : null,
    quote.rateLabel,
  ].filter(Boolean);
  if (context.length) parts[0] += ` (${context.join(", ")})`;

  if (quote.feeLabel) parts.push(`+ ${quote.feeLabel} network fee`);
  if (quote.totalLabel) parts.push(`→ ${quote.totalLabel} total`);

  return parts.join(" ");
}
