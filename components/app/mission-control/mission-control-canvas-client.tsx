"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useGetWalletAccounts } from "@dynamic-labs-sdk/react-hooks";
import { ROUTES } from "@/lib/constants/routes";
import { buildJobFlow } from "@/libs/mission-control";
import type {
  JobCheckoutResponse,
  TreasuryBalancesResponse,
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
 * Live money-flow visualization: polls job + payment + on-chain treasury
 * balances and projects them onto a React Flow pipeline. Read-only — the
 * payment itself happens in CascadePayPanel.
 */
export function MissionControlCanvasClient({
  jobId,
}: MissionControlCanvasClientProps) {
  const { data: accounts = [] } = useGetWalletAccounts();
  const requesterAddress = accounts[0]?.address;

  const jobQuery = useQuery({
    queryKey: ["mission-control-job", jobId],
    queryFn: () => fetchJson<JobCheckoutResponse>(`${ROUTES.api.jobs}/${jobId}`),
    refetchInterval: POLL_MS,
  });

  const balancesQuery = useQuery({
    queryKey: ["mission-control-balances", requesterAddress],
    queryFn: () =>
      fetchJson<TreasuryBalancesResponse>(
        requesterAddress
          ? `${ROUTES.api.treasuryBalances}?extra=${requesterAddress}`
          : ROUTES.api.treasuryBalances
      ),
    refetchInterval: POLL_MS,
  });

  const job = jobQuery.data?.job;
  const payment = jobQuery.data?.payment ?? null;
  const treasury = balancesQuery.data;

  const flow = useMemo(() => {
    if (!job) return null;
    return buildJobFlow({
      job,
      payment,
      treasuryAddress: treasury?.treasuryAddress,
      requesterAddress,
      balances: treasury?.balances ?? {},
    });
  }, [job, payment, treasury, requesterAddress]);

  if (jobQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">Loading live pipeline…</p>;
  }
  if (!flow) return null;

  return (
    <div className="space-y-2">
      <FlowCanvas nodes={flow.nodes} edges={flow.edges} />
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span className="inline-block size-2 animate-pulse rounded-full bg-[var(--brand-accent,#E8501F)]" />
        live — balances read from Base Sepolia every {POLL_MS / 1000}s
      </p>
    </div>
  );
}
