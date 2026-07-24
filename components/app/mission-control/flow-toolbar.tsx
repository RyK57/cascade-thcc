"use client";

import { explorerTxUrl } from "@/libs/dynamic/usdc";

interface FlowToolbarProps {
  escrowTxHash?: string;
  payoutTxHash?: string;
}

export function FlowToolbar({ escrowTxHash, payoutTxHash }: FlowToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
      <span className="flex items-center gap-1.5">
        <span className="inline-block size-2 animate-pulse rounded-full bg-[var(--brand-accent,#E8501F)]" />
        Updating live
      </span>
      {escrowTxHash ? (
        <a
          href={explorerTxUrl(escrowTxHash)}
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-2"
        >
          View escrow receipt
        </a>
      ) : null}
      {payoutTxHash ? (
        <a
          href={explorerTxUrl(payoutTxHash)}
          target="_blank"
          rel="noreferrer"
          className="underline underline-offset-2"
        >
          View payout receipt
        </a>
      ) : null}
    </div>
  );
}
