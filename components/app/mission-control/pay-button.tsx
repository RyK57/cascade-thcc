"use client";

import { useState } from "react";
import { useGetWalletAccounts } from "@dynamic-labs-sdk/react-hooks";
import type { EvmWalletAccount } from "@dynamic-labs-sdk/evm";
import { Button } from "@/components/ui/button";
import { payIntoEscrow } from "@/libs/mission-control/pay-into-escrow";

type PayPhase = "idle" | "sending" | "escrowed" | "error";

interface PayButtonProps {
  jobId: string;
  paymentId: string;
  amountCents: number;
  agentAddress?: string;
  onEscrowTx: (txHash: string) => void;
}

const PHASE_LABEL: Record<PayPhase, string> = {
  idle: "",
  sending: "Sending USDC to agent escrow…",
  escrowed: "Escrow locked in the agent wallet. Worker is paid only after approve.",
  error: "",
};

/**
 * Escrow-only beat: user funds the agent wallet. Worker payout happens later
 * on approve (iMessage tapback → finalizePeerPayout / agent payWorkerUsdc).
 */
export function PayButton({
  jobId,
  paymentId: _paymentId,
  amountCents,
  agentAddress,
  onEscrowTx,
}: PayButtonProps) {
  void _paymentId;
  const { data: accounts = [] } = useGetWalletAccounts();
  const [phase, setPhase] = useState<PayPhase>("idle");
  const [error, setError] = useState<string | null>(null);
  // Survives a failed record-escrow POST so a retry never re-broadcasts the
  // transfer. The USDC has already left the wallet; only the POST may repeat.
  const [sentTxHash, setSentTxHash] = useState<string | null>(null);

  const walletAccount = accounts.find((account) => account.chain === "EVM") as
    | EvmWalletAccount
    | undefined;
  const amountLabel = `$${(amountCents / 100).toFixed(2)}`;

  async function pay() {
    if (!walletAccount || !agentAddress) return;
    setError(null);
    setPhase("sending");
    try {
      let txHash = sentTxHash;
      let simulated = true;
      if (!txHash) {
        ({ txHash, simulated = true } = await payIntoEscrow({
          walletAccount,
          agentAddress: agentAddress as `0x${string}`,
          amountCents,
        }));
        setSentTxHash(txHash);
        onEscrowTx(txHash);
      }

      const response = await fetch(`/api/jobs/${jobId}/fund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dynamicWalletAddress: walletAccount.address,
          txHash,
          escrowTxHash: txHash,
          simulated,
        }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to record escrow");
      }

      setPhase("escrowed");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed");
      setPhase("error");
    }
  }

  const busy = phase === "sending";
  const missing = !walletAccount
    ? "Waiting for your embedded wallet…"
    : !agentAddress
      ? "Agent wallet not configured"
      : null;

  return (
    <div className="space-y-2">
      <Button onClick={pay} disabled={busy || phase === "escrowed" || Boolean(missing)}>
        {phase === "escrowed"
          ? "Escrow locked"
          : busy
            ? "Working…"
            : sentTxHash
              ? "Retry recording escrow"
              : `Fund ${amountLabel} USDC`}
      </Button>
      {missing && phase === "idle" ? (
        <p className="text-xs text-muted-foreground">{missing}</p>
      ) : null}
      {PHASE_LABEL[phase] ? (
        <p className="text-sm text-muted-foreground">{PHASE_LABEL[phase]}</p>
      ) : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
