"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useGetWalletAccounts } from "@dynamic-labs-sdk/react-hooks";
import { ROUTES } from "@/lib/constants/routes";
import { buildJobFlow } from "@/libs/mission-control";
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

/** Polls job + wallets and projects them into the live payment canvas. */
export function MissionControlPanel({ jobId }: MissionControlPanelProps) {
  const { data: accounts = [] } = useGetWalletAccounts();
  const requesterAddress = accounts[0]?.address;

  const [escrowTxHash, setEscrowTxHash] = useState<string | undefined>();

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
    });
  }, [job, payment, wallet, requesterAddress, escrowTxHash]);

  if (jobQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">Loading checkout…</p>;
  }
  if (jobQuery.isError || !job) {
    return (
      <p className="text-sm text-muted-foreground">
        This payment link is no longer available. Check your Messages thread for
        the latest link.
      </p>
    );
  }

  return (
    <section className="mx-auto w-full max-w-4xl space-y-4">
      <CheckoutCard
        job={job}
        payment={payment}
        agentAddress={wallet?.agentAddress}
        onEscrowTx={setEscrowTxHash}
      />

      {flow ? <FlowCanvas nodes={flow.nodes} edges={flow.edges} /> : null}

      <FlowToolbar escrowTxHash={escrowTxHash ?? payment?.escrowTxHash} />
    </section>
  );
}
