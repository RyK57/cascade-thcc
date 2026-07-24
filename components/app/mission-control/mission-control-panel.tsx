"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useGetWalletAccounts } from "@dynamic-labs-sdk/react-hooks";
import { ROUTES } from "@/lib/constants/routes";
import { buildJobFlow } from "@/libs/mission-control";
import { PAYMENT_STATUS } from "@/utils/schema/payment";
import type { AgentWalletResponse, JobCheckoutResponse } from "@/utils/schema/checkout";
import { CheckoutCard } from "./checkout-card";
import { FlowCanvas } from "./flow-canvas";
import { FlowToolbar } from "./flow-toolbar";

const POLL_MS = 2500;

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? `GET ${url} failed`);
  return data as T;
}

interface MissionControlPanelProps {
  jobId: string;
}

/** Orchestrator: polls job + wallets, projects them into the live canvas. */
export function MissionControlPanel({ jobId }: MissionControlPanelProps) {
  const { data: accounts = [] } = useGetWalletAccounts();
  const requesterAddress = accounts[0]?.address;

  const [escrowTxHash, setEscrowTxHash] = useState<string | undefined>();
  const [payoutTxHash, setPayoutTxHash] = useState<string | undefined>();
  const [isPayingOut, setIsPayingOut] = useState(false);
  const [manualPayoutPending, setManualPayoutPending] = useState(false);

  const jobQuery = useQuery({
    queryKey: ["job", jobId],
    queryFn: () => fetchJson<JobCheckoutResponse>(`${ROUTES.api.jobs}/${jobId}`),
    refetchInterval: POLL_MS,
  });

  const walletQuery = useQuery({
    queryKey: ["agent-wallet", requesterAddress],
    queryFn: () =>
      fetchJson<AgentWalletResponse>(
        requesterAddress
          ? `${ROUTES.api.agentWallet}?extra=${requesterAddress}`
          : ROUTES.api.agentWallet
      ),
    refetchInterval: POLL_MS,
  });

  const job = jobQuery.data?.job;
  const payment = jobQuery.data?.payment ?? null;
  const wallet = walletQuery.data;

  const flow = useMemo(() => {
    if (!job) return null;
    return buildJobFlow({
      job,
      payment,
      agentAddress: wallet?.agentAddress,
      workerAddress: wallet?.workerAddress,
      requesterAddress,
      balances: wallet?.balances ?? {},
      escrowTxHash,
      payoutTxHash,
      isPayingOut,
    });
  }, [job, payment, wallet, requesterAddress, escrowTxHash, payoutTxHash, isPayingOut]);

  async function manualPayout() {
    if (!payment || !wallet?.workerAddress) return;
    setManualPayoutPending(true);
    setIsPayingOut(true);
    try {
      const response = await fetch(`/api/payments/${payment.id}/payout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workerAddress: wallet.workerAddress, jobId }),
      });
      const data = await response.json();
      if (response.ok && data.payout?.txHash) setPayoutTxHash(data.payout.txHash);
    } finally {
      setManualPayoutPending(false);
      setIsPayingOut(false);
    }
  }

  if (jobQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">Loading job…</p>;
  }
  if (jobQuery.isError || !job) {
    return (
      <p className="text-sm text-destructive">
        Job not found. Seed one from the Internal dashboard.
      </p>
    );
  }

  const showPayoutButton =
    payment?.status === PAYMENT_STATUS.authorized && Boolean(wallet?.workerAddress);

  return (
    <section className="mx-auto w-full max-w-4xl space-y-4 px-4 py-8">
      <div>
        <h1 className="font-secondary text-3xl">Mission Control</h1>
        <p className="text-sm text-muted-foreground">
          A human wallet funds escrow; the agent&apos;s own wallet pays the worker.
          Every balance below is live on-chain.
        </p>
      </div>

      <CheckoutCard
        job={job}
        payment={payment}
        agentAddress={wallet?.agentAddress}
        workerAddress={wallet?.workerAddress}
        onEscrowTx={setEscrowTxHash}
        onPayoutTx={setPayoutTxHash}
        onPayingOut={setIsPayingOut}
      />

      {flow ? <FlowCanvas nodes={flow.nodes} edges={flow.edges} /> : null}

      <FlowToolbar
        escrowTxHash={escrowTxHash}
        payoutTxHash={payoutTxHash}
        showPayoutButton={showPayoutButton}
        payoutPending={manualPayoutPending}
        onTriggerPayout={manualPayout}
      />
    </section>
  );
}
