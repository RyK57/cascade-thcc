"use client";

import { useState } from "react";
import { useGetWalletAccounts } from "@dynamic-labs-sdk/react-hooks";
import type { EvmWalletAccount } from "@dynamic-labs-sdk/evm";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants/routes";
import { payIntoEscrow } from "@/libs/mission-control/pay-into-escrow";
import { PAYMENT_STATUS } from "@/utils/schema/payment";

type PayPhase =
  | "idle"
  | "sending"
  | "escrowed"
  | "paying_worker"
  | "done"
  | "error";

interface PayButtonProps {
  jobId: string;
  paymentId: string;
  amountCents: number;
  agentAddress?: string;
  workerAddress?: string;
  onEscrowTx: (txHash: string) => void;
  onPayoutTx: (txHash: string) => void;
  onPayingOut: (paying: boolean) => void;
}

const PHASE_LABEL: Record<PayPhase, string> = {
  idle: "",
  sending: "Sending USDC to escrow…",
  escrowed: "Escrow verified — agent initiating autonomous payout…",
  paying_worker: "Agent wallet paying worker on-chain…",
  done: "Done — worker paid, job closed.",
  error: "",
};

/**
 * The full payment beat: user-signed escrow deposit, then the agent's server
 * wallet autonomously pays the worker (no human click in between).
 */
export function PayButton({
  jobId,
  paymentId,
  amountCents,
  agentAddress,
  workerAddress,
  onEscrowTx,
  onPayoutTx,
  onPayingOut,
}: PayButtonProps) {
  const { data: accounts = [] } = useGetWalletAccounts();
  const [phase, setPhase] = useState<PayPhase>("idle");
  const [error, setError] = useState<string | null>(null);

  const walletAccount = accounts.find((account) => account.chain === "EVM") as
    | EvmWalletAccount
    | undefined;
  const amountLabel = `$${(amountCents / 100).toFixed(2)}`;

  async function triggerPayout() {
    setPhase("paying_worker");
    onPayingOut(true);
    try {
      const response = await fetch(`/api/payments/${paymentId}/payout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workerAddress, jobId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Payout failed");
      if (data.payout?.txHash) onPayoutTx(data.payout.txHash);
      setPhase("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payout failed");
      setPhase("error");
    } finally {
      onPayingOut(false);
    }
  }

  async function pay() {
    if (!walletAccount || !agentAddress || !workerAddress) return;
    setError(null);
    setPhase("sending");
    try {
      const { txHash } = await payIntoEscrow({
        walletAccount,
        agentAddress: agentAddress as `0x${string}`,
        amountCents,
      });
      onEscrowTx(txHash);

      const response = await fetch(`/api/payments/${paymentId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: PAYMENT_STATUS.authorized,
          dynamicWalletAddress: walletAccount.address,
        }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to record escrow");
      }

      setPhase("escrowed");
      // A visible beat so the audience sees the agent take over.
      await new Promise((resolve) => setTimeout(resolve, 1500));
      await triggerPayout();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed");
      setPhase("error");
    }
  }

  const busy = phase === "sending" || phase === "escrowed" || phase === "paying_worker";
  const missing = !walletAccount
    ? "Waiting for your embedded wallet…"
    : !agentAddress
      ? "Agent wallet not configured"
      : !workerAddress
        ? "Worker address not configured"
        : null;

  return (
    <div className="space-y-2">
      <Button onClick={pay} disabled={busy || phase === "done" || Boolean(missing)}>
        {phase === "done" ? "Paid" : busy ? "Working…" : `Pay ${amountLabel} USDC`}
      </Button>
      {missing && phase === "idle" ? (
        <p className="text-xs text-muted-foreground">{missing}</p>
      ) : null}
      {PHASE_LABEL[phase] ? (
        <p className="text-sm text-muted-foreground">{PHASE_LABEL[phase]}</p>
      ) : null}
      {error ? (
        <div className="space-y-1">
          <p className="text-sm text-destructive">{error}</p>
          {phase === "error" ? (
            <Button size="sm" variant="outline" onClick={triggerPayout}>
              Retry payout
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
