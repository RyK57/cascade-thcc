import type { Job } from "@/utils/schema/job";
import type { Payment } from "@/utils/schema/payment";
import type { AddressBalances } from "@/libs/chain";

export type MissionNodeState = "idle" | "active" | "done";

export interface MissionNodeData {
  kind: "wallet" | "stage";
  title: string;
  subtitle?: string;
  address?: string;
  balances?: AddressBalances;
  state: MissionNodeState;
  explorerUrl?: string;
  [key: string]: unknown; // React Flow node data must be Record-compatible
}

export interface MissionFlowInput {
  job: Job;
  payment: Payment | null;
  treasuryAddress?: string;
  requesterAddress?: string;
  balances: Record<string, AddressBalances>;
}
