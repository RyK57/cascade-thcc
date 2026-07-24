"use client";

import { Button } from "@/components/ui/button";
import { explorerTxUrl } from "@/libs/dynamic/usdc";

interface FlowToolbarProps {
  escrowTxHash?: string;
  payoutTxHash?: string;
  /** Backup manual trigger, shown while escrow is funded but worker unpaid. */
  showPayoutButton: boolean;
  payoutPending: boolean;
  onTriggerPayout: () => void;
}

export function FlowToolbar({
  escrowTxHash,
  payoutTxHash,
  showPayoutButton,
  payoutPending,
  onTriggerPayout,
}: FlowToolbarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1.5">
          <span className="inline-block size-2 animate-pulse rounded-full bg-[var(--brand-accent,#E8501F)]" />
          live on Base Sepolia
        </span>
        {escrowTxHash ? (
          <a
            href={explorerTxUrl(escrowTxHash)}
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-2"
          >
            escrow tx ↗
          </a>
        ) : null}
        {payoutTxHash ? (
          <a
            href={explorerTxUrl(payoutTxHash)}
            target="_blank"
            rel="noreferrer"
            className="underline underline-offset-2"
          >
            payout tx ↗
          </a>
        ) : null}
      </div>
      {showPayoutButton ? (
        <Button
          size="sm"
          variant="outline"
          onClick={onTriggerPayout}
          disabled={payoutPending}
        >
          {payoutPending ? "Paying worker…" : "Trigger worker payout"}
        </Button>
      ) : null}
    </div>
  );
}
