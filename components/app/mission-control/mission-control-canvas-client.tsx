"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useGetWalletAccounts } from "@dynamic-labs-sdk/react-hooks";
import { ROUTES } from "@/lib/constants/routes";
import { buildJobFlow } from "@/libs/mission-control";
import type {
  AgentWalletResponse,
  JobCheckoutResponse,
} from "@/utils/schema/checkout";
import { FlowCanvas } from "./flow-canvas";

const POLL_MS = 2500;

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? `GET ${url} failed`);
  return data as T;
}

interface MissionControlCanvasClientProps {
  jobId: string;
}

/**
 * Live money-flow visualization: polls job + payment + agent-wallet balances
 * and projects them onto a React Flow pipeline. Read-only — funding happens
 * in MissionControl / PayButton.
 */
export function MissionControlCanvasClient({
  jobId,
}: MissionControlCanvasClientProps) {
  const { data: accounts = [] } = useGetWalletAccounts();
  const requesterAddress =
    accounts.find((account) => account.chain === "EVM")?.address ??
    accounts[0]?.address;

  const jobQuery = useQuery({
    queryKey: ["mission-control-canvas-job", jobId],
    queryFn: () => fetchJson<JobCheckoutResponse>(`${ROUTES.api.jobs}/${jobId}`),
    refetchInterval: POLL_MS,
  });

  const walletQuery = useQuery({
    queryKey: ["mission-control-canvas-wallet", requesterAddress],
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
    });
  }, [job, payment, wallet, requesterAddress]);

  if (jobQuery.isLoading) {
    return (
      <p className="text-sm text-muted-foreground">Loading live pipeline…</p>
    );
  }
  if (!flow) return null;

  return (
    <div className="space-y-2">
      <FlowCanvas nodes={flow.nodes} edges={flow.edges} />
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span className="inline-block size-2 animate-pulse rounded-full bg-[var(--brand-accent,#E8501F)]" />
        Updating live
      </p>
    </div>
  );
}
